import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import logger from "./src/utils/logger.js";
import authRoutes from "./src/routes/auth-routes.js";
import householdRoutes from "./src/routes/household-routes.js";
import mediaRoutes from "./src/routes/media-routes.js";
import eventsRoutes from "./src/routes/events-routes.js";
import configRoutes from './src/routes/config-routes.js';
import eventTypeRoutes from './src/routes/event-type-routes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => logger.log("MongoDB connected"))
  .catch((err) => logger.error("MongoDB connection error:", err));

// Basic Route
app.get("/", (req, res) => {
  logger.log("Request received at /");
  res.send("Hello World!");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/survey", householdRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/events", eventsRoutes);
app.use('/api', configRoutes);
app.use('/api/event-types', eventTypeRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
    error: err.message,
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.log(`Server running on port ${PORT}`);
});
