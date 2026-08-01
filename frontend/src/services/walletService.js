import api from './api'

const walletService = {
  // ── Balance ──────────────────────────────────────────────────────────
  getWallet:    ()        => api.get('/wallet'),
  addMoney:     (payload) => api.post('/wallet/add-money', payload),
  pay:          (payload) => api.post('/wallet/pay', payload),
  refund:       (payload) => api.post('/wallet/refund', payload),

  // ── History ──────────────────────────────────────────────────────────
  getHistory:   (params = {}) => api.get('/wallet/history', { params }),

  // ── Promo Codes ───────────────────────────────────────────────────────
  applyPromo:   (payload) => api.post('/wallet/promo', payload),

  // ── Referrals ─────────────────────────────────────────────────────────
  getReferralInfo:  ()        => api.get('/wallet/referral'),
  applyReferral:    (payload) => api.post('/wallet/referral/apply', payload),

  // ── Reward Points ─────────────────────────────────────────────────────
  getRewardPoints:  ()        => api.get('/wallet/rewards'),
  redeemPoints:     (payload) => api.post('/wallet/rewards/redeem', payload),

  // ── Analytics ─────────────────────────────────────────────────────────
  getAnalytics: () => api.get('/wallet/analytics'),

  // ── Worker ────────────────────────────────────────────────────────────
  requestWithdrawal: (payload) => api.post('/wallet/withdraw', payload),

  // ── Admin ─────────────────────────────────────────────────────────────
  getAdminStats:    ()        => api.get('/wallet/admin/stats'),
  adminCredit:      (payload) => api.post('/wallet/admin/credit', payload),
}

export default walletService
