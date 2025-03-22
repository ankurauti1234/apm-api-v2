import { Client } from 'ssh2';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from "../utils/logger.js";

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EC2_PRIVATE_KEY_PATH = join(__dirname, 'apm-portkey-server.pem');
const METER_PRIVATE_KEY_PATH = join(__dirname, 'apm-portkey-server.pem');

export async function getActiveMeters() {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn.on('ready', () => {
      conn.exec('sudo lsof -i -n | grep LISTEN | grep sshd', (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }

        let output = '';
        stream.on('data', (data) => {
          output += data;
        });

        stream.on('close', () => {
          const meters = output
            .split('\n')
            .filter((line) => line.includes('meter_'))
            .map((line) => {
              const match = line.match(/meter_(\d+)/);
              const portMatch = line.match(/:(\d+)/);
              return {
                meterId: match ? match[1] : null,
                port: portMatch ? portMatch[1] : null,
              };
            })
            .filter((meter) => meter.meterId && meter.port);

          conn.end();
          resolve(meters);
        });
      });
    })
      .on('error', (err) => {
        reject(new Error(`SSH connection failed: ${err.message}`));
      })
      .connect({
        host: '13.235.91.236',
        port: 22,
        username: 'ubuntu',
        privateKey: readFileSync(EC2_PRIVATE_KEY_PATH, 'utf8'),
        debug: (msg) => logger.log(msg),
      });
  });
}

export function createSSHTunnel(meterId, port) {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn.on('ready', () => {
      // Execute the SSH command to connect to the meter through the EC2 instance
      const command = `ssh -i /home/ubuntu/meter_auth_key  -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null  root@localhost -p ${port}`;
      conn.shell((err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }

        // Handle initial connection output
        stream.on('data', (data) => {
          const output = data.toString();
          if (output.includes('Last login') || output.includes('#')) {
            resolve({ conn, stream });
          }
        });

        // Execute the meter connection command
        stream.write(command + '\n');
      });
    })
      .on('error', (err) => {
        reject(new Error(`SSH tunnel failed: ${err.message}`));
      })
      .connect({
        host: '13.235.91.236',
        port: 22,
        username: 'ubuntu',
        privateKey: readFileSync(METER_PRIVATE_KEY_PATH, 'utf8'),
        debug: (msg) => logger.log(msg),
      });
  });
}