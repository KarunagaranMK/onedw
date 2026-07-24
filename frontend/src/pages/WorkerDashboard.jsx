import { useState, useEffect, useCallback } from 'react'
import {
  Box, Container, Grid, Paper, Typography, Avatar, Chip,
  Button, Switch, Divider, CircularProgress,
  Alert, Rating, Card, CardContent, CardActions, useTheme,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import {
  MdLocationOn, MdEdit, MdWork, MdStar,
  MdLogout, MdAccessTime, MdPhone, MdVerified,
  MdWifiOff, MdWifi, MdFlashOn,
} from 'react-icons/md'
import { FaToolbox } from 'react-icons/fa'

const StatCard = ({ icon, label, value, color, gradient, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ y: -4, scale: 1.02 }}
  >
    <Paper sx={{
      p: 3, borderRadius: 3, textAlign: 'center', position: 'relative', overflow: 'hidden',
      border: `1px solid ${color}22`,
      boxShadow: `0 4px 20px ${color}10`,
    }}>
      <Box sx={{
        position: 'absolute', top: -20, right: -20, width: 80, height: 80,
        borderRadius: '50%', background: gradient, opacity: 0.12,
      }} />
      <Box sx={{
        width: 44, height: 44, borderRadius: 2.5, mx: 'auto', mb: 1.5,
        background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, boxShadow: `0 4px 12px ${color}30`,
      }}>
        {icon}
      </Box>
      <Typography variant="h4" fontWeight={900} sx={{ color, lineHeight: 1 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mt: 0.5, display: 'block' }}>{label}</Typography>
    </Paper>
  </motion.div>
)

export default function WorkerDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
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
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh', flexDirection: 'column', gap: 2 }}>
      <CircularProgress size={48} thickness={3} />
      <Typography color="text.secondary" fontWeight={500}>Loading dashboard…</Typography>
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>

      {/* ── Dark Hero Header ── */}
      <Box sx={{
        background: isDark
          ? 'linear-gradient(135deg,#080812,#1a1740)'
          : 'linear-gradient(135deg,#0f0c29,#302b63)',
        pt: { xs: 4, md: 6 }, pb: { xs: 10, md: 12 },
      }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              {/* Profile */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={profile?.profile_photo}
                    sx={{
                      width: 68, height: 68, fontSize: 26, fontWeight: 900,
                      background: 'linear-gradient(135deg,#6C47FF,#9B72FF)',
                      border: '3px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    {(profile?.name || user?.name || 'W')[0].toUpperCase()}
                  </Avatar>
                  <Box sx={{
                    position: 'absolute', bottom: 2, right: 2,
                    width: 14, height: 14, borderRadius: '50%',
                    bgcolor: online ? '#00D4AA' : '#6B7280',
                    border: '2px solid rgba(255,255,255,0.3)',
                    boxShadow: online ? '0 0 8px rgba(0,212,170,0.6)' : 'none',
                  }} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h5" fontWeight={900} sx={{ color: '#fff' }}>
                      {profile?.name || user?.name}
                    </Typography>
                    {profile?.verified && <MdVerified color="#FFB800" size={20} title="Verified" />}
                  </Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                    {profile?.service_type || 'Professional'} · {profile?.experience_years || 0} yrs
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <Rating value={profile?.average_rating || 0} precision={0.1} size="small" readOnly sx={{ color: '#FFB800' }} />
                    <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                      {profile?.average_rating?.toFixed(1) || '0.0'} · {profile?.total_jobs || 0} jobs
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Controls */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                {/* Online toggle */}
                <Paper
                  sx={{
                    px: 2, py: 1, borderRadius: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
                    bgcolor: online ? 'rgba(0,212,170,0.15)' : 'rgba(107,114,128,0.15)',
                    border: `1px solid ${online ? 'rgba(0,212,170,0.3)' : 'rgba(107,114,128,0.3)'}`,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {online ? <MdWifi color="#00D4AA" size={18} /> : <MdWifiOff color="#6B7280" size={18} />}
                  <Typography variant="body2" fontWeight={700} sx={{ color: online ? '#00D4AA' : '#6B7280' }}>
                    {online ? 'Online' : 'Offline'}
                  </Typography>
                  <Switch
                    checked={online}
                    onChange={handleStatusToggle}
                    disabled={updatingStatus}
                    size="small"
                    sx={{ '& .MuiSwitch-track': { bgcolor: '#6B7280' }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#00D4AA' } }}
                  />
                </Paper>

                <Button
                  variant="outlined" size="small" startIcon={<MdLocationOn />}
                  onClick={updateLocation} disabled={locating}
                  sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff', borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                >
                  {locating ? 'Locating…' : 'Update GPS'}
                </Button>
                <Button
                  variant="outlined" size="small" startIcon={<MdEdit />}
                  onClick={() => navigate('/worker/profile/setup')}
                  sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff', borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="text" size="small" startIcon={<MdLogout />}
                  onClick={handleLogout}
                  sx={{ color: 'rgba(255,255,255,0.5)', borderRadius: 2, '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}
                >
                  Logout
                </Button>
              </Box>
            </Box>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: '-44px', pb: 6, position: 'relative', zIndex: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { icon: '🔧', label: "Active Bookings", value: activeBookings.length, color: '#6C47FF', gradient: 'linear-gradient(135deg,#6C47FF,#9B72FF)', delay: 0 },
            { icon: '✅', label: 'Completed Jobs', value: completedBookings.length, color: '#22C55E', gradient: 'linear-gradient(135deg,#22C55E,#4ADE80)', delay: 0.08 },
            { icon: '⭐', label: 'Avg Rating', value: profile?.average_rating?.toFixed(1) || 'N/A', color: '#FFB800', gradient: 'linear-gradient(135deg,#FFB800,#FFD54F)', delay: 0.16 },
            { icon: '📋', label: 'Nearby Jobs', value: jobs.length, color: '#3B82F6', gradient: 'linear-gradient(135deg,#3B82F6,#60A5FA)', delay: 0.24 },
          ].map((s) => (
            <Grid item xs={6} md={3} key={s.label}><StatCard {...s} /></Grid>
          ))}
        </Grid>

        {/* Profile info strip */}
        {profile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,71,255,0.1)'}` }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
                {profile.hourly_rate > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MdWork color="#6C47FF" size={16} />
                    <Typography variant="body2" fontWeight={700}>₹{profile.hourly_rate}/hr</Typography>
                  </Box>
                )}
                {profile.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MdPhone color="#6C47FF" size={16} />
                    <Typography variant="body2">{profile.phone}</Typography>
                  </Box>
                )}
                {profile.address && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MdLocationOn color="#6C47FF" size={16} />
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{profile.address}</Typography>
                  </Box>
                )}
                {profile.working_hours && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MdAccessTime color="#6C47FF" size={16} />
                    <Typography variant="body2">{profile.working_hours.start} – {profile.working_hours.end}</Typography>
                  </Box>
                )}
                {profile.skills?.slice(0, 3).map((s) => (
                  <Chip key={s} label={s} size="small" sx={{ bgcolor: 'rgba(108,71,255,0.1)', color: '#6C47FF', fontWeight: 700 }} />
                ))}
              </Box>
            </Paper>
          </motion.div>
        )}

        <Grid container spacing={3}>
          {/* Active Bookings */}
          <Grid item xs={12} md={6}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Paper sx={{ p: 3, borderRadius: 3, height: '100%', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,71,255,0.1)'}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                  <MdFlashOn color="#6C47FF" size={20} />
                  <Typography variant="h6" fontWeight={800}>Active Bookings</Typography>
                  <Chip label={activeBookings.length} size="small" sx={{ bgcolor: 'rgba(108,71,255,0.1)', color: '#6C47FF', fontWeight: 800, ml: 'auto' }} />
                </Box>

                {activeBookings.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                    <Typography fontSize={40} mb={1}>🔧</Typography>
                    <Typography variant="body2">No active bookings right now.</Typography>
                    <Typography variant="caption">Go online to receive new jobs!</Typography>
                  </Box>
                ) : (
                  activeBookings.slice(0, 5).map((b, i) => (
                    <motion.div key={b.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                      <Box
                        onClick={() => navigate(`/booking/${b.id}`)}
                        sx={{
                          p: 2, mb: 1.5, borderRadius: 2.5, cursor: 'pointer',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,71,255,0.1)'}`,
                          '&:hover': { borderColor: 'rgba(108,71,255,0.3)', bgcolor: 'rgba(108,71,255,0.03)' },
                          transition: 'all 0.2s',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={800}>{b.service_type}</Typography>
                          <Chip label={b.status.replace(/_/g, ' ')} size="small"
                            sx={{ height: 20, fontSize: 10, fontWeight: 700,
                              bgcolor: b.status === 'accepted' ? 'rgba(34,197,94,0.1)' : 'rgba(255,184,0,0.1)',
                              color: b.status === 'accepted' ? '#22C55E' : '#FFB800',
                            }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary">{b.preferred_date} · {b.preferred_time}</Typography>
                      </Box>
                    </motion.div>
                  ))
                )}
              </Paper>
            </motion.div>
          </Grid>

          {/* Available Jobs */}
          <Grid item xs={12} md={6}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Paper sx={{ p: 3, borderRadius: 3, height: '100%', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,212,170,0.1)'}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                  <MdWork color="#00D4AA" size={20} />
                  <Typography variant="h6" fontWeight={800}>Jobs Near You</Typography>
                  <Chip label={jobs.length} size="small" sx={{ bgcolor: 'rgba(0,212,170,0.1)', color: '#00D4AA', fontWeight: 800, ml: 'auto' }} />
                </Box>

                {jobs.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                    <Typography fontSize={40} mb={1}>📋</Typography>
                    <Typography variant="body2">No jobs available right now.</Typography>
                    <Typography variant="caption">Update your location to see nearby jobs.</Typography>
                    <Box mt={1.5}>
                      <Button size="small" variant="outlined" onClick={updateLocation} startIcon={<MdLocationOn />} sx={{ borderRadius: 2 }}>
                        Update Location
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  jobs.slice(0, 5).map((job, i) => (
                    <motion.div key={job.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                      <Box sx={{
                        p: 2, mb: 1.5, borderRadius: 2.5,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,212,170,0.15)'}`,
                        '&:hover': { borderColor: 'rgba(0,212,170,0.4)', bgcolor: 'rgba(0,212,170,0.03)' },
                        transition: 'all 0.2s',
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={800}>{job.service_type}</Typography>
                          {job.distance_km != null && (
                            <Typography variant="caption" color="#00D4AA" fontWeight={700}>📍 {job.distance_km} km</Typography>
                          )}
                        </Box>
                        {job.description && (
                          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                            {job.description.slice(0, 70)}…
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {job.preferred_date} · {job.preferred_time}
                        </Typography>
                      </Box>
                    </motion.div>
                  ))
                )}
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
