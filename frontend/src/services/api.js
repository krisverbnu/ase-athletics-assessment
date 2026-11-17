// The API service layer: the ONLY place that knows how to talk to the backend.
// Pages call functions like getPlayers(); they never use axios directly.
import axios from 'axios';

const TOKEN_KEY = 'ase_token';

// some browsers block localStorage or only let you read it, saving throws an error
// so we also keep the token in memory: login always works on this visit
// if saving failed you just have to log in again after a refresh
let memoryToken = null;

export function getToken() {
  if (memoryToken) return memoryToken; // set on this visit, always the newest
  try {
    return localStorage.getItem(TOKEN_KEY); // saved from earlier visit
  } catch {
    return null;
  }
}

export function saveToken(token) {
  memoryToken = token;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage blocked, memory copy is enough
  }
}

export function clearToken() {
  memoryToken = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage blocked, nothing saved there anyway
  }
}

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 60000, // Render's free tier can take ~50 s to wake up
});

// Before every request: attach the login token if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// After every response: if the token is rejected (401), tell the app to log out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginCall = error.config?.url?.startsWith('/auth/login');
    if (error.response?.status === 401 && !isLoginCall) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  },
);

// Turn any error into a sentence a user can read
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (!error.response) return 'Cannot reach the server. Check your connection, or wait a moment while it wakes up.';
  return error.response.data?.error?.message || fallback;
}

// Field-level errors from the API's validation: { email: 'must be valid', ... }
export function getFieldErrors(error) {
  const details = error.response?.data?.error?.details || [];
  return Object.fromEntries(details.map((d) => [d.field, d.message.replace(/"/g, '')]));
}

export default api;
