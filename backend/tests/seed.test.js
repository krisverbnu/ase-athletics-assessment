// The seed script merges ASE's data files into one database. These tests check the
// merge decisions documented in docs/data-quality.md, using the real data files.
const { buildSeedData, monthsToDates, recommendationFromRating } = require('../prisma/seed');

describe('seed: merging the data files', () => {
  const { players, reports, log } = buildSeedData();
  const byName = (name) => players.find((p) => p.name === name);

  test('merges both player files into 90 players with no duplicates', () => {
    expect(players).toHaveLength(90);
    const names = players.map((p) => p.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  test('skips the retired player', () => {
    expect(players.some((p) => /batalla/i.test(p.name))).toBe(false);
    expect(log.some((line) => line.includes('retired'))).toBe(true);
  });

  test('enriches a player found in both files instead of duplicating him', () => {
    const alessandro = byName('Alessandro Rodriguez');
    expect(alessandro.sourceId).toMatch(/^main:/); // kept the main-file record
    expect(alessandro.marketValue).toBeGreaterThan(0); // added from the detailed file
  });

  test('never invents a market value: players without one stay empty, not 0', () => {
    const withoutValue = players.filter((p) => p.marketValue == null);
    expect(withoutValue).toHaveLength(78);
    expect(players.some((p) => p.marketValue === 0)).toBe(false);
  });

  test('links the orphaned scout report to its player by name', () => {
    const report = reports.find((r) => r.data.opponent && r.playerSourceId === byName('Marcus Thompson').sourceId);
    expect(report).toBeDefined();
  });
});

describe('seed: helpers', () => {
  test('fills in missing years, moving to the next year when months wrap', () => {
    const dates = monthsToDates(['November', 'December', 'January']).map((d) => d.toISOString().slice(0, 7));
    expect(dates).toEqual(['2024-11', '2024-12', '2025-01']);
  });

  test('turns an overall rating into SIGN / MONITOR / PASS', () => {
    expect([10, 9, 8, 6, 5, 1].map(recommendationFromRating)).toEqual([
      'SIGN',
      'SIGN',
      'MONITOR',
      'MONITOR',
      'PASS',
      'PASS',
    ]);
  });
});
