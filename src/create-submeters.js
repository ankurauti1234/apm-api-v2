// addSubmeters.js
import mongoose from 'mongoose';

// MongoDB Connection
const mongoConnect = async () => {
    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://ankurauti:ankurauti02@cluster0.7ikri.mongodb.net/indi_test?retryWrites=true&w=majority&appName=Cluster0', {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('MongoDB connected');
        }
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};

// Submeter Schema
const submeterSchema = new mongoose.Schema({
    submeter_id: { type: Number, required: true, unique: true },
    is_assigned: { type: Boolean, default: false },
    associated_with: { type: Number, default: null },
    submeter_mac: { type: String, required: true, unique: true },
    bounded_serial_number: { type: String, required: true, unique: true },
    created_at: { type: Date, default: Date.now }
});

const Submeter = mongoose.model('Submeter', submeterSchema);

// Function to generate random MAC address
function generateRandomMac() {
    const hexDigits = '0123456789ABCDEF';
    let mac = '';
    for (let i = 0; i < 6; i++) {
        mac += hexDigits[Math.floor(Math.random() * 16)];
        mac += hexDigits[Math.floor(Math.random() * 16)];
        if (i < 5) mac += ':';
    }
    return mac;
}

// Function to generate random serial number
function generateRandomSerialNumber(id) {
    return `SUB${id}${Math.floor(10000 + Math.random() * 90000)}`;
}

// Function to add 20 random submeters
async function addRandomSubmeters() {
    try {
        await mongoConnect();

        const submeters = [];
        for (let i = 0; i < 20; i++) {
            const submeterId = 1001 + i;
            submeters.push({
                submeter_id: submeterId,
                is_assigned: false,
                associated_with: null,
                submeter_mac: generateRandomMac(),
                bounded_serial_number: generateRandomSerialNumber(submeterId)
            });
        }

        // Insert all submeters at once
        const result = await Submeter.insertMany(submeters, { ordered: false });
        console.log('Successfully added submeters:', result.length);
        
        // Log the added submeters
        result.forEach(submeter => {
            console.log(`Added Submeter: ID=${submeter.submeter_id}, MAC=${submeter.submeter_mac}, Serial=${submeter.bounded_serial_number}`);
        });

    } catch (error) {
        console.error('Error adding submeters:', error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('MongoDB connection closed');
        }
    }
}

// Execute the function
addRandomSubmeters();