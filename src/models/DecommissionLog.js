import mongoose from 'mongoose';

const decommissionLogSchema = new mongoose.Schema({
  devices: [{
    deviceId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending'
    },
    acknowledgedAt: {
      type: Date,
      default: null
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  performedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
});

export default mongoose.model('DecommissionLog', decommissionLogSchema);