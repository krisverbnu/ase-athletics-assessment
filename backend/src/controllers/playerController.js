const playerService = require('../services/playerService');

async function list(req, res) {
  res.json(await playerService.listPlayers(req.validated.query));
}

async function search(req, res) {
  res.json(await playerService.searchPlayers(req.validated.query));
}

async function filterOptions(req, res) {
  res.json({ data: await playerService.getFilterOptions() });
}

async function getOne(req, res) {
  res.json({ data: await playerService.getPlayer(req.validated.params.id) });
}

async function create(req, res) {
  res.status(201).json({ data: await playerService.createPlayer(req.body) });
}

async function update(req, res) {
  res.json({ data: await playerService.updatePlayer(req.validated.params.id, req.body) });
}

async function remove(req, res) {
  await playerService.deletePlayer(req.validated.params.id);
  res.status(204).end(); // 204 = done, nothing to send back
}

module.exports = { list, search, filterOptions, getOne, create, update, remove };
