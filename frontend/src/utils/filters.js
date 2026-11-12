// Player filters live in the URL (?position=Forward,Midfielder&ageMin=20...)
// so a filtered view survives refreshes and can be shared as a link.
// These helpers convert between the URL and a filters object.

export const LIST_FILTERS = ['position', 'team', 'nationality'];
export const RANGE_FILTERS = ['age', 'value', 'goals', 'assists'];
export const STORAGE_KEY = 'ase_player_filters';

// URL -> { position: ['Forward'], team: [], ..., ageMin: 20, ageMax: undefined, ... }
export function readFilters(params) {
  const filters = {};
  for (const key of LIST_FILTERS) {
    filters[key] = (params.get(key) || '').split(',').filter(Boolean);
  }
  for (const key of RANGE_FILTERS) {
    for (const edge of ['Min', 'Max']) {
      const raw = params.get(key + edge);
      filters[key + edge] = raw === null || raw === '' ? undefined : Number(raw);
    }
  }
  return filters;
}

// filters object -> URL params (empty filters are left out)
export function filtersToParams(filters) {
  const out = {};
  for (const key of LIST_FILTERS) {
    if (filters[key]?.length) out[key] = filters[key].join(',');
  }
  for (const key of RANGE_FILTERS) {
    for (const edge of ['Min', 'Max']) {
      if (filters[key + edge] !== undefined) out[key + edge] = String(filters[key + edge]);
    }
  }
  return out;
}

// How many filters are switched on (for the "Filters (3)" badge)
export function countActive(filters) {
  const lists = LIST_FILTERS.reduce((n, k) => n + (filters[k]?.length || 0), 0);
  const ranges = RANGE_FILTERS.filter(
    (k) => filters[k + 'Min'] !== undefined || filters[k + 'Max'] !== undefined,
  ).length;
  return lists + ranges;
}

// sessionStorage keeps filters while the tab is open (bonus: "filter state persistence")
export function saveFilters(params) {
  try {
    sessionStorage.setItem(STORAGE_KEY, params);
  } catch {
    /* storage blocked: not essential */
  }
}
export function loadSavedFilters() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}
