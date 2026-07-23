import { useState, useEffect, useCallback } from 'react'
import {
  Box, Container, Grid, Paper, Typography, Avatar, Chip,
  Button, Switch, FormControlLabel, Divider, CircularProgress,
  Alert, Rating, Card, CardContent, CardActions, LinearProgress,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import {
  MdLocationOn, MdEdit, MdWork, MdStar, MdCheckCircle,
  MdLogout, MdAccessTime, MdPhone, MdVerified, MdEventAvailable,
} from 'react-icons/md'
import { FaToolbox } from 'react-icons/fa'

const STATUS_COLORS = { online: '#10b981', offline: '#6b7280' }

// Stat card component
const StatCard = ({ icon, label, value, color = '#6366f1', delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
    <Paper sx={{ p: 2.5, borderRadius: 3, textAlign: 'center', border: `1px solid ${color}22`,
      boxShadow: `0 4px 16px ${color}15`, '&:hover': { boxShadow: `0 8px 32px ${color}25` },
      transition: 'all 0.3s ease' }}>
      <Typography sx={{ fontSize: 32, mb: 0.5 }}>{icon}</Typography>
      <Typography variant="h4" fontWeight={900} sx={{ color }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Paper>
  </motion.div>
)

export default function WorkerDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [jobs, setJobs] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [online, setOnline] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [locating, setLocating] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [profileRes, jobsRes, bookingsRes] = await Promise.all([
        api.get('/worker/profile'),
        api.get('/worker/available-jobs'),
        api.get('/booking/worker-bookings'),
      ])
      setProfile(profileRes.data)
      setJobs(jobsRes.data || [])
      setBookings(bookingsRes.data || [])
      setOnline(profileRes.data.status === 'online')
    } catch {
      setError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleStatusToggle = async () => {
    setUpdatingStatus(true)
    const newStatus = online ? 'offline' : 'online'
    try {
      await api.put(`/worker/status?status=${newStatus}`)
      setOnline(!online)
    } catch {
      setError('Failed to update status.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const updateLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          await api.post('/worker/location', { latitude: coords.latitude, longitude: coords.longitude })
          await loadData()
        } catch { /* silent */ } finally { setLocating(false) }
      },
      () => setLocating(false),
    )
  }

  const handleLogout = () => { logout(); navigate('/') }

  const activeBookings = bookings.filter((b) => !['completed', 'cancelled'].includes(b.status))
  const completedBookings = bookings.filter((b) => b.status === 'completed')

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <CircularProgress />
    </Box>
  )

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            {/* Profile info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={profile?.profile_photo}
                sx={{ width: 72, height: 72, bgcolor: 'rgba(255,255,255,0.25)', fontSize: 28, fontWeight: 800, border: '3px solid rgba(255,255,255,0.5)' }}
              >
                {(profile?.name || user?.name || 'W')[0].toUpperCase()}
              </Avatar>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h5" fontWeight={800} sx={{ color: '#fff' }}>
                    {profile?.name || user?.name}
                  </Typography>
                  {profile?.verified && <MdVerified color="#fbbf24" size={20} title="Verified" />}
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                  {profile?.service_type || 'Professional'} · {profile?.experience_years || 0} yrs exp
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <Rating value={profile?.average_rating || 0} precision={0.1} size="small" readOnly sx={{ color: '#fbbf24' }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                    ({profile?.average_rating?.toFixed(1) || 'N/A'}) · {profile?.total_jobs || 0} jobs completed
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              {/* Online toggle */}
              <Paper sx={{ px: 2, py: 0.75, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: STATUS_COLORS[online ? 'online' : 'offline'], boxShadow: online ? '0 0 8px #10b981' : 'none' }} />
                <Typography variant="body2" fontWeight={700}>{online ? 'Online' : 'Offline'}</Typography>
                <Switch checked={online} onChange={handleStatusToggle} disabled={updatingStatus} size="small" color="success" />
              </Paper>

              <Button variant="outlined" size="small" startIcon={<MdLocationOn />} onClick={updateLocation}
                disabled={locating} sx={{ borderColor: '#fff', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                {locating ? 'Locating...' : 'Update GPS'}
              </Button>
              <Button variant="outlined" size="small" startIcon={<MdEdit />}
                onClick={() => navigate('/worker/profile/setup')}
                sx={{ borderColor: '#fff', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                Edit Profile
              </Button>
              <Button variant="contained" size="small" startIcon={<MdLogout />} onClick={handleLogout}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                Logout
              </Button>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* ── Profile Info Strip ── */}
      {profile && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {profile.hourly_rate > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MdWork color="#6366f1" />
                <Typography variant="body2"><strong>₹{profile.hourly_rate}/hr</strong></Typography>
              </Box>
            )}
            {profile.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MdPhone color="#6366f1" />
                <Typography variant="body2">{profile.phone}</Typography>
              </Box>
            )}
            {profile.address && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MdLocationOn color="#6366f1" />
                <Typography variant="body2">{profile.address}</Typography>
              </Box>
            )}
            {profile.working_hours && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MdAccessTime color="#6366f1" />
                <Typography variant="body2">{profile.working_hours.start} – {profile.working_hours.end}</Typography>
              </Box>
            )}
            {profile.languages?.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                {profile.languages.map((l) => <Chip key={l} label={l} size="small" variant="outlined" sx={{ borderColor: '#6366f1', color: '#6366f1' }} />)}
              </Box>
            )}
          </Paper>
        </motion.div>
      )}

      {/* ── Availability Days ── */}
      {profile?.availability?.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <MdEventAvailable color="#6366f1" />
              <Typography variant="subtitle2" fontWeight={700}>Availability</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => {
                const day = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i]
                const active = profile.availability.includes(day)
                return (
                  <Box key={d} sx={{
                    width: 42, height: 42, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: active ? '#6366f1' : 'rgba(0,0,0,0.04)', color: active ? '#fff' : 'text.disabled',
                    fontWeight: 700, fontSize: 12,
                  }}>{d}</Box>
                )
              })}
            </Box>
          </Paper>
        </motion.div>
      )}

      {/* ── Stats ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { icon: '🔧', label: "Today's Jobs", value: activeBookings.length, color: '#6366f1', delay: 0.1 },
          { icon: '✅', label: 'Completed Jobs', value: completedBookings.length, color: '#10b981', delay: 0.15 },
          { icon: '⭐', label: 'Rating', value: profile?.average_rating?.toFixed(1) || 'N/A', color: '#f59e0b', delay: 0.2 },
          { icon: '📋', label: 'Available Jobs', value: jobs.length, color: '#0ea5e9', delay: 0.25 },
        ].map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <StatCard {...s} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* ── Active Bookings ── */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={800} mb={2}>🔧 Active Bookings</Typography>
            {activeBookings.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <FaToolbox size={36} opacity={0.3} />
                <Typography variant="body2" mt={1}>No active bookings right now.</Typography>
              </Box>
            ) : (
              activeBookings.slice(0, 5).map((b) => (
                <Card key={b.id} sx={{ mb: 2, borderRadius: 2, border: '1px solid rgba(99,102,241,0.15)' }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={700}>{b.service_type || 'Service'}</Typography>
                      <Chip label={b.status} size="small" color={b.status === 'accepted' ? 'success' : 'warning'} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">{b.preferred_date} · {b.preferred_time}</Typography>
                  </CardContent>
                  <CardActions sx={{ pt: 0 }}>
                    <Button size="small" onClick={() => navigate(`/booking/${b.id}`)}>View Details</Button>
                  </CardActions>
                </Card>
              ))
            )}
          </Paper>
        </Grid>

        {/* ── Available Jobs Near Me ── */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={800}>📋 Available Jobs Near You</Typography>
              <Chip label={jobs.length} color="primary" size="small" />
            </Box>
            {jobs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <Typography variant="body2">No available jobs right now. Check back later!</Typography>
              </Box>
            ) : (
              jobs.slice(0, 5).map((job) => (
                <Card key={job.id} sx={{ mb: 2, borderRadius: 2, border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer',
                  '&:hover': { boxShadow: '0 4px 16px rgba(16,185,129,0.15)' }, transition: 'all 0.2s' }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2" fontWeight={700}>{job.service_type || 'Service'}</Typography>
                      {job.distance_km != null && (
                        <Typography variant="caption" color="primary" fontWeight={700}>📍 {job.distance_km} km</Typography>
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      {job.description?.slice(0, 80)}...
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {job.preferred_date} · {job.preferred_time}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            )}
          </Paper>
        </Grid>

        {/* ── Completed Jobs ── */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={800} mb={2}>✅ Completed Jobs ({completedBookings.length})</Typography>
            {completedBookings.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <MdCheckCircle size={36} opacity={0.3} />
                <Typography variant="body2" mt={1}>No completed jobs yet. Accept your first job to get started!</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {completedBookings.slice(0, 6).map((b) => (
                  <Grid item xs={12} sm={6} md={4} key={b.id}>
                    <Card sx={{ borderRadius: 2, border: '1px solid rgba(16,185,129,0.2)' }}>
                      <CardContent>
                        <Typography variant="subtitle2" fontWeight={700}>{b.service_type || 'Service'}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{b.preferred_date}</Typography>
                        {b.rating && <Rating value={b.rating} size="small" readOnly sx={{ mt: 0.5 }} />}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
