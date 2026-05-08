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

module.exports = { optimize };
