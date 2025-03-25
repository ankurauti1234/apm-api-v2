import mqtt from 'mqtt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

// Convert file URL to directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load certificates
const ca = fs.readFileSync(path.join(__dirname, '..', 'certs', 'root-CA.crt'));
const cert = fs.readFileSync(path.join(__dirname, '..', 'certs', 'certificate.pem.crt'));
const key = fs.readFileSync(path.join(__dirname, '..', 'certs', 'private.pem.key'));

// MQTT client configuration
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

// Event handlers
mqttClient.on('connect', () => {
    logger.log('MQTT Connected');
});

mqttClient.on('error', (err) => {
    logger.error('MQTT Error:', err);
});

mqttClient.on('reconnect', () => {
    logger.log('MQTT Reconnecting...');
});

mqttClient.on('close', () => {
    logger.log('MQTT Connection Closed');
});

export default mqttClient;