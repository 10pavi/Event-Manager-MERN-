
const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "EVENT_CREATED",
        "EVENT_UPDATED",
        "EVENT_DELETED",
        "USER_REGISTERED",
        "REGISTRATION_CANCELLED",
      ],
    },

    message: {
      type: String,
      required: true,
    },

    eventTitle: {
      type: String,
      default: "",
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    userName: {
      type: String,
      default: "",
    },

    userEmail: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Activity", activitySchema);