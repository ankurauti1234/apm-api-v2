// models/Meter.js
import mongoose from 'mongoose';

const meterSchema = new mongoose.Schema({
    METER_ID: {
        type: Number,
        required: true,
        unique: true
    },
    associated: {
        type: Boolean,
        default: false
    },
    associated_with: {
        type: Number,  // HHID
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Meter', meterSchema);