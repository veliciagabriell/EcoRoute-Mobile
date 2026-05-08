const db = require('../config/db');

async function findByEmail(email) {
  const res = await db.query('SELECT * FROM users WHERE email=$1', [email]);
  return res.rows[0];
}

async function findById(id) {
  const res = await db.query('SELECT * FROM users WHERE id=$1', [id]);
  return res.rows[0];
}

async function create({ name, email, password_hash, role = 'public', work_area, fcm_token }) {
  const res = await db.query(
    `INSERT INTO users (name,email,password_hash,role,work_area,fcm_token) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [name, email, password_hash, role, work_area, fcm_token]
  );
  return res.rows[0];
}

async function listByRole(role) {
  const res = await db.query('SELECT * FROM users WHERE role=$1', [role]);
  return res.rows;
}

module.exports = { findByEmail, findById, create, listByRole };
