import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  deviceId: String,
  status: { type: String, default: 'pending' },
  acknowledgedAt: Date
});

const configLogSchema = new mongoose.Schema({
  parameter: String,
  value: String,
  devices: [deviceSchema],
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
  performedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
});

export default mongoose.model('ConfigLog', configLogSchema);