const mqttClient = require('../config/mqtt');
const JSONbig = JSON;
const sensorModel = require('../models/sensor_readings');
const tpsModel = require('../models/tps');
const redis = require('../config/redis');
const { getLastNSamples } = require('../models/sensor_readings');
const movingAverage = require('../utils/movingAverage');
const { sendCriticalNotification, sendWarningNotification } = require('./notificationService');

function getAlertLevel(ammonia_ppm, fullness_pct) {
  const am = Number(ammonia_ppm);
  const fu = Number(fullness_pct);
  
  // Critical: MQ-135 > 50 ppm OR Ultrasonic > 80%
  if (am >= 50 || fu >= 80) return 'critical';
  
  // Warning: MQ-135 >= 30 ppm (approaching 50) OR Ultrasonic >= 60% (approaching 80%)
  if (am >= 30 || fu >= 60) return 'warning';
  
  return 'normal';
}

function isCritical(ammonia_ppm, fullness_pct) {
  return Number(ammonia_ppm) >= 50 || Number(fullness_pct) >= 80;
}

// Store last alert level per TPS to detect state changes
const lastAlertLevelCache = new Map();

mqttClient.on('message', async (topic, message) => {
  try {
    const payload = JSONbig.parse(message.toString());
    const { device_id, timestamp, ammonia_ppm, fullness_pct } = payload;

    // moving average check
    const lastSamples = await getLastNSamples(device_id, 5);
    if (lastSamples && lastSamples.length >= 1) {
      const avg = movingAverage(lastSamples);
      if (avg) {
        const devA = Math.abs(ammonia_ppm - avg.ammonia_ppm) / (avg.ammonia_ppm || 1);
        const devF = Math.abs(fullness_pct - avg.fullness_pct) / (avg.fullness_pct || 1);
        if (devA > 0.1 || devF > 0.1) {
          console.warn('Ignoring deviant sample from', device_id);
          return;
        }
      }
    }

    // find tps by device mapping
    const all = await tpsModel.getAll();
    const tps = all.find((t) => t.id === payload.tps_id || t.name === payload.device_id || t.device_id === payload.device_id);

    const alertLevel = getAlertLevel(ammonia_ppm, fullness_pct);
    const reading = {
      tps_id: tps ? tps.id : null,
      device_id: device_id,
      ammonia_ppm: ammonia_ppm,
      fullness_pct: fullness_pct,
      is_critical: isCritical(ammonia_ppm, fullness_pct),
      alert_level: alertLevel,
      timestamp: timestamp,
    };

    const saved = await sensorModel.insert(reading);

    // update redis latest cache
    if (reading.tps_id) {
      await redis.setex(`latest_reading:${reading.tps_id}`, 600, JSON.stringify(saved));
      
      // Check if alert level changed for this TPS
      const cacheKey = `alert_level:${reading.tps_id}`;
      const lastLevel = lastAlertLevelCache.get(reading.tps_id) || 'normal';
      
      // Send notification only if level changed or escalated
      if (alertLevel !== lastLevel && tps) {
        if (alertLevel === 'critical') {
          await sendCriticalNotification({ tps, ammonia_ppm, fullness_pct });
        } else if (alertLevel === 'warning' && lastLevel === 'normal') {
          // Send warning only when transitioning from normal to warning
          await sendWarningNotification({ tps, ammonia_ppm, fullness_pct });
        }
      }
      
      lastAlertLevelCache.set(reading.tps_id, alertLevel);
    }
  } catch (err) {
    console.error('Error handling MQTT message', err);
  }
});

module.exports = mqttClient;
