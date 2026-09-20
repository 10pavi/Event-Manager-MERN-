
const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const email = "admin@example.com";
    const password = "ChangeThisAdmin123!";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("This email already exists. Choose another email.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: "Event Manager Admin",
      email,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin account created successfully!");
    console.log("Email:", email);
    console.log("Use the password configured in createAdmin.js");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();