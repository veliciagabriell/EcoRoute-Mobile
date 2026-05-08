const db = require('../config/db');

async function getAll() {
  const res = await db.query('SELECT * FROM tps_locations ORDER BY name');
  return res.rows;
}

async function getById(id) {
  const res = await db.query('SELECT * FROM tps_locations WHERE id=$1', [id]);
  return res.rows[0];
}

module.exports = { getAll, getById };
