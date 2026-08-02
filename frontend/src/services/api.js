import axios from "axios";

// In local dev: VITE_API_BASE_URL=/api → requests go through Vite proxy
// In production: VITE_API_BASE_URL=https://onedw-backend.onrender.com/api
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30s — accommodates slow Gemini AI endpoints
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("onedw-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 (session expired) ───────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/')
    const isAdminPage = window.location.pathname.startsWith('/admin')

    // Retry once on network errors (ECONNABORTED / ERR_NETWORK) — never on 4xx/5xx
    if (!error.response && !error.config?._retried) {
      error.config._retried = true
      return api(error.config)
    }

    if (error.response?.status === 401 && !isAuthRoute) {
      // Clear stale session data
      localStorage.removeItem("onedw-token");
      localStorage.removeItem("onedw-user");
      // Redirect to correct login page
      const redirectTo = isAdminPage ? "/admin/login" : "/login"
      if (window.location.pathname !== redirectTo) {
        window.location.href = `${redirectTo}?expired=1`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
