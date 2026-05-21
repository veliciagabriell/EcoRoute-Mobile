const db = require('../config/db');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function create(report) {
  const {
    tps_id,
    reporter_id: rawReporterId,
    description,
    indicators,
    severity,
    photo_base64,
    photo_mime,
    location_lat,
    location_lng,
  } = report;
  // Pastikan reporter_id adalah UUID valid, jika tidak set null
  const reporter_id = rawReporterId && UUID_RE.test(rawReporterId) ? rawReporterId : null;
  // JSONB kolom memerlukan string JSON, bukan JS array mentah
  const indicatorsJson = indicators != null ? JSON.stringify(indicators) : null;
  const res = await db.query(
    `INSERT INTO user_reports
      (tps_id, reporter_id, description, indicators, severity, photo_base64, photo_mime, location_lat, location_lng)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [tps_id, reporter_id, description, indicatorsJson, severity, photo_base64, photo_mime, location_lat, location_lng]
  );
  return res.rows[0];
}

async function listAll() {
  const res = await db.query(`
    SELECT
      r.*,
      r.reported_at AS created_at,
      t.name        AS tps_name,
      u.name        AS reporter_name
    FROM user_reports r
    LEFT JOIN tps_locations t ON r.tps_id = t.id
    LEFT JOIN users u         ON r.reporter_id = u.id
    ORDER BY r.reported_at DESC
  `);
  return res.rows;
}

async function updateStatus(id, status) {
  const res = await db.query('UPDATE user_reports SET status=$1 WHERE id=$2 RETURNING *', [status, id]);
  return res.rows[0];
}

module.exports = { create, listAll, updateStatus };
