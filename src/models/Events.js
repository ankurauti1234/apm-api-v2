import mongoose from 'mongoose';

const detailsSchema = new mongoose.Schema(
  {},
  { _id: false, strict: false }
);

const eventsSchema = new mongoose.Schema({
    DEVICE_ID: { type: Number, required: true },
    TS: { type: Number, required: true },
    Type: { type: Number, required: true },
    AlertType: String,
    Event_Name: String,
    Details: detailsSchema,
    AlertStatus: { 
        type: String, 
        enum: ['generated', 'pending', 'resolved'],
        default: 'generated'
    },
    timestamp: { type: Date, default: Date.now },
}, { strict: false });

eventsSchema.index({ DEVICE_ID: 1, TS: -1 });
eventsSchema.index({ Type: 1 });
eventsSchema.index({ AlertStatus: 1 });

export default mongoose.model('Events', eventsSchema);