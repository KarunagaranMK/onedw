import api from './api'

// Derive WebSocket base URL from the API base URL
// api.js uses baseURL="/api" (relative), so we use current host
const BASE_WS = (() => {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host  = window.location.host
  return `${proto}://${host}`
})()

const chatService = {
  // ── Sessions ────────────────────────────────────────────────────────
  startSession:  (payload) => api.post('/chat/session', payload),
  listSessions:  ()        => api.get('/chat/sessions'),
  getSession:    (id)      => api.get(`/chat/${id}`),

  // ── Messages ─────────────────────────────────────────────────────────
  getMessages:   (id, params = {}) => api.get(`/chat/${id}/messages`, { params }),
  sendMessage:   (id, payload)     => api.post(`/chat/${id}/send`, payload),
  markRead:      (id)              => api.post(`/chat/${id}/read`),
  getTyping:     (id)              => api.get(`/chat/${id}/typing`),
  setTyping:     (id, is_typing)   => api.post(`/chat/${id}/typing`, { is_typing }),

  // ── Video ─────────────────────────────────────────────────────────────
  createVideoSession:    (payload) => api.post('/video/session', payload),
  getVideoSession:       (id)      => api.get(`/video/${id}`),
  saveInspectionSummary: (id, payload) => api.post(`/video/${id}/summary`, payload),

  // ── Chat Notifications (separate prefix to avoid conflict) ────────────
  getNotifications:      (limit = 30) => api.get('/chat-notifications', { params: { limit } }),
  getUnreadCount:        ()           => api.get('/chat-notifications/unread-count'),
  markNotificationsRead: (ids = null) => api.post('/chat-notifications/read', { notification_ids: ids }),

  // ── WebSocket factory ─────────────────────────────────────────────────
  createWebSocket: (sessionId, token) => {
    const url = `${BASE_WS}/api/ws/chat/${sessionId}?token=${token}`
    return new WebSocket(url)
  },
}

export default chatService
