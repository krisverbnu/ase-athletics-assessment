// Clicking a card or chart on the dashboard opens the player list, already filtered.
// These check each link keeps the dashboard's filters and adds the right one.
import { describe, expect, test } from 'vitest';
import { ageLink, playersLink, positionLink, teamLink } from '../utils/dashboardLinks';
import { readFilters } from '../utils/filters';

const noFilters = readFilters(new URLSearchParams(''));
const bayernOnly = readFilters(new URLSearchParams('team=Bayern Munich'));

// Read a link back into its URL parameters, so tests don't depend on their order
const params = (link) => Object.fromEntries(new URL(link, 'http://app').searchParams);

describe('dashboard links into the player list', () => {
  test('with no filters, "View players" is the plain list', () => {
    expect(playersLink(noFilters)).toBe('/players');
  });

  test('a position opens that position, top scorers first', () => {
    expect(params(positionLink(noFilters, 'Forward'))).toEqual({ position: 'Forward', sort: 'goals', order: 'desc' });
  });

  test("keeps the dashboard's filters: Forwards from a Bayern dashboard means Bayern's forwards", () => {
    expect(params(positionLink(bayernOnly, 'Forward'))).toEqual({
      team: 'Bayern Munich',
      position: 'Forward',
      sort: 'goals',
      order: 'desc',
    });
  });

  test('a club replaces the team filter instead of adding to it', () => {
    expect(params(teamLink(bayernOnly, 'Real Madrid'))).toEqual({ team: 'Real Madrid' });
  });

  test('age groups become the matching age ranges, with open ends left out', () => {
    expect(params(ageLink(noFilters, 'Under 21'))).toEqual({ ageMax: '20' });
    expect(params(ageLink(noFilters, '21-25'))).toEqual({ ageMin: '21', ageMax: '25' });
    expect(params(ageLink(noFilters, '30+'))).toEqual({ ageMin: '30' });
  });

  test('an age group replaces any age range already set on the dashboard', () => {
    const over30 = readFilters(new URLSearchParams('ageMin=30'));
    expect(params(ageLink(over30, 'Under 21'))).toEqual({ ageMax: '20' });
  });
});
