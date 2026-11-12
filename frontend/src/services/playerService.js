import api from './api';

// Arrays become comma lists: { position: ['Forward', 'Midfielder'] } -> position=Forward,Midfielder
function toParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0))
      .map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : v]),
  );
}

export const getPlayers = (params) => api.get('/players', { params: toParams(params) }).then((r) => r.data);
export const searchPlayers = (q, limit = 8) =>
  api.get('/players/search', { params: { q, limit } }).then((r) => r.data.data);
export const getFilterOptions = () => api.get('/players/filters').then((r) => r.data.data);
export const getPlayer = (id) => api.get(`/players/${id}`).then((r) => r.data.data);
export const createPlayer = (data) => api.post('/players', data).then((r) => r.data.data);
export const updatePlayer = (id, data) => api.put(`/players/${id}`, data).then((r) => r.data.data);
export const deletePlayer = (id) => api.delete(`/players/${id}`);

export { toParams };
