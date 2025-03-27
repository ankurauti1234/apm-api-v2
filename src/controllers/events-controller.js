import Events from "../models/Events.js";
import Meter from "../models/Meter.js";
import EventType from "../models/EventType.js";
import Submeter from "../models/Submeter.js";
import logger from "../utils/logger.js";
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';

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
      query.DEVICE_ID = deviceId; // No type conversion needed with Mixed
    }
    if (deviceIdMin || deviceIdMax) {
      query.DEVICE_ID = {};
      if (deviceIdMin) query.DEVICE_ID.$gte = deviceIdMin;
      if (deviceIdMax) query.DEVICE_ID.$lte = deviceIdMax;
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
    if (deviceId) query.DEVICE_ID = deviceId;
    if (deviceIdMin || deviceIdMax) {
      query.DEVICE_ID = {};
      if (deviceIdMin) query.DEVICE_ID.$gte = deviceIdMin;
      if (deviceIdMax) query.DEVICE_ID.$lte = deviceIdMax;
    }
    if (type) query.Type = Number(type);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

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

    const meterQuery = {};
    if (deviceId) meterQuery.METER_ID = deviceId;
    if (deviceIdMin || deviceIdMax) {
      meterQuery.METER_ID = {};
      if (deviceIdMin) meterQuery.METER_ID.$gte = deviceIdMin;
      if (deviceIdMax) meterQuery.METER_ID.$lte = deviceIdMax;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalMeters = await Meter.countDocuments(meterQuery);
    const meters = await Meter.find(meterQuery)
      .skip(skip)
      .limit(limitNum)
      .select("METER_ID associated is_assigned associated_with SIM2_IMSI SIM1_PASS SIM2_PASS submeter_mac created_at");

    if (!meters.length) {
      return res.status(200).json({
        status: "success",
        data: {
          meters: [],
          totalPages: 0,
          currentPage: pageNum,
          totalMeters: 0
        }
      });
    }

    const deviceIds = meters.map(meter => meter.METER_ID);

    const eventsQuery = { DEVICE_ID: { $in: deviceIds } };
    if (type) eventsQuery.Type = Number(type);
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
      { $sort: { TS: -1 } }
    ];

    const events = await Events.aggregate(pipeline);

    const deviceEventsMap = new Map();
    
    meters.forEach(meter => {
      deviceEventsMap.set(meter.METER_ID, {
        deviceId: meter.METER_ID,
        isAssociated: meter.associated,
        isAssigned: meter.is_assigned,
        hhid: meter.associated_with || null,
        sim2Imsi: meter.SIM2_IMSI || null,
        sim1Pass: meter.SIM1_PASS || null,
        sim2Pass: meter.SIM2_PASS || null,
        submeterMac: meter.submeter_mac || [],
        createdAt: meter.created_at,
        events: {}
      });
    });

    events.forEach(event => {
      if (deviceEventsMap.has(event.DEVICE_ID)) {
        deviceEventsMap.get(event.DEVICE_ID).events[event.Type] = {
          type: event.Type,
          timestamp: event.TS,
          event: event
        };
      }
    });

    const result = Array.from(deviceEventsMap.values()).map(device => ({
      ...device,
      events: Object.values(device.events)
    }));

    const totalPages = Math.ceil(totalMeters / limitNum);

    res.status(200).json({
      status: "success",
      data: {
        meters: result,
        totalPages,
        currentPage: pageNum,
        totalMeters
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message
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
      DEVICE_ID: deviceId,
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
      toDate,
    } = req.query;

    const meterQuery = { is_assigned: true };
    if (hhid) meterQuery.associated_with = Number(hhid);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalMeters = await Meter.countDocuments(meterQuery);
    const meters = await Meter.find(meterQuery)
      .skip(skip)
      .limit(limitNum)
      .select("METER_ID associated_with SIM2_IMSI SIM1_PASS SIM2_PASS created_at");

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

    const deviceIds = meters.map((meter) => meter.METER_ID);

    const eventsQuery = { DEVICE_ID: { $in: deviceIds } };
    if (deviceId) eventsQuery.DEVICE_ID = deviceId;
    if (deviceIdMin || deviceIdMax) {
      eventsQuery.DEVICE_ID = eventsQuery.DEVICE_ID || {};
      if (deviceIdMin) eventsQuery.DEVICE_ID.$gte = deviceIdMin;
      if (deviceIdMax) eventsQuery.DEVICE_ID.$lte = deviceIdMax;
    }
    if (type) eventsQuery.Type = Number(type);
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
            type: "$Type",
          },
          latestTS: { $max: "$TS" },
          eventDoc: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$eventDoc" } },
      { $sort: { TS: -1 } },
    ];

    const events = await Events.aggregate(pipeline);

    const deviceEventsMap = new Map();
    meters.forEach((meter) => {
      deviceEventsMap.set(meter.METER_ID, {
        deviceId: meter.METER_ID,
        hhid: meter.associated_with || null,
        sim2Imsi: meter.SIM2_IMSI || null,
        sim1Pass: meter.SIM1_PASS || null,
        sim2Pass: meter.SIM2_PASS || null,
        createdAt: meter.created_at || null,
        events: {},
      });
    });

    events.forEach((event) => {
      if (deviceEventsMap.has(event.DEVICE_ID)) {
        deviceEventsMap.get(event.DEVICE_ID).events[event.Type] = {
          type: event.Type,
          timestamp: event.TS,
          event: event,
        };
      }
    });

    const devices = Array.from(deviceEventsMap.values()).map((device) => ({
      ...device,
      events: Object.values(device.events),
    }));
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
    logger.error("Error in getAssociatedDevicesWithLatestEvents:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllMeters = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      deviceId,
      hhid,
      associated,
      isAssigned,
      sim2Imsi,
      sim1Pass,
      sim2Pass,
      fromDate,
      toDate,
    } = req.query;

    const meterQuery = {};

    if (deviceId) meterQuery.METER_ID = deviceId;
    if (hhid) meterQuery.associated_with = Number(hhid);
    if (associated !== undefined) meterQuery.associated = associated === "true";
    if (isAssigned !== undefined) meterQuery.is_assigned = isAssigned === "true";
    if (sim2Imsi) meterQuery.SIM2_IMSI = sim2Imsi;
    if (sim1Pass !== undefined) meterQuery.SIM1_PASS = sim1Pass === "true";
    if (sim2Pass !== undefined) meterQuery.SIM2_PASS = sim2Pass === "true";
    if (fromDate || toDate) {
      meterQuery.created_at = {};
      if (fromDate) meterQuery.created_at.$gte = new Date(fromDate);
      if (toDate) meterQuery.created_at.$lte = new Date(toDate);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalMeters = await Meter.countDocuments(meterQuery);
    const meters = await Meter.find(meterQuery)
      .skip(skip)
      .limit(limitNum)
      .select("METER_ID associated is_assigned associated_with SIM2_IMSI SIM1_PASS SIM2_PASS submeter_mac created_at")
      .sort({ created_at: 1 });

    const totalPages = Math.ceil(totalMeters / limitNum);

    res.status(200).json({
      status: "success",
      data: {
        meters: meters.map((meter) => ({
          deviceId: meter.METER_ID,
          isAssociated: meter.associated,
          isAssigned: meter.is_assigned,
          hhid: meter.associated_with || null,
          sim2Imsi: meter.SIM2_IMSI || null,
          sim1Pass: meter.SIM1_PASS || null,
          sim2Pass: meter.SIM2_PASS || null,
          submeterMac: meter.submeter_mac || [],
          createdAt: meter.created_at,
        })),
        totalPages,
        currentPage: pageNum,
        totalMeters,
      },
    });
  } catch (error) {
    logger.error("Error in getAllMeters:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllSubmeters = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      submeterId,
      hhid,
      isAssigned,
      submeterMac,
      boundedSerialNumber,
      fromDate,
      toDate,
    } = req.query;

    const submeterQuery = {};

    if (submeterId) submeterQuery.submeter_id = Number(submeterId);
    if (hhid) submeterQuery.associated_with = Number(hhid);
    if (isAssigned !== undefined) submeterQuery.is_assigned = isAssigned === "true";
    if (submeterMac) submeterQuery.submeter_mac = submeterMac;
    if (boundedSerialNumber) submeterQuery.bounded_serial_number = boundedSerialNumber;
    if (fromDate || toDate) {
      submeterQuery.created_at = {};
      if (fromDate) submeterQuery.created_at.$gte = new Date(fromDate);
      if (toDate) submeterQuery.created_at.$lte = new Date(toDate);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalSubmeters = await Submeter.countDocuments(submeterQuery);
    const submeters = await Submeter.find(submeterQuery)
      .skip(skip)
      .limit(limitNum)
      .select("submeter_id is_assigned associated_with submeter_mac bounded_serial_number created_at")
      .sort({ created_at: -1 });

    const totalPages = Math.ceil(totalSubmeters / limitNum);

    res.status(200).json({
      status: "success",
      data: {
        submeters: submeters.map((submeter) => ({
          submeterId: submeter.submeter_id,
          isAssigned: submeter.is_assigned,
          meterID: submeter.associated_with || null,
          submeterMac: submeter.submeter_mac,
          boundedSerialNumber: submeter.bounded_serial_number,
          createdAt: submeter.created_at,
        })),
        totalPages,
        currentPage: pageNum,
        totalSubmeters,
      },
    });
  } catch (error) {
    logger.error("Error in getAllSubmeters:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};

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
      type,
    } = req.query;

    const alertTypes = await EventType.find({ isAlert: true });
    const alertTypeIds = alertTypes.map(type => Number(type.typeId));

    const query = { Type: { $in: alertTypeIds } };

    if (deviceId) {
      query.DEVICE_ID = deviceId;
    }
    if (deviceIdMin || deviceIdMax) {
      query.DEVICE_ID = {};
      if (deviceIdMin) query.DEVICE_ID.$gte = deviceIdMin;
      if (deviceIdMax) query.DEVICE_ID.$lte = deviceIdMax;
    }
    if (type) {
      query.Type = Number(type);
    }
    if (priority) {
      const priorityTypes = await EventType.find({ 
        isAlert: true, 
        priority: priority.toLowerCase()
      });
      query.Type = { $in: priorityTypes.map(t => Number(t.typeId)) };
    }
    if (status) {
      query.AlertStatus = status.toLowerCase();
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

export const getEventsReport = async (req, res) => {
  try {
    const {
      deviceId,
      deviceIdMin,
      deviceIdMax,
      type,
      fromDate,
      toDate,
      format = 'json'
    } = req.query;

    const query = {};

    if (deviceId) {
      query.DEVICE_ID = deviceId;
    }
    if (deviceIdMin || deviceIdMax) {
      query.DEVICE_ID = {};
      if (deviceIdMin) query.DEVICE_ID.$gte = deviceIdMin;
      if (deviceIdMax) query.DEVICE_ID.$lte = deviceIdMax;
    }
    if (type) {
      const typeArray = type.split(',').map(t => Number(t.trim()));
      query.Type = { $in: typeArray };
    }
    if (fromDate || toDate) {
      query.TS = {};
      if (fromDate) query.TS.$gte = Math.floor(new Date(fromDate).getTime() / 1000);
      if (toDate) query.TS.$lte = Math.floor(new Date(toDate).getTime() / 1000);
    }

    const events = await Events.find(query)
      .sort({ TS: -1 })
      .lean();

    if (!events.length) {
      return res.status(200).json({
        status: "success",
        message: "No events found for the specified criteria",
        data: []
      });
    }

    const reportData = events.map(event => ({
      eventType: event.Type,
      ts: new Date(event.TS * 1000).toISOString(),
      eventName: event.Event_Name || 'N/A',
      details: event.Details ? JSON.stringify(event.Details) : 'N/A'
    }));

    switch (format.toLowerCase()) {
      case 'csv': {
        const fields = ['eventType', 'ts', 'eventName', 'details'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(reportData);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="events_report.csv"');
        return res.status(200).send(csv);
      }

      case 'xlsx': {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Events Report');

        worksheet.columns = [
          { header: 'Event Type', key: 'eventType', width: 15 },
          { header: 'TS', key: 'ts', width: 25 },
          { header: 'Event Name', key: 'eventName', width: 20 },
          { header: 'Details', key: 'details', width: 50 }
        ];

        worksheet.addRows(reportData);

        worksheet.getRow(1).font = { bold: true };
        
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="events_report.xlsx"'
        );

        const buffer = await workbook.xlsx.writeBuffer();
        return res.status(200).send(buffer);
      }

      case 'json':
      default: {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="events_report.json"');
        return res.status(200).json({
          status: "success",
          data: reportData,
          totalEvents: reportData.length
        });
      }
    }
  } catch (error) {
    logger.error("Error in getEventsReport:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};