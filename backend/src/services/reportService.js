// Scouting report logic
const prisma = require('../utils/prisma');
const HttpError = require('../utils/httpError');

// What to include with every report: who it's about and who wrote it
const INCLUDE = {
  player: { select: { id: true, name: true, team: true, position: true } },
  scout: { select: { id: true, name: true } },
};

const toDate = (value) => (value ? new Date(value) : value);

async function listReports({ page, limit, ...filters }) {
  const where = {
    ...(filters.playerId && { playerId: filters.playerId }),
    ...(filters.scoutId && { scoutId: filters.scoutId }),
    ...(filters.recommendation && { recommendation: filters.recommendation }),
  };
  const [reports, total] = await prisma.$transaction([
    prisma.scoutReport.findMany({
      where,
      include: INCLUDE,
      orderBy: [{ matchDate: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.scoutReport.count({ where }),
  ]);
  return { data: reports, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

async function getReport(id) {
  const report = await prisma.scoutReport.findUnique({ where: { id }, include: INCLUDE });
  if (!report) throw new HttpError(404, 'Report not found.');
  return report;
}

async function ensurePlayerExists(playerId) {
  const player = await prisma.player.findUnique({ where: { id: playerId }, select: { id: true } });
  if (!player)
    throw new HttpError(400, 'That player does not exist.', [{ field: 'playerId', message: 'Player not found' }]);
}

async function createReport(body, scoutId) {
  await ensurePlayerExists(body.playerId);
  return prisma.scoutReport.create({
    data: { ...body, matchDate: toDate(body.matchDate), scoutId }, // the logged-in user is the scout
    include: INCLUDE,
  });
}

// Anyone logged in can read every report, but only the scout who wrote a report
// can change or delete it
async function ensureOwner(id, userId) {
  const report = await prisma.scoutReport.findUnique({ where: { id }, select: { scoutId: true } });
  if (!report) throw new HttpError(404, 'Report not found.');
  if (report.scoutId !== Number(userId)) throw new HttpError(403, 'You can only change your own reports.');
}

async function updateReport(id, body, userId) {
  await ensureOwner(id, userId);
  if (body.playerId) await ensurePlayerExists(body.playerId);
  return prisma.scoutReport.update({
    where: { id },
    data: { ...body, ...(body.matchDate && { matchDate: toDate(body.matchDate) }) },
    include: INCLUDE,
  });
}

async function deleteReport(id, userId) {
  await ensureOwner(id, userId);
  await prisma.scoutReport.delete({ where: { id } });
}

module.exports = { listReports, getReport, createReport, updateReport, deleteReport };
