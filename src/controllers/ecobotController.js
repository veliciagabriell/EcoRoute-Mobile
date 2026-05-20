const http = require('http');

const ECOBOT_SERVICE_URL = process.env.ECOBOT_SERVICE_URL || 'http://localhost:8001';

function getEcobotTarget() {
  const url = new URL(ECOBOT_SERVICE_URL);
  return { hostname: url.hostname, port: Number(url.port) || 8001 };
}

function proxyError(res, err) {
  console.error('[EcoBot] Service tidak tersedia:', err.message);
  if (!res.headersSent) {
    res.status(503).json({ error: 'EcoBot service tidak tersedia. Pastikan server Python sudah dijalankan dengan: uvicorn src.ecobot_app:app --port 8001' });
  }
}

function chat(req, res) {
  const { hostname, port } = getEcobotTarget();
  const body = JSON.stringify(req.body);

  const proxyReq = http.request(
    { hostname, port, path: '/api/chat', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
    (proxyRes) => {
      res.status(proxyRes.statusCode);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => proxyError(res, err));
  proxyReq.write(body);
  proxyReq.end();
}

function chatStream(req, res) {
  const { hostname, port } = getEcobotTarget();
  const body = JSON.stringify(req.body);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const proxyReq = http.request(
    { hostname, port, path: '/api/chat/stream', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
    (proxyRes) => { proxyRes.pipe(res); }
  );

  proxyReq.on('error', (err) => {
    console.error('[EcoBot] Stream service tidak tersedia:', err.message);
    res.write(`data: ${JSON.stringify({ token: 'Maaf, EcoBot service tidak tersedia. Pastikan server Python sudah dijalankan.' })}\n\n`);
    res.write('event: done\ndata: {}\n\n');
    res.end();
  });

  proxyReq.write(body);
  proxyReq.end();
}

function ecobotHealth(req, res) {
  const { hostname, port } = getEcobotTarget();

  const proxyReq = http.request(
    { hostname, port, path: '/health', method: 'GET' },
    (proxyRes) => {
      res.status(proxyRes.statusCode);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', () => {
    res.status(503).json({ status: 'unavailable', message: 'EcoBot service tidak tersedia' });
  });

  proxyReq.end();
}

module.exports = { chat, chatStream, ecobotHealth };
