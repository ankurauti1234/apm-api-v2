import mongoose from 'mongoose';

const eventTypeSchema = new mongoose.Schema({
  typeId: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  isAlert: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const EventType = mongoose.model('EventType', eventTypeSchema);
export default EventType;