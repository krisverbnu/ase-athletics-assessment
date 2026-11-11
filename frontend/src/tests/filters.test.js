// Filters live in the URL so a filtered list can be refreshed or shared as a link.
// These check the round trip URL -> filters -> URL loses nothing.
import { describe, expect, test } from 'vitest';
import { countActive, filtersToParams, readFilters } from '../utils/filters';

describe('player filters in the URL', () => {
  test('reads lists and ranges from the URL', () => {
    const filters = readFilters(new URLSearchParams('position=Forward,Midfielder&ageMin=20&valueMax=50000000'));
    expect(filters.position).toEqual(['Forward', 'Midfielder']);
    expect(filters.ageMin).toBe(20);
    expect(filters.valueMax).toBe(50_000_000);
    expect(filters.ageMax).toBeUndefined();
    expect(filters.team).toEqual([]);
  });

  test('turns filters back into the same URL, leaving empty ones out', () => {
    const url = 'position=Forward%2CMidfielder&ageMin=20&valueMax=50000000';
    const filters = readFilters(new URLSearchParams(url));
    expect(new URLSearchParams(filtersToParams(filters)).toString()).toBe(url);
  });

  test('keeps a minimum of 0 instead of dropping it as empty', () => {
    expect(filtersToParams(readFilters(new URLSearchParams('goalsMin=0')))).toEqual({ goalsMin: '0' });
  });

  test('counts a range as one filter, and each chosen position separately', () => {
    const filters = readFilters(new URLSearchParams('position=Forward,Defender&ageMin=20&ageMax=25'));
    expect(countActive(filters)).toBe(3);
  });
});
