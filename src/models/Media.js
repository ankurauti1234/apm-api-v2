import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  type: { type: String, enum: ['audio', 'image'], required: true },
  s3Key: { type: String, required: true },
  bucket: { type: String, required: true },
  originalName: { type: String, required: true },
  size: { type: Number, required: true },
  deviceId: { type: String, required: true },
  timestamp: { type: Date, required: true },
  uploadDate: { type: Date, default: Date.now },
});

export default mongoose.model('Media', mediaSchema);