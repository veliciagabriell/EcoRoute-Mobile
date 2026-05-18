const admin = require('../config/firebase');
const usersModel = require('../models/users');
const notificationsModel = require('../models/notifications');

async function sendCriticalNotification({ tps, ammonia_ppm, fullness_pct }) {
  // Find officers (petugas) in area
  const officers = await usersModel.listByRole('petugas');
  const tokens = officers.filter((o) => o.work_area === tps.area && o.fcm_token).map((o) => o.fcm_token);

  const payload = {
    notification: {
      title: `🔴 KRITIS: ${tps.name}`,
      body: `Ammonia: ${ammonia_ppm} ppm, Penuh: ${fullness_pct}%`,
    },
    data: {
      tps_id: tps.id,
      alert_level: 'critical',
      ammonia_ppm: String(ammonia_ppm),
      fullness_pct: String(fullness_pct),
    },
  };

  // Save notification entry
  await notificationsModel.create({ 
    tps_id: tps.id, 
    triggered_at: new Date(), 
    ammonia_ppm, 
    fullness_pct, 
    alert_level: 'critical',
    delivery_status: 'pending' 
  });

  if (!admin || !admin.messaging || tokens.length === 0) {
    console.log('No officer tokens found for area:', tps.area);
    return { success: false, reason: 'no_tokens_or_firebase' };
  }

  try {
    const res = await admin.messaging().sendToDevice(tokens, payload);
    console.log('Critical notification sent:', res);
    return { success: true, result: res };
  } catch (err) {
    console.error('FCM send error', err);
    return { success: false, error: err };
  }
}

async function sendWarningNotification({ tps, ammonia_ppm, fullness_pct }) {
  // Find officers (petugas) in area for warnings too
  const officers = await usersModel.listByRole('petugas');
  const tokens = officers.filter((o) => o.work_area === tps.area && o.fcm_token).map((o) => o.fcm_token);

  const payload = {
    notification: {
      title: `⚠️ PERINGATAN: ${tps.name}`,
      body: `Ammonia: ${ammonia_ppm} ppm, Penuh: ${fullness_pct}%`,
    },
    data: {
      tps_id: tps.id,
      alert_level: 'warning',
      ammonia_ppm: String(ammonia_ppm),
      fullness_pct: String(fullness_pct),
    },
  };

  // Save notification entry
  await notificationsModel.create({ 
    tps_id: tps.id, 
    triggered_at: new Date(), 
    ammonia_ppm, 
    fullness_pct, 
    alert_level: 'warning',
    delivery_status: 'pending' 
  });

  if (!admin || !admin.messaging || tokens.length === 0) {
    console.log('No officer tokens found for area:', tps.area);
    return { success: false, reason: 'no_tokens_or_firebase' };
  }

  try {
    const res = await admin.messaging().sendToDevice(tokens, payload);
    console.log('Warning notification sent:', res);
    return { success: true, result: res };
  } catch (err) {
    console.error('FCM send error', err);
    return { success: false, error: err };
  }
}

module.exports = { sendCriticalNotification, sendWarningNotification };
