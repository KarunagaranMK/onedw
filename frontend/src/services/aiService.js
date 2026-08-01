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
 * Admin platform stats — requires JWT (admin role).
 * Used in AdminDashboard.
 */
export const getAdminStats = async () => {
  const { data } = await api.get('/request/admin/stats')
  return data
}

// ── Enhanced AI Features ──────────────────────────────────────────────────────

/**
 * Send a chat message to the AI assistant with multilingual support.
 * @param {string} message
 * @param {Array}  conversationHistory
 * @param {string} language - 'en' | 'ta' | 'hi' | 'te' | 'ml'
 * @param {string} sessionId
 */
export const sendChat = async (message, conversationHistory = [], language = 'en', sessionId = null) => {
  const { data } = await api.post('/ai/chat', {
    message,
    conversation_history: conversationHistory,
    language,
    session_id: sessionId,
  })
  return data
}

/**
 * Save chat history to MongoDB.
 */
export const saveChatHistory = async (sessionId, messages, language = 'en', userId = null) => {
  const { data } = await api.post('/ai/chat-history/save', {
    session_id: sessionId,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp || new Date().toISOString(),
    })),
    language,
    user_id: userId,
  })
  return data
}

/**
 * Retrieve chat history from MongoDB.
 */
export const getChatHistory = async (sessionId) => {
  const { data } = await api.get(`/ai/chat-history/${sessionId}`)
  return data
}

/**
 * Analyze an image file using Gemini Vision.
 * Converts File → base64 and sends to /api/ai/image-analyze.
 */
export const analyzeImage = async (file, serviceType = null, language = 'en') => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const base64 = e.target.result.split(',')[1]
        const mimeType = file.type || 'image/jpeg'
        const { data } = await api.post('/ai/image-analyze', {
          image_base64: base64,
          image_mime_type: mimeType,
          service_type: serviceType,
          language,
        })
        resolve(data)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Translate text using Gemini.
 */
export const translateText = async (text, targetLanguage, sourceLanguage = 'en') => {
  const { data } = await api.post('/ai/translate', {
    text,
    target_language: targetLanguage,
    source_language: sourceLanguage,
  })
  return data.translated_text
}

// ── Language Config ───────────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
]

export const SPEECH_LANG_CODES = {
  en: 'en-IN',
  ta: 'ta-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ml: 'ml-IN',
}

/**
 * Get or create a persistent session ID for chat history (localStorage).
 */
export const getOrCreateSessionId = () => {
  const key = 'onedw_ai_session_id'
  let sessionId = localStorage.getItem(key)
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem(key, sessionId)
  }
  return sessionId
}
