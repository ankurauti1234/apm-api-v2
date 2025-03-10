// eventTypeSchema.js
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
    },
    priority: {
        type: String,
        enum: ['high', 'low', 'critical'],
        default: 'low',
        required: function() { return this.isAlert; }
    }
}, {
    timestamps: true
});

export default mongoose.model('EventType', eventTypeSchema);