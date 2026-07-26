import api from './api'

export const createBooking = async (requestId, workerId, issueDetails = null) => {
  const payload = {
    request_id: requestId,
    worker_id: workerId,
  }
  if (issueDetails) {
    payload.issue_details = issueDetails
  }
  const { data } = await api.post('/booking/create', payload)
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
