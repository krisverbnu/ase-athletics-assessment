// computeStats is a pure function (players in, numbers out), so it's tested
// with a few hand-made players and fixed dates. No database needed.
jest.mock('../src/utils/prisma', () => ({})); // never load the real database client
const { computeStats } = require('../src/services/dashboardService');

const player = (overrides) => ({
  id: 1, name: 'Test', team: 'Team', position: 'Forward', age: 25,
  goals: 0, assists: 0, minutesPlayed: 0, contractSalary: 1000, contractEnd: '2027-06-30',
  marketValue: null, attributes: { pace: 70 }, marketValues: [], _count: { monthlyForm: 0 },
  ...overrides,
});

describe('dashboard stats', () => {
  const players = [
    player({ id: 1, contractEnd: '2025-01-31' }), // ended before the data date
    player({ id: 2, contractEnd: '2026-06-30' }), // ends within 12 months of the data date
    player({ id: 3, contractEnd: '2027-06-30', marketValue: 5_000_000 }), // ends within 12 months of "today"
  ];
  const stats = computeStats(players, '2025-07-08', '2026-11-11');

  test('counts contracts from the data date and from today separately', () => {
    expect(stats.contractStatus.dataDate).toEqual({ date: '2025-07-08', expired: 1, endingWithin12Months: 1 });
    expect(stats.contractStatus.today).toEqual({ date: '2026-11-11', expired: 2, endingWithin12Months: 1 });
  });

  test('reports how many players have each field', () => {
    const coverage = Object.fromEntries(stats.dataQuality.coverage.map((c) => [c.key, c.count]));
    expect(stats.dataQuality.totalPlayers).toBe(3);
    expect(coverage.marketValue).toBe(1);
    expect(coverage.contractEnd).toBe(3);
  });

  test('ignores missing market values instead of treating them as 0', () => {
    expect(stats.kpis.playersWithMarketValue).toBe(1);
    expect(stats.kpis.averageMarketValue).toBe(5_000_000);
  });
});
