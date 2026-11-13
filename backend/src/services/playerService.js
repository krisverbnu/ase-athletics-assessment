// Player business logic: every database query about players lives here.
const prisma = require('../utils/prisma');
const HttpError = require('../utils/httpError');
const { POSITIONS } = require('../validators/players');

// Turn the validated filters into a Prisma "where" object.
// Shared by the player list AND the dashboard, so both always agree.
function buildWhere(f = {}) {
  const where = { AND: [] };

  if (f.q) {
    // Case-insensitive "contains" search across name, team and nationality
    where.AND.push({
      OR: [
        { name: { contains: f.q, mode: 'insensitive' } },
        { team: { contains: f.q, mode: 'insensitive' } },
        { nationality: { contains: f.q, mode: 'insensitive' } },
      ],
    });
  }
  if (f.ids?.length) where.AND.push({ id: { in: f.ids } });
  if (f.position?.length) where.AND.push({ position: { in: f.position } });
  if (f.team?.length) where.AND.push({ team: { in: f.team } });
  if (f.nationality?.length) where.AND.push({ nationality: { in: f.nationality } });

  // Ranges: only add the parts that were sent
  const range = (field, min, max) => {
    if (min === undefined && max === undefined) return;
    where.AND.push({
      [field]: { ...(min !== undefined && { gte: min }), ...(max !== undefined && { lte: max }) },
    });
  };
  range('age', f.ageMin, f.ageMax);
  range('marketValue', f.valueMin, f.valueMax);
  range('goals', f.goalsMin, f.goalsMax);
  range('assists', f.assistsMin, f.assistsMax);

  return where.AND.length ? where : {};
}

// Columns that can be empty (null): put the empty ones last whichever way we sort
const NULLABLE_SORTS = ['marketValue', 'contractEnd'];

function buildOrderBy(sort, order) {
  const primary = NULLABLE_SORTS.includes(sort) ? { [sort]: { sort: order, nulls: 'last' } } : { [sort]: order };
  return [primary, { id: 'asc' }]; // id as tie-breaker keeps pages stable
}

async function listPlayers(query) {
  const { page, limit, sort, order, ...filters } = query;
  const where = buildWhere(filters);

  // Run the page query and the count in one transaction, so both see the same data:
  // if a player is added in between, the total still matches the rows ("page 2 of 4" stays right)
  const [players, total] = await prisma.$transaction([
    prisma.player.findMany({
      where,
      orderBy: buildOrderBy(sort, order),
      skip: (page - 1) * limit,
      take: limit,
      include: { attributes: true },
    }),
    prisma.player.count({ where }),
  ]);

  return {
    data: players,
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), sort, order },
  };
}

// Quick search for the search bar / autocomplete: few fields, few results
async function searchPlayers({ q, limit }) {
  const players = await prisma.player.findMany({
    where: buildWhere({ q }),
    orderBy: [{ name: 'asc' }],
    take: limit,
    select: { id: true, name: true, team: true, nationality: true, position: true },
  });
  return { data: players, meta: { q, count: players.length } };
}

// Everything about one player, for the profile page
async function getPlayer(id) {
  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      attributes: true,
      marketValues: { orderBy: { date: 'asc' } },
      monthlyForm: { orderBy: { month: 'asc' } },
      reports: {
        orderBy: { matchDate: 'desc' },
        include: { scout: { select: { id: true, name: true } } },
      },
    },
  });
  if (!player) throw new HttpError(404, 'Player not found.');
  return player;
}

// Values the filter controls need: every team and nationality, and min/max ranges
async function getFilterOptions() {
  const [teams, nationalities, agg] = await Promise.all([
    prisma.player.findMany({ distinct: ['team'], select: { team: true }, orderBy: { team: 'asc' } }),
    prisma.player.findMany({
      distinct: ['nationality'],
      select: { nationality: true },
      orderBy: { nationality: 'asc' },
    }),
    prisma.player.aggregate({
      _min: { age: true, marketValue: true, goals: true, assists: true },
      _max: { age: true, marketValue: true, goals: true, assists: true },
    }),
  ]);
  return {
    positions: POSITIONS,
    teams: teams.map((t) => t.team),
    nationalities: nationalities.map((n) => n.nationality),
    ranges: {
      age: { min: agg._min.age, max: agg._max.age },
      marketValue: { min: agg._min.marketValue, max: agg._max.marketValue },
      goals: { min: agg._min.goals, max: agg._max.goals },
      assists: { min: agg._min.assists, max: agg._max.assists },
    },
  };
}

// Split the request body into player columns and the nested attributes
function toPlayerData(body) {
  const { attributes, contractEnd, ...fields } = body;
  return {
    fields: {
      ...fields,
      ...(contractEnd !== undefined && { contractEnd: contractEnd ? new Date(contractEnd) : null }),
    },
    attributes,
  };
}

async function createPlayer(body) {
  const { fields, attributes } = toPlayerData(body);
  return prisma.player.create({
    data: { ...fields, ...(attributes && { attributes: { create: attributes } }) },
    include: { attributes: true },
  });
}

async function updatePlayer(id, body) {
  const { fields, attributes } = toPlayerData(body);
  // update() throws P2025 if the id doesn't exist; the error handler turns that into a 404
  return prisma.player.update({
    where: { id },
    data: {
      ...fields,
      // upsert = update the attributes row if it exists, create it if it doesn't
      ...(attributes && { attributes: { upsert: { create: attributes, update: attributes } } }),
    },
    include: { attributes: true },
  });
}

async function deletePlayer(id) {
  // Attributes, value history, form and reports are removed too (onDelete: Cascade)
  await prisma.player.delete({ where: { id } });
}

module.exports = {
  buildWhere,
  listPlayers,
  searchPlayers,
  getPlayer,
  getFilterOptions,
  createPlayer,
  updatePlayer,
  deletePlayer,
};
