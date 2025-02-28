// src/controllers/events-controller.js
import Events from "../models/Events.js";

export const getEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      deviceId,
      deviceIdMin,
      deviceIdMax,
      type,
    } = req.query;

    const query = {};

    if (deviceId) {
      query.DEVICE_ID = Number(deviceId);
    }
    if (deviceIdMin || deviceIdMax) {
      query.DEVICE_ID = {};
      if (deviceIdMin) query.DEVICE_ID.$gte = Number(deviceIdMin);
      if (deviceIdMax) query.DEVICE_ID.$lte = Number(deviceIdMax);
    }
    if (type) {
      query.Type = Number(type);
    }

    // Calculate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count and events
    const totalEvents = await Events.countDocuments(query);
    const events = await Events.find(query)
      .sort({ TS: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(totalEvents / limitNum);

    res.status(200).json({
      status: "success",
      data: {
        events,
        totalPages,
        currentPage: pageNum,
        totalEvents,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getRealTimeEvents = async (req, res) => {
  try {
    const {
      deviceId,
      deviceIdMin,
      deviceIdMax,
      type,
      page = 1,
      limit = 10,
    } = req.query;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const query = {};
    if (deviceId) query.DEVICE_ID = Number(deviceId);
    if (deviceIdMin || deviceIdMax) {
      query.DEVICE_ID = {};
      if (deviceIdMin) query.DEVICE_ID.$gte = Number(deviceIdMin);
      if (deviceIdMax) query.DEVICE_ID.$lte = Number(deviceIdMax);
    }
    if (type) query.Type = Number(type);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Initial fetch with pagination
    const totalEvents = await Events.countDocuments(query);
    const initialEvents = await Events.find(query)
      .sort({ TS: -1 })
      .skip(skip)
      .limit(limitNum);

    res.write(
      `data: ${JSON.stringify({
        type: "initial",
        events: initialEvents,
        page: pageNum,
        totalPages: Math.ceil(totalEvents / limitNum),
        totalEvents,
      })}\n\n`
    );

    let lastTimestamp = initialEvents.length > 0 ? initialEvents[0].TS : 0;

    const pollInterval = setInterval(async () => {
      try {
        // Only fetch new events (no pagination here, just latest)
        const newEvents = await Events.find({
          ...query,
          TS: { $gt: lastTimestamp },
        })
          .sort({ TS: -1 })
          .limit(limitNum);

        if (newEvents.length > 0) {
          lastTimestamp = newEvents[0].TS;
          res.write(
            `data: ${JSON.stringify({
              type: "new",
              events: newEvents,
            })}\n\n`
          );
        }
      } catch (pollError) {
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            message: "Polling error",
            error: pollError.message,
          })}\n\n`
        );
      }
    }, 5000);

    const keepAlive = setInterval(() => {
      res.write(":keep-alive\n\n");
    }, 15000);

    req.on("close", () => {
      clearInterval(pollInterval);
      clearInterval(keepAlive);
      res.end();
    });
  } catch (error) {
    res.status(500).write(
      `data: ${JSON.stringify({
        status: "error",
        message: "Internal server error",
        error: error.message,
      })}\n\n`
    );
    res.end();
  }
};


export const getLatestEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      deviceId,
      deviceIdMin,
      deviceIdMax,
      type,
    } = req.query;

    const query = {};

    if (deviceId) {
      query.DEVICE_ID = Number(deviceId);
    }
    if (deviceIdMin || deviceIdMax) {
      query.DEVICE_ID = {};
      if (deviceIdMin) query.DEVICE_ID.$gte = Number(deviceIdMin);
      if (deviceIdMax) query.DEVICE_ID.$lte = Number(deviceIdMax);
    }
    if (type) {
      query.Type = Number(type);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Aggregation pipeline to get latest event for each device
    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: "$DEVICE_ID",
          latestEvent: { $max: "$TS" },
          eventDoc: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$eventDoc" } },
      { $sort: { TS: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limitNum }]
        }
      }
    ];

    const result = await Events.aggregate(pipeline);
    const events = result[0].data;
    const totalEvents = result[0].metadata[0]?.total || 0;
    const totalPages = Math.ceil(totalEvents / limitNum);

    res.status(200).json({
      status: "success",
      data: {
        events,
        totalPages,
        currentPage: pageNum,
        totalEvents,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getLatestEventByDeviceAndType = async (req, res) => {
  try {
    const { deviceId, type } = req.params;

    if (!deviceId || !type) {
      return res.status(400).json({
        status: "error",
        message: "Device ID and Type are required parameters",
      });
    }

    const query = {
      DEVICE_ID: Number(deviceId),
      Type: Number(type),
    };

    const event = await Events.findOne(query)
      .sort({ TS: -1 })
      .limit(1);

    if (!event) {
      return res.status(404).json({
        status: "error",
        message: "No event found for the specified device ID and type",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        event,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};