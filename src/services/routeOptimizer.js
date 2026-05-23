// Priority scale: how many km of road distance 1 point of priority "saves"
// critical TPS (score~1000) gets ~10km effective discount → always visited first unless 10km+ farther
const PRIORITY_SCALE = 0.01;

function scoreTps(tps) {
  let score = 0;
  if (tps.is_critical) score += 1000;
  score += (Number(tps.fullness_pct) || 0) * 10;
  score += Number(tps.ammonia_ppm) || 0;
  return score;
}

function optimize(list) {
  // list of { tps, latestReading }
  const decorated = list.map((it) => ({ ...it, score: scoreTps({ is_critical: it.latestReading?.is_critical, fullness_pct: it.latestReading?.fullness_pct, ammonia_ppm: it.latestReading?.ammonia_ppm }) }));
  decorated.sort((a, b) => b.score - a.score);
  return decorated.map((d) => ({ tps: d.tps, latest: d.latestReading }));
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toCoords(tps) {
  const lat = toNumber(tps?.latitude);
  const lng = toNumber(tps?.longitude);
  if (lat === null || lng === null) return null;
  return { lat, lng };
}

function haversineKm(a, b) {
  const R = 6371; // km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function optimizeGreedy(list, startCoords, endCoords) {
  const candidates = list
    .map((item) => ({
      ...item,
      coords: toCoords(item.tps),
      score: scoreTps({
        is_critical: item.latestReading?.is_critical,
        fullness_pct: item.latestReading?.fullness_pct,
        ammonia_ppm: item.latestReading?.ammonia_ppm,
      }),
    }))
    .filter((item) => item.coords);

  if (!candidates.length) {
    return { ordered: [], totalDistanceKm: 0, start: null, end: null };
  }

  const fallbackStart = candidates[0]?.coords || null;
  const fallbackEnd = candidates[candidates.length - 1]?.coords || fallbackStart;
  const start = startCoords || fallbackStart;
  const end = endCoords || fallbackEnd;

  const remaining = [...candidates];
  const ordered = [];
  let current = start;
  let totalDistanceKm = 0;

  while (remaining.length) {
    let bestIdx = 0;
    let bestScore = -Infinity;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i += 1) {
      const dist = haversineKm(current, remaining[i].coords);
      const score = remaining[i].score ?? 0;
      if (score > bestScore || (score === bestScore && dist < bestDist)) {
        bestScore = score;
        bestDist = dist;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    totalDistanceKm += Number.isFinite(bestDist) ? bestDist : 0;
    ordered.push({ tps: next.tps, latest: next.latestReading, distanceFromPrevKm: bestDist });
    current = next.coords;
  }

  if (end && current) {
    totalDistanceKm += haversineKm(current, end);
  }

  return {
    ordered,
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    start,
    end,
  };
}

// Per-request timeout (ms) for OSRM. Public OSRM is best-effort; if it can't
// answer within this window we fall back to Haversine or skip the geometry so
// the API call itself never hangs the controller.
const OSRM_TIMEOUT_MS = 6000;

function httpGetJson(url, timeoutMs) {
  const https = require('https');
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const req = https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try { finish(JSON.parse(body)); }
        catch { finish(null); }
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      finish(null);
    });
    req.on('error', () => finish(null));
  });
}

async function getOsrmRoute({ origin, destination, waypoints, baseUrl }) {
  if (!origin || !destination) return null;

  const coords = [origin, ...(waypoints || []), destination]
    .map((p) => `${p.lng},${p.lat}`)
    .join(';');

  const url = `${baseUrl || 'https://router.project-osrm.org'}/route/v1/driving/${coords}?overview=full&geometries=geojson&annotations=distance,duration`;

  const data = await httpGetJson(url, OSRM_TIMEOUT_MS);
  if (!data) return { error: 'request_error', message: 'OSRM unreachable or timed out' };
  if (data.code !== 'Ok') {
    return { error: data.code, message: data.message || 'OSRM error' };
  }
  const route = data.routes?.[0];
  return {
    distance_m: route?.distance,
    duration_s: route?.duration,
    geometry: route?.geometry,
    legs: route?.legs,
  };
}

/**
 * Calls OSRM Table API to get a real road distance matrix between all points.
 * Returns { distances: number[][], durations: number[][] } in metres/seconds,
 * or null when the server is unreachable or returns an error.
 */
async function getOsrmDistanceMatrix(points, baseUrl) {
  if (!points || points.length < 2) return null;

  const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
  const url = `${baseUrl || 'https://router.project-osrm.org'}/table/v1/driving/${coords}?annotations=distance,duration`;

  const data = await httpGetJson(url, OSRM_TIMEOUT_MS);
  if (!data || data.code !== 'Ok') return null;
  return { distances: data.distances || null, durations: data.durations || null };
}

/**
 * Dijkstra-enhanced route optimiser.
 *
 * Improvements over the plain greedy approach:
 *  1. Uses REAL road distances from the OSRM Table API instead of straight-line Haversine.
 *  2. Combines distance and TPS priority into a single effective-cost metric:
 *       effectiveCost = roadDistKm − (priorityScore × PRIORITY_SCALE)
 *     A critical TPS (score ≥ 1000) gets a ~10 km discount, so it is always
 *     visited before a non-critical stop unless it is more than 10 km farther away.
 *  3. Falls back to Haversine automatically when OSRM is unavailable.
 *
 * @param {Array}  list        – decorated TPS items [{ tps, latestReading }]
 * @param {Object} startCoords – { lat, lng } of the officer's current position
 * @param {Object} endCoords   – { lat, lng } of the garage / return point
 * @param {string} baseUrl     – OSRM base URL (optional)
 * @returns {Promise<Object>}  – { ordered, totalDistanceKm, start, end, algorithm, usedRealDistances }
 */
async function optimizeDijkstra(list, startCoords, endCoords, baseUrl) {
  const candidates = list
    .map((item) => ({
      ...item,
      coords: toCoords(item.tps),
      priority: scoreTps({
        is_critical: item.latestReading?.is_critical,
        fullness_pct: item.latestReading?.fullness_pct,
        ammonia_ppm: item.latestReading?.ammonia_ppm,
      }),
    }))
    .filter((item) => item.coords);

  if (!candidates.length) {
    return { ordered: [], totalDistanceKm: 0, start: null, end: null, algorithm: 'dijkstra', usedRealDistances: false };
  }

  const fallbackStart = candidates[0].coords;
  const fallbackEnd = candidates[candidates.length - 1].coords;
  const start = startCoords || fallbackStart;
  const end = endCoords || fallbackEnd;

  // Build the full point list for the OSRM matrix:
  // index 0        → start (officer position)
  // indices 1..N   → TPS candidates
  // index N+1      → end (depot / return point)
  const allPoints = [start, ...candidates.map((c) => c.coords), end];
  const endIdx = allPoints.length - 1;

  const matrix = await getOsrmDistanceMatrix(allPoints, baseUrl);
  const usedRealDistances = matrix !== null && matrix.distances !== null;

  const getDistKm = (fromIdx, toIdx) => {
    if (usedRealDistances && matrix.distances[fromIdx]?.[toIdx] != null) {
      return matrix.distances[fromIdx][toIdx] / 1000; // metres → km
    }
    return haversineKm(allPoints[fromIdx], allPoints[toIdx]);
  };

  const visited = new Set();
  const ordered = [];
  let currentIdx = 0; // start at the officer position (index 0 in allPoints)
  let totalDistanceKm = 0;

  while (visited.size < candidates.length) {
    let bestI = -1;
    let bestCost = Infinity;
    let bestRoadDist = Infinity;

    for (let i = 0; i < candidates.length; i++) {
      if (visited.has(i)) continue;
      const nodeIdx = i + 1; // +1 offset: TPS i is at allPoints[i+1]
      const roadDist = getDistKm(currentIdx, nodeIdx);
      const priority = candidates[i].priority;

      // effectiveCost balances urgency vs road distance.
      // Negative values are fine; we just pick the minimum.
      const effectiveCost = roadDist - priority * PRIORITY_SCALE;

      if (effectiveCost < bestCost) {
        bestCost = effectiveCost;
        bestI = i;
        bestRoadDist = roadDist;
      }
    }

    if (bestI === -1) break;

    visited.add(bestI);
    totalDistanceKm += bestRoadDist;
    ordered.push({
      tps: candidates[bestI].tps,
      latest: candidates[bestI].latestReading,
      distanceFromPrevKm: Number(bestRoadDist.toFixed(3)),
    });
    currentIdx = bestI + 1; // move to this TPS node index in allPoints
  }

  // Add the final leg from the last TPS back to the end/depot
  if (ordered.length > 0) {
    totalDistanceKm += getDistKm(currentIdx, endIdx);
  }

  return {
    ordered,
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    start,
    end,
    algorithm: 'dijkstra',
    usedRealDistances,
  };
}

module.exports = {
  optimize,
  optimizeGreedy,
  optimizeDijkstra,
  getOsrmDistanceMatrix,
  getOsrmRoute,
};
