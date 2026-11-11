const dashboardService = require('../services/dashboardService');

async function stats(req, res) {
  res.json(await dashboardService.getDashboardStats(req.validated.query));
}

module.exports = { stats };
