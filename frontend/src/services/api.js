import axios from "axios";

// Use relative "/api" so all requests go through the Vite proxy
// Vite forwards: /api/* → http://127.0.0.1:8000/api/*
// This avoids CORS issues and works correctly on any port (5173, 5174, etc.)
const api = axios.create({
  baseURL: "/api",
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
