import Household from '../models/Household.js';

// Start new survey
export const startSurvey = async (req, res) => {
    try {
        const lastHousehold = await Household.findOne().sort({ HHID: -1 });
        const newHHID = lastHousehold ? lastHousehold.HHID + 1 : 1100;
        
        const household = new Household({
            HHID: newHHID,
            METER_ID: parseInt(`${newHHID}${Math.floor(1000 + Math.random() * 9000)}`),
        });
        
        await household.save();
        res.json({ HHID: newHHID, message: 'Survey started' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update household details
export const updateHousehold = async (req, res) => {
    try {
        const { hhid } = req.params;
        const { hh_email, hh_phone, Address, max_members } = req.body;
        
        const household = await Household.findOneAndUpdate(
            { HHID: parseInt(hhid) },
            { hh_email, hh_phone, Address, max_members },
            { new: true }
        );
        
        if (!household) return res.status(404).json({ error: 'Household not found' });
        res.json(household);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add/Update member details
export const updateMember = async (req, res) => {
    try {
        const { hhid, mmid } = req.params;
        const memberData = req.body;

        const household = await Household.findOne({ HHID: parseInt(hhid) });
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

// Get household details
export const getHousehold = async (req, res) => {
    try {
        const { hhid } = req.params;
        const household = await Household.findOne({ HHID: parseInt(hhid) });
        if (!household) return res.status(404).json({ error: 'Household not found' });
        res.json(household);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};