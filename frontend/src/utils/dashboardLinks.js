// Links from the dashboard into the player list.
// Each link keeps the dashboard's current filters and adds one more, so clicking
// "Forwards" on a Bayern-only dashboard opens Bayern's forwards, not every forward.
import { filtersToParams } from './filters';

// The dashboard's age groups as Players filter ranges (ages are whole numbers).
// Must match AGE_GROUPS in backend/src/services/dashboardService.js
export const AGE_RANGES = {
  'Under 21': { ageMin: undefined, ageMax: 20 },
  '21-25': { ageMin: 21, ageMax: 25 },
  '26-29': { ageMin: 26, ageMax: 29 },
  '30+': { ageMin: 30, ageMax: undefined },
};

// filters = the dashboard's filters; changes = filters to replace; extra = other URL params (sort, order)
export function playersLink(filters, changes = {}, extra = {}) {
  const query = new URLSearchParams({ ...filtersToParams({ ...filters, ...changes }), ...extra }).toString();
  return query ? `/players?${query}` : '/players';
}

// One position, top scorers first (the chart it comes from is about goals)
export const positionLink = (filters, position) =>
  playersLink(filters, { position: [position] }, { sort: 'goals', order: 'desc' });

export const teamLink = (filters, team) => playersLink(filters, { team: [team] });

export const ageLink = (filters, label) => playersLink(filters, AGE_RANGES[label]);
