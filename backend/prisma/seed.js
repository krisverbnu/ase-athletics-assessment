/**
 * Seed script: fills the database with ASE's data.
 *
 * Run with:  npm run db:seed        (or: npx prisma db seed)
 * Dry run:   node prisma/seed.js --dry-run   (prints what it would insert, touches nothing)
 *
 * It merges the two player files following the "Data decisions" in the README:
 *  - All 79 players from players_Data_production.json (the main file) are kept as they are.
 *  - Players from player_statistics_detailed.json are matched BY NAME (the files share no IDs):
 *      - already in the main file (Alessandro Rodriguez): keep the main record and add
 *        market value, value history, league and monthly form from the detailed file;
 *      - not in the main file: imported as new players (11 of them);
 *      - retired (Sebastián Batalla): skipped.
 *  - Detailed positions ("CAM", "Centre Back"...) are mapped to the 4 main groups;
 *    the original is kept in detailedPosition.
 *  - Scout reports are linked to players by name, so report #1 (Marcus Thompson,
 *    only in the detailed file) finds him.
 *  - Each scout becomes a user account; the demo account is demo@ase-athletics.com / demo123.
 *  - Nothing is invented: a value missing from the files stays empty (null).
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));

// ---------- Helpers ----------

// Detailed-file positions -> the 4 groups used by the main file (and the Position enum)
const POSITION_MAP = {
  goalkeeper: 'Goalkeeper',
  gk: 'Goalkeeper',
  defender: 'Defender',
  'centre back': 'Defender',
  'center back': 'Defender',
  cb: 'Defender',
  'left back': 'Defender',
  'right back': 'Defender',
  midfielder: 'Midfielder',
  'central midfielder': 'Midfielder',
  'defensive midfielder': 'Midfielder',
  'attacking midfielder': 'Midfielder',
  cam: 'Midfielder',
  cm: 'Midfielder',
  cdm: 'Midfielder',
  forward: 'Forward',
  striker: 'Forward',
  st: 'Forward',
  'left winger': 'Forward',
  'right winger': 'Forward',
  lw: 'Forward',
  rw: 'Forward',
};

function mapPosition(raw) {
  const group = POSITION_MAP[String(raw).trim().toLowerCase()];
  if (!group) throw new Error(`Unknown position "${raw}": add it to POSITION_MAP`);
  return group;
}

// "2027-06-30" -> Date (or null if missing)
const toDate = (value) => (value ? new Date(`${value}T00:00:00Z`) : null);

// Month labels come in two styles: "August 2024" and just "August".
// When the year is missing, we walk the list in order starting in 2024 (the season's
// first year) and move to the next year whenever the months wrap past December.
// e.g. ["August", ..., "December", "January"] -> Aug 2024 ... Dec 2024, Jan 2025
const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];
const SEASON_START_YEAR = 2024;

function monthsToDates(labels) {
  let year = SEASON_START_YEAR;
  let previousMonth = -1;
  return labels.map((label) => {
    const [monthName, explicitYear] = String(label).trim().split(/\s+/);
    const monthIndex = MONTHS.indexOf(monthName.toLowerCase());
    if (monthIndex === -1) throw new Error(`Can't read month "${label}"`);
    if (explicitYear) {
      year = Number(explicitYear);
    } else if (monthIndex < previousMonth) {
      year += 1; // wrapped past December
    }
    previousMonth = monthIndex;
    return new Date(Date.UTC(year, monthIndex, 1));
  });
}

// Same name even with accents or different capitals: "Matías" == "matias"
const normaliseName = (name) => name.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

const isRetired = (detail) =>
  /retired/i.test(detail.clubInfo?.currentTeam || '') || detail.clubInfo?.playerStatus === 'Retired';

// Market value history: the dated history plus the current value, oldest first, no duplicate dates
function buildValueHistory(market) {
  if (!market) return [];
  const points = (market.valueHistory || []).map((h) => ({
    date: toDate(h.date),
    value: h.value,
    source: h.source || null,
  }));
  if (market.currentMarketValue && market.valuationDate) {
    points.push({ date: toDate(market.valuationDate), value: market.currentMarketValue, source: 'Current valuation' });
  }
  const byDate = new Map(points.map((p) => [p.date.toISOString(), p]));
  return [...byDate.values()].sort((a, b) => a.date - b.date);
}

function buildMonthlyForm(detail) {
  const rows = detail.formAnalysis?.seasonProgression || [];
  const dates = monthsToDates(rows.map((m) => m.month));
  return rows.map((m, i) => ({
    month: dates[i],
    appearances: m.appearances ?? 0,
    goals: m.goals ?? 0,
    assists: m.assists ?? 0,
    averageRating: m.averageRating ?? null,
  }));
}

// ---------- Main file player -> database row ----------
function fromMainFile(p) {
  const s = p.stats;
  const a = p.attributes;
  return {
    sourceId: `main:${p.id}`,
    name: p.name,
    position: mapPosition(p.position),
    detailedPosition: null,
    age: p.age,
    team: p.team,
    league: null,
    nationality: p.nationality,
    height: p.height ?? null,
    weight: p.weight ?? null,
    preferredFoot: p.preferredFoot ?? null,
    jerseyNumber: p.jerseyNumber ?? null,
    imageUrl: null, // the file only has initials; the frontend draws those itself
    appearances: s.appearances,
    goals: s.goals,
    assists: s.assists,
    minutesPlayed: s.minutesPlayed,
    yellowCards: s.yellowCards,
    redCards: s.redCards,
    passAccuracy: s.passAccuracy ?? null,
    shotsOnTarget: s.shotsOnTarget ?? null,
    totalShots: s.totalShots ?? null,
    dribblesCompleted: s.dribblesCompleted ?? null,
    tacklesWon: s.tacklesWon ?? null,
    aerialDuelsWon: s.aerialDuelsWon ?? null,
    saves: s.saves ?? null,
    cleanSheets: s.cleanSheets ?? null,
    goalsConceded: s.goalsConceded ?? null,
    contractSalary: p.contract?.salary ?? null, // assumed weekly EUR (see README)
    contractEnd: toDate(p.contract?.contractEnd),
    marketValue: null, // the main file has no market values
    attributes: {
      pace: a.pace,
      shooting: a.shooting,
      passing: a.passing,
      dribbling: a.dribbling,
      defending: a.defending,
      physical: a.physical,
      positioning: a.positioning ?? null,
      finishing: a.finishing ?? null,
      crossing: a.crossing ?? null,
      longShots: a.longShots ?? null,
      diving: a.diving ?? null,
      handling: a.handling ?? null,
      kicking: a.kicking ?? null,
      reflexes: a.reflexes ?? null,
    },
    marketValues: [],
    monthlyForm: [],
  };
}

// ---------- Detailed file player -> database row ----------
function fromDetailedFile(key, d) {
  const basic = d.basicInfo;
  const club = d.clubInfo;
  const stats = d.seasonStats?.basicStats || {};
  const adv = d.seasonStats?.advancedStats || {};
  const tech = d.scoutingNotes?.attributes?.technical || {};
  const det = d.scoutingNotes?.attributes?.detailed || {};
  const gkAttrs = d.scoutingNotes?.attributes?.goalkeeper || {};
  const position = mapPosition(club.position);
  const isGk = position === 'Goalkeeper';
  return {
    sourceId: `detailed:${key}`,
    name: basic.name,
    position,
    detailedPosition: club.position,
    age: basic.age,
    team: club.currentTeam,
    league: club.league ?? null,
    nationality: basic.nationality,
    height: basic.height ?? null,
    weight: basic.weight ?? null,
    preferredFoot: basic.preferredFoot ?? null,
    jerseyNumber: club.jerseyNumber ?? null,
    imageUrl: null,
    appearances: stats.appearances ?? 0,
    goals: stats.goals ?? 0,
    assists: stats.assists ?? 0,
    minutesPlayed: stats.minutesPlayed ?? 0,
    yellowCards: stats.yellowCards ?? 0,
    redCards: stats.redCards ?? 0,
    passAccuracy: adv.passingMetrics?.passAccuracy ?? null,
    shotsOnTarget: isGk ? null : (adv.shootingMetrics?.shotsOnTarget ?? null),
    totalShots: isGk ? null : (adv.shootingMetrics?.totalShots ?? null),
    dribblesCompleted: null, // not given in a comparable form
    tacklesWon: isGk ? null : (adv.defensiveMetrics?.tacklesWon ?? null),
    aerialDuelsWon: null, // detailed file gives attempts and %, not wins
    saves: isGk ? (d.seasonStats?.goalkeepingStats?.saves ?? null) : null,
    cleanSheets: isGk ? (stats.cleanSheets ?? null) : null,
    goalsConceded: isGk ? (d.seasonStats?.goalkeepingStats?.goalsConceded ?? null) : null,
    contractSalary: d.contractInfo?.salary?.weeklyWage ?? null, // weekly EUR, stated in the file
    contractEnd: toDate(d.contractInfo?.contractEnd),
    marketValue: d.marketData?.currentMarketValue ?? null,
    attributes: {
      pace: tech.pace,
      shooting: tech.shooting,
      passing: tech.passing,
      dribbling: tech.dribbling,
      defending: tech.defending,
      physical: tech.physical,
      positioning: det.positioning ?? null,
      finishing: isGk ? null : (det.finishing ?? null),
      crossing: isGk ? null : (det.crossing ?? null),
      longShots: isGk ? null : (det.longShots ?? null),
      diving: gkAttrs.diving ?? null,
      handling: gkAttrs.handling ?? null,
      kicking: gkAttrs.kicking ?? null,
      reflexes: gkAttrs.reflexes ?? null,
    },
    marketValues: buildValueHistory(d.marketData),
    monthlyForm: buildMonthlyForm(d),
  };
}

// ---------- Scout report -> database row ----------
// The file's recommendation is a sentence; the brief wants SIGN / MONITOR / PASS.
// Rule (documented in the README): overall 9-10 = SIGN, 6-8 = MONITOR, 1-5 = PASS.
function recommendationFromRating(overall) {
  if (overall >= 9) return 'SIGN';
  if (overall >= 6) return 'MONITOR';
  return 'PASS';
}

function fromReport(r) {
  const m = r.matchDetails || {};
  return {
    matchDate: toDate(r.date),
    opponent: m.opponent,
    competition: m.competition ?? null,
    venue: null, // not in the file
    result: m.result ?? null,
    minutesPlayed: m.minutesPlayed ?? null,
    positionPlayed: m.position ?? null,
    ...r.ratings,
    overallRating: r.overallRating,
    strengths: r.strengths || [],
    weaknesses: r.weaknesses || [],
    keyMoments: r.keyMoments || [],
    recommendation: recommendationFromRating(r.overallRating),
    summary: r.recommendation ?? null,
    notes: r.notes ?? null,
  };
}

// ---------- Build everything in memory first ----------
function buildSeedData() {
  const mainPlayers = readJson('players_Data_production.json').players;
  const detailed = readJson('player_statistics_detailed.json').playerDataSchema;
  const scoutFile = readJson('scout_report.json');

  const log = [];
  const players = mainPlayers.map(fromMainFile);
  const byName = new Map(players.map((p) => [normaliseName(p.name), p]));

  for (const [key, d] of Object.entries(detailed)) {
    if (!/^PL\d+$/.test(key)) continue; // skip "metadata" and "dataQuality"
    const name = d.basicInfo?.name;
    if (isRetired(d)) {
      log.push(`skipped ${name} (${key}): retired`);
      continue;
    }
    const existing = byName.get(normaliseName(name));
    if (existing) {
      // Main file wins for core data; detailed file adds what the main file lacks
      const extra = fromDetailedFile(key, d);
      existing.marketValue = extra.marketValue;
      existing.marketValues = extra.marketValues;
      existing.monthlyForm = extra.monthlyForm;
      existing.league = extra.league;
      existing.detailedPosition = extra.detailedPosition;
      log.push(`enriched ${name} (${existing.sourceId} + ${key}) with market value, history and form`);
    } else {
      const player = fromDetailedFile(key, d);
      players.push(player);
      byName.set(normaliseName(name), player);
      log.push(`added ${name} (${key}) from detailed file`);
    }
  }

  // Scouts: one user per distinct scout name
  const scoutNames = [...new Set(scoutFile.scoutingReports.map((r) => r.scoutName))];
  const reports = scoutFile.scoutingReports.map((r) => {
    const player = byName.get(normaliseName(r.playerName));
    if (!player) throw new Error(`Report ${r.id}: player "${r.playerName}" not found in either file`);
    if (player.sourceId !== `main:${r.playerId}`) {
      log.push(
        `report ${r.id}: playerId ${r.playerId} not in main file, linked by name to ${player.name} (${player.sourceId})`,
      );
    }
    return { playerSourceId: player.sourceId, scoutName: r.scoutName, data: fromReport(r) };
  });

  return { players, scoutNames, reports, log };
}

// ---------- Write to the database ----------
async function main() {
  const { players, scoutNames, reports, log } = buildSeedData();

  if (process.argv.includes('--dry-run')) {
    log.forEach((line) => console.log(`- ${line}`));
    console.log(`\nWould insert: ${players.length} players, ${scoutNames.length + 1} users, ${reports.length} reports`);
    console.log(`Players with market value: ${players.filter((p) => p.marketValue).length}`);
    console.log(`Value history points: ${players.reduce((n, p) => n + p.marketValues.length, 0)}`);
    console.log(`Monthly form rows: ${players.reduce((n, p) => n + p.monthlyForm.length, 0)}`);
    console.log(
      'Positions:',
      players.reduce((acc, p) => ({ ...acc, [p.position]: (acc[p.position] || 0) + 1 }), {}),
    );
    console.log(
      'Recommendations:',
      reports.map((r) => `${r.data.recommendation} (overall ${r.data.overallRating})`).join(', '),
    );
    return;
  }

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    console.log('Clearing old data...');
    // Children first, then parents (reports need players and users to exist)
    await prisma.scoutReport.deleteMany();
    await prisma.monthlyForm.deleteMany();
    await prisma.marketValue.deleteMany();
    await prisma.playerAttributes.deleteMany();
    await prisma.player.deleteMany();
    await prisma.user.deleteMany();

    console.log('Creating users...');
    const demo = await prisma.user.create({
      data: {
        email: 'demo@ase-athletics.com',
        name: 'Demo Scout',
        passwordHash: await bcrypt.hash('demo123', 10),
      },
    });
    const scoutIds = new Map();
    for (const name of scoutNames) {
      const email = `${normaliseName(name).replace(/[^a-z]+/g, '.')}@ase-athletics.com`;
      // Imported scouts can't log in: their password is a random string nobody knows
      const randomPassword = require('crypto').randomBytes(24).toString('hex');
      const user = await prisma.user.create({
        data: { email, name, passwordHash: await bcrypt.hash(randomPassword, 10) },
      });
      scoutIds.set(name, user.id);
    }

    console.log(`Creating ${players.length} players...`);
    const idBySource = new Map();
    for (const p of players) {
      const { attributes, marketValues, monthlyForm, ...fields } = p;
      const created = await prisma.player.create({
        data: {
          ...fields,
          attributes: { create: attributes },
          marketValues: { create: marketValues },
          monthlyForm: { create: monthlyForm },
        },
      });
      idBySource.set(p.sourceId, created.id);
    }

    console.log(`Creating ${reports.length} scout reports...`);
    for (const r of reports) {
      await prisma.scoutReport.create({
        data: {
          ...r.data,
          playerId: idBySource.get(r.playerSourceId),
          scoutId: scoutIds.get(r.scoutName) ?? demo.id,
        },
      });
    }

    log.forEach((line) => console.log(`- ${line}`));
    console.log(`\nDone: ${players.length} players, ${scoutNames.length + 1} users, ${reports.length} reports.`);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run when called as a script (npm run db:seed), not when a test imports this file
if (require.main === module) {
  main().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
}

module.exports = { buildSeedData, monthsToDates, recommendationFromRating };
