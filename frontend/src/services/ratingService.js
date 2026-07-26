import api from './api'

export const submitRating = async ({
  bookingId,
  workerId,
  stars,
  review,
  punctuality,
  behavior,
  work_quality,
  communication,
  value_for_money,
  cleanliness,
  recommend,
  review_images,
}) => {
  const { data } = await api.post('/rating/create', {
    booking_id: bookingId,
    worker_id: workerId,
    stars,
    review,
    punctuality,
    behavior,
    work_quality,
    communication,
    value_for_money,
    cleanliness,
    recommend,
    review_images,
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
