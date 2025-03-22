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
    SIM1_IMSI: {
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
    this.SIM1_IMSI = null;
    this.SIM2_PASS = null;
    this.SIM1_PASS = null;
    this.submeter_mac = [];
    await this.save();
};

// Add indexes
meterSchema.index({ METER_ID: 1 });
meterSchema.index({ associated_with: 1 });
meterSchema.index({ created_at: 1 }); // For sorting
meterSchema.index({ associated: 1 });
meterSchema.index({ is_assigned: 1 });
meterSchema.index({ SIM2_IMSI: 1 });
meterSchema.index({ SIM1_PASS: 1 });

export default mongoose.model('Meter', meterSchema);