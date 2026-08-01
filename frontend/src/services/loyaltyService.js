import api from './api'

/**
 * Loyalty Program API functions (Phase 18).
 */

// ── Customer ──────────────────────────────────────────────────────────────────

export const getMyLoyalty = async () => {
  const { data } = await api.get('/loyalty/my-points')
  return data
}

export const getPointsHistory = async () => {
  const { data } = await api.get('/loyalty/history')
  return data
}

export const getAllBadges = async () => {
  const { data } = await api.get('/loyalty/badges')
  return data
}

export const getRewards = async () => {
  const { data } = await api.get('/loyalty/rewards')
  return data
}

export const redeemReward = async (rewardId, quantity = 1) => {
  const { data } = await api.post('/loyalty/redeem', { reward_id: rewardId, quantity })
  return data
}

export const getLeaderboard = async (limit = 20) => {
  const { data } = await api.get('/loyalty/leaderboard', { params: { limit } })
  return data
}

export const awardProfilePoints = async () => {
  const { data } = await api.post('/loyalty/profile-complete')
  return data
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export const getLoyaltyAccounts = async (params = {}) => {
  const { data } = await api.get('/loyalty/admin/accounts', { params })
  return data
}

export const getTierDistribution = async () => {
  const { data } = await api.get('/loyalty/admin/tier-distribution')
  return data
}

export const adminAwardPoints = async (userId, points, reason, description = '') => {
  const { data } = await api.post('/loyalty/admin/award', {
    user_id: userId,
    points,
    reason,
    description,
  })
  return data
}
