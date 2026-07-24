import api from './api'

/**
 * AI / NLP service functions — voice parsing, recommendations, platform stats.
 */

/**
 * Parse a raw voice transcript through Gemini NLP (or local fallback).
 * @param {string} text - Raw spoken text
 * @returns {Promise<{service, location, date, time, raw_text}>}
 */
export const processNLPText = async (text) => {
  const { data } = await api.post('/nlp/process', { text })
  return data
}

/**
 * Ask Gemini AI to recommend the best worker.
 */
export const getAIRecommendation = async (serviceType, lat, lon, candidates) => {
  const payload = {
    service_type: serviceType,
    customer_latitude: lat,
    customer_longitude: lon,
    candidates: candidates.map((w) => ({
      worker_id: w.worker_id || w.id,
      name: w.name,
      skills: w.skills,
      experience_years: w.experience_years,
      average_rating: w.average_rating,
      total_jobs: w.total_jobs,
      distance_km: w.distance_km || 0,
      is_available: w.is_available,
    })),
  }
  const { data } = await api.post('/ai/recommend', payload)
  return data
}

/**
 * Get public platform stats — no auth required.
 * Used on homepage StatisticsSection.
 */
export const getPlatformStats = async () => {
  const { data } = await api.get('/request/platform-stats')
  return data
}

/**
 * Get admin platform stats — requires JWT (admin role).
 * Used in AdminDashboard.
 */
export const getAdminStats = async () => {
  const { data } = await api.get('/request/admin/stats')
  return data
}
