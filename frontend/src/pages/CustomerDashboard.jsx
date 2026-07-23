import { useState, useEffect } from 'react'
import {
  Container, Typography, Box, Grid, Paper, Button, CircularProgress,
  Alert, Chip, Avatar, Divider, Card, CardContent, CardActions,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MdAdd, MdHistory, MdWork, MdNotifications, MdArrowForward, MdStar } from 'react-icons/md'
import { getMyRequests } from '../services/requestService'
import { getMyBookings } from '../services/bookingService'
import { useAuth } from '../hooks/useAuth'
import BookingStepper from '../components/common/BookingStepper'

const StatusChip = ({ status }) => {
  const colorMap = {
    pending: 'warning',
    accepted: 'primary',
    worker_on_the_way: 'info',
    started: 'secondary',
    completed: 'success',
    cancelled: 'error',
  }
  return (
    <Chip
      label={status?.replace(/_/g, ' ')}
      color={colorMap[status] || 'default'}
      size="small"
      sx={{ textTransform: 'capitalize' }}
    />
  )
}

const CustomerDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [reqs, books] = await Promise.all([getMyRequests(), getMyBookings()])
        setRequests(reqs)
        setBookings(books)
      } catch (err) {
        setError('Failed to load your data.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const activeBooking = bookings.find((b) =>
    ['accepted', 'worker_on_the_way', 'started'].includes(b.status)
  )

  const stats = [
    { label: 'Total Requests', value: requests.length, color: '#6366f1', icon: '📋' },
    { label: 'Active Booking', value: activeBooking ? '1' : '0', color: '#0ea5e9', icon: '🔧' },
    { label: 'Completed Jobs', value: bookings.filter((b) => b.status === 'completed').length, color: '#10b981', icon: '✅' },
    { label: 'Pending', value: requests.filter((r) => r.status === 'pending').length, color: '#f59e0b', icon: '⏳' },
  ]

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={48} />
        <Typography color="text.secondary">Loading your dashboard...</Typography>
      </Box>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800}>
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your home services hub — manage requests, track bookings, and more.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<MdAdd />}
              onClick={() => navigate('/create-request')}
              sx={{
                borderRadius: 2, fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' },
              }}
            >
              New Request
            </Button>
            <Button variant="outlined" onClick={logout} sx={{ borderRadius: 2 }}>
              Logout
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Stats Cards */}
        <Grid container spacing={2} mb={3}>
          {stats.map((stat) => (
            <Grid item xs={6} sm={3} key={stat.label}>
              <motion.div whileHover={{ y: -4 }}>
                <Paper
                  sx={{
                    p: 2.5, borderRadius: 3, textAlign: 'center',
                    border: `1px solid ${stat.color}22`,
                    boxShadow: `0 4px 16px ${stat.color}15`,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Typography variant="h2" sx={{ fontSize: 28, mb: 0.5 }}>{stat.icon}</Typography>
                  <Typography variant="h4" fontWeight={800} color={stat.color}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Active Booking Tracker */}
        {activeBooking && (
          <Paper
            sx={{
              p: 3, mb: 3, borderRadius: 3,
              border: '2px solid rgba(99,102,241,0.3)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(139,92,246,0.04))',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>🔴 Active Booking</Typography>
              <Button
                endIcon={<MdArrowForward />}
                size="small"
                onClick={() => navigate(`/booking/${activeBooking.id}`)}
                sx={{ borderRadius: 2 }}
              >
                View Details
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {activeBooking.service_type} · {activeBooking.location} · Worker: {activeBooking.worker_name || 'Assigned'}
            </Typography>
            <BookingStepper status={activeBooking.status} />
          </Paper>
        )}

        <Grid container spacing={3}>
          {/* My Requests */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.15)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>📋 My Requests</Typography>
                <Chip label={requests.length} size="small" color="primary" />
              </Box>
              {requests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary" mb={2}>No requests yet.</Typography>
                  <Button variant="outlined" onClick={() => navigate('/create-request')} startIcon={<MdAdd />} sx={{ borderRadius: 2 }}>
                    Create Request
                  </Button>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
                  {requests.slice(0, 8).map((req) => (
                    <Box
                      key={req.id}
                      sx={{
                        p: 1.5, mb: 1, borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.06)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        '&:hover': { background: 'rgba(99,102,241,0.04)' },
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{req.service_type}</Typography>
                        <Typography variant="caption" color="text.secondary">{req.location} · {req.preferred_date}</Typography>
                      </Box>
                      <StatusChip status={req.status} />
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Booking History */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.15)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>📅 Booking History</Typography>
                <Chip label={bookings.length} size="small" color="secondary" />
              </Box>
              {bookings.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary">No bookings yet.</Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
                  {bookings.map((b) => (
                    <Box
                      key={b.id}
                      onClick={() => navigate(`/booking/${b.id}`)}
                      sx={{
                        p: 1.5, mb: 1, borderRadius: 2, cursor: 'pointer',
                        border: '1px solid rgba(0,0,0,0.06)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        '&:hover': { background: 'rgba(99,102,241,0.04)', borderColor: 'rgba(99,102,241,0.2)' },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{b.service_type}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {b.worker_name || 'Worker'} · {b.preferred_date}
                        </Typography>
                      </Box>
                      <StatusChip status={b.status} />
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  )
}

export default CustomerDashboard
