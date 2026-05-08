const mqttClient = require('../config/mqtt');
const JSONbig = JSON;
const sensorModel = require('../models/sensor_readings');
const tpsModel = require('../models/tps');
const redis = require('../config/redis');
const { getLastNSamples } = require('../models/sensor_readings');
const movingAverage = require('../utils/movingAverage');
const { sendCriticalNotification } = require('./notificationService');

function isCritical(ammonia_ppm, fullness_pct) {
  return Number(ammonia_ppm) >= 50 || Number(fullness_pct) >= 80;
}

mqttClient.on('message', async (topic, message) => {
  try {
    const payload = JSONbig.parse(message.toString());
    // basic structure validation
    const { device_id, timestamp, ammonia_ppm, fullness_pct } = payload;
    // get device's tps mapping - here we assume device_id == tps.device_id or similar - user must map

    // moving average check
    const lastSamples = await getLastNSamples(device_id, 5);
    if (lastSamples && lastSamples.length >= 1) {
      const avg = movingAverage(lastSamples);
      if (avg) {
        // ignore if deviation >10%
        const devA = Math.abs(ammonia_ppm - avg.ammonia_ppm) / (avg.ammonia_ppm || 1);
        const devF = Math.abs(fullness_pct - avg.fullness_pct) / (avg.fullness_pct || 1);
        if (devA > 0.1 || devF > 0.1) {
          console.warn('Ignoring deviant sample from', device_id);
          return;
        }
      }
    }

    // find tps by device mapping - as a placeholder we try to find TPS with matching id same as device_id
    // In production there should be a device registry
    const all = await tpsModel.getAll();
    const tps = all.find((t) => t.id === payload.tps_id || t.name === payload.device_id || t.device_id === payload.device_id);

    const reading = {
      tps_id: tps ? tps.id : null,
      device_id: device_id,
      ammonia_ppm: ammonia_ppm,
      fullness_pct: fullness_pct,
      is_critical: isCritical(ammonia_ppm, fullness_pct),
      timestamp: timestamp,
    };

    const saved = await sensorModel.insert(reading);

    // update redis latest cache
    if (reading.tps_id) {
      await redis.setex(`latest_reading:${reading.tps_id}`, 600, JSON.stringify(saved));
    }

    if (reading.is_critical && tps) {
      // create notification row and send push
      await sendCriticalNotification({ tps, ammonia_ppm, fullness_pct });
    }
  } catch (err) {
    console.error('Error handling MQTT message', err);
  }
});

module.exports = mqttClient;
