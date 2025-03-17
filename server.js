import express from "express";
import { WebSocketServer } from 'ws';
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import logger from "./src/utils/logger.js";
import authRoutes from "./src/routes/auth-routes.js";
import householdRoutes from "./src/routes/household-routes.js";
import mediaRoutes from "./src/routes/media-routes.js";
import eventsRoutes from "./src/routes/events-routes.js";
import configRoutes from './src/routes/config-routes.js';
import otaRoutes from './src/routes/ota-routes.js';
import eventTypeRoutes from './src/routes/event-type-routes.js';
import geolocationRoutes from './src/routes/geolocation-routes.js';
import androidLocationRoutes from './src/routes/android-location-routes.js'
import sshRoutes from './src/routes/ssh-routes.js';
import assetsRoutes from './src/routes/assets-routes.js';
import { setupWebSocket } from './src/controllers/ssh-controller.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();


app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

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
app.use("/api/households", householdRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/ota", otaRoutes);
app.use('/api', configRoutes);
app.use('/api/event-types', eventTypeRoutes);
app.use('/api/geolocate', geolocationRoutes);
app.use('/api/location', androidLocationRoutes);
app.use('/api/ssh', sshRoutes);
app.use('/api/assets', assetsRoutes);

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
const server = app.listen(PORT, () => {
  logger.log(`Server running on port ${PORT}`);
});


const wss = new WebSocketServer({ server });
setupWebSocket(wss);