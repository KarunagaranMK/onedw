import api from './api'

export const uploadMedia = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/issues/upload-media', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const analyzeImage = async (imageUrl, serviceType) => {
  const { data } = await api.post('/issues/analyze-image', {
    image_url: imageUrl,
    service_type: serviceType,
  })
  return data
}

export const transcribeVoice = async (audioUrl) => {
  const { data } = await api.post('/issues/voice-transcription', {
    audio_url: audioUrl,
  })
  return data
}

export const estimateCost = async (serviceType, issueCategory, severity, imageCount) => {
  const { data } = await api.post('/issues/estimate-cost', {
    service_type: serviceType,
    issue_category: issueCategory,
    severity,
    image_count: imageCount,
  })
  return data
}

export const updateBookingIssue = async (bookingId, issueDetails) => {
  const { data } = await api.put(`/issues/booking/${bookingId}/issue`, issueDetails)
  return data
}

export const getBookingIssue = async (bookingId) => {
  const { data } = await api.get(`/issues/booking/${bookingId}/issue`)
  return data
}

export const uploadBeforeImage = async (bookingId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post(`/issues/booking/${bookingId}/before-images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const uploadAfterImage = async (bookingId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post(`/issues/booking/${bookingId}/after-images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const getBookingImages = async (bookingId) => {
  const { data } = await api.get(`/issues/booking/${bookingId}/images`)
  return data
}

export const sendCounterOffer = async (bookingId, estimatedPrice, message, estimatedDuration) => {
  const { data } = await api.post('/issues/counter-offer', {
    booking_id: bookingId,
    estimated_price: estimatedPrice,
    message,
    estimated_duration: estimatedDuration,
  })
  return data
}

export const acceptCounterOffer = async (offerId) => {
  const { data } = await api.post(`/issues/counter-offer/${offerId}/accept`)
  return data
}

export const getIssueHistory = async (addressId) => {
  const { data } = await api.get(`/issues/history/${addressId}`)
  return data
}

export const createWarranty = async (bookingId, durationDays, coveredServices, notes) => {
  const { data } = await api.post('/issues/warranty/create', {
    booking_id: bookingId,
    duration_days: durationDays,
    covered_services: coveredServices || [],
    notes,
  })
  return data
}

export const getBookingWarranty = async (bookingId) => {
  const { data } = await api.get(`/issues/warranty/booking/${bookingId}`)
  return data
}

export const getMyWarranties = async () => {
  const { data } = await api.get('/issues/warranty/my-warranties')
  return data
}

export const claimWarranty = async (warrantyId, description, images) => {
  const { data } = await api.post(`/issues/warranty/${warrantyId}/claim`, {
    warranty_id: warrantyId,
    description,
    issue_images: images || [],
  })
  return data
}

export const updateTracking = async (bookingId, trackingData) => {
  const { data } = await api.post(`/issues/booking/${bookingId}/tracking`, trackingData)
  return data
}

export const getTracking = async (bookingId) => {
  const { data } = await api.get(`/issues/booking/${bookingId}/tracking`)
  return data
}
