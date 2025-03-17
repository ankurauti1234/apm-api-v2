import Household from "../models/Household.js";
import Meter from "../models/Meter.js";
import logger from "../utils/logger.js";

export const getAllHouseholds = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      hhid,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build the base query for households
    const householdQuery = {};
    if (hhid) householdQuery.HHID = Number(hhid);

    // Aggregation pipeline
    const pipeline = [
      // Match households with the initial query
      { $match: householdQuery },
      // Lookup meters where associated_with matches HHID
      {
        $lookup: {
          from: "meters", // Collection name in MongoDB (lowercase model name)
          localField: "HHID",
          foreignField: "associated_with",
          as: "associated_meters",
        },
      },
      // Project the required fields
      {
        $project: {
          hhid: "$HHID",
          members: {
            $map: {
              input: { $range: [1, { $add: [{ $size: "$members" }, 1] }] },
              as: "index",
              in: { $concat: ["m", { $toString: "$$index" }] },
            },
          },
          associated: { $gt: [{ $size: "$associated_meters" }, 0] }, // True if there are associated meters
          meterId: {
            $cond: {
              if: { $gt: [{ $size: "$associated_meters" }, 0] },
              then: { $arrayElemAt: ["$associated_meters.METER_ID", 0] }, // First meter ID if associated
              else: null,
            },
          },
        },
      },
      // Sort by HHID
      { $sort: { hhid: 1 } },
      // Pagination
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limitNum }],
        },
      },
    ];

    const result = await Household.aggregate(pipeline);
    const households = result[0]?.data || [];
    const totalHouseholds = result[0]?.metadata[0]?.total || 0;
    const totalPages = Math.ceil(totalHouseholds / limitNum);

    res.status(200).json({
      status: "success",
      data: {
        households,
        totalPages,
        currentPage: pageNum,
        totalHouseholds,
      },
    });
  } catch (error) {
    logger.error("Error in getAllHouseholds:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};