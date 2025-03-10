import mongoose from 'mongoose';

const decommissionLogSchema = new mongoose.Schema({
  devices: [{
    deviceId: String,
    status: { type: String, default: 'pending' },
    acknowledgedAt: Date
  }],
  completedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('DecommissionLog', decommissionLogSchema);