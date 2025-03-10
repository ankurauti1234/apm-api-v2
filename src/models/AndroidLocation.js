import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: { type: Number, default: null },
  altitude: { type: Number, default: null },
  heading: { type: Number, default: null },
  speed: { type: Number, default: null },
  timestamp: { type: Date, required: true },
  deviceId: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('AndroidLocation', locationSchema);