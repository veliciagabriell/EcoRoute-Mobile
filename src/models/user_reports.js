const db = require('../config/db');

async function create(report) {
  const { tps_id, reporter_id, description } = report;
  const res = await db.query(
    `INSERT INTO user_reports (tps_id,reporter_id,description) VALUES ($1,$2,$3) RETURNING *`,
    [tps_id, reporter_id, description]
  );
  return res.rows[0];
}

async function listAll() {
  const res = await db.query('SELECT * FROM user_reports ORDER BY reported_at DESC');
  return res.rows;
}

async function updateStatus(id, status) {
  const res = await db.query('UPDATE user_reports SET status=$1 WHERE id=$2 RETURNING *', [status, id]);
  return res.rows[0];
}

module.exports = { create, listAll, updateStatus };
