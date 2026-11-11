// How numbers and dates are shown everywhere in the app
import { describe, expect, test } from 'vitest';
import { formatDate, formatMoney, per90, ratingLabel } from '../utils/format';
import { buildTrendRows } from '../utils/chartData';

describe('formatting', () => {
  test('shows money in short euro form', () => {
    expect(formatMoney(65_000_000)).toBe('€65M');
    expect(formatMoney(12_500_000)).toBe('€12.5M');
    expect(formatMoney(850_000)).toBe('€850K');
  });

  test('says a missing value is missing instead of showing €0', () => {
    expect(formatMoney(null)).toBe('Not available');
    expect(formatMoney(undefined)).toBe('Not available');
    expect(formatDate(null)).toBe('Not available');
  });

  test('shows dates the same way in every time zone', () => {
    expect(formatDate('2027-06-30T00:00:00.000Z')).toBe('30 Jun 2027');
  });

  test('works out per-90 stats and avoids dividing by zero', () => {
    expect(per90(10, 900)).toBe('1.00');
    expect(per90(3, 0)).toBe('0.00');
  });

  test('gives every rating from 1 to 10 a label', () => {
    for (let r = 1; r <= 10; r += 1) expect(ratingLabel(r)).toBeTruthy();
  });
});

describe('chart data', () => {
  test('merges players with different valuation dates into one row per date, in order', () => {
    const rows = buildTrendRows([
      { name: 'A', history: [{ date: '2024-01-01', value: 10 }, { date: '2025-01-01', value: 20 }] },
      { name: 'B', history: [{ date: '2025-01-01', value: 5 }] },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ A: 20, B: 5 });
    expect(rows[0].B).toBeUndefined(); // B had no value yet, so no fake point is drawn
  });
});
