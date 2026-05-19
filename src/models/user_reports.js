const db = require('../config/db');

async function create(report) {
  const {
    tps_id,
    reporter_id,
    description,
    indicators,
    severity,
    photo_base64,
    photo_mime,
    location_lat,
    location_lng,
  } = report;
  const res = await db.query(
    `INSERT INTO user_reports
      (tps_id, reporter_id, description, indicators, severity, photo_base64, photo_mime, location_lat, location_lng)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [tps_id, reporter_id, description, indicators, severity, photo_base64, photo_mime, location_lat, location_lng]
  );
  return res.rows[0];
}

async function listAll() {
  const res = await db.query(`
    SELECT r.*, t.name as tps_name, u.name as reporter_name
    FROM user_reports r
    LEFT JOIN tps_locations t ON r.tps_id = t.id
    LEFT JOIN users u ON r.reporter_id = u.id
    ORDER BY r.reported_at DESC
  `);
  return res.rows;
}

async function updateStatus(id, status) {
  const res = await db.query('UPDATE user_reports SET status=$1 WHERE id=$2 RETURNING *', [status, id]);
  return res.rows[0];
}

module.exports = { create, listAll, updateStatus };
