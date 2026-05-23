const tpsModel = require('../models/tps');
const sensorModel = require('../models/sensor_readings');
const routeOptimizer = require('../services/routeOptimizer');

async function optimalRoute(req, res) {
  const area = req.query.area;
  const withMaps = req.query.withMaps === 'true';
  // 'dijkstra' is the default; pass algorithm=greedy to use the legacy approach
  const algorithm = req.query.algorithm === 'greedy' ? 'greedy' : 'dijkstra';

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

  // Fetch all latest sensor readings in parallel — previously serial,
  // which made the endpoint slow once we added another OSRM call.
  const decorated = await Promise.all(
    all.map(async (t) => ({
      tps: t,
      latestReading: await sensorModel.getLatestByTps(t.id),
    })),
  );

  let optimized;
  if (algorithm === 'dijkstra') {
    optimized = await routeOptimizer.optimizeDijkstra(
      decorated,
      startCoords,
      endCoords,
      process.env.ROUTE_ENGINE_URL,
    );
  } else {
    optimized = routeOptimizer.optimizeGreedy(decorated, startCoords, endCoords);
    optimized.algorithm = 'greedy';
    optimized.usedRealDistances = false;
  }

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
    // getOsrmRoute already has its own 6s timeout; if it fails or returns
    // an error object, we still send the rest of the route to the client.
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
    algorithm: optimized.algorithm,
    usedRealDistances: optimized.usedRealDistances,
    stops,
    maps,
  });
}

module.exports = { optimalRoute };
