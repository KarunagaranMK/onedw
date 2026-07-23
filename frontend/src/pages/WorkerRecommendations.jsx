import { useState, useEffect, lazy, Suspense } from 'react'
import {
  Container, Typography, Box, CircularProgress, Alert, Grid,
  Paper, Chip, Button, Divider,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MdAutoAwesome, MdRefresh } from 'react-icons/md'
import { getNearbyWorkers } from '../services/workerService'
import { getAIRecommendation } from '../services/aiService'
import { createBooking } from '../services/bookingService'
import WorkerCard from '../components/common/WorkerCard'

const Map = lazy(() => import('../components/common/Map'))

const WorkerRecommendations = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const requestId = searchParams.get('requestId')
  const serviceType = searchParams.get('service') || 'Electrician'
  const lat = parseFloat(searchParams.get('lat')) || 12.9236
  const lon = parseFloat(searchParams.get('lon')) || 80.1258

  const [workers, setWorkers] = useState([])
  const [aiResult, setAiResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(null)
  const [error, setError] = useState('')
  const [booked, setBooked] = useState(false)

  const fetchWorkersAndRecommend = async () => {
    setLoading(true)
    setError('')
    try {
      const nearby = await getNearbyWorkers(serviceType, lat, lon, 100)
      setWorkers(nearby)

      if (nearby.length > 0) {
        const recommendation = await getAIRecommendation(serviceType, lat, lon, nearby)
        setAiResult(recommendation)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load workers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkersAndRecommend()
  }, [serviceType, lat, lon])

  const handleBook = async (worker) => {
    if (!requestId) {
      navigate('/create-request')
      return
    }
    setBookingLoading(worker.worker_id || worker.id)
    try {
      const booking = await createBooking(requestId, worker.worker_id || worker.id)
      navigate(`/booking/${booking.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to book worker.')
      setBookingLoading(null)
    }
  }

  // Sort workers: recommended first, then by rating
  const sortedWorkers = [...workers].sort((a, b) => {
    if (aiResult) {
      if ((a.worker_id || a.id) === aiResult.top_worker_id) return -1
      if ((b.worker_id || b.id) === aiResult.top_worker_id) return 1
    }
    return b.average_rating - a.average_rating
  })

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h4" fontWeight={800}>
                Find Your {serviceType}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {workers.length} verified professionals found nearby
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<MdRefresh />}
              onClick={fetchWorkersAndRecommend}
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
          </Box>

          {/* AI Recommendation Banner */}
          {aiResult && aiResult.top_worker_id && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Paper
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
                  border: '1px solid rgba(99,102,241,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <MdAutoAwesome color="#6366f1" size={28} />
                <Box flex={1}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary">
                    🤖 Gemini AI Recommendation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {aiResult.reason}
                  </Typography>
                </Box>
                <Chip
                  label={`${Math.round((aiResult.confidence || 0) * 100)}% confidence`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Paper>
            </motion.div>
          )}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10, flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={48} />
            <Typography color="text.secondary">Finding best workers near you...</Typography>
          </Box>
        ) : workers.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={1}>No Workers Found</Typography>
            <Typography color="text.secondary" mb={3}>
              No available {serviceType.toLowerCase()} professionals found within 100 km.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/create-request')} sx={{ borderRadius: 2 }}>
              Try Different Service
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {/* Map */}
            <Grid item xs={12}>
              <Suspense fallback={<Box sx={{ height: 300 }} />}>
                <Map
                  center={[lat, lon]}
                  zoom={12}
                  customerLocation={{ lat, lon, label: 'Your Location' }}
                  workers={workers}
                  height={320}
                />
              </Suspense>
            </Grid>

            {/* Worker Cards */}
            {sortedWorkers.map((worker) => {
              const isRecommended = aiResult?.top_worker_id === (worker.worker_id || worker.id)
              return (
                <Grid item xs={12} sm={6} md={4} key={worker.worker_id || worker.id}>
                  <WorkerCard
                    worker={worker}
                    isRecommended={isRecommended}
                    aiReason={isRecommended ? aiResult.reason : ''}
                    confidence={isRecommended ? aiResult.confidence : null}
                    onBook={handleBook}
                    loading={bookingLoading === (worker.worker_id || worker.id)}
                  />
                </Grid>
              )
            })}
          </Grid>
        )}
      </motion.div>
    </Container>
  )
}

export default WorkerRecommendations
