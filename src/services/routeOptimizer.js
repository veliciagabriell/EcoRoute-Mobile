function scoreTps(tps) {
  // Higher score for critical (is_critical true), then by fullness or ammonia
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

async function getOsrmRoute({ origin, destination, waypoints, baseUrl }) {
  if (!origin || !destination) return null;

  const https = require('https');

  const coords = [origin, ...(waypoints || []), destination]
    .map((p) => `${p.lng},${p.lat}`)
    .join(';');

  const url = `${baseUrl || 'https://router.project-osrm.org'}/route/v1/driving/${coords}?overview=full&geometries=geojson&annotations=distance,duration`;

  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.code !== 'Ok') {
              return resolve({ error: data.code, message: data.message || 'OSRM error' });
            }

            const route = data.routes?.[0];
            resolve({
              distance_m: route?.distance,
              duration_s: route?.duration,
              geometry: route?.geometry,
              legs: route?.legs,
            });
          } catch (err) {
            resolve({ error: 'parse_error', message: err.message });
          }
        });
      })
      .on('error', (err) => resolve({ error: 'request_error', message: err.message }));
  });
}

module.exports = {
  optimize,
  optimizeGreedy,
  getOsrmRoute,
};
