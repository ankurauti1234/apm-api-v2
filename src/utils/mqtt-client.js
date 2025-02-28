// src/utils/mqttClient.js
import mqtt from 'mqtt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ConfigLog from '../models/ConfigLog.js';
import DecommissionLog from '../models/DecommissionLog.js';
import logger from './logger.js';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ca = fs.readFileSync(path.join(__dirname, '..', 'certs', 'root-CA.crt'));
const cert = fs.readFileSync(path.join(__dirname, '..', 'certs', 'certificate.pem.crt'));
const key = fs.readFileSync(path.join(__dirname, '..', 'certs', 'private.pem.key'));

const mqttClient = mqtt.connect({
  host: 'a3uoz4wfsx2nz3-ats.iot.ap-south-1.amazonaws.com',
  port: 8883,
  protocol: 'mqtts',
  ca: ca,
  cert: cert,
  key: key,
  clientId: `server_${Math.random().toString(16).substr(2, 8)}`,
  reconnectPeriod: 1000,
});

mqttClient.on('connect', () => {
  logger.log('MQTT Connected');
  mqttClient.subscribe('apm/installation', (err) => {
    if (err) console.error('Subscription error:', err);
  });
});

mqttClient.on('error', (err) => {
  console.error('MQTT Error:', err);
});

mqttClient.on('reconnect', () => {
  logger.log('MQTT Reconnecting...');
});

mqttClient.on('close', () => {
  logger.log('MQTT Connection Closed');
});

// Handle MQTT Acknowledgments
mqttClient.on('message', async (topic, message) => {
  if (topic === 'apm/installation') {
    const payload = JSON.parse(message.toString());
    const meterId = payload.METER_ID;

    if (payload.parameter && payload.status === 'completed') {
      const configLog = await ConfigLog.findOne({
        parameter: payload.parameter,
        value: payload.value,
        'devices.deviceId': meterId
      });
      if (configLog) {
        const device = configLog.devices.find(d => d.deviceId === meterId);
        if (device) {
          device.status = 'completed';
          device.acknowledgedAt = new Date();
          if (configLog.devices.every(d => d.status === 'completed')) {
            configLog.completedAt = new Date();
          }
          await configLog.save();
          logger.log(`Config acknowledgment processed for meter ${meterId}`);
        }
      }
    }

    if (payload.is_decommissioning_success === true) {
      const decommissionLog = await DecommissionLog.findOne({
        'devices.deviceId': meterId
      });
      if (decommissionLog) {
        const device = decommissionLog.devices.find(d => d.deviceId === meterId);
        if (device) {
          device.status = 'completed';
          device.acknowledgedAt = new Date();
          if (decommissionLog.devices.every(d => d.status === 'completed')) {
            decommissionLog.completedAt = new Date();
          }
          await decommissionLog.save();
          logger.log(`Decommission acknowledgment processed for meter ${meterId}`);
        }
      }
    }
  }
});

export default mqttClient;