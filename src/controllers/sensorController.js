const sensorModel = require('../models/sensor_readings');
const tpsModel = require('../models/tps');
const redis = require('../config/redis');

/**
 * Get latest sensor readings for all TPS with alert status
 * Returns sensor status (normal, warning, critical) with visual indicators
 */
async function getLatestStatus(req, res) {
  try {
    const all = await tpsModel.getAll();
    const result = [];
    
    for (const tps of all) {
      const cache = await redis.get(`latest_reading:${tps.id}`);
      let latest = null;
      
      if (cache) {
        latest = JSON.parse(cache);
      } else {
        latest = await sensorModel.getLatestByTps(tps.id);
      }
      
      if (latest) {
        result.push({
          tps_id: tps.id,
          tps_name: tps.name,
          location: {
            latitude: tps.latitude,
            longitude: tps.longitude,
            area: tps.area,
          },
          sensor_data: {
            ammonia_ppm: latest.ammonia_ppm,
            fullness_pct: latest.fullness_pct,
            timestamp: latest.timestamp,
          },
          alert: {
            level: latest.alert_level || 'normal',
            color: getAlertColor(latest.alert_level),
            critical: latest.is_critical,
          },
          thresholds: {
            ammonia: {
              normal: 30,
              warning: 30,
              critical: 50,
              current: latest.ammonia_ppm,
              status: getAmmonilaStatus(latest.ammonia_ppm),
            },
            fullness: {
              normal: 60,
              warning: 60,
              critical: 80,
              current: latest.fullness_pct,
              status: getFullnessStatus(latest.fullness_pct),
            },
          },
        });
      }
    }
    
    res.json(result);
  } catch (err) {
    console.error('Error fetching sensor status:', err);
    res.status(500).json({ error: 'Failed to fetch sensor status' });
  }
}

/**
 * Get sensor readings for a specific TPS with detailed alert history
 */
async function getTpsAlertHistory(req, res) {
  try {
    const { tps_id } = req.params;
    const { hours = 24 } = req.query;
    
    const tps = await tpsModel.getById(tps_id);
    if (!tps) return res.status(404).json({ error: 'TPS not found' });
    
    const fromTS = new Date(Date.now() - 1000 * 60 * 60 * hours).toISOString();
    const toTS = new Date().toISOString();
    
    const readings = await sensorModel.getByTpsInRange(tps_id, fromTS, toTS);
    
    const result = {
      tps: {
        id: tps.id,
        name: tps.name,
        area: tps.area,
      },
      alert_history: readings.map(r => ({
        timestamp: r.timestamp,
        ammonia_ppm: r.ammonia_ppm,
        fullness_pct: r.fullness_pct,
        alert_level: r.alert_level,
        color: getAlertColor(r.alert_level),
      })),
      summary: {
        total_readings: readings.length,
        critical_count: readings.filter(r => r.alert_level === 'critical').length,
        warning_count: readings.filter(r => r.alert_level === 'warning').length,
        normal_count: readings.filter(r => r.alert_level === 'normal').length,
      },
    };
    
    res.json(result);
  } catch (err) {
    console.error('Error fetching alert history:', err);
    res.status(500).json({ error: 'Failed to fetch alert history' });
  }
}

function getAlertColor(level) {
  switch (level) {
    case 'critical':
      return '#FF4444'; // Red
    case 'warning':
      return '#FFD700'; // Yellow
    case 'normal':
    default:
      return '#4CAF50'; // Green
  }
}

function getAmmonilaStatus(ppm) {
  const am = Number(ppm);
  if (am >= 50) return 'critical';
  if (am >= 30) return 'warning';
  return 'normal';
}

function getFullnessStatus(pct) {
  const fu = Number(pct);
  if (fu >= 80) return 'critical';
  if (fu >= 60) return 'warning';
  return 'normal';
}

module.exports = { getLatestStatus, getTpsAlertHistory };
