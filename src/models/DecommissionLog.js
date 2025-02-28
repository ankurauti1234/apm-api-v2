import mongoose from 'mongoose';

const decommissionLogSchema = new mongoose.Schema({
  devices: [{
    deviceId: Number,
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    acknowledgedAt: { type: Date, default: null }
  }],
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null }
});

export default mongoose.model('DecommissionLog', decommissionLogSchema);