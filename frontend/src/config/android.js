// Platform detection — no Capacitor dependency needed for web
// This is a pure web app running in the browser

export const isAndroid = () => false

export const getApiBase = () => {
  return import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
}
