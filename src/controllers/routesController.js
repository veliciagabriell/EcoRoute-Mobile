const tpsModel = require('../models/tps');
const sensorModel = require('../models/sensor_readings');
const routeOptimizer = require('../services/routeOptimizer');

async function optimalRoute(req, res) {
  const area = req.query.area;
  const withMaps = req.query.withMaps === 'true';
  const startLat = Number(req.query.startLat || process.env.ROUTE_START_LAT);
  const startLng = Number(req.query.startLng || process.env.ROUTE_START_LNG);
  const endLat = Number(req.query.endLat || process.env.ROUTE_END_LAT);
  const endLng = Number(req.query.endLng || process.env.ROUTE_END_LNG);

  const startCoords = Number.isFinite(startLat) && Number.isFinite(startLng)
    ? { lat: startLat, lng: startLng }
    : null;
  const endCoords = Number.isFinite(endLat) && Number.isFinite(endLng)
    ? { lat: endLat, lng: endLng }
    : null;

  let all = await tpsModel.getAll();
  if (area) all = all.filter((t) => t.area === area);
  const decorated = [];
  for (const t of all) {
    const latest = await sensorModel.getLatestByTps(t.id);
    decorated.push({ tps: t, latestReading: latest });
  }

  const optimized = routeOptimizer.optimizeGreedy(decorated, startCoords, endCoords);
  const stops = optimized.ordered.map((item, index) => ({
    order: index + 1,
    id: item.tps.id,
    name: item.tps.name,
    latitude: Number(item.tps.latitude),
    longitude: Number(item.tps.longitude),
    latestReading: item.latest,
    distanceFromPrevKm: item.distanceFromPrevKm,
  }));

  let maps = null;
  if (withMaps && optimized.start && optimized.end) {
    maps = await routeOptimizer.getOsrmRoute({
      origin: optimized.start,
      destination: optimized.end,
      waypoints: stops.map((s) => ({ lat: s.latitude, lng: s.longitude })),
      baseUrl: process.env.ROUTE_ENGINE_URL,
    });
  }

  res.json({
    start: optimized.start,
    end: optimized.end,
    totalDistanceKm: optimized.totalDistanceKm,
    stops,
    maps,
  });
}

module.exports = { optimalRoute };
