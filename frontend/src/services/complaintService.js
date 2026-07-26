import api from './api'

/**
 * Complaint API functions.
 * JWT is auto-attached via the Axios interceptor in api.js.
 */

export const createComplaint = async (complaintData) => {
  const { data } = await api.post('/complaints', complaintData)
  return data
}

export const getMyComplaints = async () => {
  const { data } = await api.get('/complaints/my')
  return data
}

export const getAllComplaints = async (params = {}) => {
  const { data } = await api.get('/complaints', { params })
  return data
}

export const getComplaintById = async (id) => {
  const { data } = await api.get(`/complaints/${id}`)
  return data
}

export const updateComplaintStatus = async (id, statusData) => {
  const { data } = await api.put(`/complaints/${id}/status`, statusData)
  return data
}

export const addComplaintMessage = async (id, messageData) => {
  const { data } = await api.post(`/complaints/${id}/messages`, messageData)
  return data
}

export const getComplaintMessages = async (id) => {
  const { data } = await api.get(`/complaints/${id}/messages`)
  return data
}
