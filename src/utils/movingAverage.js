function movingAverage(samples) {
  if (!samples || samples.length === 0) return null;
  const sumA = samples.reduce((s, r) => s + Number(r.ammonia_ppm || 0), 0);
  const sumF = samples.reduce((s, r) => s + Number(r.fullness_pct || 0), 0);
  return { ammonia_ppm: sumA / samples.length, fullness_pct: sumF / samples.length };
}

module.exports = movingAverage;
