import api from './api'

/**
 * Admin API functions — all require admin JWT.
 */

// ── Dashboard ──────────────────────────────────────────────────────────────
export const getDashboardStats = async () => {
  const { data } = await api.get('/admin/dashboard')
  return data
}

export const getBookingsPerMonth = async () => {
  const { data } = await api.get('/admin/analytics/bookings-per-month')
  return data
}

export const getRevenuePerMonth = async () => {
  const { data } = await api.get('/admin/analytics/revenue-per-month')
  return data
}

export const getRevenueGrowth = async () => {
  const { data } = await api.get('/admin/analytics/revenue-growth')
  return data
}

export const getServicePopularity = async () => {
  const { data } = await api.get('/admin/analytics/service-popularity')
  return data
}

// ── Customers ──────────────────────────────────────────────────────────────
export const getAdminCustomers = async (params = {}) => {
  const { data } = await api.get('/admin/customers', { params })
  return data
}

export const blockCustomer = async (id, block = true) => {
  const { data } = await api.put(`/admin/customers/${id}/block`, null, { params: { block } })
  return data
}

// ── Workers ────────────────────────────────────────────────────────────────
export const getAdminWorkers = async (params = {}) => {
  const { data } = await api.get('/admin/workers', { params })
  return data
}

export const approveWorker = async (workerId) => {
  const { data } = await api.put(`/admin/workers/${workerId}/approve`)
  return data
}

export const rejectWorker = async (workerId, note = '') => {
  const { data } = await api.put(`/admin/workers/${workerId}/reject`, null, { params: { note } })
  return data
}

export const suspendWorker = async (workerId) => {
  const { data } = await api.put(`/admin/workers/${workerId}/suspend`)
  return data
}

// ── Bookings ───────────────────────────────────────────────────────────────
export const getAdminBookings = async (params = {}) => {
  const { data } = await api.get('/admin/bookings', { params })
  return data
}

// ── Reviews ────────────────────────────────────────────────────────────────
export const getAdminReviews = async (params = {}) => {
  const { data } = await api.get('/admin/reviews', { params })
  return data
}

// ── Complaints ─────────────────────────────────────────────────────────────
export const getAdminComplaints = async (params = {}) => {
  const { data } = await api.get('/admin/complaints', { params })
  return data
}

// ── Settings ───────────────────────────────────────────────────────────────
export const getAdminSettings = async () => {
  const { data } = await api.get('/admin/settings')
  return data
}

export const updateAdminSetting = async (key, value) => {
  const { data } = await api.put(`/admin/settings/${key}`, { value })
  return data
}

// ── Warnings ───────────────────────────────────────────────────────────────
export const issueWarning = async (targetId, targetType, reason) => {
  const { data } = await api.post('/admin/warnings', {
    target_id: targetId,
    target_type: targetType,
    reason,
  })
  return data
}

// ── System ─────────────────────────────────────────────────────────────────
export const getSystemHealth = async () => {
  const { data } = await api.get('/admin/system-health')
  return data
}

// ── Refunds ────────────────────────────────────────────────────────────────
export const processRefund = async (bookingId, amount, refundType, reason) => {
  const { data } = await api.post('/admin/refund', {
    booking_id: bookingId,
    amount,
    refund_type: refundType,
    reason,
  })
  return data
}

// ── Platform Settings ──────────────────────────────────────────────────────
// getAdminSettings and updateAdminSetting are declared above (lines ~84-91)
