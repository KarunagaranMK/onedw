import { useState, useEffect } from 'react'
import {
  Container, Typography, Box, CircularProgress, Alert, Grid,
  Paper, Chip, Button, Avatar, Divider, LinearProgress,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  MdCheckCircle, MdLocationOn, MdPhone, MdStar, MdWork,
  MdAccessTime, MdArrowForward, MdRefresh, MdVerified,
  MdMyLocation, MdDirectionsWalk,
} from 'react-icons/md'
import { getNearbyWorkers } from '../services/workerService'

const BOOKING_STEPS = [
  { label: 'Request Created', icon: '📋', done: true },
  { label: 'Finding Workers', icon: '🔍', done: true },
  { label: 'Worker Assigned', icon: '👷', done: false },
  { label: 'On the Way', icon: '🚗', done: false },
  { label: 'Service Complete', icon: '✅', done: false },
]

const StarRating = ({ rating }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <MdStar key={s} size={14} color={s <= Math.round(rating) ? '#FFB800' : '#E5E7EB'} />
    ))}
    <Typography variant="caption" fontWeight={700} ml={0.5}>{rating.toFixed(1)}</Typography>
  </Box>
)

const WorkerCard = ({ worker, onSelect, recommended }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4 }}
  >
    <Paper sx={{
      p: 3, borderRadius: 4, position: 'relative', overflow: 'hidden',
      border: recommended ? '2px solid #6C47FF' : '1px solid rgba(108,71,255,0.1)',
      boxShadow: recommended ? '0 8px 32px rgba(108,71,255,0.18)' : '0 4px 16px rgba(0,0,0,0.06)',
      transition: 'all 0.3s ease',
      '&:hover': { boxShadow: '0 12px 40px rgba(108,71,255,0.2)' },
    }}>
      {recommended && (
        <Box sx={{
          position: 'absolute', top: 12, right: 12,
          px: 1.5, py: 0.4, borderRadius: 10,
          background: 'linear-gradient(135deg,#6C47FF,#9B72FF)',
          display: 'flex', alignItems: 'center', gap: 0.5,
        }}>
          <MdVerified color="#fff" size={12} />
          <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, fontSize: 10 }}>AI PICK</Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
        <Avatar sx={{
          width: 60, height: 60, fontSize: 22, fontWeight: 900,
          background: recommended
            ? 'linear-gradient(135deg,#6C47FF,#9B72FF)'
            : 'linear-gradient(135deg,#00D4AA,#00B894)',
          flexShrink: 0,
        }}>
          {(worker.name || 'W')[0].toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={800} fontSize={16} noWrap>{worker.name}</Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
            {worker.service_type || worker.skills?.[0] || 'Professional'}
          </Typography>
          <StarRating rating={worker.average_rating || 4.5} />
        </Box>
      </Box>

      <Grid container spacing={1.5} mb={2}>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MdWork size={14} color="#6C47FF" />
            <Typography variant="caption" fontWeight={600}>{worker.experience_years || 1} yrs exp</Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MdAccessTime size={14} color="#00D4AA" />
            <Typography variant="caption" fontWeight={600}>₹{worker.hourly_rate || 300}/hr</Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MdWork size={14} color="#FFB800" />
            <Typography variant="caption" fontWeight={600}>{worker.total_jobs || 0} jobs done</Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MdLocationOn size={14} color="#EF4444" />
            <Typography variant="caption" fontWeight={600}>
              {worker.distance_km != null ? `${worker.distance_km} km` : 'Nearby'}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {worker.bio && (
        <Typography variant="caption" color="text.secondary" display="block" mb={2}
          sx={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {worker.bio}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 2 }}>
        {(worker.skills || []).slice(0, 3).map((sk) => (
          <Chip key={sk} label={sk} size="small"
            sx={{ fontSize: 10, fontWeight: 700, bgcolor: 'rgba(108,71,255,0.08)', color: '#6C47FF', height: 22 }} />
        ))}
      </Box>

      <Button
        fullWidth variant="contained"
        endIcon={<MdArrowForward />}
        onClick={() => onSelect(worker)}
        sx={{
          borderRadius: 2.5, fontWeight: 800,
          background: recommended
            ? 'linear-gradient(135deg,#6C47FF,#9B72FF)'
            : 'linear-gradient(135deg,#00D4AA,#00B894)',
          py: 1.2,
        }}
      >
        Book {worker.name?.split(' ')[0]}
      </Button>
    </Paper>
  </motion.div>
)

const BookingConfirmed = ({ worker, serviceType, requestId, onBack }) => {
  const navigate = useNavigate()
  const [trackStep, setTrackStep] = useState(0)

  // Simulate tracking progression
  useEffect(() => {
    const timers = [
      setTimeout(() => setTrackStep(1), 1500),
      setTimeout(() => setTrackStep(2), 4000),
      setTimeout(() => setTrackStep(3), 7000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const steps = [
    { label: 'Booking Confirmed!', sub: 'Your request has been sent to the worker', color: '#22C55E', icon: '✅' },
    { label: 'Worker Accepted', sub: `${worker.name} has accepted your request`, color: '#6C47FF', icon: '👷' },
    { label: 'On the Way', sub: 'Worker is heading to your location', color: '#3B82F6', icon: '🚗' },
    { label: 'Arriving Soon', sub: 'Worker will arrive in ~15 minutes', color: '#FFB800', icon: '📍' },
  ]

  const currentStep = steps[Math.min(trackStep, steps.length - 1)]

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <Box sx={{ maxWidth: 640, mx: 'auto' }}>

        {/* Success Banner */}
        <Paper sx={{
          p: 4, borderRadius: 4, mb: 3, textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(0,212,170,0.06))',
          border: '2px solid rgba(34,197,94,0.2)',
        }}>
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
          >
            <Typography fontSize={64} mb={1}>🎉</Typography>
          </motion.div>
          <Typography variant="h4" fontWeight={900} color="#22C55E" mb={0.5}>
            Booking Confirmed!
          </Typography>
          <Typography color="text.secondary" mb={2}>
            Your {serviceType} request has been successfully booked.
          </Typography>
          {requestId && (
            <Chip
              label={`Request ID: #${requestId.slice(-8).toUpperCase()}`}
              sx={{ bgcolor: 'rgba(34,197,94,0.1)', color: '#22C55E', fontWeight: 800 }}
            />
          )}
        </Paper>

        {/* Live Tracking */}
        <Paper sx={{ p: 3, borderRadius: 4, mb: 3, border: '1px solid rgba(108,71,255,0.12)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <Box sx={{
              width: 8, height: 8, borderRadius: '50%', bgcolor: '#22C55E',
              boxShadow: '0 0 8px rgba(34,197,94,0.6)',
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                '50%': { transform: 'scale(1.5)', opacity: 0.6 },
              },
            }} />
            <Typography fontWeight={800} fontSize={16}>Live Tracking</Typography>
          </Box>

          {/* Step progress */}
          <Box sx={{ mb: 2.5 }}>
            {steps.map((step, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: i < steps.length - 1 ? 1 : 0 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 32 }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 14,
                    bgcolor: i <= trackStep ? step.color : 'rgba(0,0,0,0.06)',
                    transition: 'background 0.5s ease',
                  }}>
                    {i <= trackStep ? step.icon : <Typography fontSize={12} color="text.disabled">{i + 1}</Typography>}
                  </Box>
                  {i < steps.length - 1 && (
                    <Box sx={{
                      width: 2, height: 28, mt: 0.5,
                      bgcolor: i < trackStep ? step.color : 'rgba(0,0,0,0.08)',
                      transition: 'background 0.5s ease',
                    }} />
                  )}
                </Box>
                <Box sx={{ pt: 0.5 }}>
                  <Typography fontWeight={700} fontSize={13}
                    color={i <= trackStep ? 'text.primary' : 'text.disabled'}>
                    {step.label}
                  </Typography>
                  {i === trackStep && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Typography variant="caption" color="text.secondary">{step.sub}</Typography>
                    </motion.div>
                  )}
                </Box>
              </Box>
            ))}
          </Box>

          <LinearProgress
            variant="determinate"
            value={(trackStep / (steps.length - 1)) * 100}
            sx={{
              borderRadius: 2, height: 6,
              bgcolor: 'rgba(108,71,255,0.08)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
                background: 'linear-gradient(90deg,#6C47FF,#00D4AA)',
              },
            }}
          />
        </Paper>

        {/* Assigned Worker Details */}
        <Paper sx={{ p: 3, borderRadius: 4, mb: 3, border: '1px solid rgba(108,71,255,0.12)' }}>
          <Typography fontWeight={800} fontSize={16} mb={2}>Your Assigned Worker</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <Avatar sx={{
              width: 64, height: 64, fontSize: 24, fontWeight: 900,
              background: 'linear-gradient(135deg,#6C47FF,#9B72FF)',
            }}>
              {(worker.name || 'W')[0].toUpperCase()}
            </Avatar>
            <Box>
              <Typography fontWeight={800} fontSize={17}>{worker.name}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                {worker.service_type || worker.skills?.[0]}
              </Typography>
              <StarRating rating={worker.average_rating || 4.5} />
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(108,71,255,0.08)' }}>
                  <MdWork color="#6C47FF" size={18} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Experience</Typography>
                  <Typography fontWeight={700} fontSize={13}>{worker.experience_years || 1} Years</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(0,212,170,0.08)' }}>
                  <MdWork color="#00D4AA" size={18} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Jobs Done</Typography>
                  <Typography fontWeight={700} fontSize={13}>{worker.total_jobs || 0}+</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255,184,0,0.08)' }}>
                  <MdAccessTime color="#FFB800" size={18} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Rate</Typography>
                  <Typography fontWeight={700} fontSize={13}>₹{worker.hourly_rate || 300}/hr</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(239,68,68,0.08)' }}>
                  <MdLocationOn color="#EF4444" size={18} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Distance</Typography>
                  <Typography fontWeight={700} fontSize={13}>
                    {worker.distance_km != null ? `${worker.distance_km} km` : 'Nearby'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {worker.phone && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  fullWidth variant="outlined"
                  startIcon={<MdPhone />}
                  href={`tel:${worker.phone}`}
                  sx={{ borderRadius: 2.5, fontWeight: 700, borderColor: 'rgba(108,71,255,0.3)', color: '#6C47FF' }}
                >
                  Call Worker
                </Button>
                <Button
                  fullWidth variant="contained"
                  startIcon={<MdMyLocation />}
                  sx={{ borderRadius: 2.5, fontWeight: 700, background: 'linear-gradient(135deg,#6C47FF,#9B72FF)' }}
                >
                  Track Live
                </Button>
              </Box>
            </>
          )}
        </Paper>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            fullWidth variant="outlined"
            onClick={() => navigate('/dashboard')}
            sx={{ borderRadius: 2.5, fontWeight: 700 }}
          >
            Go to Dashboard
          </Button>
          <Button
            fullWidth variant="contained"
            onClick={() => navigate('/my-requests')}
            endIcon={<MdArrowForward />}
            sx={{ borderRadius: 2.5, fontWeight: 800, background: 'linear-gradient(135deg,#6C47FF,#9B72FF)' }}
          >
            View My Requests
          </Button>
        </Box>
      </Box>
    </motion.div>
  )
}

const WorkerRecommendations = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const requestId = searchParams.get('requestId')
  const serviceType = searchParams.get('service') || 'Electrician'
  const lat = parseFloat(searchParams.get('lat')) || 12.9236
  const lon = parseFloat(searchParams.get('lon')) || 80.1258

  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedWorker, setSelectedWorker] = useState(null)

  const fetchWorkers = async () => {
    setLoading(true)
    setError('')
    try {
      // Use 500km radius to always find demo workers regardless of user location
      let nearby = await getNearbyWorkers(serviceType, lat, lon, 500)

      // If still empty, fetch all workers without service filter
      if (!nearby || nearby.length === 0) {
        nearby = await getNearbyWorkers('all', lat, lon, 9999)
      }

      setWorkers(Array.isArray(nearby) ? nearby : [])
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load workers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkers()
  }, [serviceType, lat, lon])

  if (selectedWorker) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <BookingConfirmed
          worker={selectedWorker}
          serviceType={serviceType}
          requestId={requestId}
          onBack={() => setSelectedWorker(null)}
        />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* Booking Confirmed Header */}
        <Paper sx={{
          p: 3, mb: 4, borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(108,71,255,0.06))',
          border: '1px solid rgba(34,197,94,0.2)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 52, height: 52, borderRadius: '50%',
              bgcolor: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MdCheckCircle color="#22C55E" size={28} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={900} color="#22C55E">
                ✅ Service Request Created!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Now select a professional to assign your {serviceType} job
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h4" fontWeight={900}>Available {serviceType} Professionals</Typography>
            <Typography variant="body2" color="text.secondary">
              {loading ? 'Searching...' : `${workers.length} verified professionals found`}
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<MdRefresh />} onClick={fetchWorkers} disabled={loading}
            sx={{ borderRadius: 2 }}>
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
            <CircularProgress size={48} thickness={3} />
            <Typography color="text.secondary">Finding the best professionals near you…</Typography>
          </Box>
        ) : workers.length === 0 ? (
          <Paper sx={{ p: 6, borderRadius: 4, textAlign: 'center' }}>
            <Typography fontSize={52} mb={2}>🔍</Typography>
            <Typography variant="h6" fontWeight={800} mb={1}>No Workers Found Nearby</Typography>
            <Typography color="text.secondary" mb={3}>
              No {serviceType.toLowerCase()} professionals are currently available.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={fetchWorkers} startIcon={<MdRefresh />}
                sx={{ borderRadius: 2.5, fontWeight: 700 }}>
                Try Again
              </Button>
              <Button variant="contained" onClick={() => navigate('/workers')}
                sx={{ borderRadius: 2.5, fontWeight: 700, background: 'linear-gradient(135deg,#6C47FF,#9B72FF)' }}>
                Browse All Workers
              </Button>
            </Box>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {workers.map((worker, idx) => (
              <Grid item xs={12} sm={6} md={4} key={worker.worker_id || worker.id || idx}>
                <WorkerCard
                  worker={worker}
                  onSelect={setSelectedWorker}
                  recommended={idx === 0}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </motion.div>
    </Container>
  )
}

export default WorkerRecommendations
