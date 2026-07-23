import { useState, useEffect } from 'react'
import {
  Container, Typography, Box, Grid, Paper, Button, CircularProgress,
  Alert, Chip, Switch, FormControlLabel, Avatar, Divider,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MdStar, MdWork, MdLocationOn, MdCheck, MdClose, MdArrowForward } from 'react-icons/md'
import { getAvailableJobs, getWorkerProfile, updateWorkerProfile, updateWorkerLocation } from '../services/workerService'
import { getWorkerBookings } from '../services/bookingService'
import { updateBookingStatus } from '../services/bookingService'
import { useAuth } from '../hooks/useAuth'

const WorkerDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [jobs, setJobs] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acceptingId, setAcceptingId] = useState(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [prof, availJobs, myBookings] = await Promise.all([
          getWorkerProfile(),
          getAvailableJobs(),
          getWorkerBookings(),
        ])
        setProfile(prof)
        setJobs(availJobs)
        setBookings(myBookings)
      } catch (err) {
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const handleToggleAvailability = async () => {
    const newVal = !profile.is_available
    setProfile((prev) => ({ ...prev, is_available: newVal }))
    try {
      await updateWorkerProfile({ is_available: newVal })
    } catch {
      setProfile((prev) => ({ ...prev, is_available: !newVal }))
    }
  }

  const handleGetLocation = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      await updateWorkerLocation(pos.coords.latitude, pos.coords.longitude)
      setProfile((prev) => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }))
    })
  }

  const handleAcceptJob = async (job) => {
    setAcceptingId(job.id)
    try {
      navigate(`/find-workers?requestId=${job.id}&service=${encodeURIComponent(job.service_type)}&lat=${job.latitude}&lon=${job.longitude}`)
    } finally {
      setAcceptingId(null)
    }
  }

  const completedBookings = bookings.filter((b) => b.status === 'completed')
  const activeBookings = bookings.filter((b) => ['accepted', 'worker_on_the_way', 'started'].includes(b.status))

  const stats = [
    { label: "Today's Jobs", value: activeBookings.length, color: '#6366f1', icon: '🔧' },
    { label: 'Completed Jobs', value: completedBookings.length, color: '#10b981', icon: '✅' },
    { label: 'Rating', value: profile?.average_rating?.toFixed(1) || 'N/A', color: '#f59e0b', icon: '⭐' },
    { label: 'Available Jobs', value: jobs.length, color: '#0ea5e9', icon: '📋' },
  ]

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={48} />
        <Typography color="text.secondary">Loading worker dashboard...</Typography>
      </Box>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 56, height: 56, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontSize: 20, fontWeight: 700 }}>
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={800}>{user?.name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <MdStar color="#f59e0b" />
                <Typography variant="body2" color="text.secondary">
                  {profile?.average_rating?.toFixed(1)} · {profile?.total_jobs} jobs completed
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControlLabel
              control={<Switch checked={profile?.is_available || false} onChange={handleToggleAvailability} color="success" />}
              label={profile?.is_available ? '🟢 Available' : '🔴 Offline'}
            />
            <Button variant="outlined" size="small" startIcon={<MdLocationOn />} onClick={handleGetLocation} sx={{ borderRadius: 2 }}>
              Update Location
            </Button>
            <Button variant="outlined" onClick={logout} sx={{ borderRadius: 2 }}>Logout</Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Stats */}
        <Grid container spacing={2} mb={3}>
          {stats.map((stat) => (
            <Grid item xs={6} sm={3} key={stat.label}>
              <motion.div whileHover={{ y: -4 }}>
                <Paper sx={{ p: 2.5, borderRadius: 3, textAlign: 'center', border: `1px solid ${stat.color}22`, boxShadow: `0 4px 16px ${stat.color}15` }}>
                  <Typography sx={{ fontSize: 28, mb: 0.5 }}>{stat.icon}</Typography>
                  <Typography variant="h4" fontWeight={800} color={stat.color}>{stat.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Active Bookings */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.15)' }}>
              <Typography variant="h6" fontWeight={700} mb={2}>🔧 Active Bookings</Typography>
              {activeBookings.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No active bookings right now.</Typography>
              ) : (
                activeBookings.map((b) => (
                  <Box
                    key={b.id}
                    onClick={() => navigate(`/booking/${b.id}`)}
                    sx={{
                      p: 2, mb: 1.5, borderRadius: 2, cursor: 'pointer',
                      border: '1px solid rgba(99,102,241,0.2)',
                      background: 'rgba(99,102,241,0.04)',
                      '&:hover': { borderColor: '#6366f1', transform: 'translateX(4px)' },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body1" fontWeight={700}>{b.service_type}</Typography>
                        <Typography variant="caption" color="text.secondary">{b.location} · {b.preferred_date} at {b.preferred_time}</Typography>
                      </Box>
                      <Chip label={b.status.replace(/_/g, ' ')} color="primary" size="small" />
                    </Box>
                  </Box>
                ))
              )}
            </Paper>
          </Grid>

          {/* Available Jobs */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.15)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>📋 Available Jobs Near You</Typography>
                <Chip label={jobs.length} size="small" color="info" />
              </Box>
              {jobs.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No available jobs right now. Check back later!
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 380, overflowY: 'auto', pr: 0.5 }}>
                  {jobs.map((job) => (
                    <Box
                      key={job.id}
                      sx={{
                        p: 2, mb: 1.5, borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.08)',
                        '&:hover': { border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.03)' },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box flex={1}>
                          <Typography variant="body1" fontWeight={700}>{job.service_type}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            📍 {job.location}
                            {job.distance_km != null && ` · ${job.distance_km.toFixed(1)} km away`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            📅 {job.preferred_date} at {job.preferred_time}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {job.description}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={acceptingId === job.id}
                          onClick={() => handleAcceptJob(job)}
                          sx={{
                            borderRadius: 2, ml: 1, flexShrink: 0,
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            fontWeight: 700,
                          }}
                        >
                          View
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Completed Jobs */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.15)' }}>
              <Typography variant="h6" fontWeight={700} mb={2}>✅ Completed Jobs ({completedBookings.length})</Typography>
              {completedBookings.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No completed jobs yet. Accept your first job to get started!
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {completedBookings.slice(0, 6).map((b) => (
                    <Grid item xs={12} sm={6} md={4} key={b.id}>
                      <Box
                        sx={{
                          p: 2, borderRadius: 2, border: '1px solid rgba(16,185,129,0.2)',
                          background: 'rgba(16,185,129,0.04)',
                          cursor: 'pointer',
                          '&:hover': { borderColor: '#10b981' },
                          transition: 'all 0.2s ease',
                        }}
                        onClick={() => navigate(`/booking/${b.id}`)}
                      >
                        <Typography variant="body2" fontWeight={700}>{b.service_type}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{b.location}</Typography>
                        <Typography variant="caption" color="text.secondary">{b.preferred_date}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  )
}

export default WorkerDashboard
