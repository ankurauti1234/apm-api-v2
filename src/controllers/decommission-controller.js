import mqttClient from '../utils/mqtt-client.js';
import DecommissionLog from '../models/DecommissionLog.js';
import Meter from '../models/Meter.js';
import Household from '../models/Household.js';
import Submeter from '../models/Submeter.js';
import logger from '../utils/logger.js';

export const decommissionDevices = async (req, res) => {
  try {
    const { deviceIds, deviceRange, remaining } = req.body;

    let targetDevices = [];

    if (deviceIds) {
      targetDevices = Array.isArray(deviceIds) ? deviceIds : [deviceIds];
    }

    if (deviceRange && deviceRange.min && deviceRange.max) {
      for (let i = deviceRange.min; i <= deviceRange.max; i++) {
        targetDevices.push(i.toString());
      }
    }

    if (remaining) {
      const pendingDecommissions = await DecommissionLog.find({
        'devices.status': 'pending'
      });
      const pendingDevices = pendingDecommissions.flatMap(log =>
        log.devices.filter(d => d.status === 'pending').map(d => d.deviceId)
      );
      targetDevices = [...new Set([...targetDevices, ...pendingDevices])];
    }

    if (targetDevices.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No target devices specified' });
    }

    const decommissionLog = new DecommissionLog({
      devices: targetDevices.map(id => ({ deviceId: id.toString() })),
      performedBy: req.user._id
    });
    await decommissionLog.save();

    for (const deviceId of targetDevices) {
      const meter = await Meter.findOne({ METER_ID: Number(deviceId) });
      if (!meter) {
        logger.log(`Meter ${deviceId} not found in database`);
        continue;
      }

      const associatedHHID = meter.associated_with;
      const assignedSubmeterMacs = meter.submeter_mac || [];
      await meter.resetMeter();
      const updatedMeter = await Meter.findOne({ METER_ID: Number(deviceId) });
      if (updatedMeter.is_assigned === false && updatedMeter.associated_with === null) {
        logger.log(`Meter ${deviceId} reset successfully`);
      } else {
        logger.error(`Meter ${deviceId} reset failed, current state: ${JSON.stringify(updatedMeter)}`);
        continue;
      }

      if (assignedSubmeterMacs.length > 0) {
        const submeters = await Submeter.find({ submeter_mac: { $in: assignedSubmeterMacs } });
        for (const submeter of submeters) {
          submeter.is_assigned = false;
          submeter.associated_with = null;
          await submeter.save();
          logger.log(`Submeter ${submeter.submeter_mac} reset successfully`);
        }
      } else {
        logger.log(`No submeters associated with meter ${deviceId}`);
      }

      if (associatedHHID) {
        const household = await Household.findOne({ HHID: associatedHHID });
        if (!household) {
          logger.log(`No household found with HHID ${associatedHHID} for meter ${deviceId}`);
        } else {
          await household.resetHousehold();
          const updatedHousehold = await Household.findOne({ HHID: associatedHHID });
          if (updatedHousehold.is_assigned === false) {
            logger.log(`Household ${associatedHHID} reset successfully`);
          } else {
            logger.error(`Household ${associatedHHID} reset failed, current state: ${JSON.stringify(updatedHousehold)}`);
          }
        }
      } else {
        logger.log(`No associated HHID found for meter ${deviceId}`);
      }
    }

    if (mqttClient.connected) {
      const payload = JSON.stringify({ decommissioning: true });
      targetDevices.forEach(deviceId => {
        const topic = `apm/decommission/${deviceId}`;
        mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
          if (err) {
            logger.error(`Failed to publish to ${topic}:`, err);
          } else {
            logger.log(`Published decommission to ${topic}`);
          }
        });
      });
    } else {
      logger.error('MQTT client not connected, skipping publish');
    }

    res.status(200).json({
      status: 'success',
      message: 'Decommissioning initiated successfully',
      decommissionId: decommissionLog._id
    });
  } catch (error) {
    logger.error('Decommission error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
  }
};

export const getDecommissionStatus = async (req, res) => {
  try {
    const logs = await DecommissionLog.find()
      .populate('performedBy', 'firstname lastname email')
      .sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', data: logs });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
  }
};