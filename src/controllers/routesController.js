const tpsModel = require('../models/tps');
const sensorModel = require('../models/sensor_readings');
const routeOptimizer = require('../services/routeOptimizer');

async function optimalRoute(req, res) {
  const area = req.query.area;
  let all = await tpsModel.getAll();
  if (area) all = all.filter((t) => t.area === area);
  const decorated = [];
  for (const t of all) {
    const latest = await sensorModel.getLatestByTps(t.id);
    decorated.push({ tps: t, latestReading: latest });
  }
  const optimized = routeOptimizer.optimize(decorated);
  res.json(optimized);
}

module.exports = { optimalRoute };
