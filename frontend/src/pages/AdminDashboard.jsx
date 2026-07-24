import { useState, useEffect } from 'react'
import {
  Container, Typography, Box, Grid, Paper, CircularProgress,
  Alert, Chip, Avatar, useTheme, Button,
} from '@mui/material'
import { motion } from 'framer-motion'
import { MdPeople, MdWork, MdBookOnline, MdTrendingUp, MdVerified, MdLogout } from 'react-icons/md'
import { getAdminStats } from '../services/aiService'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const StatCard = ({ icon: Icon, label, value, color, gradient, trend, delay = 0 }) => (
  <motion.div whileHover={{ y: -6 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}>
    <Paper sx={{
      p: 3, borderRadius: 3,
      border: `1px solid ${color}22`,
      boxShadow: `0 4px 24px ${color}18`,
      position: 'relative', overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:hover': { boxShadow: `0 12px 36px ${color}28` },
    }}>
      <Box sx={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `${color}12` }} />
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.8}>
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={900} color={color} mt={0.5}>{value ?? '—'}</Typography>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mt: 0.5 }}>
              <MdTrendingUp color="#00D4AA" size={14} />
              <Typography variant="caption" color="#00D4AA">{trend}</Typography>
            </Box>
          )}
        </Box>
        <Box sx={{
          width: 52, height: 52, borderRadius: 2,
          background: gradient || `linear-gradient(135deg,${color},${color}cc)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 8px 20px ${color}44`,
        }}>
          <Icon color="white" size={26} />
        </Box>
      </Box>
    </Paper>
  </motion.div>
)

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminStats()
        setStats(data)
      } catch {
        setError('Failed to load platform statistics.')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
      <CircularProgress size={48} thickness={3} />
      <Typography color="text.secondary" fontWeight={500}>Loading platform data…</Typography>
    </Box>
  )

  const statCards = stats ? [
    { icon: MdPeople,    label: 'Total Users',       value: stats.total_users     || 0, color: '#6C47FF', gradient: 'linear-gradient(135deg,#6C47FF,#9B72FF)', trend: 'All registered', delay: 0 },
    { icon: MdWork,      label: 'Professionals',     value: stats.total_workers   || 0, color: '#00D4AA', gradient: 'linear-gradient(135deg,#00D4AA,#00B894)', trend: 'Verified workers', delay: 0.06 },
    { icon: MdPeople,    label: 'Customers',         value: stats.total_customers || 0, color: '#3B82F6', gradient: 'linear-gradient(135deg,#3B82F6,#60A5FA)', trend: 'Active customers', delay: 0.12 },
    { icon: MdBookOnline,label: 'Total Bookings',    value: stats.total_bookings  || 0, color: '#FFB800', gradient: 'linear-gradient(135deg,#FFB800,#FFD54F)', trend: 'All time', delay: 0.18 },
    { icon: MdVerified,  label: 'Completed Jobs',    value: stats.completed_bookings || 0, color: '#22C55E', gradient: 'linear-gradient(135deg,#22C55E,#4ADE80)', trend: 'Successful', delay: 0.24 },
    { icon: MdTrendingUp,label: 'Pending Requests',  value: stats.pending_requests || 0, color: '#FF6B6B', gradient: 'linear-gradient(135deg,#FF6B6B,#FF8E8E)', trend: 'Awaiting workers', delay: 0.30 },
  ] : []


  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Dark hero header */}
      <Box sx={{
        background: isDark ? 'linear-gradient(135deg,#080812,#1a1740)' : 'linear-gradient(135deg,#0f0c29,#302b63)',
        pt: { xs: 4, md: 6 }, pb: { xs: 8, md: 10 },
      }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{
                  width: 56, height: 56, fontSize: 22, fontWeight: 900,
                  background: 'linear-gradient(135deg,#6C47FF,#9B72FF)',
                  border: '3px solid rgba(255,255,255,0.15)',
                }}>A</Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={900} sx={{ color: '#fff', letterSpacing: '-0.02em' }}>Admin Dashboard</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)' }}>Platform overview — users, workers, bookings &amp; metrics</Typography>
                </Box>
              </Box>
              <Button variant="outlined" size="small" startIcon={<MdLogout />}
                onClick={() => { logout(); navigate('/') }}
                sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff', borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                Logout
              </Button>
            </Box>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: '-48px', pb: 6, position: 'relative', zIndex: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Stats */}
        <Grid container spacing={2.5} mb={4}>
          {statCards.map((card) => (
            <Grid item xs={12} sm={6} md={4} key={card.label}>
              <StatCard {...card} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Platform Health */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(108,71,255,0.12)', height: '100%' }}>
              <Typography variant="h6" fontWeight={800} mb={2}>🏥 Platform Health</Typography>
              {stats && [
                ['Total Service Requests', stats.total_requests],
                ['Pending Requests',       stats.pending_requests],
                ['Active Bookings',        (stats.total_bookings || 0) - (stats.completed_bookings || 0)],
                ['Completed Bookings',     stats.completed_bookings],
                ['Completion Rate',        stats.total_bookings ? `${Math.round((stats.completed_bookings / stats.total_bookings) * 100)}%` : 'N/A'],
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2, borderBottom: '1px solid rgba(108,71,255,0.06)' }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="body2" fontWeight={800}>{value ?? '—'}</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>

          {/* Collections */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(108,71,255,0.12)', height: '100%' }}>
              <Typography variant="h6" fontWeight={800} mb={2}>🗄️ MongoDB Collections</Typography>
              {[
                { name: 'users',         count: stats?.total_users,    color: '#6C47FF' },
                { name: 'workers',       count: stats?.total_workers,  color: '#00D4AA' },
                { name: 'requests',      count: stats?.total_requests, color: '#3B82F6' },
                { name: 'bookings',      count: stats?.total_bookings, color: '#FFB800' },
                { name: 'ratings',       count: '—',                   color: '#22C55E' },
                { name: 'notifications', count: '—',                   color: '#FF6B6B' },
              ].map((col) => (
                <Box key={col.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2, borderBottom: '1px solid rgba(108,71,255,0.06)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: col.color, boxShadow: `0 0 6px ${col.color}60` }} />
                    <Typography variant="body2" fontFamily="'Fira Code', monospace" sx={{ fontSize: 13 }}>{col.name}</Typography>
                  </Box>
                  <Chip label={col.count ?? '—'} size="small" sx={{ background: `${col.color}18`, color: col.color, fontWeight: 800, minWidth: 44 }} />
                </Box>
              ))}
            </Paper>
          </Grid>

          {/* System Info */}
          <Grid item xs={12}>
            <Paper sx={{
              p: 3, borderRadius: 3,
              border: '1px solid rgba(108,71,255,0.12)',
              background: 'linear-gradient(135deg,rgba(108,71,255,0.04),rgba(0,212,170,0.03))',
            }}>
              <Typography variant="h6" fontWeight={800} mb={2}>⚙️ System Information</Typography>
              <Grid container spacing={2}>
                {[
                  ['Stack',       'FastAPI + Motor + MongoDB Atlas'],
                  ['AI Engine',   'Google Gemini 1.5 Flash'],
                  ['Maps',        'OpenStreetMap + React Leaflet'],
                  ['Auth',        'JWT (HS256)'],
                  ['Frontend',    'React 18 + Vite + MUI v5'],
                  ['Environment', 'Development'],
                ].map(([key, val]) => (
                  <Grid item xs={12} sm={6} md={4} key={key}>
                    <Box sx={{ p: 1.5, bgcolor: 'rgba(108,71,255,0.04)', borderRadius: 2, border: '1px solid rgba(108,71,255,0.08)' }}>
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>{key}</Typography>
                      <Typography variant="body2" fontWeight={700}>{val}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export default AdminDashboard
