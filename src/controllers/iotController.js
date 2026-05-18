const sensorModel = require('../models/sensor_readings');
const tpsModel = require('../models/tps');
const redis = require('../config/redis');
const { getLastNSamples } = require('../models/sensor_readings');
const movingAverage = require('../utils/movingAverage');
const { sendCriticalNotification, sendWarningNotification } = require('../services/notificationService');

function getAlertLevel(ammonia_ppm, fullness_pct) {
  const am = Number(ammonia_ppm);
  const fu = Number(fullness_pct);
  
  if (am >= 50 || fu >= 80) return 'critical';
  if (am >= 30 || fu >= 60) return 'warning';
  return 'normal';
}

function isCritical(ammonia_ppm, fullness_pct) {
  return Number(ammonia_ppm) >= 50 || Number(fullness_pct) >= 80;
}

async function postData(req, res) {
  const payload = req.body;
  // basic moving average check
  const lastSamples = await getLastNSamples(payload.device_id, 5);
  if (lastSamples && lastSamples.length >= 1) {
    const avg = movingAverage(lastSamples);
    if (avg) {
      const devA = Math.abs(payload.ammonia_ppm - avg.ammonia_ppm) / (avg.ammonia_ppm || 1);
      const devF = Math.abs(payload.fullness_pct - avg.fullness_pct) / (avg.fullness_pct || 1);
      if (devA > 0.1 || devF > 0.1) {
        return res.status(400).json({ error: 'Deviant reading' });
      }
    }
  }

  const all = await tpsModel.getAll();
  const tps = all.find((t) => t.id === payload.tps_id || t.name === payload.device_id || t.device_id === payload.device_id);

  const alertLevel = getAlertLevel(payload.ammonia_ppm, payload.fullness_pct);
  const reading = {
    tps_id: tps ? tps.id : null,
    device_id: payload.device_id,
    ammonia_ppm: payload.ammonia_ppm,
    fullness_pct: payload.fullness_pct,
    is_critical: isCritical(payload.ammonia_ppm, payload.fullness_pct),
    alert_level: alertLevel,
    timestamp: payload.timestamp,
  };

  const saved = await sensorModel.insert(reading);
  if (reading.tps_id) await redis.setex(`latest_reading:${reading.tps_id}`, 600, JSON.stringify(saved));
  if (reading.is_critical && tps) await sendCriticalNotification({ tps, ammonia_ppm: reading.ammonia_ppm, fullness_pct: reading.fullness_pct });
  if (reading.alert_level === 'warning' && tps) await sendWarningNotification({ tps, ammonia_ppm: reading.ammonia_ppm, fullness_pct: reading.fullness_pct });

  res.status(201).json(saved);
}

module.exports = { postData };
