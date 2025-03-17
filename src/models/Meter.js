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
        type: Number, // HHID
        default: null
    },
    is_assigned: {
        type: Boolean,
        default: false
    },
    SIM2_IMSI: {
        type: String,
        default: null
    },
    SIM2_PASS: {
        type: Boolean,
        default: null
    },
    SIM1_PASS: {
        type: Boolean,
        default: null
    },
    submeter_mac: [{
        type: String,
        required: false
    }],
    created_at: {
        type: Date,
        default: Date.now
    }
});

meterSchema.methods.resetMeter = async function () {
    this.associated = false;
    this.associated_with = null;
    this.is_assigned = false;
    this.SIM2_IMSI = null;
    this.SIM2_PASS = null;
    this.SIM1_PASS = null;
    this.submeter_mac = [];
    await this.save();
};

export default mongoose.model('Meter', meterSchema);