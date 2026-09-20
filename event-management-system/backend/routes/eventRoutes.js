
const express = require("express");
const router = express.Router();

const Event = require("../models/Event");
const Registration = require("../models/Registration");
const User = require("../models/User");
const Activity = require("../models/Activity");
const jwt = require("jsonwebtoken");

// ==========================================
// VERIFY LOGIN
// ==========================================
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. Please log in.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "User not found.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};

// ==========================================
// VERIFY ADMIN
// ==========================================
const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admin only.",
    });
  }

  next();
};

// ==========================================
// SAVE RECENT ACTIVITY
// ==========================================
const recordActivity = async (activityData) => {
  try {
    await Activity.create(activityData);
  } catch (error) {
    // Logging errors should not interrupt the main action
    console.error("Activity logging error:", error.message);
  }
};

// ==========================================
// GET HOMEPAGE STATISTICS
// ==========================================
router.get("/stats", async (req, res) => {
  try {
    const [
      totalEvents,
      totalParticipants,
      organizerIds,
      categories,
    ] = await Promise.all([
      Event.countDocuments(),
      Registration.countDocuments(),
      Event.distinct("createdBy"),
      Event.distinct("category"),
    ]);

    res.status(200).json({
      totalEvents,
      totalParticipants,
      totalOrganizers: organizerIds.length,
      totalCategories: categories.length,
    });
  } catch (error) {
    console.error("Statistics error:", error.message);

    res.status(500).json({
      message: "Failed to fetch homepage statistics.",
    });
  }
});

// ==========================================
// GET MY REGISTRATIONS
// ==========================================
router.get(
  "/my/registrations",
  verifyToken,
  async (req, res) => {
    try {
      const registrations = await Registration.find({
        user: req.user._id,
      })
        .populate("event")
        .sort({ createdAt: -1 });

      res.status(200).json(registrations);
    } catch (error) {
      console.error(
        "Fetch registrations error:",
        error.message
      );

      res.status(500).json({
        message: "Failed to fetch your registrations.",
      });
    }
  }
);

// ==========================================
// GET RECENT ACTIVITY (ADMIN ONLY)
// Keep this before GET /:id
// ==========================================
router.get(
  "/activity",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const activities = await Activity.find()
        .sort({ createdAt: -1 })
        .limit(10);

      res.status(200).json(activities);
    } catch (error) {
      console.error("Fetch activity error:", error.message);

      res.status(500).json({
        message: "Failed to fetch recent activity.",
      });
    }
  }
);

// ==========================================
// GET ALL EVENTS WITH PARTICIPANT COUNTS
// ==========================================
router.get("/", async (req, res) => {
  try {
    const events = await Event.aggregate([
      {
        $lookup: {
          from: "registrations",
          localField: "_id",
          foreignField: "event",
          as: "registrations",
        },
      },
      {
        $addFields: {
          participantCount: {
            $size: "$registrations",
          },
        },
      },
      {
        $project: {
          registrations: 0,
        },
      },
      {
        $sort: {
          date: 1,
        },
      },
    ]);

    res.status(200).json(events);
  } catch (error) {
    console.error("Fetch events error:", error.message);

    res.status(500).json({
      message: "Failed to fetch events.",
    });
  }
});

// ==========================================
// GET REGISTERED PARTICIPANTS (ADMIN ONLY)
// ==========================================
router.get(
  "/:id/participants",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({
          message: "Event not found.",
        });
      }

      const registrations = await Registration.find({
        event: event._id,
      })
        .populate("user", "name email")
        .sort({ createdAt: -1 });

      const participants = registrations.map(
        (registration) => ({
          _id: registration._id,
          name: registration.user?.name || "Name unavailable",
          email: registration.user?.email || "Email unavailable",
          registeredAt: registration.createdAt,
        })
      );

      res.status(200).json({
        eventTitle: event.title,
        participantCount: participants.length,
        participants,
      });
    } catch (error) {
      console.error(
        "Fetch participants error:",
        error.message
      );

      res.status(500).json({
        message: "Failed to fetch participants.",
      });
    }
  }
);

// ==========================================
// GET ONE EVENT WITH PARTICIPANT COUNT
// ==========================================
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found.",
      });
    }

    const participantCount =
      await Registration.countDocuments({
        event: event._id,
      });

    res.status(200).json({
      ...event.toObject(),
      participantCount,
    });
  } catch (error) {
    res.status(400).json({
      message: "Invalid event ID.",
    });
  }
});

// ==========================================
// CREATE EVENT (ADMIN ONLY)
// ==========================================
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        date,
        time,
        location,
        image,
        capacity,
      } = req.body;

      if (
        !title ||
        !description ||
        !category ||
        !date ||
        !time ||
        !location ||
        capacity === undefined ||
        !Number.isFinite(Number(capacity)) ||
        Number(capacity) < 1
      ) {
        return res.status(400).json({
          message: "Please fill in all required fields correctly.",
        });
      }

      const newEvent = new Event({
        title,
        description,
        category,
        date,
        time,
        location,
        image: image || "",
        capacity: Number(capacity),
        createdBy: req.user._id,
      });

      const savedEvent = await newEvent.save();

      await recordActivity({
        action: "EVENT_CREATED",
        message: `Admin created "${savedEvent.title}"`,
        eventTitle: savedEvent.title,
        eventId: savedEvent._id,
        userName: req.user.name,
        userEmail: req.user.email,
      });

      res.status(201).json({
        message: "Event created successfully!",
        event: savedEvent,
      });
    } catch (error) {
      console.error("Create event error:", error.message);

      res.status(500).json({
        message: "Failed to create event.",
      });
    }
  }
);

// ==========================================
// EDIT EVENT (ADMIN ONLY)
// ==========================================
router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        date,
        time,
        location,
        image,
        capacity,
      } = req.body;

      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({
          message: "Event not found.",
        });
      }

      if (
        !title ||
        !description ||
        !category ||
        !date ||
        !time ||
        !location ||
        capacity === undefined ||
        !Number.isFinite(Number(capacity)) ||
        Number(capacity) < 1
      ) {
        return res.status(400).json({
          message: "Please fill in all required fields correctly.",
        });
      }

      const participantCount =
        await Registration.countDocuments({
          event: event._id,
        });

      if (Number(capacity) < participantCount) {
        return res.status(400).json({
          message: `Capacity cannot be less than the current ${participantCount} participants.`,
        });
      }

      event.title = title;
      event.description = description;
      event.category = category;
      event.date = date;
      event.time = time;
      event.location = location;
      event.image = image || "";
      event.capacity = Number(capacity);

      const updatedEvent = await event.save();

      await recordActivity({
        action: "EVENT_UPDATED",
        message: `Admin updated "${updatedEvent.title}"`,
        eventTitle: updatedEvent.title,
        eventId: updatedEvent._id,
        userName: req.user.name,
        userEmail: req.user.email,
      });

      res.status(200).json({
        message: "Event updated successfully!",
        event: updatedEvent,
      });
    } catch (error) {
      console.error("Update event error:", error.message);

      res.status(500).json({
        message: "Failed to update event.",
      });
    }
  }
);

// ==========================================
// DELETE EVENT (ADMIN ONLY)
// ==========================================
router.delete(
  "/:id",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({
          message: "Event not found.",
        });
      }

      // Save activity before deleting the event
      await recordActivity({
        action: "EVENT_DELETED",
        message: `Admin deleted "${event.title}"`,
        eventTitle: event.title,
        eventId: event._id,
        userName: req.user.name,
        userEmail: req.user.email,
      });

      // Delete registrations linked to this event
      await Registration.deleteMany({
        event: event._id,
      });

      // Delete the event
      await Event.findByIdAndDelete(event._id);

      res.status(200).json({
        message: "Event and its registrations deleted successfully.",
      });
    } catch (error) {
      console.error("Delete event error:", error.message);

      res.status(500).json({
        message: "Failed to delete event.",
      });
    }
  }
);

// ==========================================
// REGISTER FOR EVENT
// ==========================================
router.post(
  "/:id/register",
  verifyToken,
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({
          message: "Event not found.",
        });
      }

      const existingRegistration =
        await Registration.findOne({
          user: req.user._id,
          event: event._id,
        });

      if (existingRegistration) {
        return res.status(409).json({
          message: "You are already registered for this event.",
        });
      }

      // Check event capacity
      const participantCount =
        await Registration.countDocuments({
          event: event._id,
        });

      if (participantCount >= event.capacity) {
        return res.status(400).json({
          message: "Sorry, this event has reached its capacity.",
        });
      }

      const registration = await Registration.create({
        user: req.user._id,
        event: event._id,
      });

      await recordActivity({
        action: "USER_REGISTERED",
        message: `${req.user.name} registered for "${event.title}"`,
        eventTitle: event.title,
        eventId: event._id,
        userName: req.user.name,
        userEmail: req.user.email,
      });

      res.status(201).json({
        message: "Registered successfully!",
        registration,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          message: "You are already registered for this event.",
        });
      }

      console.error("Registration error:", error.message);

      res.status(500).json({
        message: "Failed to register for event.",
      });
    }
  }
);

// ==========================================
// CANCEL REGISTRATION
// ==========================================
router.delete(
  "/:id/register",
  verifyToken,
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({
          message: "Event not found.",
        });
      }

      const registration =
        await Registration.findOneAndDelete({
          user: req.user._id,
          event: event._id,
        });

      if (!registration) {
        return res.status(404).json({
          message: "Registration not found.",
        });
      }

      await recordActivity({
        action: "REGISTRATION_CANCELLED",
        message: `${req.user.name} cancelled registration for "${event.title}"`,
        eventTitle: event.title,
        eventId: event._id,
        userName: req.user.name,
        userEmail: req.user.email,
      });

      res.status(200).json({
        message: "Registration cancelled successfully.",
      });
    } catch (error) {
      console.error(
        "Cancel registration error:",
        error.message
      );

      res.status(400).json({
        message: "Could not cancel registration.",
      });
    }
  }
);

module.exports = router;