// householdController.js
import Household from '../models/Household.js';
import Meter from '../models/Meter.js';

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

export const getSimplifiedHouseholds = async (req, res) => {
    try {
        // Extract query parameters
        const {
            hhid,           // Filter by specific HHID
            is_assigned,    // Filter by assignment status (true/false)
            meter_id,       // Filter by associated meter ID
            page = 1,       // Pagination page number (default: 1)
            limit = 10      // Items per page (default: 10)
        } = req.query;

        // Build the household query
        let householdQuery = {};

        // HHID filter
        if (hhid) {
            householdQuery.HHID = parseInt(hhid);
        }

        // is_assigned filter
        if (is_assigned !== undefined) {
            householdQuery.is_assigned = is_assigned === 'true';
        }

        // Meter ID filter - first find matching households
        let meterFilterHHIDs = null;
        if (meter_id) {
            const meters = await Meter.find({ 
                METER_ID: parseInt(meter_id),
                associated: true 
            }).select('associated_with').lean();
            meterFilterHHIDs = meters.map(m => m.associated_with);
            if (meterFilterHHIDs.length > 0) {
                householdQuery.HHID = { $in: meterFilterHHIDs };
            } else {
                // If no meters match, return empty result
                return res.status(200).json({
                    count: 0,
                    totalPages: 0,
                    currentPage: parseInt(page),
                    households: []
                });
            }
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Fetch total count for pagination
        const totalHouseholds = await Household.countDocuments(householdQuery);

        // Fetch households with pagination
        const households = await Household.find(householdQuery)
            .select('HHID max_members is_assigned')
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Fetch all associated meters
        const meters = await Meter.find({ associated: true })
            .select('METER_ID associated_with')
            .lean();

        // Process the response data
        const simplifiedHouseholds = households.map(household => {
            // Generate member labels (m1, m2, m3...)
            const memberLabels = Array.from(
                { length: household.max_members },
                (_, i) => `m${i + 1}`
            );

            // Find submeters associated with this household
            const associatedSubmeters = meters
                .filter(meter => meter.associated_with === household.HHID)
                .map(meter => meter.METER_ID);

            return {
                HHID: household.HHID,
                members: memberLabels,
                numberOfMembers: household.max_members,
                is_assigned: household.is_assigned,
                submeters: associatedSubmeters,
                numberOfSubmeters: associatedSubmeters.length
            };
        });

        res.status(200).json({
            count: simplifiedHouseholds.length,
            totalCount: totalHouseholds,
            totalPages: Math.ceil(totalHouseholds / limit),
            currentPage: parseInt(page),
            households: simplifiedHouseholds
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching simplified households', 
            error: error.message 
        });
    }
};