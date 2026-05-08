const tpsModel = require('../models/tps');
const sensorModel = require('../models/sensor_readings');
const redis = require('../config/redis');

async function list(req, res) {
  const all = await tpsModel.getAll();
  // augment with latest from redis or db
  const result = [];
  for (const t of all) {
    const cache = await redis.get(`latest_reading:${t.id}`);
    let latest = null;
    if (cache) latest = JSON.parse(cache);
    else latest = await sensorModel.getLatestByTps(t.id);
    result.push({ tps: t, latestReading: latest });
  }
  res.json(result);
}

async function getOne(req, res) {
  const { id } = req.params;
  const tps = await tpsModel.getById(id);
  if (!tps) return res.status(404).json({ error: 'Not found' });
  const cache = await redis.get(`latest_reading:${tps.id}`);
  let latest = null;
  if (cache) latest = JSON.parse(cache);
  else latest = await sensorModel.getLatestByTps(tps.id);
  res.json({ tps, latestReading: latest });
}

async function getReadings(req, res) {
  const { id } = req.params;
  const { from, to } = req.query;
  const fromTS = from ? new Date(from).toISOString() : new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
  const toTS = to ? new Date(to).toISOString() : new Date().toISOString();
  const rows = await sensorModel.getByTpsInRange(id, fromTS, toTS);
  res.json(rows);
}

module.exports = { list, getOne, getReadings };
