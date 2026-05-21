const admin = require('../config/firebase');
const usersModel = require('../models/users');
const notificationsModel = require('../models/notifications');

async function _saveNotification(data) {
  try {
    await notificationsModel.create(data);
  } catch (err) {
    console.warn('[Notification] DB record failed (table may not exist yet):', err.message);
  }
}

async function _sendFCM(tokens, payload) {
  if (tokens.length === 0) {
    return { success: false, reason: 'no_tokens' };
  }
  try {
    const res = await admin.messaging().sendToDevice(tokens, payload);
    console.log('[Notification] FCM sent:', res.successCount, 'success,', res.failureCount, 'failed');
    return { success: true, result: res };
  } catch (err) {
    // Expected when GOOGLE_APPLICATION_CREDENTIALS is not set
    if (err.message?.includes('default Firebase app does not exist') || err.code === 'app/no-app') {
      console.log('[Notification] Firebase not configured — skipping FCM');
    } else {
      console.error('[Notification] FCM send error:', err.message);
    }
    return { success: false, error: err.message };
  }
}

async function sendCriticalNotification({ tps, ammonia_ppm, fullness_pct }) {
  const officers = await usersModel.listByRole('petugas');
  const tokens = officers.filter((o) => o.work_area === tps.area && o.fcm_token).map((o) => o.fcm_token);

  await _saveNotification({
    tps_id: tps.id,
    triggered_at: new Date(),
    ammonia_ppm,
    fullness_pct,
    alert_level: 'critical',
    delivery_status: 'pending',
  });

  const payload = {
    notification: {
      title: `🔴 KRITIS: ${tps.name}`,
      body: `Ammonia: ${ammonia_ppm} ppm, Penuh: ${fullness_pct}%`,
    },
    data: {
      tps_id: String(tps.id),
      alert_level: 'critical',
      ammonia_ppm: String(ammonia_ppm),
      fullness_pct: String(fullness_pct),
    },
  };

  return _sendFCM(tokens, payload);
}

async function sendWarningNotification({ tps, ammonia_ppm, fullness_pct }) {
  const officers = await usersModel.listByRole('petugas');
  const tokens = officers.filter((o) => o.work_area === tps.area && o.fcm_token).map((o) => o.fcm_token);

  await _saveNotification({
    tps_id: tps.id,
    triggered_at: new Date(),
    ammonia_ppm,
    fullness_pct,
    alert_level: 'warning',
    delivery_status: 'pending',
  });

  const payload = {
    notification: {
      title: `⚠️ PERINGATAN: ${tps.name}`,
      body: `Ammonia: ${ammonia_ppm} ppm, Penuh: ${fullness_pct}%`,
    },
    data: {
      tps_id: String(tps.id),
      alert_level: 'warning',
      ammonia_ppm: String(ammonia_ppm),
      fullness_pct: String(fullness_pct),
    },
  };

  return _sendFCM(tokens, payload);
}

async function sendReportNotification({ tps, severity, description }) {
  const officers = await usersModel.listByRole('petugas');
  const tokens = officers.filter((o) => o.fcm_token).map((o) => o.fcm_token);

  const alertLevel = severity === 'tinggi' ? 'critical' : severity === 'sedang' ? 'warning' : 'normal';
  if (tps?.id) {
    await _saveNotification({
      tps_id: tps.id,
      triggered_at: new Date(),
      alert_level: alertLevel,
      delivery_status: 'pending',
    });
  }

  const title = `📝 Laporan TPS${tps?.name ? `: ${tps.name}` : ''}`;
  const body = description ? description.slice(0, 120) : 'Ada laporan baru dari warga.';
  const payload = {
    notification: { title, body },
    data: {
      tps_id: tps?.id ? String(tps.id) : '',
      severity: severity || 'sedang',
      type: 'user_report',
    },
  };

  return _sendFCM(tokens, payload);
}

module.exports = { sendCriticalNotification, sendWarningNotification, sendReportNotification };
