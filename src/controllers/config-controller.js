import mqttClient from '../utils/mqtt-client.js';
import ConfigLog from '../models/ConfigLog.js';
import logger from '../utils/logger.js';

export const pushConfig = async (req, res) => {
  try {
    const { parameter, value, deviceIds, deviceRange, remaining } = req.body;

    if (!parameter || !value) {
      return res.status(400).json({ status: 'error', message: 'Parameter and value are required' });
    }

    let targetDevices = [];

    if (deviceIds) {
      targetDevices = Array.isArray(deviceIds) ? deviceIds : [deviceIds];
    }

    if (deviceRange && deviceRange.min && deviceRange.max) {
      for (let i = deviceRange.min; i <= deviceRange.max; i++) {
        targetDevices.push(i);
      }
    }

    if (remaining) {
      const pendingConfigs = await ConfigLog.find({
        'devices.status': 'pending',
        parameter,
        value
      });
      const pendingDevices = pendingConfigs.flatMap(log => 
        log.devices.filter(d => d.status === 'pending').map(d => d.deviceId)
      );
      targetDevices = [...new Set([...targetDevices, ...pendingDevices])];
    }

    if (targetDevices.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No target devices specified' });
    }

    const configLog = new ConfigLog({
      parameter,
      value,
      devices: targetDevices.map(id => ({ deviceId: id }))
    });
    await configLog.save();

    if (!mqttClient.connected) {
      logger.error('MQTT client not connected');
      return res.status(503).json({
        status: 'error',
        message: 'MQTT service unavailable',
        configId: configLog._id
      });
    }

    const payload = JSON.stringify({ parameter, value });
    targetDevices.forEach(deviceId => {
      const topic = `apm/config/${deviceId}`;
      mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          logger.error(`Failed to publish to ${topic}:`, err);
        } else {
          logger.log(`Published config to ${topic}`);
        }
      });
    });

    res.status(200).json({
      status: 'success',
      message: 'Configuration pushed successfully',
      configId: configLog._id
    });
  } catch (error) {
    logger.error('Config push error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
  }
};

export const getConfigStatus = async (req, res) => {
  try {
    const logs = await ConfigLog.find().sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', data: logs });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
  }
};