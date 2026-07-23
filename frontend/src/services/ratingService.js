import api from './api'

/**
 * Rating API functions — submit and retrieve worker ratings.
 */

export const submitRating = async ({ bookingId, workerId, stars, comment }) => {
  const { data } = await api.post('/rating/create', {
    booking_id: bookingId,
    worker_id: workerId,
    stars,
    comment,
  })
  return data
}

export const getWorkerRatings = async (workerId) => {
  const { data } = await api.get(`/rating/worker/${workerId}`)
  return data
}

export const getMyRatings = async () => {
  const { data } = await api.get('/rating/my-ratings')
  return data
}
