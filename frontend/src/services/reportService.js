import api from './api';
import { toParams } from './playerService';

export const getReports = (params) => api.get('/reports', { params: toParams(params) }).then((r) => r.data);
export const getReport = (id) => api.get(`/reports/${id}`).then((r) => r.data.data);
export const createReport = (data) => api.post('/reports', data).then((r) => r.data.data);
export const updateReport = (id, data) => api.put(`/reports/${id}`, data).then((r) => r.data.data);
export const deleteReport = (id) => api.delete(`/reports/${id}`);
