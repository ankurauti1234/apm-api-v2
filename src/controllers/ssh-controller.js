import { getActiveMeters, createSSHTunnel } from '../utils/ssh-utils.js';

export const listMeters = async (req, res) => {
  try {
    const meters = await getActiveMeters();
    res.json({ success: true, meters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const setupWebSocket = (wss) => {
  const connections = new Map();

  wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
      const data = JSON.parse(message);
      
      if (data.type === 'connect') {
        try {
          const { conn, stream } = await createSSHTunnel(data.meterId, data.port);
          
          connections.set(ws, { conn, stream });
          
          stream.on('data', (data) => {
            ws.send(JSON.stringify({ type: 'output', data: data.toString() }));
          });

          stream.on('close', () => {
            ws.send(JSON.stringify({ type: 'disconnected' }));
            connections.delete(ws);
            conn.end();
          });

          ws.on('message', (msg) => {
            const input = JSON.parse(msg);
            if (input.type === 'input') {
              stream.write(input.data);
            }
          });

          ws.send(JSON.stringify({ type: 'connected' }));
        } catch (error) {
          ws.send(JSON.stringify({ type: 'error', error: error.message }));
        }
      }

      if (data.type === 'disconnect') {
        const connection = connections.get(ws);
        if (connection) {
          connection.stream.end();
          connection.conn.end();
          connections.delete(ws);
        }
      }
    });

    ws.on('close', () => {
      const connection = connections.get(ws);
      if (connection) {
        connection.stream.end();
        connection.conn.end();
        connections.delete(ws);
      }
    });
  });
};