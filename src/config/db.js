const { Pool } = require('pg');
const dns = require('dns');
const dotenv = require('dotenv');

dotenv.config();

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

function parseDatabaseUrl() {
  const rawUrl =
    process.env.DATABASE_URL_POOLER ||
    process.env.SUPABASE_POOLER_URL ||
    process.env.DATABASE_URL;

  if (!rawUrl) {
    throw new Error('DATABASE_URL is not configured');
  }

  const url = new URL(rawUrl);
  const isSupabase = url.hostname.includes('supabase.co');
  const isPooler = url.hostname.includes('pooler');

  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, '') || 'postgres',
    ssl: isSupabase ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: isPooler ? 5000 : 8000,
  };
}

const pool = new Pool(parseDatabaseUrl());

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
