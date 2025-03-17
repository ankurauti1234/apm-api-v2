// createAdmin.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect("mongodb+srv://ankurauti:ankurauti02@cluster0.7ikri.mongodb.net/indi_test?retryWrites=true&w=majority&appName=Cluster0");
    console.log("MongoDB connected");

    const hashedPassword = await bcrypt.hash("Ankur@123", 10);
    console.log("New hashed password:", hashedPassword);

    // Force update or create
    const adminUser = await User.findOneAndUpdate(
      { email: "ankurauti@gmail.com" },
      {
        firstname: "Ankur",
        lastname: "Auti",
        phone: "1234567890",
        email: "ankurauti@gmail.com",
        company: "Inditronics",
        designation: "Administrator",
        roles: ["admin"],
        password: hashedPassword,
        isEmailVerified: true,
        mustChangePassword: false
      },
      { upsert: true, new: true } // upsert: create if doesn't exist, new: return updated doc
    );

    console.log("Admin user updated/created successfully:", adminUser);

    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error creating/updating admin user:", error);
    await mongoose.connection.close();
  }
}

createAdmin();