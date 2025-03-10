import Location from "../models/AndroidLocation.js"; // Assuming a Location model exists

export const storeLocation = async (req, res) => {
  const {
    latitude,
    longitude,
    accuracy,
    altitude,
    heading,
    speed,
    timestamp,
    deviceId,
  } = req.body;

  try {
    // Validate required fields
    if (!latitude || !longitude || !deviceId || !timestamp) {
      return res.status(400).json({
        error: "Missing required fields: latitude, longitude, deviceId, and timestamp are required",
      });
    }

    // Create new location entry
    const location = new Location({
      latitude,
      longitude,
      accuracy: accuracy || null,
      altitude: altitude || null,
      heading: heading || null,
      speed: speed || null,
      timestamp: new Date(timestamp), // Convert timestamp to Date object
      deviceId,
    });

    await location.save();

    res.status(201).json({
      message: "Location stored successfully",
      locationId: location._id,
      timestamp: location.timestamp,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};