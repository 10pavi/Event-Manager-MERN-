
const dns = require("dns");

// DNS configuration for MongoDB Atlas
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.send("Event Manager Backend is running!");
});

// API test route
app.get("/api/test", (req, res) => {
  res.json({
    message: "Frontend and Backend are connected successfully!",
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Event routes
app.use("/api/events", eventRoutes);

// Start server after connecting to MongoDB
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();