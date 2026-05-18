const db = require('../config/db');

async function insert(reading) {
  const { tps_id, device_id, ammonia_ppm, fullness_pct, is_critical, alert_level = 'normal', timestamp } = reading;
  const res = await db.query(
    `INSERT INTO sensor_readings (tps_id,device_id,ammonia_ppm,fullness_pct,is_critical,alert_level,timestamp)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [tps_id, device_id, ammonia_ppm, fullness_pct, is_critical, alert_level, timestamp]
  );
  return res.rows[0];
}

async function getLatestByTps(tps_id) {
  const res = await db.query(
    'SELECT * FROM sensor_readings WHERE tps_id=$1 ORDER BY timestamp DESC LIMIT 1',
    [tps_id]
  );
  return res.rows[0];
}

async function getByTpsInRange(tps_id, from, to, limit = 1000) {
  const res = await db.query(
    `SELECT * FROM sensor_readings WHERE tps_id=$1 AND timestamp >= $2 AND timestamp <= $3 ORDER BY timestamp DESC LIMIT $4`,
    [tps_id, from, to, limit]
  );
  return res.rows;
}

async function getLastNSamples(device_id, n = 5) {
  const res = await db.query(
    'SELECT ammonia_ppm,fullness_pct FROM sensor_readings WHERE device_id=$1 ORDER BY timestamp DESC LIMIT $2',
    [device_id, n]
  );
  return res.rows;
}

module.exports = { insert, getLatestByTps, getByTpsInRange, getLastNSamples };
