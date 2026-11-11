// Dashboard statistics. Every card and chart on the dashboard comes from one call.
//
// Why compute in JavaScript instead of many SQL queries? The dataset is small (about
// 90 players), so one query plus a pass in memory is fast and much easier to read.
// With tens of thousands of players we'd move these into database GROUP BY queries.
const prisma = require('../utils/prisma');
const { buildWhere } = require('./playerService');

// The data files are a snapshot from 8 July 2025 (2024-25 season).
// "Expiring soon" is measured from this date by default, not from today,
// otherwise most contracts would already show as expired. See README.
const DATA_DATE = '2025-07-08';

const round = (n, digits = 1) => Math.round(n * 10 ** digits) / 10 ** digits;
const average = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);
const pick = (p) => ({ id: p.id, name: p.name, team: p.team, position: p.position });

const AGE_GROUPS = [
  { label: 'Under 21', test: (age) => age < 21 },
  { label: '21-25', test: (age) => age >= 21 && age <= 25 },
  { label: '26-29', test: (age) => age >= 26 && age <= 29 },
  { label: '30+', test: (age) => age >= 30 },
];
const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
const CORE_ATTRIBUTES = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
const MIN_MINUTES_FOR_PER_90 = 900; // 10 full matches, so one lucky cameo doesn't top the table

// Pure function: players in, numbers out. Easy to test without a database.
function computeStats(players, asOfDate) {
  const asOf = new Date(asOfDate);
  const inOneYear = new Date(asOf);
  inOneYear.setUTCFullYear(inOneYear.getUTCFullYear() + 1);

  const withValue = players.filter((p) => p.marketValue != null);
  const byGoals = [...players].sort((a, b) => b.goals - a.goals);
  const byAssists = [...players].sort((a, b) => b.assists - a.assists);

  // Contracts
  const withContract = players.filter((p) => p.contractEnd);
  const expired = withContract.filter((p) => new Date(p.contractEnd) < asOf);
  const expiringSoon = withContract
    .filter((p) => new Date(p.contractEnd) >= asOf && new Date(p.contractEnd) <= inOneYear)
    .sort((a, b) => new Date(a.contractEnd) - new Date(b.contractEnd));

  // Goals + assists per 90 minutes (output adjusted for playing time)
  const per90 = players
    .filter((p) => p.minutesPlayed >= MIN_MINUTES_FOR_PER_90)
    .map((p) => ({ ...pick(p), minutesPlayed: p.minutesPlayed, goalContributionsPer90: round(((p.goals + p.assists) / p.minutesPlayed) * 90, 2) }))
    .sort((a, b) => b.goalContributionsPer90 - a.goalContributionsPer90);

  // Goal contributions per €10k of weekly salary (salary unit assumed weekly EUR)
  const valueForMoney = players
    .filter((p) => p.contractSalary > 0 && p.goals + p.assists > 0)
    .map((p) => ({ ...pick(p), weeklySalary: p.contractSalary, contributionsPer10k: round(((p.goals + p.assists) / p.contractSalary) * 10000, 2) }))
    .sort((a, b) => b.contributionsPer10k - a.contributionsPer10k);

  const teamCounts = players.reduce((acc, p) => ({ ...acc, [p.team]: (acc[p.team] || 0) + 1 }), {});

  return {
    kpis: {
      totalPlayers: players.length,
      averageAge: round(average(players.map((p) => p.age))),
      totalGoals: players.reduce((n, p) => n + p.goals, 0),
      totalAssists: players.reduce((n, p) => n + p.assists, 0),
      playersWithMarketValue: withValue.length,
      averageMarketValue: withValue.length ? Math.round(average(withValue.map((p) => p.marketValue))) : null,
      topScorer: byGoals[0] ? { ...pick(byGoals[0]), goals: byGoals[0].goals } : null,
      topAssister: byAssists[0] ? { ...pick(byAssists[0]), assists: byAssists[0].assists } : null,
      expiredContracts: expired.length,
      contractsExpiringWithin12Months: expiringSoon.length,
    },
    mostValuable: [...withValue]
      .sort((a, b) => b.marketValue - a.marketValue)
      .slice(0, 5)
      .map((p) => ({ ...pick(p), marketValue: p.marketValue })),
    expiringContracts: expiringSoon.slice(0, 10).map((p) => ({ ...pick(p), contractEnd: p.contractEnd })),
    byPosition: POSITIONS.map((position) => {
      const group = players.filter((p) => p.position === position);
      return {
        position,
        players: group.length,
        goals: group.reduce((n, p) => n + p.goals, 0),
        assists: group.reduce((n, p) => n + p.assists, 0),
        averageAge: round(average(group.map((p) => p.age))),
      };
    }),
    ageGroups: AGE_GROUPS.map((g) => ({ label: g.label, players: players.filter((p) => g.test(p.age)).length })),
    teams: Object.entries(teamCounts)
      .map(([team, count]) => ({ team, players: count }))
      .sort((a, b) => b.players - a.players || a.team.localeCompare(b.team)),
    attributesByPosition: POSITIONS.map((position) => {
      const group = players.filter((p) => p.position === position && p.attributes);
      return {
        position,
        ...Object.fromEntries(CORE_ATTRIBUTES.map((attr) => [attr, round(average(group.map((p) => p.attributes[attr])))])),
      };
    }),
    topPer90: per90.slice(0, 10),
    bestValueForMoney: valueForMoney.slice(0, 5),
    marketValueTrends: players
      .filter((p) => p.marketValues?.length > 1)
      .map((p) => ({ ...pick(p), history: p.marketValues.map((v) => ({ date: v.date, value: v.value })) })),
    dataQuality: dataCoverage(players),
  };
}

// How complete the data is: for each field, how many of the (filtered) players have it.
// Shown on the dashboard so users know which numbers rest on partial data.
function dataCoverage(players) {
  const has = (test) => players.filter(test).length;
  const formCount = (p) => p._count?.monthlyForm ?? p.monthlyForm?.length ?? 0;
  return {
    totalPlayers: players.length,
    coverage: [
      { key: 'attributes', label: 'Attribute ratings', count: has((p) => p.attributes) },
      { key: 'contractEnd', label: 'Contract end date', count: has((p) => p.contractEnd) },
      { key: 'contractSalary', label: 'Salary', count: has((p) => p.contractSalary != null) },
      { key: 'marketValue', label: 'Market value', count: has((p) => p.marketValue != null) },
      { key: 'valueHistory', label: 'Value history', count: has((p) => p.marketValues?.length > 1) },
      { key: 'monthlyForm', label: 'Month-by-month form', count: has((p) => formCount(p) > 0) },
    ],
  };
}

async function getDashboardStats(query) {
  const { asOf = DATA_DATE, ...filters } = query;
  const players = await prisma.player.findMany({
    where: buildWhere(filters),
    include: {
      attributes: true,
      marketValues: { orderBy: { date: 'asc' } },
      _count: { select: { monthlyForm: true } }, // just the number of rows, not the rows themselves
    },
  });
  const asOfIso = new Date(asOf).toISOString().slice(0, 10);
  return { data: computeStats(players, asOfIso), meta: { asOf: asOfIso, dataDate: DATA_DATE } };
}

module.exports = { computeStats, getDashboardStats, DATA_DATE };
