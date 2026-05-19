const reportsModel = require('../models/user_reports');
const tpsModel = require('../models/tps_locations');
const { sendReportNotification } = require('../services/notificationService');

async function createReport(req, res) {
  const {
    tps_id,
    description,
    indicators,
    severity,
    photo_base64,
    photo_mime,
    location_lat,
    location_lng,
  } = req.body;
  const reporter_id = req.user.id;

  const r = await reportsModel.create({
    tps_id,
    reporter_id,
    description,
    indicators,
    severity,
    photo_base64,
    photo_mime,
    location_lat,
    location_lng,
  });

  try {
    const tps = tps_id ? await tpsModel.getById(tps_id) : null;
    await sendReportNotification({
      tps,
      severity: severity || 'sedang',
      description,
    });
  } catch (err) {
    console.error('[Reports] Notification error', err.message);
  }

  res.status(201).json(r);
}

async function listReports(req, res) {
  const rows = await reportsModel.listAll();
  res.json(rows);
}

async function updateReport(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const updated = await reportsModel.updateStatus(id, status);
  res.json(updated);
}

module.exports = { createReport, listReports, updateReport };
