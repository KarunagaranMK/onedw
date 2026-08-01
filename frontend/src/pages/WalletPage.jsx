import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Paper, Grid, TextField, Button, Chip,
  CircularProgress, Alert, Divider, useTheme, Tabs, Tab,
  InputAdornment, IconButton, Skeleton, Avatar, LinearProgress,
  Tooltip,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdAccountBalanceWallet, MdAdd, MdHistory, MdLocalOffer,
  MdArrowUpward, MdArrowDownward, MdCardGiftcard, MdStar,
  MdCheckCircle, MdRefresh, MdClose, MdContentCopy,
  MdPeople, MdShare, MdAutoAwesome, MdTrendingUp,
  MdMoneyOff, MdAccountBalance, MdPayment,
} from 'react-icons/md'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts'
import { useAuth } from '../hooks/useAuth'
import walletService from '../services/walletService'

// ─── Config ───────────────────────────────────────────────────────────────────

const TX_TYPE_COLORS = {
  RECHARGE:        { bg: '#dcfce7', text: '#16a34a', icon: <MdArrowDownward /> },
  BOOKING_PAYMENT: { bg: '#fef3c7', text: '#d97706', icon: <MdArrowUpward /> },
  REFUND:          { bg: '#dbeafe', text: '#2563eb', icon: <MdArrowDownward /> },
  CASHBACK:        { bg: '#f3e8ff', text: '#7c3aed', icon: <MdStar /> },
  COUPON:          { bg: '#fce7f3', text: '#db2777', icon: <MdLocalOffer /> },
  BONUS:           { bg: '#ecfdf5', text: '#059669', icon: <MdCardGiftcard /> },
  ADMIN_CREDIT:    { bg: '#dcfce7', text: '#16a34a', icon: <MdArrowDownward /> },
  ADMIN_DEBIT:     { bg: '#fee2e2', text: '#dc2626', icon: <MdArrowUpward /> },
  REFERRAL:        { bg: '#dbeafe', text: '#2563eb', icon: <MdCardGiftcard /> },
  REWARD_REDEEM:   { bg: '#f3e8ff', text: '#7c3aed', icon: <MdAutoAwesome /> },
  WITHDRAWAL:      { bg: '#fef3c7', text: '#d97706', icon: <MdAccountBalance /> },
}

const QUICK_AMOUNTS  = [100, 200, 500, 1000, 2000]
const DEMO_PROMOS    = ['WELCOME10', 'ONEDW20', 'SAVE50', 'FIRST100', 'REFER25']
const PIE_COLORS     = ['#6c47ff', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, isDark, sub }) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Paper sx={{
        p: 2.5, borderRadius: 3, height: '100%',
        background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        backdropFilter: 'blur(10px)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>{value}</Typography>
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
          </Box>
        </Box>
      </Paper>
    </motion.div>
  )
}

function TransactionItem({ tx, isDark }) {
  const style = TX_TYPE_COLORS[tx.type] || { bg: '#f3f4f6', text: '#6b7280', icon: <MdHistory /> }
  const isCredit = tx.amount > 0
  const date = tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, mb: 1, background: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`, '&:hover': { background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }, transition: 'background 0.2s' }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '50%', background: style.bg, color: style.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {style.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>{tx.description || tx.type}</Typography>
          <Typography variant="caption" color="text.secondary">{date}</Typography>
        </Box>
        <Chip label={tx.type.replace(/_/g, ' ')} size="small" sx={{ background: style.bg, color: style.text, fontWeight: 700, fontSize: 10, borderRadius: 1 }} />
        <Typography variant="body2" fontWeight={800} sx={{ color: isCredit ? '#16a34a' : '#dc2626', minWidth: 80, textAlign: 'right', flexShrink: 0 }}>
          {isCredit ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
        </Typography>
      </Box>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const { user } = useAuth()

  const [wallet, setWallet]         = useState(null)
  const [transactions, setTxs]      = useState([])
  const [analytics, setAnalytics]   = useState(null)
  const [rewards, setRewards]       = useState(null)
  const [referral, setReferral]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [txLoading, setTxLoading]   = useState(false)
  const [tab, setTab]               = useState(0)

  // Add money
  const [addAmount, setAddAmount]   = useState('')
  const [adding, setAdding]         = useState(false)

  // Promo
  const [promoCode, setPromoCode]   = useState('')
  const [applying, setApplying]     = useState(false)
  const [promoResult, setPromoResult] = useState(null)

  // Referral
  const [refCode, setRefCode]       = useState('')
  const [applyingRef, setApplyingRef] = useState(false)
  const [refResult, setRefResult]   = useState(null)
  const [copied, setCopied]         = useState(false)

  // Rewards
  const [redeemPts, setRedeemPts]   = useState('')
  const [redeeming, setRedeeming]   = useState(false)

  // Withdrawal (worker)
  const [wdAmount, setWdAmount]     = useState('')
  const [wdUpi, setWdUpi]           = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [wdResult, setWdResult]     = useState(null)

  const [alert, setAlert]           = useState(null)

  // ── Fetchers ────────────────────────────────────────────────────────────────

  const fetchWallet = useCallback(async () => {
    try { const r = await walletService.getWallet(); setWallet(r.data) }
    catch { setAlert({ type: 'error', msg: 'Could not load wallet.' }) }
    finally { setLoading(false) }
  }, [])

  const fetchHistory = useCallback(async () => {
    setTxLoading(true)
    try { const r = await walletService.getHistory({ limit: 50 }); setTxs(r.data) }
    catch {}
    finally { setTxLoading(false) }
  }, [])

  const fetchAnalytics = useCallback(async () => {
    try { const r = await walletService.getAnalytics(); setAnalytics(r.data) } catch {}
  }, [])

  const fetchRewards = useCallback(async () => {
    try { const r = await walletService.getRewardPoints(); setRewards(r.data) } catch {}
  }, [])

  const fetchReferral = useCallback(async () => {
    try { const r = await walletService.getReferralInfo(); setReferral(r.data) } catch {}
  }, [])

  const refreshAll = useCallback(() => {
    fetchWallet(); fetchHistory(); fetchAnalytics(); fetchRewards(); fetchReferral()
  }, [fetchWallet, fetchHistory, fetchAnalytics, fetchRewards, fetchReferral])

  useEffect(() => { refreshAll() }, [refreshAll])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAddMoney = async () => {
    const amt = parseFloat(addAmount)
    if (!amt || amt <= 0) return setAlert({ type: 'error', msg: 'Enter a valid amount.' })
    if (amt > 50000) return setAlert({ type: 'error', msg: 'Maximum recharge is ₹50,000.' })
    setAdding(true)
    try {
      await walletService.addMoney({ amount: amt, payment_method: 'mock', gateway_reference: `demo_${Date.now()}` })
      setAlert({ type: 'success', msg: `₹${amt.toFixed(2)} added to your wallet!` })
      setAddAmount(''); refreshAll()
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.detail || 'Could not add money.' })
    } finally { setAdding(false) }
  }

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setApplying(true); setPromoResult(null)
    try {
      const r = await walletService.applyPromo({ code: promoCode.trim().toUpperCase(), booking_amount: 500 })
      setPromoResult(r.data)
      if (r.data.valid) refreshAll()
    } catch (e) {
      setPromoResult({ valid: false, message: e.response?.data?.detail || 'Invalid promo code.' })
    } finally { setApplying(false) }
  }

  const handleApplyReferral = async () => {
    if (!refCode.trim()) return
    setApplyingRef(true); setRefResult(null)
    try {
      const r = await walletService.applyReferral({ referral_code: refCode.trim().toUpperCase() })
      setRefResult(r.data)
      if (r.data.valid) refreshAll()
    } catch (e) {
      setRefResult({ valid: false, message: e.response?.data?.detail || 'Invalid referral code.' })
    } finally { setApplyingRef(false) }
  }

  const handleRedeemPoints = async () => {
    const pts = parseInt(redeemPts)
    if (!pts || pts <= 0) return
    setRedeeming(true)
    try {
      await walletService.redeemPoints({ points: pts })
      setAlert({ type: 'success', msg: `${pts} points redeemed = ₹${(pts * 0.1).toFixed(2)} added!` })
      setRedeemPts(''); refreshAll()
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.detail || 'Could not redeem points.' })
    } finally { setRedeeming(false) }
  }

  const handleWithdraw = async () => {
    const amt = parseFloat(wdAmount)
    if (!amt || amt <= 0) return
    setWithdrawing(true); setWdResult(null)
    try {
      const r = await walletService.requestWithdrawal({ amount: amt, upi_id: wdUpi, method: 'upi' })
      setWdResult(r.data)
      refreshAll()
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.detail || 'Withdrawal failed.' })
    } finally { setWithdrawing(false) }
  }

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // ── Rendering helpers ────────────────────────────────────────────────────────

  const isWorker = user?.role === 'worker'
  const balanceGrad = isDark
    ? 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #7c3aed 100%)'
    : 'linear-gradient(135deg, #6c47ff 0%, #a78bfa 100%)'

  const monthlyData = analytics?.monthly_spending || []
  const breakdownData = (analytics?.transaction_breakdown || []).map((b, i) => ({
    name: b.type.replace(/_/g, ' '),
    value: b.total,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }))

  const TABS = isWorker
    ? ['Add Money', 'History', 'Withdraw', 'Promos', 'Analytics']
    : ['Add Money', 'History', 'Rewards', 'Promos', 'Referral', 'Analytics']

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 4 }, background: isDark ? '#080812' : '#f8fafc' }}>

      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="overline" sx={{ color: '#7c3aed', fontWeight: 700 }}>Financial Hub</Typography>
          <Typography variant="h4" fontWeight={900} mt={0.5} sx={{ letterSpacing: '-0.02em' }}>
            {isWorker ? 'My Earnings 💼' : 'My Wallet 💳'}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {isWorker
              ? 'Manage your earnings, withdrawals, and payments'
              : 'Manage balance, transactions, cashback & rewards'}
          </Typography>
        </Box>
      </motion.div>

      {alert && (
        <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 3, borderRadius: 2 }}
          action={<IconButton size="small" onClick={() => setAlert(null)}><MdClose /></IconButton>}>
          {alert.msg}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ── LEFT: Balance Card ───────────────────────────────────────────── */}
        <Grid item xs={12} md={4}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            {/* Main balance card */}
            <Paper sx={{ p: 3.5, borderRadius: 4, background: balanceGrad, color: '#fff', position: 'relative', overflow: 'hidden', mb: 2 }}>
              {[{ top: -40, right: -40, size: 140, opacity: 0.15 }, { bottom: -30, left: -30, size: 100, opacity: 0.1 }].map((c, i) => (
                <Box key={i} sx={{ position: 'absolute', top: c.top, right: c.right, bottom: c.bottom, left: c.left, width: c.size, height: c.size, borderRadius: '50%', background: `rgba(255,255,255,${c.opacity})`, pointerEvents: 'none' }} />
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {isWorker ? 'Total Balance' : 'Available Balance'}
                  </Typography>
                  {loading ? <Skeleton variant="text" width={160} height={52} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} /> : (
                    <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: '-0.02em' }}>
                      ₹{(wallet?.balance ?? 0).toFixed(2)}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MdAccountBalanceWallet size={28} style={{ opacity: 0.8 }} />
                  <IconButton size="small" onClick={refreshAll} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' } }}>
                    <MdRefresh />
                  </IconButton>
                </Box>
              </Box>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mb: 2 }} />
              {isWorker ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box><Typography variant="caption" sx={{ opacity: 0.7 }}>Total Earned</Typography><Typography fontWeight={700}>₹{(wallet?.total_earned ?? 0).toFixed(2)}</Typography></Box>
                  <Box><Typography variant="caption" sx={{ opacity: 0.7 }}>Pending Payout</Typography><Typography fontWeight={700}>₹{(wallet?.pending_withdrawal ?? 0).toFixed(2)}</Typography></Box>
                  <Box><Typography variant="caption" sx={{ opacity: 0.7 }}>Withdrawn</Typography><Typography fontWeight={700}>₹{(wallet?.total_withdrawn ?? 0).toFixed(2)}</Typography></Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box><Typography variant="caption" sx={{ opacity: 0.7 }}>Reward Points</Typography><Typography fontWeight={700}>⭐ {wallet?.reward_points ?? 0} pts</Typography></Box>
                  <Box><Typography variant="caption" sx={{ opacity: 0.7 }}>Total Cashback</Typography><Typography fontWeight={700}>₹{(wallet?.total_cashback ?? 0).toFixed(2)}</Typography></Box>
                  <Box><Typography variant="caption" sx={{ opacity: 0.7 }}>Total Spent</Typography><Typography fontWeight={700}>₹{(wallet?.total_spent ?? 0).toFixed(2)}</Typography></Box>
                </Box>
              )}
              {/* Referral code */}
              {!isWorker && referral?.referral_code && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }}>
                  <MdShare size={14} style={{ opacity: 0.8 }} />
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, flex: 1 }}>
                    Referral: {referral.referral_code}
                  </Typography>
                  <Tooltip title={copied ? 'Copied!' : 'Copy'}>
                    <IconButton size="small" onClick={() => handleCopyCode(referral.referral_code)} sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      {copied ? <MdCheckCircle size={14} /> : <MdContentCopy size={14} />}
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Paper>

            {/* Stat mini-cards */}
            <Grid container spacing={1.5}>
              {loading ? [...Array(4)].map((_, i) => <Grid item xs={6} key={i}><Skeleton variant="rounded" height={80} sx={{ borderRadius: 3 }} /></Grid>) : (
                isWorker ? [
                  { icon: <MdTrendingUp size={20} />, label: 'Pending', value: `₹${(wallet?.pending_withdrawal ?? 0).toFixed(2)}`, color: '#f59e0b' },
                  { icon: <MdAccountBalance size={20} />, label: 'Withdrawn', value: `₹${(wallet?.total_withdrawn ?? 0).toFixed(2)}`, color: '#6c47ff' },
                ] : [
                  { icon: <MdArrowDownward size={20} />, label: 'Pending Refunds', value: `₹${(wallet?.pending_refunds ?? 0).toFixed(2)}`, color: '#2563eb' },
                  { icon: <MdStar size={20} />, label: 'Points Value', value: `₹${((wallet?.reward_points ?? 0) * 0.1).toFixed(2)}`, color: '#d97706' },
                  { icon: <MdPeople size={20} />, label: 'Referrals', value: `${referral?.total_referrals ?? 0}`, color: '#10b981', sub: `₹${(referral?.total_earned ?? 0).toFixed(0)} earned` },
                  { icon: <MdAutoAwesome size={20} />, label: 'Cashback', value: `₹${(wallet?.total_cashback ?? 0).toFixed(2)}`, color: '#7c3aed' },
                ]
              ).map((stat) => <Grid item xs={6} key={stat.label}><StatCard {...stat} isDark={isDark} /></Grid>)}
            </Grid>
          </motion.div>
        </Grid>

        {/* ── RIGHT: Feature Tabs ──────────────────────────────────────────── */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ borderRadius: 4, overflow: 'hidden', background: isDark ? 'rgba(17,24,39,0.95)' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
              sx={{ px: 2, borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { fontSize: 12, fontWeight: 700, minWidth: 80 } }}
              TabIndicatorProps={{ style: { background: '#7c3aed', height: 3, borderRadius: 2 } }}>
              {TABS.map(t => <Tab key={t} label={t} />)}
            </Tabs>

            <Box sx={{ p: 3 }}>

              {/* ── Add Money ──────────────────────────────────────────────── */}
              {tab === 0 && (
                <motion.div key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Typography variant="h6" fontWeight={800} mb={0.5}>Add Money to Wallet</Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Instant credit via UPI, Card, or Net Banking
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
                    {QUICK_AMOUNTS.map(amt => (
                      <Chip key={amt} label={`₹${amt}`} onClick={() => setAddAmount(String(amt))} variant={addAmount === String(amt) ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 700, cursor: 'pointer', ...(addAmount === String(amt) && { background: 'linear-gradient(135deg, #6c47ff, #a78bfa)', color: '#fff' }) }} />
                    ))}
                  </Box>
                  <TextField fullWidth label="Custom Amount (₹)" type="number" value={addAmount} onChange={(e) => setAddAmount(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                    sx={{ mb: 2.5 }} inputProps={{ min: 1, max: 50000 }} />
                  <Button fullWidth variant="contained" size="large" onClick={handleAddMoney} disabled={adding || !addAmount}
                    startIcon={adding ? <CircularProgress size={18} color="inherit" /> : <MdAdd />}
                    sx={{ py: 1.5, fontWeight: 800, borderRadius: 2.5, fontSize: 15, background: 'linear-gradient(135deg, #6c47ff, #a78bfa)', '&:hover': { background: 'linear-gradient(135deg, #5a38e0, #9268f5)' } }}>
                    {adding ? 'Processing…' : `Add ₹${addAmount || '0'} to Wallet`}
                  </Button>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1.5} textAlign="center">
                    🔒 Secured by 256-bit encryption · Instant credit · 5% cashback on every booking
                  </Typography>
                </motion.div>
              )}

              {/* ── Transaction History ────────────────────────────────────── */}
              {tab === 1 && (
                <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={800}>Transaction History</Typography>
                    <IconButton onClick={fetchHistory} size="small"><MdRefresh /></IconButton>
                  </Box>
                  {txLoading ? [...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={64} sx={{ mb: 1, borderRadius: 2 }} />) :
                    transactions.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <MdHistory size={48} style={{ opacity: 0.2, marginBottom: 8 }} />
                        <Typography color="text.secondary">No transactions yet.</Typography>
                        <Typography variant="caption" color="text.secondary">Add money or make a booking to see your history.</Typography>
                      </Box>
                    ) : (
                      <Box sx={{ maxHeight: 450, overflowY: 'auto', pr: 0.5, scrollbarWidth: 'thin' }}>
                        {transactions.map((tx, i) => <TransactionItem key={tx.id || i} tx={tx} isDark={isDark} />)}
                      </Box>
                    )}
                </motion.div>
              )}

              {/* ── Rewards (customer) ────────────────────────────────────── */}
              {!isWorker && tab === 2 && (
                <motion.div key="rewards" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Typography variant="h6" fontWeight={800} mb={0.5}>Reward Points</Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Earn 1 point per ₹10 spent. Redeem 10 points = ₹1.
                  </Typography>

                  {/* Points display */}
                  <Paper sx={{ p: 3, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '1px solid #fcd34d' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 700 }}>AVAILABLE POINTS</Typography>
                        <Typography variant="h3" fontWeight={900} sx={{ color: '#78350f' }}>
                          ⭐ {rewards?.current_balance ?? wallet?.reward_points ?? 0}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#92400e' }}>
                          = ₹{((rewards?.current_balance ?? wallet?.reward_points ?? 0) * 0.1).toFixed(2)} wallet value
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ color: '#92400e' }}>Total Earned</Typography>
                        <Typography fontWeight={700} sx={{ color: '#78350f' }}>{rewards?.total_earned ?? 0} pts</Typography>
                        <Typography variant="caption" sx={{ color: '#92400e' }}>Total Redeemed</Typography>
                        <Typography fontWeight={700} sx={{ color: '#78350f' }}>{rewards?.total_redeemed ?? 0} pts</Typography>
                      </Box>
                    </Box>
                    {/* Progress bar */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600 }}>
                        Progress to next milestone ({Math.min((rewards?.current_balance ?? 0) % 100, 100)}/100 pts)
                      </Typography>
                      <LinearProgress variant="determinate" value={Math.min(((rewards?.current_balance ?? 0) % 100), 100)}
                        sx={{ mt: 0.5, height: 8, borderRadius: 4, bgcolor: 'rgba(120,53,15,0.15)', '& .MuiLinearProgress-bar': { background: '#d97706', borderRadius: 4 } }} />
                    </Box>
                  </Paper>

                  <Typography variant="body2" fontWeight={700} mb={1}>Redeem Points</Typography>
                  <TextField fullWidth size="small" type="number" label="Points to redeem" value={redeemPts} onChange={(e) => setRedeemPts(e.target.value)}
                    helperText={redeemPts ? `= ₹${(parseFloat(redeemPts) * 0.1).toFixed(2)} wallet credit` : 'Minimum 10 points'}
                    sx={{ mb: 2 }} inputProps={{ min: 10, max: rewards?.current_balance ?? 0 }} />
                  <Button fullWidth variant="contained" onClick={handleRedeemPoints}
                    disabled={redeeming || !redeemPts || parseInt(redeemPts) < 10}
                    startIcon={redeeming ? <CircularProgress size={18} color="inherit" /> : <MdAutoAwesome />}
                    sx={{ py: 1.5, fontWeight: 800, borderRadius: 2.5, background: 'linear-gradient(135deg, #d97706, #f59e0b)', '&:hover': { background: 'linear-gradient(135deg, #b45309, #d97706)' } }}>
                    {redeeming ? 'Redeeming…' : 'Redeem Points'}
                  </Button>
                </motion.div>
              )}

              {/* ── Withdraw (worker) ─────────────────────────────────────── */}
              {isWorker && tab === 2 && (
                <motion.div key="withdraw" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Typography variant="h6" fontWeight={800} mb={0.5}>Request Withdrawal</Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Pending earnings: <strong>₹{(wallet?.pending_withdrawal ?? 0).toFixed(2)}</strong>. Transfers within 1-2 business days.
                  </Typography>
                  {QUICK_AMOUNTS.map(amt => (
                    <Chip key={amt} label={`₹${amt}`} onClick={() => setWdAmount(String(amt))} variant={wdAmount === String(amt) ? 'filled' : 'outlined'}
                      sx={{ mr: 0.5, mb: 1, fontWeight: 700, cursor: 'pointer', ...(wdAmount === String(amt) && { background: 'linear-gradient(135deg, #6c47ff, #a78bfa)', color: '#fff' }) }} />
                  ))}
                  <TextField fullWidth label="Amount (₹)" type="number" value={wdAmount} onChange={(e) => setWdAmount(e.target.value)} sx={{ mt: 1.5, mb: 2 }} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                  <TextField fullWidth label="UPI ID" placeholder="yourname@upi" value={wdUpi} onChange={(e) => setWdUpi(e.target.value)} sx={{ mb: 2 }} />
                  <Button fullWidth variant="contained" size="large" onClick={handleWithdraw} disabled={withdrawing || !wdAmount || !wdUpi}
                    startIcon={withdrawing ? <CircularProgress size={18} color="inherit" /> : <MdAccountBalance />}
                    sx={{ py: 1.5, fontWeight: 800, borderRadius: 2.5, background: 'linear-gradient(135deg, #059669, #10b981)', '&:hover': { background: 'linear-gradient(135deg, #047857, #059669)' } }}>
                    {withdrawing ? 'Processing…' : `Withdraw ₹${wdAmount || '0'}`}
                  </Button>
                  {wdResult && (
                    <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                      ✅ {wdResult.message} · Ref: {wdResult.reference_id}
                    </Alert>
                  )}
                </motion.div>
              )}

              {/* ── Promo Codes ────────────────────────────────────────────── */}
              {tab === (isWorker ? 3 : 3) && (
                <motion.div key="promo" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Typography variant="h6" fontWeight={800} mb={0.5}>Promo & Cashback Codes</Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>Apply a code to get instant cashback in your wallet</Typography>
                  <Box sx={{ mb: 2.5, p: 2, borderRadius: 2, background: isDark ? 'rgba(124,58,237,0.12)' : '#f5f3ff', border: '1px dashed rgba(124,58,237,0.4)' }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#7c3aed', mb: 1, display: 'block' }}>🎁 Available Codes</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {DEMO_PROMOS.map(code => (
                        <Chip key={code} label={code} onClick={() => setPromoCode(code)} variant="outlined"
                          sx={{ fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer', borderColor: '#7c3aed', color: '#7c3aed' }} />
                      ))}
                    </Box>
                  </Box>
                  <TextField fullWidth label="Enter Promo Code" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    sx={{ mb: 2 }} inputProps={{ style: { fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 } }} />
                  <Button fullWidth variant="contained" size="large" onClick={handleApplyPromo} disabled={applying || !promoCode.trim()}
                    startIcon={applying ? <CircularProgress size={18} color="inherit" /> : <MdLocalOffer />}
                    sx={{ py: 1.5, fontWeight: 800, borderRadius: 2.5, background: 'linear-gradient(135deg, #db2777, #f472b6)', '&:hover': { background: 'linear-gradient(135deg, #be185d, #ec4899)' } }}>
                    {applying ? 'Validating…' : 'Apply Code'}
                  </Button>
                  <AnimatePresence>
                    {promoResult && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Alert severity={promoResult.valid ? 'success' : 'error'} sx={{ mt: 2, borderRadius: 2 }} onClose={() => setPromoResult(null)}>
                          {promoResult.message}
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Box sx={{ mt: 2.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      💡 Auto Cashback: 5% on every booking · Reward Points: 1 pt per ₹10 spent
                    </Typography>
                  </Box>
                </motion.div>
              )}

              {/* ── Referral (customer only) ───────────────────────────────── */}
              {!isWorker && tab === 4 && (
                <motion.div key="referral" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Typography variant="h6" fontWeight={800} mb={0.5}>Referral Program 🎉</Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Share your code. Both you and your friend get ₹100 wallet bonus!
                  </Typography>

                  {/* My code */}
                  <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, background: isDark ? 'rgba(108,71,255,0.1)' : 'rgba(108,71,255,0.06)', border: '1px solid rgba(108,71,255,0.25)' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#6c47ff', display: 'block', mb: 1 }}>Your Referral Code</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5" fontWeight={900} sx={{ fontFamily: 'monospace', color: '#6c47ff', flex: 1, letterSpacing: 3 }}>
                        {referral?.referral_code || '—'}
                      </Typography>
                      <Tooltip title={copied ? 'Copied!' : 'Copy code'}>
                        <IconButton onClick={() => handleCopyCode(referral?.referral_code || '')} sx={{ color: '#6c47ff', background: 'rgba(108,71,255,0.12)' }}>
                          {copied ? <MdCheckCircle /> : <MdContentCopy />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Divider sx={{ my: 1.5, borderColor: 'rgba(108,71,255,0.15)' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box><Typography variant="caption" color="text.secondary">Total Referrals</Typography><Typography fontWeight={700}>{referral?.total_referrals ?? 0}</Typography></Box>
                      <Box><Typography variant="caption" color="text.secondary">Bonus Earned</Typography><Typography fontWeight={700} color="success.main">₹{(referral?.total_earned ?? 0).toFixed(0)}</Typography></Box>
                      <Box><Typography variant="caption" color="text.secondary">Per Referral</Typography><Typography fontWeight={700}>₹{referral?.bonus_per_referral ?? 100}</Typography></Box>
                    </Box>
                  </Paper>

                  {/* Apply friend's code */}
                  <Typography variant="body2" fontWeight={700} mb={1}>Apply a Friend's Code</Typography>
                  <TextField fullWidth label="Enter referral code" value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                    sx={{ mb: 2 }} inputProps={{ style: { fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 } }} />
                  <Button fullWidth variant="contained" onClick={handleApplyReferral} disabled={applyingRef || !refCode.trim()}
                    startIcon={applyingRef ? <CircularProgress size={18} color="inherit" /> : <MdCardGiftcard />}
                    sx={{ py: 1.5, fontWeight: 800, borderRadius: 2.5, background: 'linear-gradient(135deg, #10b981, #34d399)', '&:hover': { background: 'linear-gradient(135deg, #059669, #10b981)' } }}>
                    {applyingRef ? 'Applying…' : 'Apply Referral Code'}
                  </Button>
                  <AnimatePresence>
                    {refResult && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Alert severity={refResult.valid ? 'success' : 'error'} sx={{ mt: 2, borderRadius: 2 }} onClose={() => setRefResult(null)}>
                          {refResult.message}
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ── Analytics ─────────────────────────────────────────────── */}
              {tab === (isWorker ? 4 : 5) && (
                <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Typography variant="h6" fontWeight={800} mb={0.5}>Transaction Analytics 📊</Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>Your spending and earning trends over the last 6 months</Typography>

                  {!analytics ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress sx={{ color: '#6c47ff' }} /></Box>
                  ) : (
                    <>
                      {/* Summary chips */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                        {[
                          { label: 'Balance', value: `₹${analytics.total_balance?.toFixed(2)}`, color: '#6c47ff' },
                          { label: 'Spent', value: `₹${analytics.total_spent?.toFixed(2)}`, color: '#ef4444' },
                          { label: 'Cashback', value: `₹${analytics.total_cashback?.toFixed(2)}`, color: '#10b981' },
                          { label: 'Refunds', value: `₹${analytics.total_refunds?.toFixed(2)}`, color: '#3b82f6' },
                        ].map(c => (
                          <Chip key={c.label} label={`${c.label}: ${c.value}`} sx={{ fontWeight: 700, background: c.color + '18', color: c.color, border: `1px solid ${c.color}30` }} />
                        ))}
                      </Box>

                      {/* Monthly bar chart */}
                      {monthlyData.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" fontWeight={700} mb={1}>Monthly Spending (₹)</Typography>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={monthlyData}>
                              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                              <XAxis dataKey="month" tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                              <YAxis tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                              <ReTooltip formatter={(v) => `₹${v.toFixed(2)}`} contentStyle={{ background: isDark ? '#1f2937' : '#fff', borderRadius: 8, border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}` }} />
                              <Bar dataKey="amount" fill="#6c47ff" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      )}

                      {/* Pie breakdown */}
                      {breakdownData.length > 0 && (
                        <Box>
                          <Typography variant="body2" fontWeight={700} mb={1}>Category Breakdown</Typography>
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie data={breakdownData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                {breakdownData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                              </Pie>
                              <ReTooltip formatter={(v) => `₹${v.toFixed(2)}`} contentStyle={{ background: isDark ? '#1f2937' : '#fff', borderRadius: 8 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      )}

                      {monthlyData.length === 0 && breakdownData.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                          <MdTrendingUp size={48} style={{ opacity: 0.2, marginBottom: 8 }} />
                          <Typography color="text.secondary">No analytics data yet.</Typography>
                          <Typography variant="caption" color="text.secondary">Make some transactions to see your spending trends.</Typography>
                        </Box>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
