// Submeter.js
import mongoose from 'mongoose';

// Submeter Schema
const submeterSchema = new mongoose.Schema({
    submeter_id: { 
        type: Number, 
        required: true, 
        unique: true 
    },
    is_assigned: { 
        type: Boolean, 
        default: false 
    },
    associated_with: { 
        type: Number, 
        default: null 
    }, // References HHID
    submeter_mac: { 
        type: String, 
        required: true, 
        unique: true 
    },
    bounded_serial_number: { 
        type: String, 
        required: true, 
        unique: true 
    },
    created_at: { 
        type: Date, 
        default: Date.now 
    }
});

// Create and export the Submeter model
const Submeter = mongoose.model('Submeter', submeterSchema);
export default Submeter;