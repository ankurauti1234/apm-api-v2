// src/controllers/decommissionController.js
import mqttClient from '../utils/mqtt-client.js';
import DecommissionLog from '../models/DecommissionLog.js';
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
        targetDevices.push(i.toString()); // Ensure deviceId is a string
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
      devices: targetDevices.map(id => ({ deviceId: id.toString() })) // Ensure deviceId is a string
    });
    await decommissionLog.save();

    if (!mqttClient.connected) {
      console.error('MQTT client not connected');
      return res.status(503).json({
        status: 'error',
        message: 'MQTT service unavailable',
        decommissionId: decommissionLog._id
      });
    }

    const payload = JSON.stringify({ decommissioning: true });
    targetDevices.forEach(deviceId => {
      const topic = `apm/decommission/${deviceId}`; // Updated topic
      mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          console.error(`Failed to publish to ${topic}:`, err);
        } else {
          logger.log(`Published decommission to ${topic}`);
        }
      });
    });

    res.status(200).json({
      status: 'success',
      message: 'Decommissioning request sent successfully',
      decommissionId: decommissionLog._id
    });
  } catch (error) {
    console.error('Decommission error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
  }
};

export const getDecommissionStatus = async (req, res) => {
  try {
    const logs = await DecommissionLog.find().sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', data: logs });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
  }
};