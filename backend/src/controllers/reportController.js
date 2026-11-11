const reportService = require('../services/reportService');

async function list(req, res) {
  res.json(await reportService.listReports(req.validated.query));
}

async function getOne(req, res) {
  res.json({ data: await reportService.getReport(req.validated.params.id) });
}

async function create(req, res) {
  res.status(201).json({ data: await reportService.createReport(req.body, req.user.id) });
}

async function update(req, res) {
  res.json({ data: await reportService.updateReport(req.validated.params.id, req.body) });
}

async function remove(req, res) {
  await reportService.deleteReport(req.validated.params.id);
  res.status(204).end();
}

module.exports = { list, getOne, create, update, remove };
