import mqtt from 'mqtt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ConfigLog from '../models/ConfigLog.js';
import DecommissionLog from '../models/DecommissionLog.js';
import Meter from '../models/Meter.js';
import Household from '../models/Household.js';
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
    host: 'a3uoz4wfsx2nz3-ats.iot.ap-south-1.amazonaws.com', // AWS IoT Core endpoint
    port: 8883, // Secure MQTT port
    protocol: 'mqtts', // MQTT over TLS
    ca: ca, // Root CA certificate
    cert: cert, // Client certificate
    key: key, // Client private key
    clientId: `server_${Math.random().toString(16).substr(2, 8)}`, // Unique client ID
    reconnectPeriod: 1000, // Reconnect every 1 second if disconnected
});

// Event: When MQTT client connects
mqttClient.on('connect', () => {
    logger.log('MQTT Connected');

    // Subscribe to configuration topic
    mqttClient.subscribe('apm/config', (err) => {
        if (err) {
            logger.error('Config subscription error:', err);
        } else {
            logger.log('Subscribed to apm/config');
        }
    });

    // Subscribe to decommission topic
    mqttClient.subscribe('apm/decommission', (err) => {
        if (err) {
            logger.error('Decommission subscription error:', err);
        } else {
            logger.log('Subscribed to apm/decommission');
        }
    });
});

// Event: When MQTT client encounters an error
mqttClient.on('error', (err) => {
    logger.error('MQTT Error:', err);
});

// Event: When MQTT client is reconnecting
mqttClient.on('reconnect', () => {
    logger.log('MQTT Reconnecting...');
});

// Event: When MQTT connection is closed
mqttClient.on('close', () => {
    logger.log('MQTT Connection Closed');
});

// Event: When a message is received on a subscribed topic
mqttClient.on('message', async (topic, message) => {
    try {
        const payload = JSON.parse(message.toString());
        logger.log(`Received message on ${topic}: ${JSON.stringify(payload)}`);

        // Handle configuration acknowledgments
        if (topic === 'apm/config') {
            if (payload.parameter && payload.status === 'completed') {
                const meterId = payload.meter_id.toString();
                logger.log(`Processing config ack for meter ${meterId}`);

                const configLog = await ConfigLog.findOne({
                    parameter: payload.parameter,
                    value: payload.value,
                    'devices.deviceId': meterId,
                });

                if (!configLog) {
                    logger.log(`No config log found for meter ${meterId}, parameter: ${payload.parameter}`);
                    return;
                }

                const device = configLog.devices.find((d) => d.deviceId === meterId);
                if (device) {
                    logger.log(`Before update - Device status: ${device.status}`);
                    device.status = 'completed';
                    device.acknowledgedAt = new Date();

                    if (configLog.devices.every((d) => d.status === 'completed')) {
                        configLog.completedAt = new Date();
                    }

                    await configLog.save();
                    logger.log(`After update - Saved config log for meter ${meterId}`);

                    const updatedLog = await ConfigLog.findById(configLog._id);
                    const updatedDevice = updatedLog.devices.find((d) => d.deviceId === meterId);
                    logger.log(`Verified status: ${updatedDevice.status}`);
                } else {
                    logger.log(`Device ${meterId} not found in config log`);
                }
            }
        }

        // Handle decommission acknowledgments
        if (topic === 'apm/decommission') {
            const meterId = payload.meter_id?.toString();
            if (payload.is_decommissioning_success === true && meterId) {
                logger.log(`Processing decommission ack for meter ${meterId}`);

                // Find and update the decommission log
                const decommissionLog = await DecommissionLog.findOne({
                    'devices.deviceId': meterId,
                });

                if (!decommissionLog) {
                    logger.log(`No decommission log found for meter ${meterId}`);
                    return;
                }

                const device = decommissionLog.devices.find((d) => d.deviceId === meterId);
                if (device) {
                    logger.log(`Before update - Device status: ${device.status}`);
                    device.status = 'completed';
                    device.acknowledgedAt = new Date();

                    if (decommissionLog.devices.every((d) => d.status === 'completed')) {
                        decommissionLog.completedAt = new Date();
                    }
                    await decommissionLog.save();
                    logger.log(`After update - Saved decommission log for meter ${meterId}`);

                    // Reset Meter and Household data
                    const meter = await Meter.findOne({ METER_ID: Number(meterId) });
                    if (meter) {
                        const associatedHHID = meter.associated_with;
                        await meter.resetMeter();
                        logger.log(`Meter ${meterId} reset successfully`);

                        if (associatedHHID) {
                            const household = await Household.findOne({ HHID: associatedHHID });
                            if (household) {
                                await household.resetHousehold();
                                logger.log(`Household ${associatedHHID} reset successfully`);
                            }
                        }
                    } else {
                        logger.log(`Meter ${meterId} not found in database`);
                    }

                    const updatedLog = await DecommissionLog.findById(decommissionLog._id);
                    const updatedDevice = updatedLog.devices.find((d) => d.deviceId === meterId);
                    logger.log(`Verified status: ${updatedDevice.status}`);
                } else {
                    logger.log(`Device ${meterId} not found in decommission log`);
                }
            }
        }
    } catch (error) {
        logger.error(`Error processing MQTT message on ${topic}: ${error.message}`);
    }
});

// Export the MQTT client
export default mqttClient;