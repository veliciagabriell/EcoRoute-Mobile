const db = require('../config/db');

async function trends(req, res) {
  // Simple aggregation: average fullness and ammonia per TPS over time (last 30 days)
  const rows = await db.query(`
    SELECT t.id as tps_id, t.name, AVG(s.fullness_pct) as avg_fullness, AVG(s.ammonia_ppm) as avg_ammonia, SUM(CASE WHEN s.is_critical THEN 1 ELSE 0 END) as critical_count
    FROM tps_locations t
    LEFT JOIN sensor_readings s ON s.tps_id = t.id AND s.timestamp >= NOW() - INTERVAL '30 days'
    GROUP BY t.id, t.name
    ORDER BY critical_count DESC
  `);
  res.json(rows.rows);
}

module.exports = { trends };
