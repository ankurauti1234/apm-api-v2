import mongoose from 'mongoose';

const configLogSchema = new mongoose.Schema({
  parameter: String,
  value: String,
  devices: [{
    deviceId: Number,
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    acknowledgedAt: { type: Date, default: null }
  }],
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null }
});

export default mongoose.model('ConfigLog', configLogSchema);