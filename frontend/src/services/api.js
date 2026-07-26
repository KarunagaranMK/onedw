import axios from "axios";

// Use relative "/api" so all requests go through the Vite proxy
// Vite forwards: /api/* → http://127.0.0.1:8000/api/*
// This avoids CORS issues and works correctly on any port (5173, 5174, etc.)
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
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
    if (error.response?.status === 401) {
      // Clear stale session data
      localStorage.removeItem("onedw-token");
      localStorage.removeItem("onedw-user");
      // Redirect to login — but only if not already there
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?expired=1";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
