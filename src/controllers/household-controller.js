// controllers/householdController.js
import Household from '../models/Household.js';
import Meter from '../models/Meter.js';

// Start new survey - Unchanged
export const startSurvey = async (req, res) => {
    try {
        const { HHID } = req.body;
        
        if (!HHID) {
            return res.status(400).json({ error: 'HHID is required' });
        }

        const existingHousehold = await Household.findOne({ HHID });
        if (existingHousehold) {
            return res.status(400).json({ error: 'HHID already exists' });
        }

        const availableMeter = await Meter.findOne({ associated: false });
        if (!availableMeter) {
            return res.status(400).json({ error: 'No available meter IDs' });
        }

        const household = new Household({
            HHID: parseInt(HHID),
        });
        
        availableMeter.associated = true;
        availableMeter.associated_with = parseInt(HHID);
        
        await Promise.all([household.save(), availableMeter.save()]);
        
        res.json({ 
            HHID, 
            METER_ID: availableMeter.METER_ID,
            message: 'Survey started and meter associated' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update household details - Unchanged
export const updateHousehold = async (req, res) => {
    try {
        const { HHID } = req.params;
        const { hh_email, hh_phone, Address, max_members } = req.body;
        
        const household = await Household.findOneAndUpdate(
            { HHID: parseInt(HHID) },
            { hh_email, hh_phone, Address, max_members },
            { new: true }
        );
        
        if (!household) return res.status(404).json({ error: 'Household not found' });
        res.json(household);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update member details - Unchanged
export const updateMember = async (req, res) => {
    try {
        const { HHID, mmid } = req.params;
        const memberData = req.body;

        const household = await Household.findOne({ HHID: parseInt(HHID) });
        if (!household) return res.status(404).json({ error: 'Household not found' });

        const memberIndex = household.members.findIndex(m => m.MMID === mmid);
        if (memberIndex === -1) {
            household.members.push({ MMID: mmid, ...memberData });
        } else {
            household.members[memberIndex] = { ...household.members[memberIndex], ...memberData };
        }

        await household.save();
        res.json(household);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get household details - Unchanged
export const getHousehold = async (req, res) => {
    try {
        const { HHID } = req.params;
        const household = await Household.findOne({ HHID: parseInt(HHID) });
        if (!household) return res.status(404).json({ error: 'Household not found' });
        
        const meter = await Meter.findOne({ associated_with: parseInt(HHID) });
        
        res.json({
            ...household.toObject(),
            METER_ID: meter ? meter.METER_ID : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a single meter - Unchanged
export const createMeter = async (req, res) => {
    try {
        const { METER_ID } = req.body;
        
        if (!METER_ID) {
            return res.status(400).json({ error: 'METER_ID is required' });
        }

        const existingMeter = await Meter.findOne({ METER_ID });
        if (existingMeter) {
            return res.status(400).json({ error: 'Meter ID already exists' });
        }

        const meter = new Meter({
            METER_ID: parseInt(METER_ID),
        });
        
        await meter.save();
        res.json({ METER_ID, message: 'Meter created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all available meters - Unchanged
export const getAvailableMeters = async (req, res) => {
    try {
        const availableMeters = await Meter.find({ associated: false });
        res.json(availableMeters);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Bulk add meters
export const bulkAddMeters = async (req, res) => {
    try {
        const { meterIds } = req.body; // Expecting array of meter IDs
        
        if (!Array.isArray(meterIds) || meterIds.length === 0) {
            return res.status(400).json({ error: 'meterIds must be a non-empty array' });
        }

        const uniqueMeterIds = [...new Set(meterIds.map(id => parseInt(id)))]; // Remove duplicates
        const existingMeters = await Meter.find({ METER_ID: { $in: uniqueMeterIds } });
        const existingIds = new Set(existingMeters.map(m => m.METER_ID));

        const newMeters = uniqueMeterIds
            .filter(id => !existingIds.has(id))
            .map(id => ({
                METER_ID: id,
                associated: false,
                associated_with: null
            }));

        let addedMeters = [];
        if (newMeters.length > 0) {
            addedMeters = await Meter.insertMany(newMeters);
        }

        res.json({
            addedCount: addedMeters.length,
            skippedCount: uniqueMeterIds.length - addedMeters.length,
            addedMeterIds: addedMeters.map(m => m.METER_ID),
            skippedMeterIds: uniqueMeterIds.filter(id => existingIds.has(id)),
            message: 'Bulk add completed'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Bulk delete meters
export const bulkDeleteMeters = async (req, res) => {
    try {
        const { meterIds } = req.body; // Expecting array of meter IDs
        
        if (!Array.isArray(meterIds) || meterIds.length === 0) {
            return res.status(400).json({ error: 'meterIds must be a non-empty array' });
        }

        const uniqueMeterIds = [...new Set(meterIds.map(id => parseInt(id)))]; // Remove duplicates
        
        // Only delete meters that aren't associated with households
        const result = await Meter.deleteMany({
            METER_ID: { $in: uniqueMeterIds },
            associated: false
        });

        const deletedIds = await Meter.find({ METER_ID: { $in: uniqueMeterIds }, associated: false });
        const skippedIds = uniqueMeterIds.filter(id => !deletedIds.some(d => d.METER_ID === id));

        res.json({
            deletedCount: result.deletedCount,
            skippedCount: uniqueMeterIds.length - result.deletedCount,
            deletedMeterIds: deletedIds.map(m => m.METER_ID),
            skippedMeterIds: skippedIds,
            message: 'Bulk delete completed (associated meters were skipped)'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};