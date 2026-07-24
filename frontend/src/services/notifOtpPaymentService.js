import api from './api'

/**
 * Notification, OTP, and Payment service functions.
 */

// ─── Notifications ────────────────────────────────────────────────────────────

export const getNotifications = async () => {
  const { data } = await api.get('/notifications')
  return data
}

export const getUnreadCount = async () => {
  const { data } = await api.get('/notifications/unread-count')
  return data.unread_count || 0
}

export const markAllRead = async () => {
  const { data } = await api.put('/notifications/mark-all-read')
  return data
}

export const markNotificationRead = async (id) => {
  const { data } = await api.put(`/notifications/${id}/read`)
  return data
}

// ─── OTP ──────────────────────────────────────────────────────────────────────

export const generateOTP = async (bookingId) => {
  const { data } = await api.post('/otp/generate', { booking_id: bookingId })
  return data
}

export const verifyOTP = async (bookingId, otp) => {
  const { data } = await api.post('/otp/verify', { booking_id: bookingId, otp })
  return data
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export const createPayment = async (bookingId, amount, method, notes = '') => {
  const { data } = await api.post('/payments', {
    booking_id: bookingId,
    amount,
    method,
    notes,
  })
  return data
}

export const getInvoice = async (bookingId) => {
  const { data } = await api.get(`/payments/invoice/${bookingId}`)
  return data
}

export const getWorkerEarnings = async () => {
  const { data } = await api.get('/payments/earnings')
  return data
}

export const getPaymentForBooking = async (bookingId) => {
  const { data } = await api.get(`/payments/booking/${bookingId}`)
  return data
}

export const submitRating = async ({ bookingId, workerId, stars, comment }) => {
  const { data } = await api.post('/rating/create', {
    booking_id: bookingId,
    worker_id: workerId,
    stars,
    comment,
  })
  return data
}
