import api from './api';

export const login = (credentials) => api.post('/auth/login', credentials).then((r) => r.data.data);
export const register = (details) => api.post('/auth/register', details).then((r) => r.data.data);
export const logout = () => api.post('/auth/logout').catch(() => {}); // fine if it fails: we clear the token anyway
export const getMe = () => api.get('/auth/me').then((r) => r.data.data);
