import mqttClient from '../utils/mqtt-client.js';
import DecommissionLog from '../models/DecommissionLog.js';

export const decommissionDevices = async (req, res) => {
  try {
    const { deviceIds, deviceRange, remaining } = req.body;

    let targetDevices = [];

    // Handle single or multiple device IDs
    if (deviceIds) {
      targetDevices = Array.isArray(deviceIds) ? deviceIds : [deviceIds];
    }

    // Handle device range
    if (deviceRange && deviceRange.min && deviceRange.max) {
      for (let i = deviceRange.min; i <= deviceRange.max; i++) {
        targetDevices.push(i);
      }
    }

    // Handle remaining devices that haven't acknowledged
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

    // Save to MongoDB
    const decommissionLog = new DecommissionLog({
      devices: targetDevices.map(id => ({ deviceId: id }))
    });
    await decommissionLog.save();

    // Publish to MQTT
    const payload = JSON.stringify({ decommissioning: true });
    targetDevices.forEach(deviceId => {
      mqttClient.publish(`/apm/config/${deviceId}`, payload, { qos: 1 });
    });

    res.status(200).json({
      status: 'success',
      message: 'Decommissioning request sent successfully',
      decommissionId: decommissionLog._id
    });
  } catch (error) {
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