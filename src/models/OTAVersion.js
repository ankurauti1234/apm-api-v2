// OTAVersion.js
import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema({
  filename: { type: String, required: true }, // e.g., "update.swu" or "output.zck"
  version: { type: String, required: true }, // "0.0.x" format
  uploadDate: { type: Date, default: Date.now },
  url: { type: String, required: true },
  type: { type: String, enum: ['full', 'delta'], required: true }, // Track update type
  deltaUrl: { type: String }, // Optional URL for delta update's .zck file
});

const OTAVersion = mongoose.model('OTAVersion', versionSchema);

export default OTAVersion;