import Events from "../models/Events.js";
import Meter from "../models/Meter.js";
import EventType from "../models/EventType.js";

export const getEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      deviceId,
      deviceIdMin,
      deviceIdMax,
      type,
      fromDate,
      toDate
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
    if (fromDate || toDate) {
      query.TS = {};
      if (fromDate) query.TS.$gte = new Date(fromDate);
      if (toDate) query.TS.$lte = new Date(toDate);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

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
      fromDate,
      toDate
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
    if (fromDate || toDate) {
      query.TS = {};
      if (fromDate) query.TS.$gte = new Date(fromDate);
      if (toDate) query.TS.$lte = new Date(toDate);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

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
    const { fromDate, toDate } = req.query;

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

    if (fromDate || toDate) {
      query.TS = {};
      if (fromDate) query.TS.$gte = new Date(fromDate);
      if (toDate) query.TS.$lte = new Date(toDate);
    }

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

export const getAssociatedDevicesWithLatestEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      deviceId,
      deviceIdMin,
      deviceIdMax,
      type,
      hhid,
      fromDate,
      toDate
    } = req.query;

    const meterQuery = { associated: true };
    if (hhid) {
      meterQuery.associated_with = Number(hhid);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalMeters = await Meter.countDocuments(meterQuery);
    const meters = await Meter.find(meterQuery)
      .skip(skip)
      .limit(limitNum)
      .select('METER_ID associated_with');

    if (!meters.length) {
      return res.status(200).json({
        status: "success",
        data: {
          devices: [],
          totalPages: 0,
          currentPage: pageNum,
          totalDevices: 0,
        },
      });
    }

    const deviceIds = meters.map(meter => meter.METER_ID);

    const eventsQuery = { DEVICE_ID: { $in: deviceIds } };
    
    if (deviceId) {
      eventsQuery.DEVICE_ID = Number(deviceId);
    }
    if (deviceIdMin || deviceIdMax) {
      eventsQuery.DEVICE_ID = eventsQuery.DEVICE_ID || {};
      if (deviceIdMin) eventsQuery.DEVICE_ID.$gte = Number(deviceIdMin);
      if (deviceIdMax) eventsQuery.DEVICE_ID.$lte = Number(deviceIdMax);
    }
    if (type) {
      eventsQuery.Type = Number(type);
    }
    if (fromDate || toDate) {
      eventsQuery.TS = {};
      if (fromDate) eventsQuery.TS.$gte = new Date(fromDate);
      if (toDate) eventsQuery.TS.$lte = new Date(toDate);
    }

    const pipeline = [
      { $match: eventsQuery },
      {
        $group: {
          _id: {
            deviceId: "$DEVICE_ID",
            type: "$Type"
          },
          latestEvent: { $max: "$TS" },
          eventDoc: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$eventDoc" } },
      { $sort: { DEVICE_ID: 1, Type: 1 } },
    ];

    const events = await Events.aggregate(pipeline);

    const deviceEventsMap = new Map();
    events.forEach(event => {
      if (!deviceEventsMap.has(event.DEVICE_ID)) {
        deviceEventsMap.set(event.DEVICE_ID, {
          deviceId: event.DEVICE_ID,
          hhid: meters.find(m => m.METER_ID === event.DEVICE_ID)?.associated_with,
          events: []
        });
      }
      deviceEventsMap.get(event.DEVICE_ID).events.push({
        type: event.Type,
        timestamp: event.TS,
        event: event
      });
    });

    const devices = Array.from(deviceEventsMap.values());
    const totalPages = Math.ceil(totalMeters / limitNum);

    res.status(200).json({
      status: "success",
      data: {
        devices,
        totalPages,
        currentPage: pageNum,
        totalDevices: totalMeters,
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

// Get all alerts with pagination and filtering
export const getAlerts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      deviceId,
      deviceIdMin,
      deviceIdMax,
      priority,
      status,
      fromDate,
      toDate,
      type, // Added type as a query parameter
    } = req.query;

    // Get all alert type IDs
    const alertTypes = await EventType.find({ isAlert: true });
    const alertTypeIds = alertTypes.map(type => Number(type.typeId)); // Ensure typeId is a number

    const query = { Type: { $in: alertTypeIds } };

    if (deviceId) {
      query.DEVICE_ID = Number(deviceId);
    }
    if (deviceIdMin || deviceIdMax) {
      query.DEVICE_ID = {};
      if (deviceIdMin) query.DEVICE_ID.$gte = Number(deviceIdMin);
      if (deviceIdMax) query.DEVICE_ID.$lte = Number(deviceIdMax);
    }
    if (type) {
      query.Type = Number(type); // Ensure type is a number
    }
    if (priority) {
      const priorityTypes = await EventType.find({ 
        isAlert: true, 
        priority: priority.toLowerCase() // Normalize to lowercase
      });
      query.Type = { $in: priorityTypes.map(t => Number(t.typeId)) };
    }
    if (status) {
      query.AlertStatus = status.toLowerCase(); // Normalize to lowercase
    }
    if (fromDate || toDate) {
      query.TS = {};
      if (fromDate) query.TS.$gte = new Date(fromDate);
      if (toDate) query.TS.$lte = new Date(toDate);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalAlerts = await Events.countDocuments(query);
    const alerts = await Events.find(query)
      .sort({ TS: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(totalAlerts / limitNum);

    res.status(200).json({
      status: "success",
      data: {
        alerts,
        totalPages,
        currentPage: pageNum,
        totalAlerts,
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

// Update alert status
export const updateAlertStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;

    if (!['generated', 'pending', 'resolved'].includes(status.toLowerCase())) {
      return res.status(400).json({
        status: "error",
        message: "Invalid status value. Must be 'generated', 'pending', or 'resolved'"
      });
    }

    // Check if it's an alert event
    const event = await Events.findOne({ _id: eventId });
    if (!event) {
      return res.status(404).json({
        status: "error",
        message: "Event not found"
      });
    }

    const eventType = await EventType.findOne({ typeId: event.Type });
    if (!eventType?.isAlert) {
      return res.status(400).json({
        status: "error",
        message: "This event is not an alert"
      });
    }

    // Use findOneAndUpdate instead of findByIdAndUpdate for timeseries compatibility
    const updatedEvent = await Events.findOneAndUpdate(
      { _id: eventId },
      { AlertStatus: status.toLowerCase() },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({
        status: "error",
        message: "Failed to update alert"
      });
    }

    res.status(200).json({
      status: "success",
      data: updatedEvent
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};