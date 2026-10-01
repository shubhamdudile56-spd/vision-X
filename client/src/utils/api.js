import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Shared Axios instance.
 * - `withCredentials` so the httpOnly session cookie rides along
 * - A single response interceptor that normalises every failure into
 *   `{ message, details, status }` so components never read `err.response` directly
 */
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 60_000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status ?? 0;
    const data = error?.response?.data ?? {};

    let message = data.error || error.message || 'Request failed';
    if (error.code === 'ECONNABORTED') {
      message = 'The request timed out. The vision engine may be under load — try again.';
    } else if (error.code === 'ERR_NETWORK' || status === 0) {
      message = 'Cannot reach the VisionX API. Make sure the server is running on port 5000.';
    } else if (status === 429) {
      message = data.error || 'Rate limit exceeded. Please wait a moment and retry.';
    }

    const normalised = new Error(message);
    normalised.status = status;
    normalised.details = Array.isArray(data.details) ? data.details : null;
    normalised.code = data.code || null;
    return Promise.reject(normalised);
  }
);

/** Flattens a Zod/server `details` array into "field: message" strings. */
export function fieldErrors(error) {
  if (!error?.details?.length) return {};
  return error.details.reduce((acc, item) => {
    if (item?.field) acc[item.field] = item.message;
    return acc;
  }, {});
}

export const health = () => api.get('/health').then((r) => r.data);
export const visionStatus = () => api.get('/vision/status').then((r) => r.data);

/** Runtime Gemini key management — the key is posted once and never returned. */
export const fetchCredentials = () => api.get('/vision/credentials').then((r) => r.data);
export const saveCredentials = (apiKey) => api.put('/vision/credentials', { api_key: apiKey }).then((r) => r.data);
export const clearCredentials = () => api.delete('/vision/credentials').then((r) => r.data);

export const register = (payload) => api.post('/auth/register', payload).then((r) => r.data);
export const login = (payload) => api.post('/auth/login', payload).then((r) => r.data);
export const logout = () => api.post('/auth/logout').then((r) => r.data);
export const fetchMe = () => api.get('/auth/me').then((r) => r.data);

/** Analyses a Base64 data URL (live camera frames and pasted images). */
export const analyzeImageData = (payload) =>
  api
    .post('/vision/analyze', {
      image_data: payload.imageData,
      mode: payload.mode,
      source_type: payload.sourceType,
      persist: payload.persist !== false,
      demo_scene: payload.demoScene
    })
    .then((r) => r.data);

/** Analyses a File object through the multipart endpoint. */
export function analyzeFile(file, { mode = 'REAL', sourceType = 'UPLOAD', demoScene } = {}) {
  const form = new FormData();
  form.append('image', file, file.name || 'capture.jpg');
  form.append('mode', mode);
  form.append('source_type', sourceType);
  if (demoScene) form.append('demo_scene', demoScene);
  return api.post('/vision/analyze-file', form, { timeout: 90_000 }).then((r) => r.data);
}

export const fetchScans = (params = {}) => api.get('/scans', { params }).then((r) => r.data);
export const fetchScan = (id) => api.get(`/scans/${id}`).then((r) => r.data.scan);
export const saveScan = (payload) => api.post('/scans', payload).then((r) => r.data);
export const deleteScan = (id) => api.delete(`/scans/${id}`).then((r) => r.data);
export const fetchAnalytics = () => api.get('/analytics').then((r) => r.data);

export default api;
