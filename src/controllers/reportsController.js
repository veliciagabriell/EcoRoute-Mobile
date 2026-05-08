const reportsModel = require('../models/user_reports');

async function createReport(req, res) {
  const { tps_id, description } = req.body;
  const reporter_id = req.user.id;
  const r = await reportsModel.create({ tps_id, reporter_id, description });
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
