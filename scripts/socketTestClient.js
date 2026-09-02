const http = require('http');
const fs = require('fs');
const path = require('path');
const { io } = require('socket.io-client');

const TEMP_DIR = 'C:\\Users\\admin\\AppData\\Local\\Temp\\kilo';
const officialLogin = JSON.parse(fs.readFileSync(path.join(TEMP_DIR, 'official_login.json'), 'utf8'));

function request(method, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, 'http://localhost:5000');
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login() {
  const res = await request('POST', '/api/auth/login', officialLogin);
  return res.body.token;
}

async function run() {
  const token = await login();
  console.log('Logged in as official, connecting to Socket.IO...\n');

  const socket = io('http://localhost:5000', {
    auth: { token },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log(`[Socket] Connected: ${socket.id}\n`);
  });

  socket.on('streetlight:updated', (data) => {
    console.log('[EVENT] streetlight:updated');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
  });

  socket.on('fault:new', (data) => {
    console.log('[EVENT] fault:new');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
  });

  socket.on('fault:updated', (data) => {
    console.log('[EVENT] fault:updated');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
  });

  socket.on('fault:resolved', (data) => {
    console.log('[EVENT] fault:resolved');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Disconnected: ${reason}`);
  });

  socket.on('connect_error', (error) => {
    console.error(`[Socket] Connection error: ${error.message}`);
  });
}

run().catch((error) => {
  console.error('Socket test client error:', error);
  process.exit(1);
});
