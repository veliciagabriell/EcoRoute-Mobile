const db = require('../config/db');

async function create(notification) {
  const { tps_id, triggered_at, ammonia_ppm, fullness_pct, alert_level = 'normal', delivery_status = 'pending' } = notification;
  const res = await db.query(
    `INSERT INTO notifications (tps_id,triggered_at,ammonia_ppm,fullness_pct,alert_level,delivery_status)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [tps_id, triggered_at, ammonia_ppm, fullness_pct, alert_level, delivery_status]
  );
  return res.rows[0];
}

module.exports = { create };
