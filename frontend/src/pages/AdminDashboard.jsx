import { useState, useEffect, useCallback } from 'react'
import {
  Box, Container, Typography, Grid, Paper, Avatar, Button,
  Chip, CircularProgress, Alert, useTheme, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, TextField, InputAdornment, Tooltip, LinearProgress,
  Divider, Badge, MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  MdPeople, MdWork, MdBookOnline, MdTrendingUp, MdVerified,
  MdLogout, MdDashboard, MdSearch, MdRefresh, MdCheckCircle,
  MdCancel, MdPending, MdReportProblem, MdStar, MdAttachMoney,
  MdBarChart, MdSettings, MdPerson, MdBlock, MdDone,
  MdWarning, MdAdminPanelSettings, MdGroups, MdEqualizer,
  MdArrowUpward, MdArrowDownward, MdMoreVert, MdVisibility,
  MdReply, MdSave, MdEdit, MdAutoAwesome, MdSend, MdNotifications,
  MdOutlineBarChart, MdPeopleAlt, MdVerifiedUser,
} from 'react-icons/md'
import {
  getDashboardStats, getAdminCustomers, getAdminWorkers,
  getAdminBookings, getAdminReviews, getAdminComplaints,
  approveWorker, rejectWorker, suspendWorker, blockCustomer,
  getBookingsPerMonth, getServicePopularity, getRevenueGrowth,
  getAdminSettings, updateAdminSetting, getAIInsights, broadcastNotification,
  getDailyRevenue, getYearlyRevenue, getPeakHours, getTopWorkers,
  getTopServices, getCustomerGrowth, getWorkerGrowth, getComplaintAnalysis, getAIForecast,
} from '../services/adminService'
import { hideReview, deleteReview, replyToReview } from '../services/reviewService'
import { updateComplaintStatus } from '../services/complaintService'
import { useAuth } from '../hooks/useAuth'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from 'recharts'

const MotionPaper = motion(Paper)
const COLORS = ['#6C47FF', '#00D4AA', '#FFB800', '#FF6B35', '#3B82F6', '#22C55E']

// ─── Reusable stat card ─────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, gradient, delay = 0 }) => (
  <motion.div whileHover={{ y: -5, scale: 1.02 }} initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}>
    <Paper sx={{
      p: 3, borderRadius: 3, position: 'relative', overflow: 'hidden',
      border: `1px solid ${color}22`, boxShadow: `0 4px 20px ${color}12`,
      '&:hover': { boxShadow: `0 12px 40px ${color}28` }, transition: 'all 0.3s',
    }}>
      <Box sx={{ position: 'absolute', top: -24, right: -24, width: 88, height: 88, borderRadius: '50%', background: gradient, opacity: 0.1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={1} display="block">
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={900} sx={{ color, mt: 0.5, lineHeight: 1 }}>{value ?? '—'}</Typography>
          {sub && <Typography variant="caption" color="text.secondary" mt={0.5} display="block">{sub}</Typography>}
        </Box>
        <Box sx={{ width: 52, height: 52, borderRadius: 2.5, background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 20px ${color}44`, flexShrink: 0 }}>
          <Icon color="white" size={26} />
        </Box>
      </Box>
    </Paper>
  </motion.div>
)

// ─── Status badge ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    completed:   { color: '#22C55E', label: 'Completed' },
    pending:     { color: '#FFB800', label: 'Pending' },
    cancelled:   { color: '#EF4444', label: 'Cancelled' },
    active:      { color: '#6C47FF', label: 'Active' },
    approved:    { color: '#22C55E', label: 'Approved' },
    rejected:    { color: '#EF4444', label: 'Rejected' },
    suspended:   { color: '#FF6B35', label: 'Suspended' },
    open:        { color: '#FF6B35', label: 'Open' },
    resolved:    { color: '#22C55E', label: 'Resolved' },
    under_review:{ color: '#FFB800', label: 'Under Review' },
    closed:      { color: '#6B7280', label: 'Closed' },
  }[status] || { color: '#6B7280', label: status }
  return (
    <Chip label={cfg.label} size="small"
      sx={{ bgcolor: `${cfg.color}18`, color: cfg.color, fontWeight: 700, fontSize: 11, border: `1px solid ${cfg.color}30` }} />
  )
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [tab, setTab] = useState(0)
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [popularityData, setPopularityData] = useState([])
  const [customers, setCustomers] = useState([])
  const [workers, setWorkers] = useState([])
  const [bookings, setBookings] = useState([])
  const [reviews, setReviews] = useState([])
  const [complaints, setComplaints] = useState([])
  const [platformSettings, setPlatformSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const [actionType, setActionType] = useState('success')

  // Review reply state
  const [replyDialog, setReplyDialog] = useState({ open: false, reviewId: null, text: '' })
  // Settings edit state
  const [settingEdit, setSettingEdit] = useState({})
  // AI Insights state
  const [aiInsights, setAiInsights] = useState(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  // Broadcast state
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', type: 'announcement', target: 'all' })
  const [broadcastSending, setBroadcastSending] = useState(false)

  // BI Dashboard state (Phase 17)
  const [biData, setBiData] = useState({
    daily: [], yearly: [], peakHours: [], topWorkers: [], topServices: [],
    customerGrowth: [], workerGrowth: [], complaintAnalysis: null, aiForecast: null,
  })
  const [biLoading, setBiLoading] = useState(false)
  const [aiForecastLoading, setAiForecastLoading] = useState(false)

  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/')
  }, [user, navigate])

  // Load dashboard stats on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [s, chart, pop, rev] = await Promise.all([
          getDashboardStats(),
          getBookingsPerMonth().catch(() => []),
          getServicePopularity().catch(() => []),
          getRevenueGrowth().catch(() => []),
        ])
        setStats(s)
        setChartData(chart)
        setPopularityData(pop)
        setRevenueData(rev)
      } catch (e) {
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Load tab-specific data
  useEffect(() => {
    const loadTab = async () => {
      setTabLoading(true)
      try {
        if (tab === 1) setCustomers(await getAdminCustomers({ search: searchQ }))
        if (tab === 2) setWorkers(await getAdminWorkers({ search: searchQ }))
        if (tab === 3) setBookings(await getAdminBookings())
        if (tab === 4) setReviews(await getAdminReviews({ include_hidden: true }))
        if (tab === 5) setComplaints(await getAdminComplaints())
        if (tab === 7) {
          const s = await getAdminSettings().catch(() => ({}))
          setPlatformSettings(s)
          setSettingEdit(s)
        }
      // BI Dashboard tab (tab 10)
      if (tab === 10) {
        setBiLoading(true)
        try {
          const [daily, yearly, peakHours, topWorkers, topServices, customerGrowth, workerGrowth, complaintAnalysis] = await Promise.all([
            getDailyRevenue().catch(() => []),
            getYearlyRevenue().catch(() => []),
            getPeakHours().catch(() => []),
            getTopWorkers().catch(() => []),
            getTopServices().catch(() => []),
            getCustomerGrowth().catch(() => []),
            getWorkerGrowth().catch(() => []),
            getComplaintAnalysis().catch(() => null),
          ])
          setBiData(prev => ({ ...prev, daily, yearly, peakHours, topWorkers, topServices, customerGrowth, workerGrowth, complaintAnalysis }))
        } finally { setBiLoading(false) }
      }
      if (tab === 8) {
        setInsightsLoading(true)
        try {
          const data = await getAIInsights().catch(() => null)
          setAiInsights(data)
        } finally {
          setInsightsLoading(false)
        }
      }
      } catch { /* silently fail */ }
      finally { setTabLoading(false) }
    }
    if (tab > 0) loadTab()
  }, [tab, searchQ])

  const showMsg = (msg, type = 'success') => {
    setActionMsg(msg); setActionType(type)
    setTimeout(() => setActionMsg(''), 3500)
  }

  const handleApproveWorker = async (id) => {
    try { await approveWorker(id); showMsg('Worker approved ✓'); setWorkers(ws => ws.map(w => w.user_id === id || w.id === id ? { ...w, verification_status: 'approved' } : w)) }
    catch { showMsg('Failed to approve worker', 'error') }
  }
  const handleRejectWorker = async (id) => {
    try { await rejectWorker(id); showMsg('Worker rejected'); setWorkers(ws => ws.map(w => w.user_id === id || w.id === id ? { ...w, verification_status: 'rejected' } : w)) }
    catch { showMsg('Failed to reject worker', 'error') }
  }
  const handleSuspendWorker = async (id) => {
    try { await suspendWorker(id); showMsg('Worker suspended'); setWorkers(ws => ws.map(w => w.user_id === id || w.id === id ? { ...w, verification_status: 'suspended' } : w)) }
    catch { showMsg('Failed to suspend worker', 'error') }
  }
  const handleBlockCustomer = async (id, block) => {
    try { await blockCustomer(id, block); showMsg(block ? 'Customer blocked' : 'Customer unblocked'); setCustomers(cs => cs.map(c => c.id === id ? { ...c, is_blocked: block } : c)) }
    catch { showMsg('Action failed', 'error') }
  }
  const handleHideReview = async (id, hide) => {
    try { await hideReview(id, hide); showMsg(hide ? 'Review hidden' : 'Review restored'); setReviews(rs => rs.map(r => r.id === id ? { ...r, is_hidden: hide } : r)) }
    catch { showMsg('Action failed', 'error') }
  }
  const handleDeleteReview = async (id) => {
    if (!window.confirm('Permanently delete this review?')) return
    try { await deleteReview(id); showMsg('Review deleted'); setReviews(rs => rs.filter(r => r.id !== id)) }
    catch { showMsg('Delete failed', 'error') }
  }
  const handleSendReply = async () => {
    if (!replyDialog.text.trim()) return
    try {
      await replyToReview(replyDialog.reviewId, replyDialog.text)
      showMsg('Reply posted ✓')
      setReviews(rs => rs.map(r => r.id === replyDialog.reviewId ? { ...r, admin_reply: replyDialog.text } : r))
      setReplyDialog({ open: false, reviewId: null, text: '' })
    } catch { showMsg('Failed to post reply', 'error') }
  }
  const handleUpdateComplaintStatus = async (id, status) => {
    try {
      await updateComplaintStatus(id, { status, note: '' })
      showMsg(`Complaint marked as ${status}`)
      setComplaints(cs => cs.map(c => c.id === id ? { ...c, status } : c))
    } catch { showMsg('Status update failed', 'error') }
  }
  const handleSaveSetting = async (key) => {
    try {
      await updateAdminSetting(key, settingEdit[key])
      showMsg(`${key} updated ✓`)
      setPlatformSettings(s => ({ ...s, [key]: settingEdit[key] }))
    } catch { showMsg('Save failed', 'error') }
  }

  const handleBroadcast = async () => {
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      showMsg('Please enter a title and message.', 'error')
      return
    }
    setBroadcastSending(true)
    try {
      const res = await broadcastNotification(broadcastForm)
      showMsg(`✓ Broadcast sent to ${res.recipients_count ?? 'all'} users!`, 'success')
      setBroadcastForm({ title: '', message: '', type: 'announcement', target: 'all' })
    } catch { showMsg('Broadcast failed. Try again.', 'error') }
    finally { setBroadcastSending(false) }
  }

  const glassCard = {
    borderRadius: 3, p: 3,
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(20px)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(108,71,255,0.08)',
  }

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', flexDirection: 'column', gap: 2 }}>
      <CircularProgress size={52} thickness={3} />
      <Typography color="text.secondary" fontWeight={600}>Loading Admin Dashboard…</Typography>
    </Box>
  )

  const r = stats?.revenue || {}
  const c = stats?.customers || {}
  const w = stats?.workers || {}
  const b = stats?.bookings || {}

  const STAT_CARDS = [
    { icon: MdPeople,     label: 'Total Customers', value: c.total,     sub: `+${c.new_today ?? 0} today`,        color: '#6C47FF', gradient: 'linear-gradient(135deg,#6C47FF,#9B72FF)', delay: 0 },
    { icon: MdWork,       label: 'Total Workers',   value: w.total,     sub: `${w.verified ?? 0} verified`,        color: '#00D4AA', gradient: 'linear-gradient(135deg,#00D4AA,#00B894)', delay: 0.06 },
    { icon: MdBookOnline, label: 'Total Bookings',  value: b.total,     sub: `${b.today ?? 0} today`,              color: '#FFB800', gradient: 'linear-gradient(135deg,#FFB800,#FFD54F)', delay: 0.12 },
    { icon: MdCheckCircle,label: 'Completed Jobs',  value: b.completed, sub: `${b.pending ?? 0} pending`,          color: '#22C55E', gradient: 'linear-gradient(135deg,#22C55E,#4ADE80)', delay: 0.18 },
    { icon: MdAttachMoney,label: 'Total Revenue',   value: `₹${(r.total ?? 0).toLocaleString('en-IN')}`, sub: `₹${(r.today ?? 0).toLocaleString('en-IN')} today`, color: '#3B82F6', gradient: 'linear-gradient(135deg,#3B82F6,#60A5FA)', delay: 0.24 },
    { icon: MdReportProblem,label:'Open Complaints',value: stats?.complaints?.open ?? 0, sub: `${stats?.complaints?.critical ?? 0} critical`, color: '#FF6B35', gradient: 'linear-gradient(135deg,#FF6B35,#FF9A5C)', delay: 0.30 },
  ]

  const TAB_LABELS = ['Overview', 'Customers', 'Workers', 'Bookings', 'Reviews', 'Complaints', 'Revenue', 'Settings', 'AI Insights', 'Broadcast', '📊 BI Dashboard']

  return (
    <Box sx={{ minHeight: '100vh', background: isDark ? 'linear-gradient(135deg,#080812,#0D0D1A)' : 'linear-gradient(135deg,#F0EDFF,#FAFAFA)' }}>
      {/* ── Header ── */}
      <Box sx={{ background: isDark ? 'linear-gradient(135deg,#080812,#1a1740)' : 'linear-gradient(135deg,#0f0c29,#302b63)', pt: { xs: 3, md: 5 }, pb: { xs: 8, md: 10 } }}>
        <Container maxWidth="xl">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: 3, background: 'linear-gradient(135deg,#6C47FF,#9B72FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(108,71,255,0.4)' }}>
                  <MdAdminPanelSettings size={30} color="#fff" />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={900} sx={{ color: '#fff', letterSpacing: '-0.02em' }}>OneDW Admin Portal</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                    Internal Administration Dashboard · {user?.email}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Chip label="Admin" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700 }} />
                <Button variant="outlined" size="small" startIcon={<MdLogout />}
                  onClick={() => { logout(); navigate('/') }}
                  sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff', borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                  Sign Out
                </Button>
              </Box>
            </Box>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: '-52px', pb: 8, position: 'relative', zIndex: 2 }}>
        {/* Stat Cards */}
        <Grid container spacing={2.5} mb={3}>
          {STAT_CARDS.map((c) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={c.label}>
              <StatCard {...c} />
            </Grid>
          ))}
        </Grid>

        {/* Revenue Row */}
        <Grid container spacing={2.5} mb={3}>
          {[
            { label: "Today's Revenue",    value: `₹${(r.today ?? 0).toLocaleString('en-IN')}`,              color: '#22C55E' },
            { label: 'Weekly Revenue',     value: `₹${(r.week ?? 0).toLocaleString('en-IN')}`,               color: '#3B82F6' },
            { label: 'Monthly Revenue',    value: `₹${(r.month ?? 0).toLocaleString('en-IN')}`,              color: '#6C47FF' },
            { label: 'Platform Commission',value: `₹${(r.platform_commission ?? 0).toLocaleString('en-IN')}`,color: '#FFB800' },
            { label: 'Worker Payout',      value: `₹${(r.worker_payout ?? 0).toLocaleString('en-IN')}`,      color: '#00D4AA' },
          ].map((item, i) => (
            <Grid item xs={6} sm={4} md={2.4} key={item.label}>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Paper sx={{ ...glassCard, p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" textTransform="uppercase" letterSpacing={0.5}>{item.label}</Typography>
                  <Typography variant="h6" fontWeight={900} sx={{ color: item.color, mt: 0.5 }}>{item.value}</Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Tabs */}
        <Paper sx={{ ...glassCard, p: 0, overflow: 'hidden', mb: 3 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
            sx={{
              px: 2, pt: 1,
              '& .MuiTab-root': { fontWeight: 700, fontSize: 13, textTransform: 'none', minWidth: 100 },
              '& .MuiTabs-indicator': { background: 'linear-gradient(90deg,#6C47FF,#9B72FF)', borderRadius: 1, height: 3 },
            }}>
            {TAB_LABELS.map((l) => <Tab key={l} label={l} />)}
          </Tabs>
          <Divider />

          <Box sx={{ p: 3, minHeight: 400 }}>
            {tabLoading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}
            {actionMsg && <Alert severity={actionType} sx={{ mb: 2, borderRadius: 2 }}>{actionMsg}</Alert>}
            {error && tab === 0 && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            {/* ── Overview Tab ── */}
            {tab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" fontWeight={800} mb={2}>Bookings per Month</Typography>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6C47FF" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: isDark ? '#aaa' : '#666' }} />
                        <YAxis tick={{ fontSize: 12, fill: isDark ? '#aaa' : '#666' }} />
                        <RTooltip contentStyle={{ background: isDark ? '#1a1a2e' : '#fff', border: '1px solid rgba(108,71,255,0.2)', borderRadius: 8 }} />
                        <Area type="monotone" dataKey="count" stroke="#6C47FF" strokeWidth={2.5} fill="url(#bookGrad)" name="Bookings" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                      <Typography>No booking data yet</Typography>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="h6" fontWeight={800} mb={2}>Service Popularity</Typography>
                  {popularityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={popularityData} dataKey="count" nameKey="service" cx="50%" cy="50%" outerRadius={90} paddingAngle={3}
                          label={({ service, percent }) => `${(service || 'Unknown').split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {popularityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <RTooltip contentStyle={{ background: isDark ? '#1a1a2e' : '#fff', borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                      <Typography>No data yet</Typography>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" fontWeight={800} mb={2}>Worker Verification</Typography>
                  {[
                    { label: 'Verified',  value: w.verified ?? 0,             color: '#22C55E', pct: w.total ? Math.round((w.verified / w.total) * 100) : 0 },
                    { label: 'Pending',   value: w.pending_verification ?? 0, color: '#FFB800', pct: w.total ? Math.round((w.pending_verification / w.total) * 100) : 0 },
                    { label: 'Rejected',  value: w.rejected ?? 0,             color: '#EF4444', pct: w.total ? Math.round((w.rejected / w.total) * 100) : 0 },
                  ].map(({ label, value, color, pct }) => (
                    <Box key={label} mb={1.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={600}>{label}</Typography>
                        <Typography variant="body2" fontWeight={800} sx={{ color }}>{value} ({pct}%)</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 4, bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', '& .MuiLinearProgress-bar': { background: color, borderRadius: 4 } }} />
                    </Box>
                  ))}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" fontWeight={800} mb={2}>Booking Status</Typography>
                  {[
                    { label: 'Completed', value: b.completed ?? 0, color: '#22C55E' },
                    { label: 'Pending',   value: b.pending   ?? 0, color: '#FFB800' },
                    { label: 'Active',    value: b.active    ?? 0, color: '#6C47FF' },
                    { label: 'Cancelled', value: b.cancelled ?? 0, color: '#EF4444' },
                  ].map(({ label, value, color }) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                        <Typography variant="body2">{label}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={800} sx={{ color }}>{value}</Typography>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            )}

            {/* ── Customers Tab ── */}
            {tab === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="h6" fontWeight={800}>Customer Management</Typography>
                  <TextField size="small" placeholder="Search customers…" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><MdSearch /></InputAdornment> }}
                    sx={{ width: 280, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {['Name', 'Email', 'Phone', 'Status', 'Joined', 'Actions'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customers.length === 0 ? (
                        <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>No customers found</TableCell></TableRow>
                      ) : customers.map(cu => (
                        <TableRow key={cu.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg,#6C47FF,#9B72FF)', fontSize: 13, fontWeight: 800 }}>
                                {(cu.name || 'U')[0].toUpperCase()}
                              </Avatar>
                              <Typography variant="body2" fontWeight={700}>{cu.name || '—'}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell><Typography variant="body2" color="text.secondary">{cu.email}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{cu.phone || '—'}</Typography></TableCell>
                          <TableCell>
                            <Chip label={cu.is_blocked ? 'Blocked' : 'Active'} size="small"
                              sx={{ bgcolor: cu.is_blocked ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: cu.is_blocked ? '#EF4444' : '#22C55E', fontWeight: 700, fontSize: 11 }} />
                          </TableCell>
                          <TableCell><Typography variant="caption" color="text.secondary">{cu.created_at ? new Date(cu.created_at).toLocaleDateString('en-IN') : '—'}</Typography></TableCell>
                          <TableCell>
                            <Tooltip title={cu.is_blocked ? 'Unblock' : 'Block'}>
                              <IconButton size="small" onClick={() => handleBlockCustomer(cu.id, !cu.is_blocked)} sx={{ color: cu.is_blocked ? '#22C55E' : '#EF4444' }}>
                                {cu.is_blocked ? <MdDone size={18} /> : <MdBlock size={18} />}
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* ── Workers Tab ── */}
            {tab === 2 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="h6" fontWeight={800}>Worker Management</Typography>
                  <TextField size="small" placeholder="Search workers…" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><MdSearch /></InputAdornment> }}
                    sx={{ width: 280, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {['Worker', 'Skills', 'Rating', 'Verification', 'Actions'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {workers.length === 0 ? (
                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>No workers found</TableCell></TableRow>
                      ) : workers.map(wk => (
                        <TableRow key={wk.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg,#00D4AA,#00B894)', fontSize: 13, fontWeight: 800 }}>
                                {(wk.name || 'W')[0].toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={700}>{wk.name || '—'}</Typography>
                                <Typography variant="caption" color="text.secondary">{wk.email || ''}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 200 }}>
                              {(wk.skills || []).slice(0, 3).map(s => <Chip key={s} label={s} size="small" variant="outlined" sx={{ fontSize: 10 }} />)}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <MdStar color="#FFB800" size={14} />
                              <Typography variant="body2" fontWeight={700}>{wk.average_rating?.toFixed(1) || '—'}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell><StatusBadge status={wk.verification_status || 'pending'} /></TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {wk.verification_status !== 'approved' && (
                                <Tooltip title="Approve">
                                  <IconButton size="small" onClick={() => handleApproveWorker(wk.user_id || wk.id)} sx={{ color: '#22C55E' }}>
                                    <MdCheckCircle size={18} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {wk.verification_status !== 'rejected' && (
                                <Tooltip title="Reject">
                                  <IconButton size="small" onClick={() => handleRejectWorker(wk.user_id || wk.id)} sx={{ color: '#EF4444' }}>
                                    <MdCancel size={18} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {wk.verification_status !== 'suspended' && (
                                <Tooltip title="Suspend">
                                  <IconButton size="small" onClick={() => handleSuspendWorker(wk.user_id || wk.id)} sx={{ color: '#FF6B35' }}>
                                    <MdBlock size={18} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* ── Bookings Tab ── */}
            {tab === 3 && (
              <Box>
                <Typography variant="h6" fontWeight={800} mb={2}>All Bookings</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {['Service', 'Customer', 'Worker', 'Amount', 'Status', 'Date'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bookings.length === 0 ? (
                        <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>No bookings found</TableCell></TableRow>
                      ) : bookings.map(bk => (
                        <TableRow key={bk.id} hover>
                          <TableCell><Typography variant="body2" fontWeight={700}>{bk.service_type || '—'}</Typography></TableCell>
                          <TableCell><Typography variant="body2" color="text.secondary">{bk.customer_id?.slice(-8) || '—'}</Typography></TableCell>
                          <TableCell><Typography variant="body2" color="text.secondary">{bk.worker_id?.slice(-8) || '—'}</Typography></TableCell>
                          <TableCell><Typography variant="body2" fontWeight={700}>₹{(bk.amount || 0).toLocaleString('en-IN')}</Typography></TableCell>
                          <TableCell><StatusBadge status={bk.status} /></TableCell>
                          <TableCell><Typography variant="caption" color="text.secondary">{bk.created_at ? new Date(bk.created_at).toLocaleDateString('en-IN') : '—'}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* ── Reviews Tab ── */}
            {tab === 4 && (
              <Box>
                <Typography variant="h6" fontWeight={800} mb={2}>Review Moderation</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {reviews.length === 0 ? (
                    <Typography color="text.secondary" textAlign="center" py={6}>No reviews yet</Typography>
                  ) : reviews.map(rv => (
                    <Paper key={rv.id} sx={{
                      p: 2.5, borderRadius: 2.5,
                      background: rv.is_hidden ? (isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)') : (isDark ? 'rgba(255,255,255,0.04)' : '#fafafa'),
                      border: rv.is_hidden ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(108,71,255,0.08)',
                      opacity: rv.is_hidden ? 0.75 : 1,
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight={800}>{rv.customer_name || 'Customer'}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                              {[1,2,3,4,5].map(s => <MdStar key={s} size={14} color={s <= rv.overall_rating ? '#FFB800' : '#ddd'} />)}
                            </Box>
                            {rv.is_hidden && <Chip label="Hidden" size="small" sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 700, fontSize: 10 }} />}
                            {rv.is_verified && <Chip icon={<MdVerified size={12} />} label="Verified" size="small" sx={{ bgcolor: 'rgba(34,197,94,0.1)', color: '#22C55E', fontWeight: 700, fontSize: 10 }} />}
                          </Box>
                          <Typography variant="body2" color="text.secondary" mb={1}>{rv.review_text || '(No text)'}</Typography>
                          {rv.admin_reply && (
                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(108,71,255,0.06)', border: '1px solid rgba(108,71,255,0.1)' }}>
                              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 0.3 }}>
                                <MdVerified color="#6C47FF" size={12} />
                                <Typography variant="caption" fontWeight={800} color="primary.main">OneDW Team Reply: </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">{rv.admin_reply}</Typography>
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, ml: 2, flexShrink: 0 }}>
                          <Tooltip title="Reply to review">
                            <IconButton size="small" onClick={() => setReplyDialog({ open: true, reviewId: rv.id, text: rv.admin_reply || '' })} sx={{ color: '#6C47FF' }}>
                              <MdReply size={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={rv.is_hidden ? 'Restore' : 'Hide'}>
                            <IconButton size="small" onClick={() => handleHideReview(rv.id, !rv.is_hidden)} sx={{ color: rv.is_hidden ? '#22C55E' : '#FF6B35' }}>
                              <MdVisibility size={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete review">
                            <IconButton size="small" onClick={() => handleDeleteReview(rv.id)} sx={{ color: '#EF4444' }}>
                              <MdCancel size={18} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}

            {/* ── Complaints Tab ── */}
            {tab === 5 && (
              <Box>
                <Typography variant="h6" fontWeight={800} mb={2}>Complaint Management</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {complaints.length === 0 ? (
                    <Typography color="text.secondary" textAlign="center" py={6}>No complaints filed yet</Typography>
                  ) : complaints.map(cp => {
                    const p = { low: '#22C55E', medium: '#FFB800', high: '#FF6B35', critical: '#EF4444' }[cp.priority] || '#6B7280'
                    return (
                      <Paper key={cp.id} sx={{ p: 2.5, borderRadius: 2.5, background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa', border: `1px solid ${p}18` }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                              <Typography variant="subtitle2" fontWeight={800}>{cp.title}</Typography>
                              <Chip label={cp.priority || 'medium'} size="small" sx={{ bgcolor: `${p}18`, color: p, fontWeight: 700, fontSize: 10 }} />
                              <StatusBadge status={cp.status} />
                            </Box>
                            <Typography variant="body2" color="text.secondary" mb={0.5}>
                              {cp.description?.slice(0, 120)}{cp.description?.length > 120 ? '…' : ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              By: {cp.complainant_name || cp.complainant_id?.slice(-8) || '—'} · {cp.category} · {cp.created_at ? new Date(cp.created_at).toLocaleDateString('en-IN') : '—'}
                            </Typography>
                          </Box>
                          {/* Status changer */}
                          <Box sx={{ ml: 2, flexShrink: 0, minWidth: 140 }}>
                            <FormControl size="small" fullWidth>
                              <Select
                                value={cp.status || 'open'}
                                onChange={e => handleUpdateComplaintStatus(cp.id, e.target.value)}
                                sx={{ borderRadius: 2, fontSize: 12 }}
                              >
                                {['open','under_review','assigned','investigating','resolved','closed'].map(s => (
                                  <MenuItem key={s} value={s} sx={{ fontSize: 12 }}>{s.replace('_',' ').replace(/\b\w/g, l => l.toUpperCase())}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                        </Box>
                      </Paper>
                    )
                  })}
                </Box>
              </Box>
            )}

            {/* ── Revenue Tab ── */}
            {tab === 6 && (
              <Box>
                <Typography variant="h6" fontWeight={800} mb={3}>Revenue Analytics</Typography>
                {revenueData.length > 0 ? (
                  <Grid container spacing={3}>
                    {/* Revenue chart */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" fontWeight={700} mb={2}>Monthly Revenue & Commission (₹)</Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                          <XAxis dataKey="month" tick={{ fontSize: 12, fill: isDark ? '#aaa' : '#666' }} />
                          <YAxis tick={{ fontSize: 12, fill: isDark ? '#aaa' : '#666' }} />
                          <RTooltip
                            contentStyle={{ background: isDark ? '#1a1a2e' : '#fff', border: '1px solid rgba(108,71,255,0.2)', borderRadius: 8 }}
                            formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                          />
                          <Legend />
                          <Bar dataKey="revenue" name="Total Revenue" fill="#6C47FF" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="commission" name="Platform Commission" fill="#00D4AA" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="worker_payout" name="Worker Payout" fill="#FFB800" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Grid>

                    {/* Growth % area chart */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" fontWeight={700} mb={2}>Revenue Growth % Month-over-Month</Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <defs>
                            <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                          <XAxis dataKey="month" tick={{ fontSize: 12, fill: isDark ? '#aaa' : '#666' }} />
                          <YAxis tick={{ fontSize: 12, fill: isDark ? '#aaa' : '#666' }} unit="%" />
                          <RTooltip contentStyle={{ background: isDark ? '#1a1a2e' : '#fff', borderRadius: 8 }} formatter={(v) => [`${v}%`, 'Growth']} />
                          <Area type="monotone" dataKey="growth" stroke="#22C55E" strokeWidth={2.5} fill="url(#growthGrad)" name="Growth %" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Grid>

                    {/* Revenue summary cards */}
                    {revenueData.length > 0 && (() => {
                      const totals = revenueData.reduce((acc, r) => ({
                        revenue: acc.revenue + r.revenue,
                        commission: acc.commission + r.commission,
                        worker_payout: acc.worker_payout + r.worker_payout,
                        bookings: acc.bookings + r.bookings,
                      }), { revenue: 0, commission: 0, worker_payout: 0, bookings: 0 })
                      return [
                        { label: 'Total Revenue (12m)', value: `₹${totals.revenue.toLocaleString('en-IN')}`, color: '#6C47FF' },
                        { label: 'Platform Earnings', value: `₹${totals.commission.toLocaleString('en-IN')}`, color: '#00D4AA' },
                        { label: 'Worker Payouts', value: `₹${totals.worker_payout.toLocaleString('en-IN')}`, color: '#FFB800' },
                        { label: 'Total Bookings', value: totals.bookings, color: '#3B82F6' },
                      ].map((item, i) => (
                        <Grid item xs={6} sm={3} key={item.label}>
                          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                            <Paper sx={{ p: 2.5, borderRadius: 3, textAlign: 'center', border: `1px solid ${item.color}20`, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa' }}>
                              <Typography variant="h5" fontWeight={900} sx={{ color: item.color }}>{item.value}</Typography>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>{item.label}</Typography>
                            </Paper>
                          </motion.div>
                        </Grid>
                      ))
                    })()}
                  </Grid>
                ) : (
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <MdBarChart size={64} color={isDark ? '#333' : '#ddd'} />
                    <Typography color="text.secondary" mt={2}>No revenue data yet. Revenue charts will appear once bookings are completed.</Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* ── Settings Tab ── */}
            {tab === 7 && (
              <Box>
                <Typography variant="h6" fontWeight={800} mb={1}>Platform Settings</Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Configure platform-wide settings. Changes take effect immediately.
                </Typography>
                <Grid container spacing={3} maxWidth={680}>
                  {[
                    { key: 'commission_rate',       label: 'Platform Commission Rate (%)', type: 'number', help: 'Percentage the platform takes from each completed booking.' },
                    { key: 'gst_rate',              label: 'GST Rate (%)',                  type: 'number', help: 'Goods and Services Tax rate applied to bookings.' },
                    { key: 'cancellation_charges',  label: 'Cancellation Charges (₹)',      type: 'number', help: 'Flat fee charged on booking cancellations.' },
                    { key: 'emergency_charges',     label: 'Emergency Booking Surcharge (₹)', type: 'number', help: 'Extra amount charged for emergency/same-day bookings.' },
                  ].map(({ key, label, type, help }) => (
                    <Grid item xs={12} sm={6} key={key}>
                      <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(108,71,255,0.1)', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa' }}>
                        <Typography variant="caption" fontWeight={700} display="block" mb={1}>{label}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mb={1.5} lineHeight={1.5}>{help}</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            size="small" type={type} fullWidth
                            value={settingEdit[key] ?? platformSettings[key] ?? ''}
                            onChange={e => setSettingEdit(s => ({ ...s, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                          <Tooltip title="Save">
                            <IconButton
                              size="small"
                              onClick={() => handleSaveSetting(key)}
                              sx={{ bgcolor: 'rgba(108,71,255,0.1)', color: '#6C47FF', borderRadius: 2, px: 1, '&:hover': { bgcolor: 'rgba(108,71,255,0.2)' } }}
                            >
                              <MdSave size={18} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        {platformSettings[key] !== undefined && (
                          <Typography variant="caption" color="text.secondary" display="block" mt={0.8}>
                            Current: <strong>{platformSettings[key]}</strong>
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* ── AI Insights Tab ── */}
            {tab === 8 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'linear-gradient(135deg,#6C47FF,#9B72FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MdAutoAwesome color="#fff" size={20} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>AI Platform Telemetry</Typography>
                    <Typography variant="body2" color="text.secondary">Real-time AI-generated insights from platform activity</Typography>
                  </Box>
                </Box>

                {insightsLoading ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={40} />
                    <Typography color="text.secondary" mt={2}>Generating AI insights…</Typography>
                  </Box>
                ) : !aiInsights ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>No insights data available yet. Insights appear as bookings and reviews accumulate.</Alert>
                ) : (
                  <Grid container spacing={3}>
                    {/* CSAT Score */}
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ ...glassCard, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={1}>CSAT Score</Typography>
                        <Typography variant="h2" fontWeight={900} sx={{ color: '#22C55E', my: 1 }}>
                          {aiInsights.csat?.satisfaction_score ?? 0}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {aiInsights.csat?.average_rating ?? 0}★ avg from {aiInsights.csat?.total_reviews ?? 0} reviews
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={aiInsights.csat?.satisfaction_score ?? 0}
                          sx={{ mt: 2, height: 8, borderRadius: 4, bgcolor: 'rgba(34,197,94,0.15)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#22C55E,#4ADE80)' } }}
                        />
                      </Paper>
                    </Grid>

                    {/* Cancellation Rate */}
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ ...glassCard, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={1}>Cancellation Rate</Typography>
                        <Typography variant="h2" fontWeight={900} sx={{ color: aiInsights.cancellation_rate > 20 ? '#EF4444' : '#FFB800', my: 1 }}>
                          {aiInsights.cancellation_rate ?? 0}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {aiInsights.cancellation_rate > 20 ? '⚠️ High — investigate causes' : '✓ Within acceptable range'}
                        </Typography>
                      </Paper>
                    </Grid>

                    {/* Demand Forecast */}
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ ...glassCard }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                          <MdOutlineBarChart color="#6C47FF" size={20} />
                          <Typography variant="subtitle2" fontWeight={800}>Demand Forecast</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" mb={1.5}>
                          {aiInsights.demand_forecast?.note}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {(aiInsights.demand_forecast?.peak_days || []).map(d => (
                            <Chip key={d} label={d} size="small" sx={{ bgcolor: 'rgba(108,71,255,0.12)', color: '#6C47FF', fontWeight: 700 }} />
                          ))}
                          {(aiInsights.demand_forecast?.peak_hours || []).map(h => (
                            <Chip key={h} label={h} size="small" sx={{ bgcolor: 'rgba(255,184,0,0.12)', color: '#D97706', fontWeight: 700 }} />
                          ))}
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Top Complaint Categories */}
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ ...glassCard }}>
                        <Typography variant="subtitle2" fontWeight={800} mb={2}>🔥 Top Complaint Categories</Typography>
                        {(aiInsights.top_complaint_categories || []).length === 0 ? (
                          <Typography color="text.secondary" variant="body2">No complaints yet — great work!</Typography>
                        ) : (
                          (aiInsights.top_complaint_categories || []).map((item, i) => (
                            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                              <Typography variant="body2" fontWeight={600}>{item.category}</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, mx: 2 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min((item.count / Math.max(...(aiInsights.top_complaint_categories || []).map(x => x.count), 1)) * 100, 100)}
                                  sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: 'rgba(239,68,68,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#EF4444' } }}
                                />
                              </Box>
                              <Chip label={item.count} size="small" sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 700, minWidth: 40 }} />
                            </Box>
                          ))
                        )}
                      </Paper>
                    </Grid>

                    {/* Most Booked Services */}
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ ...glassCard }}>
                        <Typography variant="subtitle2" fontWeight={800} mb={2}>📊 Most Booked Services</Typography>
                        {(aiInsights.most_booked_services || []).length === 0 ? (
                          <Typography color="text.secondary" variant="body2">No booking data yet.</Typography>
                        ) : (
                          (aiInsights.most_booked_services || []).map((item, i) => (
                            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                              <Typography variant="body2" fontWeight={600}>{item.service}</Typography>
                              <Box sx={{ flex: 1, mx: 2 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min((item.count / Math.max(...(aiInsights.most_booked_services || []).map(x => x.count), 1)) * 100, 100)}
                                  sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(108,71,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#6C47FF' } }}
                                />
                              </Box>
                              <Chip label={item.count} size="small" sx={{ bgcolor: 'rgba(108,71,255,0.1)', color: '#6C47FF', fontWeight: 700, minWidth: 40 }} />
                            </Box>
                          ))
                        )}
                      </Paper>
                    </Grid>

                    {/* Top Workers */}
                    <Grid item xs={12}>
                      <Paper sx={{ ...glassCard }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <MdVerifiedUser color="#22C55E" size={20} />
                          <Typography variant="subtitle2" fontWeight={800}>🏆 Top Rated Workers</Typography>
                        </Box>
                        {(aiInsights.top_workers || []).length === 0 ? (
                          <Typography color="text.secondary" variant="body2">No worker data available yet.</Typography>
                        ) : (
                          <Grid container spacing={2}>
                            {(aiInsights.top_workers || []).map((w, i) => (
                              <Grid item xs={12} sm={6} md={4} key={i}>
                                <Box sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', border: '1px solid rgba(34,197,94,0.2)' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar sx={{ width: 40, height: 40, background: COLORS[i % COLORS.length] + '33', color: COLORS[i % COLORS.length], fontWeight: 800 }}>
                                      {i + 1}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="body2" fontWeight={700}>{w.name || 'Worker'}</Typography>
                                      <Typography variant="caption" color="text.secondary">{w.service}</Typography>
                                    </Box>
                                    <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                                      <Typography variant="body2" fontWeight={800} sx={{ color: '#FFB800' }}>⭐ {w.rating?.toFixed(1) ?? 0}</Typography>
                                      <Typography variant="caption" color="text.secondary">{w.jobs} jobs</Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>
                )}
              </Box>
            )}

            {/* ── Broadcast Center Tab ── */}
            {tab === 9 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'linear-gradient(135deg,#3B82F6,#60A5FA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MdNotifications color="#fff" size={20} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>Notification Broadcast Center</Typography>
                    <Typography variant="body2" color="text.secondary">Send announcements, alerts, or maintenance notices to all users</Typography>
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={7}>
                    <Paper sx={{ ...glassCard }}>
                      <Typography variant="subtitle2" fontWeight={800} mb={2}>📢 Compose Broadcast</Typography>

                      <TextField
                        fullWidth label="Notification Title" placeholder="e.g. Platform Maintenance Tonight"
                        value={broadcastForm.title}
                        onChange={e => setBroadcastForm(f => ({ ...f, title: e.target.value }))}
                        sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />

                      <TextField
                        fullWidth multiline rows={5} label="Message"
                        placeholder="Write your notification message here…"
                        value={broadcastForm.message}
                        onChange={e => setBroadcastForm(f => ({ ...f, message: e.target.value }))}
                        sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />

                      <Grid container spacing={2} mb={2}>
                        <Grid item xs={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Type</InputLabel>
                            <Select value={broadcastForm.type} label="Type"
                              onChange={e => setBroadcastForm(f => ({ ...f, type: e.target.value }))}
                              sx={{ borderRadius: 2 }}
                            >
                              <MenuItem value="announcement">📢 Announcement</MenuItem>
                              <MenuItem value="maintenance">🔧 Maintenance</MenuItem>
                              <MenuItem value="emergency">🚨 Emergency</MenuItem>
                              <MenuItem value="promotion">🎁 Promotion</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Target Audience</InputLabel>
                            <Select value={broadcastForm.target} label="Target Audience"
                              onChange={e => setBroadcastForm(f => ({ ...f, target: e.target.value }))}
                              sx={{ borderRadius: 2 }}
                            >
                              <MenuItem value="all">👥 All Users</MenuItem>
                              <MenuItem value="customers">🧑 Customers Only</MenuItem>
                              <MenuItem value="workers">👷 Workers Only</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>

                      <Button
                        fullWidth variant="contained" size="large"
                        onClick={handleBroadcast}
                        disabled={broadcastSending || !broadcastForm.title.trim() || !broadcastForm.message.trim()}
                        startIcon={broadcastSending ? <CircularProgress size={18} color="inherit" /> : <MdSend />}
                        sx={{
                          py: 1.5, fontWeight: 800, borderRadius: 2.5,
                          background: 'linear-gradient(135deg,#3B82F6,#60A5FA)',
                          '&:hover': { background: 'linear-gradient(135deg,#2563EB,#3B82F6)' }
                        }}
                      >
                        {broadcastSending ? 'Sending…' : '📨 Send Broadcast'}
                      </Button>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={5}>
                    <Paper sx={{ ...glassCard }}>
                      <Typography variant="subtitle2" fontWeight={800} mb={2}>📋 Broadcast Guidelines</Typography>
                      {[
                        { icon: '✅', title: 'Announcements', desc: 'Platform updates, new features, policy changes' },
                        { icon: '🔧', title: 'Maintenance', desc: 'Scheduled downtime or service interruptions' },
                        { icon: '🚨', title: 'Emergency', desc: 'Critical alerts — use sparingly' },
                        { icon: '🎁', title: 'Promotions', desc: 'Special offers, cashback events, seasonal deals' },
                      ].map((item) => (
                        <Box key={item.title} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                          <Typography fontSize={20}>{item.icon}</Typography>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>{item.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Paper>

                    <Paper sx={{ ...glassCard, mt: 2 }}>
                      <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Preview</Typography>
                      {broadcastForm.title ? (
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(59,130,246,0.1)' : '#EFF6FF', border: '1px solid rgba(59,130,246,0.2)' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <MdNotifications size={16} color="#3B82F6" />
                            <Typography variant="body2" fontWeight={800} sx={{ color: '#3B82F6' }}>{broadcastForm.title}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {broadcastForm.message || 'Your message will appear here…'}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', gap: 0.75 }}>
                            <Chip label={broadcastForm.type} size="small" sx={{ bgcolor: 'rgba(59,130,246,0.15)', color: '#3B82F6', fontWeight: 700, fontSize: 10 }} />
                            <Chip label={`→ ${broadcastForm.target}`} size="small" sx={{ bgcolor: 'rgba(108,71,255,0.1)', color: '#6C47FF', fontWeight: 700, fontSize: 10 }} />
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Fill in the form to preview your broadcast.</Typography>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* ── BI Dashboard Tab (Phase 17) ── */}
            {tab === 10 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={900}>📊 Business Intelligence Dashboard</Typography>
                    <Typography variant="body2" color="text.secondary">Real-time analytics from MongoDB — Phase 17</Typography>
                  </Box>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={aiForecastLoading ? <CircularProgress size={14} color="inherit" /> : <MdAutoAwesome size={16} />}
                    disabled={aiForecastLoading}
                    onClick={async () => {
                      setAiForecastLoading(true)
                      try {
                        const forecast = await getAIForecast().catch(() => null)
                        setBiData(prev => ({ ...prev, aiForecast: forecast }))
                      } finally { setAiForecastLoading(false) }
                    }}
                    sx={{ borderRadius: 2.5, fontWeight: 700, background: 'linear-gradient(135deg,#6C47FF,#9B72FF)', fontSize: 12 }}
                  >
                    {aiForecastLoading ? 'Generating…' : 'AI Forecast'}
                  </Button>
                </Box>

                {biLoading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

                {/* AI Forecast Panel */}
                {biData.aiForecast && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, mb: 3, background: isDark ? 'rgba(108,71,255,0.1)' : 'rgba(108,71,255,0.06)', border: '1px solid rgba(108,71,255,0.2)' }}>
                      <Typography variant="subtitle1" fontWeight={900} color="primary" mb={2}>
                        <MdAutoAwesome size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        AI Business Intelligence Report
                        {biData.aiForecast.fallback && <Chip label="Fallback" size="small" sx={{ ml: 1, fontSize: 9 }} />}
                      </Typography>
                      <Grid container spacing={2}>
                        {/* Revenue Forecast */}
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center', border: '1px solid rgba(108,71,255,0.15)' }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" display="block">Revenue Forecast</Typography>
                            <Typography variant="h6" fontWeight={900} color="primary">
                              ₹{(biData.aiForecast.revenue_forecast?.next_month_prediction || 0).toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Next Month</Typography>
                            <Chip label={biData.aiForecast.revenue_forecast?.trend || 'stable'} size="small"
                              sx={{ mt: 1, display: 'block', mx: 'auto', width: 'fit-content', fontWeight: 700,
                                bgcolor: biData.aiForecast.revenue_forecast?.trend === 'growing' ? '#10B98122' : '#FFB80022',
                                color: biData.aiForecast.revenue_forecast?.trend === 'growing' ? '#10B981' : '#FFB800' }} />
                          </Paper>
                        </Grid>
                        {/* Health Score */}
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center', border: '1px solid rgba(108,71,255,0.15)' }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" display="block">Business Health</Typography>
                            <Typography variant="h3" fontWeight={900} sx={{ color: '#22C55E' }}>
                              {biData.aiForecast.business_health?.score || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">/ 100</Typography>
                            <Chip label={biData.aiForecast.business_health?.status || 'Good'} size="small"
                              sx={{ mt: 1, display: 'block', mx: 'auto', width: 'fit-content', fontWeight: 700, bgcolor: '#22C55E22', color: '#22C55E' }} />
                          </Paper>
                        </Grid>
                        {/* Demand Forecast */}
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(108,71,255,0.15)' }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>Peak Demand</Typography>
                            <Typography variant="caption" fontWeight={600}>{biData.aiForecast.demand_forecast?.peak_hours}</Typography>
                            <Box sx={{ mt: 0.5 }}>
                              {(biData.aiForecast.demand_forecast?.peak_services || []).map(s => (
                                <Chip key={s} label={s} size="small" sx={{ mr: 0.5, mt: 0.5, fontSize: 9, fontWeight: 700, bgcolor: '#3B82F622', color: '#3B82F6' }} />
                              ))}
                            </Box>
                          </Paper>
                        </Grid>
                        {/* Action Items */}
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(108,71,255,0.15)' }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>Action Items</Typography>
                            {(biData.aiForecast.business_health?.action_items || []).map((item, i) => (
                              <Typography key={i} variant="caption" display="block" sx={{ fontSize: 10, mb: 0.5 }}>
                                {i + 1}. {item}
                              </Typography>
                            ))}
                          </Paper>
                        </Grid>
                      </Grid>
                      <Typography variant="caption" color="text.secondary" mt={1} display="block">
                        {biData.aiForecast.revenue_forecast?.insight}
                      </Typography>
                    </Paper>
                  </motion.div>
                )}

                <Grid container spacing={3}>
                  {/* Daily Revenue */}
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                      <Typography variant="subtitle1" fontWeight={800} mb={2}>Daily Revenue (Last 30 Days)</Typography>
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={biData.daily} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <defs>
                            <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#6C47FF" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d?.slice(5)} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                          <RTooltip formatter={(v) => [`₹${v.toFixed(2)}`, 'Revenue']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                          <Area type="monotone" dataKey="revenue" stroke="#6C47FF" strokeWidth={2.5} fill="url(#dailyGrad)" name="Revenue" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>

                  {/* Peak Hours */}
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                      <Typography variant="subtitle1" fontWeight={800} mb={2}>Peak Hours</Typography>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={biData.peakHours.filter(h => h.bookings > 0)} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                          <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <RTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                          <Bar dataKey="bookings" fill="#FFB800" radius={[4, 4, 0, 0]} name="Bookings" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>

                  {/* Monthly Revenue */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                      <Typography variant="subtitle1" fontWeight={800} mb={2}>Monthly Revenue</Typography>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                          <RTooltip formatter={(v) => [`₹${v.toFixed(2)}`, 'Revenue']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                          <Legend />
                          <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Revenue" />
                          <Bar dataKey="commission" fill="#6C47FF" radius={[4, 4, 0, 0]} name="Commission" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>

                  {/* Yearly Revenue */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                      <Typography variant="subtitle1" fontWeight={800} mb={2}>Yearly Revenue</Typography>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={biData.yearly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                          <RTooltip formatter={(v) => [`₹${v.toFixed(2)}`, 'Revenue']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                          <Legend />
                          <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 4 }} name="Revenue" />
                          <Line type="monotone" dataKey="profit" stroke="#6C47FF" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#6C47FF', r: 3 }} name="Profit" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>

                  {/* Customer Growth */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                      <Typography variant="subtitle1" fontWeight={800} mb={2}>Customer Growth</Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={biData.customerGrowth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <defs>
                            <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <RTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                          <Area type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2.5} fill="url(#custGrad)" name="New Customers" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>

                  {/* Worker Growth */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                      <Typography variant="subtitle1" fontWeight={800} mb={2}>Worker Growth</Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={biData.workerGrowth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <RTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                          <Line type="monotone" dataKey="count" stroke="#FFB800" strokeWidth={2.5} dot={{ fill: '#FFB800', r: 4 }} name="New Workers" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>

                  {/* Top Workers */}
                  <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                      <Typography variant="subtitle1" fontWeight={800} mb={2}>Top Workers by Completed Bookings</Typography>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={biData.topWorkers.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
                          <RTooltip formatter={(v, n, p) => [v, n]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                          <Bar dataKey="bookings" fill="#6C47FF" radius={[0, 4, 4, 0]} name="Completed Bookings">
                            {biData.topWorkers.slice(0, 8).map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>

                  {/* Complaint Analysis */}
                  <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                      <Typography variant="subtitle1" fontWeight={800} mb={2}>Complaint Analysis</Typography>
                      {biData.complaintAnalysis ? (
                        <ResponsiveContainer width="100%" height={240}>
                          <PieChart>
                            <Pie
                              data={biData.complaintAnalysis.by_category}
                              dataKey="count" nameKey="category"
                              cx="50%" cy="50%" outerRadius={80} paddingAngle={3}
                              label={({ category, percent }) => `${category?.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {(biData.complaintAnalysis.by_category || []).map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                              ))}
                            </Pie>
                            <RTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography color="text.secondary">No complaint data</Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Top Services */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                      <Typography variant="subtitle1" fontWeight={800} mb={2}>Top Services by Bookings & Revenue</Typography>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={biData.topServices.slice(0, 8)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                          <XAxis dataKey="service" tick={{ fontSize: 10 }} />
                          <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                          <RTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                          <Legend />
                          <Bar yAxisId="left" dataKey="bookings" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Bookings" />
                          <Bar yAxisId="right" dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} name="Revenue (₹)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

          </Box>
        </Paper>
      </Container>

      {/* ── Reply to Review Dialog ── */}
      <Dialog open={replyDialog.open} onClose={() => setReplyDialog({ open: false, reviewId: null, text: '' })} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <MdVerified color="#6C47FF" size={20} />
            Reply as OneDW Team
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Your reply will appear with a verified "OneDW Team" badge visible to all customers.
          </Typography>
          <TextField
            fullWidth multiline rows={4}
            placeholder="Thank you for your valuable feedback. We appreciate your support and are continuously working to improve our services."
            value={replyDialog.text}
            onChange={e => setReplyDialog(d => ({ ...d, text: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setReplyDialog({ open: false, reviewId: null, text: '' })} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSendReply}
            disabled={!replyDialog.text.trim()}
            startIcon={<MdSend />}
            sx={{ borderRadius: 2, fontWeight: 700, background: 'linear-gradient(135deg,#6C47FF,#9B72FF)' }}
          >
            Post Reply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
