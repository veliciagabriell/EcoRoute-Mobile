const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { execSync } = require('child_process');
require('dotenv').config();

const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://ecouser:ecopass@localhost:5432/ecoroute' });

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'src', 'db', 'schema.sql'), 'utf8');
  await pool.query(sql);
  const pw = await bcrypt.hash('password123', 10);
  await pool.query("INSERT INTO users (name,email,password_hash,role,work_area) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING", ['Admin','admin@ecoroute.com',pw,'admin','central']);
  console.log('Seed complete');
  await pool.end();
}

run().catch((err) => { console.error(err); process.exit(1); });
