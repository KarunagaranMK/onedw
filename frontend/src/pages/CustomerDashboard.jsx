import { useState, useEffect } from 'react'
import {
  Container, Typography, Box, Grid, Paper, Button, CircularProgress,
  Alert, Chip, Avatar, Divider, useTheme,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  MdAdd, MdArrowForward, MdSearch, MdLogout,
  MdCheckCircle, MdHistory, MdPending, MdWork,
} from 'react-icons/md'
import { getMyRequests } from '../services/requestService'
import { getMyBookings } from '../services/bookingService'
import { useAuth } from '../hooks/useAuth'
import BookingStepper from '../components/common/BookingStepper'

const STATUS_CONFIG = {
  pending:          { color: '#FFB800', bg: 'rgba(255,184,0,0.1)',     label: '⏳ Pending' },
  accepted:         { color: '#6C47FF', bg: 'rgba(108,71,255,0.1)',    label: '✅ Accepted' },
  worker_on_the_way:{ color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',    label: '🚗 On Way' },
  arrived:          { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)',    label: '📍 Arrived' },
  started:          { color: '#00D4AA', bg: 'rgba(0,212,170,0.1)',     label: '🔧 Started' },
  completed:        { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',     label: '✔ Done' },
  cancelled:        { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',     label: '✗ Cancelled' },
}

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { color: '#6B7280', bg: 'rgba(107,114,128,0.1)', label: status }
  return (
    <Box sx={{
      px: 1.5, py: 0.4, borderRadius: 2, fontSize: 11, fontWeight: 700,
      bgcolor: cfg.bg, color: cfg.color, whiteSpace: 'nowrap',
    }}>
      {cfg.label.replace(/_/g, ' ')}
    </Box>
  )
}

const StatCard = ({ icon, label, value, color, gradient, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ y: -4, scale: 1.02 }}
  >
    <Paper sx={{
      p: 3, borderRadius: 3, position: 'relative', overflow: 'hidden',
      border: `1px solid ${color}22`,
      boxShadow: `0 4px 20px ${color}12`,
    }}>
      {/* background glow */}
      <Box sx={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: gradient, opacity: 0.15,
      }} />
      <Box sx={{
        width: 44, height: 44, borderRadius: 2.5, mb: 1.5,
        background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, boxShadow: `0 4px 12px ${color}30`,
      }}>
        {icon}
      </Box>
      <Typography variant="h4" fontWeight={900} sx={{ color, lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mt: 0.5, display: 'block' }}>
        {label}
      </Typography>
    </Paper>
  </motion.div>
)

export default function CustomerDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [requests, setRequests] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      try { const r = await getMyRequests(); setRequests(Array.isArray(r) ? r : []) } catch { setError('Failed to load requests.') }
      try { const b = await getMyBookings(); setBookings(Array.isArray(b) ? b : []) } catch { setBookings([]) }
      setLoading(false)
    }
    fetchAll()
  }, [])

  const activeBooking = bookings.find((b) => ['accepted', 'worker_on_the_way', 'arrived', 'started'].includes(b.status))
  const completed = bookings.filter((b) => b.status === 'completed').length
  const pending = requests.filter((r) => r.status === 'pending').length

  const STATS = [
    { icon: '📋', label: 'Total Requests', value: requests.length, color: '#6C47FF', gradient: 'linear-gradient(135deg,#6C47FF,#9B72FF)', delay: 0 },
    { icon: '🔧', label: 'Active Booking', value: activeBooking ? 1 : 0, color: '#3B82F6', gradient: 'linear-gradient(135deg,#3B82F6,#60A5FA)', delay: 0.08 },
    { icon: '✅', label: 'Completed', value: completed, color: '#22C55E', gradient: 'linear-gradient(135deg,#22C55E,#4ADE80)', delay: 0.16 },
    { icon: '⏳', label: 'Pending', value: pending, color: '#FFB800', gradient: 'linear-gradient(135deg,#FFB800,#FFD54F)', delay: 0.24 },
  ]

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', flexDirection: 'column', gap: 2 }}>
      <CircularProgress size={48} thickness={3} />
      <Typography color="text.secondary" fontWeight={500}>Loading your dashboard…</Typography>
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero header bar */}
      <Box sx={{
        background: isDark
          ? 'linear-gradient(135deg, #0f0c29, #1a1740)'
          : 'linear-gradient(135deg, #0f0c29, #302b63)',
        pt: { xs: 4, md: 6 }, pb: { xs: 8, md: 10 }, px: { xs: 2, md: 4 },
      }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
                <Avatar sx={{
                  width: 56, height: 56, fontSize: 22, fontWeight: 900,
                  background: 'linear-gradient(135deg,#6C47FF,#9B72FF)',
                  border: '3px solid rgba(255,255,255,0.15)',
                }}>
                  {(user?.name || 'U')[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={900} sx={{ color: '#fff', letterSpacing: '-0.01em' }}>
                    Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<MdAdd />}
                  onClick={() => navigate('/create-request')}
                  sx={{ borderRadius: 2.5, fontWeight: 800, background: 'linear-gradient(135deg,#6C47FF,#9B72FF)', px: 3 }}
                >
                  New Request
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<MdSearch />}
                  onClick={() => navigate('/workers')}
                  sx={{ borderRadius: 2.5, fontWeight: 700, borderColor: 'rgba(255,255,255,0.3)', color: '#fff', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
                >
                  Find Workers
                </Button>
                <Button
                  variant="text"
                  startIcon={<MdLogout />}
                  onClick={() => { logout(); navigate('/') }}
                  sx={{ borderRadius: 2.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}
                >
                  Logout
                </Button>
              </Box>
            </Box>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: '-40px', pb: 6, position: 'relative', zIndex: 2 }}>
        {error && <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {STATS.map((s) => (
            <Grid item xs={6} sm={3} key={s.label}>
              <StatCard {...s} />
            </Grid>
          ))}
        </Grid>

        {/* Active Booking Tracker */}
        {activeBooking && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Paper sx={{
              p: 3, mb: 3, borderRadius: 3,
              border: '2px solid rgba(108,71,255,0.25)',
              background: isDark
                ? 'linear-gradient(135deg,rgba(108,71,255,0.06),rgba(0,212,170,0.04))'
                : 'linear-gradient(135deg,rgba(108,71,255,0.04),rgba(0,212,170,0.03))',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#00D4AA', boxShadow: '0 0 8px rgba(0,212,170,0.6)', animation: 'pulse 1.5s infinite' }} />
                  <Typography variant="h6" fontWeight={800}>Live Booking Tracker</Typography>
                </Box>
                <Button
                  endIcon={<MdArrowForward />}
                  size="small"
                  onClick={() => navigate(`/booking/${activeBooking.id}`)}
                  sx={{ borderRadius: 2, fontWeight: 700, color: 'primary.main' }}
                >
                  View Details
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2.5}>
                <strong>{activeBooking.service_type}</strong> · {activeBooking.location}
                {activeBooking.worker_name && ` · 👷 ${activeBooking.worker_name}`}
              </Typography>
              <BookingStepper status={activeBooking.status} />
            </Paper>
          </motion.div>
        )}

        <Grid container spacing={3}>
          {/* My Requests */}
          <Grid item xs={12} md={6}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,71,255,0.1)'}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MdPending color="#6C47FF" size={20} />
                    <Typography variant="h6" fontWeight={800}>My Requests</Typography>
                  </Box>
                  <Chip label={requests.length} size="small" sx={{ bgcolor: 'rgba(108,71,255,0.1)', color: '#6C47FF', fontWeight: 800 }} />
                </Box>

                {requests.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography fontSize={40} mb={1}>📋</Typography>
                    <Typography color="text.secondary" fontSize={14} mb={2}>No service requests yet.</Typography>
                    <Button variant="outlined" onClick={() => navigate('/create-request')} startIcon={<MdAdd />} sx={{ borderRadius: 2, fontWeight: 700 }}>
                      Create Request
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: 340, overflowY: 'auto', pr: 0.5,
                    '&::-webkit-scrollbar': { width: 4 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(108,71,255,0.3)', borderRadius: 4 },
                  }}>
                    {requests.slice(0, 10).map((req, i) => (
                      <motion.div key={req.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                        <Box sx={{
                          p: 2, mb: 1.5, borderRadius: 2.5,
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          '&:hover': { borderColor: 'rgba(108,71,255,0.25)', bgcolor: 'rgba(108,71,255,0.03)' },
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                        }}>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>{req.service_type}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {req.location} · {req.preferred_date}
                            </Typography>
                          </Box>
                          <StatusBadge status={req.status} />
                        </Box>
                      </motion.div>
                    ))}
                  </Box>
                )}
              </Paper>
            </motion.div>
          </Grid>

          {/* Booking History */}
          <Grid item xs={12} md={6}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,71,255,0.1)'}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MdHistory color="#00D4AA" size={20} />
                    <Typography variant="h6" fontWeight={800}>Booking History</Typography>
                  </Box>
                  <Chip label={bookings.length} size="small" sx={{ bgcolor: 'rgba(0,212,170,0.1)', color: '#00D4AA', fontWeight: 800 }} />
                </Box>

                {bookings.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography fontSize={40} mb={1}>📅</Typography>
                    <Typography color="text.secondary" fontSize={14}>No bookings yet. Start by booking a service!</Typography>
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: 340, overflowY: 'auto', pr: 0.5,
                    '&::-webkit-scrollbar': { width: 4 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,212,170,0.3)', borderRadius: 4 },
                  }}>
                    {bookings.map((b, i) => (
                      <motion.div key={b.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                        <Box
                          onClick={() => navigate(`/booking/${b.id}`)}
                          sx={{
                            p: 2, mb: 1.5, borderRadius: 2.5, cursor: 'pointer',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            '&:hover': { borderColor: 'rgba(0,212,170,0.3)', bgcolor: 'rgba(0,212,170,0.03)' },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6C47FF,#9B72FF)', fontSize: 14, fontWeight: 800 }}>
                              {(b.worker_name || 'W')[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>{b.service_type}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {b.worker_name || 'Worker'} · {b.preferred_date}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StatusBadge status={b.status} />
                            <MdArrowForward size={16} color="#9CA3AF" />
                          </Box>
                        </Box>
                      </motion.div>
                    ))}
                  </Box>
                )}
              </Paper>
            </motion.div>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,71,255,0.1)'}` }}>
                <Typography variant="h6" fontWeight={800} mb={2.5}>⚡ Quick Actions</Typography>
                <Grid container spacing={2}>
                  {[
                    { icon: '🔧', label: 'Book a Service', sub: 'Browse professionals', color: '#6C47FF', onClick: () => navigate('/workers') },
                    { icon: '📋', label: 'New Request', sub: 'Describe your need', color: '#00D4AA', onClick: () => navigate('/create-request') },
                    { icon: '📅', label: 'View Bookings', sub: 'Track your bookings', color: '#FFB800', onClick: () => bookings[0] && navigate(`/booking/${bookings[0].id}`) },
                    { icon: '💬', label: 'Get Support', sub: 'We\'re here to help', color: '#FF6B6B', onClick: () => navigate('/contact') },
                  ].map((action) => (
                    <Grid item xs={6} sm={3} key={action.label}>
                      <Box
                        onClick={action.onClick}
                        sx={{
                          p: 2.5, borderRadius: 3, cursor: 'pointer', textAlign: 'center',
                          border: `1px solid ${action.color}22`,
                          '&:hover': { bgcolor: `${action.color}08`, borderColor: `${action.color}44`, transform: 'translateY(-3px)' },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Typography fontSize={28} mb={1}>{action.icon}</Typography>
                        <Typography variant="body2" fontWeight={800} sx={{ color: action.color }}>{action.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{action.sub}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
