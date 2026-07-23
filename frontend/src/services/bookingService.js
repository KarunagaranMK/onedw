import api from './api'

/**
 * Booking API functions for the full booking lifecycle.
 */

export const createBooking = async (requestId, workerId) => {
  const { data } = await api.post('/booking/create', {
    request_id: requestId,
    worker_id: workerId,
  })
  return data
}

export const getMyBookings = async () => {
  const { data } = await api.get('/booking/my-bookings')
  return data
}

export const getWorkerBookings = async () => {
  const { data } = await api.get('/booking/worker-bookings')
  return data
}

export const getBookingById = async (bookingId) => {
  const { data } = await api.get(`/booking/${bookingId}`)
  return data
}

export const updateBookingStatus = async (bookingId, newStatus) => {
  const { data } = await api.put(`/booking/${bookingId}/status`, { status: newStatus })
  return data
}
