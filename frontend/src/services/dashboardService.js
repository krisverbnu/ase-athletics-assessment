import api from './api';
import { toParams } from './playerService';

// All dashboard numbers in one call; accepts the same filters as the player list
export const getDashboardStats = (params) =>
  api.get('/dashboard/stats', { params: toParams(params) }).then((r) => r.data);
