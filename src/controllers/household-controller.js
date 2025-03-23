// householdController.js
import Household from '../models/Household.js';

// Add new household
export const addHousehold = async (req, res) => {
  try {
      const {
          hh_email,
          hh_phone,
          max_members,
          max_submeters,
          members,
          Address,
          City,
          State,
          Region,
          TVOwnership,
          NoOfTVs
      } = req.body;

      // Validation for required fields - explicitly check for undefined or null
      if (
          hh_email === undefined || hh_email === null || hh_email === "" ||
          hh_phone === undefined || hh_phone === null || hh_phone === "" ||
          max_members === undefined || max_members === null ||
          max_submeters === undefined || max_submeters === null
      ) {
          return res.status(400).json({ 
              message: 'Email, phone, max_members, and max_submeters are required' 
          });
      }

      // Validate members array length matches max_members
      if (!members || members.length !== max_members) {
          return res.status(400).json({ 
              message: `Please provide exactly ${max_members} members` 
          });
      }

      // Validate required fields for each member
      for (const member of members) {
          if (!member.Name || !member.Age || !member.Gender) {
              return res.status(400).json({ 
                  message: 'Name, Age, and Gender are required for each member' 
              });
          }
      }

      // Get the last HHID and increment by 1
      const lastHousehold = await Household.findOne().sort({ HHID: -1 });
      const newHHID = lastHousehold ? lastHousehold.HHID + 1 : 1000;

      // Create new household object
      const newHousehold = new Household({
          HHID: newHHID,
          hh_email,
          hh_phone,
          max_members,
          max_submeters,
          members,
          Address,
          City,
          State,
          Region,
          TVOwnership,
          NoOfTVs
      });

      // Save to database
      const savedHousehold = await newHousehold.save();
      
      res.status(201).json({
          message: 'Household added successfully',
          household: savedHousehold
      });
  } catch (error) {
      res.status(500).json({ 
          message: 'Error adding household', 
          error: error.message 
      });
  }
};

// Get household by HHID
export const getHousehold = async (req, res) => {
    try {
        const { hhid } = req.params;
        
        const household = await Household.findOne({ HHID: hhid });
        
        if (!household) {
            return res.status(404).json({ message: 'Household not found' });
        }
        
        res.status(200).json(household);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching household', 
            error: error.message 
        });
    }
};

// Get all households
export const getAllHouseholds = async (req, res) => {
    try {
        const households = await Household.find();
        res.status(200).json({
            count: households.length,
            households
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching households', 
            error: error.message 
        });
    }
};