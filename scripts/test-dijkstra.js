/**
 * Standalone test for the Dijkstra route optimizer.
 * Verifies:
 *   1. The algorithm produces a valid ordered route for a set of TPS points.
 *   2. Critical TPS are visited earlier than normal ones (priority weighting works).
 *   3. The OSRM Table API integration returns a real distance matrix (or falls back cleanly).
 *   4. The fallback to Haversine works when OSRM is unreachable.
 *
 * Run: node scripts/test-dijkstra.js
 */

const routeOptimizer = require('../src/services/routeOptimizer');

// Mock TPS points around ITB Bandung area
const mockTpsList = [
  {
    tps: { id: 'tps-1', name: 'TPS Ganesha', latitude: -6.8915, longitude: 107.6105 },
    latestReading: { is_critical: false, fullness_pct: 30, ammonia_ppm: 10 },
  },
  {
    tps: { id: 'tps-2', name: 'TPS Cisitu', latitude: -6.8743, longitude: 107.6190 },
    latestReading: { is_critical: true, fullness_pct: 95, ammonia_ppm: 80 },
  },
  {
    tps: { id: 'tps-3', name: 'TPS Dago', latitude: -6.8830, longitude: 107.6135 },
    latestReading: { is_critical: false, fullness_pct: 60, ammonia_ppm: 25 },
  },
  {
    tps: { id: 'tps-4', name: 'TPS Sukajadi', latitude: -6.8870, longitude: 107.6020 },
    latestReading: { is_critical: false, fullness_pct: 15, ammonia_ppm: 5 },
  },
  {
    tps: { id: 'tps-5', name: 'TPS Tubagus Ismail', latitude: -6.8800, longitude: 107.6225 },
    latestReading: { is_critical: true, fullness_pct: 85, ammonia_ppm: 60 },
  },
];

// Officer's current position (somewhere in ITB campus)
const officerStart = { lat: -6.8914, lng: 107.6107 };
// Return/depot point
const depotEnd = { lat: -6.8914, lng: 107.6107 };

async function runTests() {
  let allPassed = true;
  const log = (msg) => console.log(msg);
  const pass = (msg) => log(`  [PASS] ${msg}`);
  const fail = (msg) => { log(`  [FAIL] ${msg}`); allPassed = false; };

  log('\n=== TEST: Dijkstra Route Optimizer ===\n');

  // ---------------------------------------------------------------
  // Test 1: With OSRM (real road distances)
  // ---------------------------------------------------------------
  log('Test 1: Dijkstra with public OSRM Table API');
  const dijkstraResult = await routeOptimizer.optimizeDijkstra(
    mockTpsList,
    officerStart,
    depotEnd
  );

  log(`  Algorithm:           ${dijkstraResult.algorithm}`);
  log(`  Used real distances: ${dijkstraResult.usedRealDistances}`);
  log(`  Total distance (km): ${dijkstraResult.totalDistanceKm}`);
  log(`  Visit order:`);
  dijkstraResult.ordered.forEach((stop, idx) => {
    const r = stop.latest;
    const tag = r?.is_critical ? '[CRITICAL]' : '          ';
    log(`    ${idx + 1}. ${tag} ${stop.tps.name.padEnd(25)} fullness=${r?.fullness_pct}%  dist_from_prev=${stop.distanceFromPrevKm} km`);
  });

  if (dijkstraResult.algorithm === 'dijkstra') pass('algorithm flag is "dijkstra"');
  else fail('algorithm flag should be "dijkstra"');

  if (dijkstraResult.ordered.length === mockTpsList.length) pass(`all ${mockTpsList.length} TPS were included in route`);
  else fail(`expected ${mockTpsList.length} stops, got ${dijkstraResult.ordered.length}`);

  // Both critical TPS should appear in the first two positions
  const firstTwo = dijkstraResult.ordered.slice(0, 2).map(s => s.tps.id);
  const criticalIds = ['tps-2', 'tps-5'];
  const bothCriticalFirst = criticalIds.every(id => firstTwo.includes(id));
  if (bothCriticalFirst) pass('critical TPS (tps-2 & tps-5) visited in the first 2 positions');
  else fail(`critical TPS not prioritised — first two were: ${firstTwo.join(', ')}`);

  // Distances should be positive numbers
  const allDistsValid = dijkstraResult.ordered.every(s => Number.isFinite(s.distanceFromPrevKm) && s.distanceFromPrevKm >= 0);
  if (allDistsValid) pass('all distanceFromPrevKm values are valid positive numbers');
  else fail('some distance values are invalid');

  if (dijkstraResult.totalDistanceKm > 0) pass(`total route distance is positive (${dijkstraResult.totalDistanceKm} km)`);
  else fail('total route distance is zero or negative');

  // ---------------------------------------------------------------
  // Test 2: OSRM Distance Matrix call works
  // ---------------------------------------------------------------
  log('\nTest 2: OSRM Distance Matrix API call');
  const points = [officerStart, ...mockTpsList.map(t => ({ lat: t.tps.latitude, lng: t.tps.longitude }))];
  const matrix = await routeOptimizer.getOsrmDistanceMatrix(points);
  if (matrix && matrix.distances) {
    pass(`OSRM returned a ${matrix.distances.length}x${matrix.distances[0].length} distance matrix`);
    log(`    Sample distances (m) from officer to first 3 TPS: ${matrix.distances[0].slice(1, 4).map(d => d.toFixed(0)).join(', ')}`);
  } else {
    log('  [WARN] OSRM matrix unavailable (likely offline / rate-limited). Fallback to Haversine will be used.');
  }

  // ---------------------------------------------------------------
  // Test 3: Fallback to Haversine when OSRM is unreachable
  // ---------------------------------------------------------------
  log('\nTest 3: Fallback to Haversine when OSRM URL is invalid');
  const fallbackResult = await routeOptimizer.optimizeDijkstra(
    mockTpsList,
    officerStart,
    depotEnd,
    'https://invalid-osrm-host.example.com'
  );
  log(`  Used real distances: ${fallbackResult.usedRealDistances}`);
  log(`  Total distance (km): ${fallbackResult.totalDistanceKm}`);
  log(`  Stops included:      ${fallbackResult.ordered.length}`);

  if (fallbackResult.usedRealDistances === false) pass('correctly reports usedRealDistances=false when OSRM fails');
  else fail('should report usedRealDistances=false on invalid OSRM URL');

  if (fallbackResult.ordered.length === mockTpsList.length) pass('Haversine fallback still routes all TPS');
  else fail('Haversine fallback failed to include all stops');

  // ---------------------------------------------------------------
  // Test 4: Empty list handling
  // ---------------------------------------------------------------
  log('\nTest 4: Empty TPS list');
  const emptyResult = await routeOptimizer.optimizeDijkstra([], officerStart, depotEnd);
  if (emptyResult.ordered.length === 0 && emptyResult.totalDistanceKm === 0) {
    pass('empty list returns empty result without crashing');
  } else {
    fail('empty list did not produce empty result');
  }

  // ---------------------------------------------------------------
  // Test 5: Compare Dijkstra vs Greedy (Haversine)
  // ---------------------------------------------------------------
  log('\nTest 5: Compare Dijkstra (real roads) vs Greedy (straight-line)');
  const greedyResult = routeOptimizer.optimizeGreedy(mockTpsList, officerStart, depotEnd);
  log(`  Greedy total (Haversine): ${greedyResult.totalDistanceKm} km`);
  log(`  Dijkstra total (OSRM):    ${dijkstraResult.totalDistanceKm} km`);
  const greedyOrder = greedyResult.ordered.map(s => s.tps.name).join(' → ');
  const dijkstraOrder = dijkstraResult.ordered.map(s => s.tps.name).join(' → ');
  log(`  Greedy order:   ${greedyOrder}`);
  log(`  Dijkstra order: ${dijkstraOrder}`);

  // ---------------------------------------------------------------
  log('\n=========================================');
  if (allPassed) {
    log('  ALL TESTS PASSED ✓');
  } else {
    log('  SOME TESTS FAILED ✗');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test crashed:', err);
  process.exit(1);
});
