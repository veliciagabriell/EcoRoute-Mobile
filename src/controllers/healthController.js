const os = require('os');
const db = require('../config/db');

async function health(req, res) {
  let dbOk = false;
  try {
    await db.query('SELECT 1');
    dbOk = true;
  } catch (err) {
    dbOk = false;
  }

  res.json({
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
    db: dbOk ? 'connected' : 'disconnected',
    version: process.env.npm_package_version || '0.0.0',
    load: os.loadavg ? os.loadavg() : null,
  });
}

module.exports = { health };
