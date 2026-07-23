import api from './api'

/**
 * Worker API functions — profile, location, and job discovery.
 */

export const getWorkerProfile = async () => {
  const { data } = await api.get('/worker/profile')
  return data
}

export const updateWorkerProfile = async (profileData) => {
  const { data } = await api.put('/worker/profile', profileData)
  return data
}

export const updateWorkerLocation = async (lat, lon) => {
  const { data } = await api.post('/worker/location', { latitude: lat, longitude: lon })
  return data
}

export const getAvailableJobs = async (serviceType = null) => {
  const params = serviceType ? { service_type: serviceType } : {}
  const { data } = await api.get('/worker/available-jobs', { params })
  return data
}

export const getNearbyWorkers = async (serviceType, lat, lon, radiusKm = 50) => {
  const { data } = await api.get('/worker/nearby', {
    params: {
      service_type: serviceType,
      customer_lat: lat,
      customer_lon: lon,
      radius_km: radiusKm,
    },
  })
  return data
}
