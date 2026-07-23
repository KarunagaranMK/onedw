import { useState, useEffect } from 'react'
import {
  Container, Typography, Box, Grid, Paper, CircularProgress,
  Alert, Table, TableBody, TableCell, TableHead, TableRow, Chip, Avatar, Divider,
} from '@mui/material'
import { motion } from 'framer-motion'
import { MdPeople, MdWork, MdBookOnline, MdTrendingUp, MdVerified } from 'react-icons/md'
import { getPlatformStats } from '../services/aiService'
import { useAuth } from '../hooks/useAuth'

const StatCard = ({ icon: Icon, label, value, color, trend }) => (
  <motion.div whileHover={{ y: -6 }}>
    <Paper
      sx={{
        p: 3, borderRadius: 3,
        border: `1px solid ${color}22`,
        boxShadow: `0 4px 24px ${color}18`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
    >
      <Box
        sx={{
          position: 'absolute', top: -20, right: -20, width: 80, height: 80,
          borderRadius: '50%', background: `${color}12`,
        }}
      />
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.8}>
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={900} color={color} mt={0.5}>
            {value}
          </Typography>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mt: 0.5 }}>
              <MdTrendingUp color="#10b981" size={14} />
              <Typography variant="caption" color="#10b981">{trend}</Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            width: 52, height: 52, borderRadius: 2,
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 20px ${color}44`,
          }}
        >
          <Icon color="white" size={26} />
        </Box>
      </Box>
    </Paper>
  </motion.div>
)

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getPlatformStats()
        setStats(data)
      } catch (err) {
        setError('Failed to load platform statistics.')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={48} />
        <Typography color="text.secondary">Loading platform statistics...</Typography>
      </Box>
    )
  }

  const statCards = stats ? [
    { icon: MdPeople, label: 'Total Users', value: stats.total_users, color: '#6366f1', trend: '+12% this month' },
    { icon: MdWork, label: 'Registered Workers', value: stats.total_workers, color: '#0ea5e9', trend: '+8% this week' },
    { icon: MdPeople, label: 'Customers', value: stats.total_customers, color: '#8b5cf6', trend: '+15% this week' },
    { icon: MdBookOnline, label: 'Total Bookings', value: stats.total_bookings, color: '#10b981', trend: '+22% this month' },
    { icon: MdVerified, label: 'Completed Bookings', value: stats.completed_bookings, color: '#f59e0b', trend: '87% success rate' },
    { icon: MdTrendingUp, label: 'Pending Requests', value: stats.pending_requests, color: '#ef4444' },
  ] : []

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar
              sx={{ width: 52, height: 52, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontWeight: 800 }}
            >
              A
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={900}>
                Admin Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Platform overview — all users, workers, bookings, and revenue metrics
              </Typography>
            </Box>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Stats Grid */}
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
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.15)' }}>
              <Typography variant="h6" fontWeight={700} mb={2}>🏥 Platform Health</Typography>
              {stats && [
                ['Total Service Requests', stats.total_requests],
                ['Pending Requests', stats.pending_requests],
                ['Active Bookings', stats.total_bookings - stats.completed_bookings],
                ['Completed Bookings', stats.completed_bookings],
                ['Completion Rate', stats.total_bookings ? `${Math.round((stats.completed_bookings / stats.total_bookings) * 100)}%` : 'N/A'],
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="body2" fontWeight={700}>{value}</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>

          {/* Collections Summary */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.15)' }}>
              <Typography variant="h6" fontWeight={700} mb={2}>🗄️ MongoDB Collections</Typography>
              {[
                { name: 'users', count: stats?.total_users, color: '#6366f1' },
                { name: 'workers', count: stats?.total_workers, color: '#0ea5e9' },
                { name: 'requests', count: stats?.total_requests, color: '#8b5cf6' },
                { name: 'bookings', count: stats?.total_bookings, color: '#10b981' },
                { name: 'ratings', count: '—', color: '#f59e0b' },
                { name: 'notifications', count: '—', color: '#ef4444' },
              ].map((col) => (
                <Box key={col.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                    <Typography variant="body2" fontFamily="monospace">{col.name}</Typography>
                  </Box>
                  <Chip label={col.count ?? '—'} size="small" sx={{ background: `${col.color}22`, color: col.color, fontWeight: 700 }} />
                </Box>
              ))}
            </Paper>
          </Grid>

          {/* System Info */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.15)', background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(139,92,246,0.04))' }}>
              <Typography variant="h6" fontWeight={700} mb={2}>⚙️ System Information</Typography>
              <Grid container spacing={2}>
                {[
                  ['Stack', 'FastAPI + Motor + MongoDB Atlas'],
                  ['AI Engine', 'Google Gemini 1.5 Flash'],
                  ['Maps', 'OpenStreetMap + React Leaflet'],
                  ['Auth', 'JWT (HS256)'],
                  ['Frontend', 'React 18 + Vite + MUI'],
                  ['Environment', 'Development'],
                ].map(([key, val]) => (
                  <Grid item xs={12} sm={6} md={4} key={key}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">{key}</Typography>
                      <Typography variant="body2" fontWeight={600}>{val}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  )
}

export default AdminDashboard
