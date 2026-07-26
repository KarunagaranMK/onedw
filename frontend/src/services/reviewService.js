import api from './api'

/**
 * Review API functions.
 * JWT is auto-attached via the Axios interceptor in api.js.
 */

export const submitReview = async (reviewData) => {
  const { data } = await api.post('/reviews', reviewData)
  return data
}

export const getMyReviews = async () => {
  const { data } = await api.get('/reviews/my')
  return data
}

export const getWorkerReviews = async (workerId, params = {}) => {
  const { data } = await api.get('/reviews', { params: { worker_id: workerId, ...params } })
  return data
}

export const getAllReviews = async (params = {}) => {
  const { data } = await api.get('/reviews', { params })
  return data
}

export const hideReview = async (reviewId, hide = true) => {
  const { data } = await api.put(`/reviews/${reviewId}/hide`, null, { params: { hide } })
  return data
}

export const deleteReview = async (reviewId) => {
  await api.delete(`/reviews/${reviewId}`)
}

export const replyToReview = async (reviewId, replyText) => {
  const { data } = await api.post(`/reviews/${reviewId}/reply`, { reply_text: replyText })
  return data
}

export const submitWorkerReview = async (reviewData) => {
  const { data } = await api.post('/reviews/worker', reviewData)
  return data
}

export const getPublicReviews = async (params = {}) => {
  const { data } = await api.get('/reviews/public', { params })
  return data
}
