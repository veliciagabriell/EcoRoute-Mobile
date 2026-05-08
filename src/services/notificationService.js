const admin = require('../config/firebase');
const usersModel = require('../models/users');
const notificationsModel = require('../models/notifications');

async function sendCriticalNotification({ tps, ammonia_ppm, fullness_pct }) {
  // Find officers in area
  const officers = await usersModel.listByRole('officer');
  const tokens = officers.filter((o) => o.work_area === tps.area && o.fcm_token).map((o) => o.fcm_token);

  const payload = {
    notification: {
      title: `Critical at ${tps.name}`,
      body: `Ammonia: ${ammonia_ppm} ppm, Fullness: ${fullness_pct}%`,
    },
    data: {
      tps_id: tps.id,
      critical: 'true',
    },
  };

  // Save notification entry
  await notificationsModel.create({ tps_id: tps.id, triggered_at: new Date(), ammonia_ppm, fullness_pct, delivery_status: 'pending' });

  if (!admin || !admin.messaging || tokens.length === 0) return { success: false, reason: 'no_tokens_or_firebase' };

  try {
    const res = await admin.messaging().sendToDevice(tokens, payload);
    return { success: true, result: res };
  } catch (err) {
    console.error('FCM send error', err);
    return { success: false, error: err };
  }
}

module.exports = { sendCriticalNotification };
