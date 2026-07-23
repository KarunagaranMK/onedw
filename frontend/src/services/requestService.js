    import api from './api'

/**
 * API functions for the Customer Request module.
 * All calls automatically include the JWT via the Axios interceptor
 * configured in services/api.js.
 */

export const createRequest = async (requestData) => {
  const { data } = await api.post('/request/create', requestData)
  return data
}

export const getMyRequests = async () => {
  const { data } = await api.get('/request/my-requests')
  return data
}

export const getRequestById = async (id) => {
  const { data } = await api.get(`/request/${id}`)
  return data
}

export const updateRequest = async (id, updates) => {
  const { data } = await api.put(`/request/${id}`, updates)
  return data
}

export const deleteRequest = async (id) => {
  await api.delete(`/request/${id}`)
}