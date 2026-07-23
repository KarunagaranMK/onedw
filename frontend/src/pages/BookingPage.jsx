import { useState, useEffect, useCallback } from 'react'
import {
  Container, Typography, Box, CircularProgress, Alert, Paper,
  Chip, Button, Divider, Avatar, Grid,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { MdPhone, MdStar, MdRefresh, MdHome } from 'react-icons/md'
import { getBookingById, updateBookingStatus } from '../services/bookingService'
import { useAuth } from '../hooks/useAuth'
import BookingStepper from '../components/common/BookingStepper'
import RatingModal from '../components/common/RatingModal'

const STATUS_ACTIONS = {
  accepted: { label: 'Mark On The Way', next: 'worker_on_the_way', color: 'primary', role: 'worker' },
  worker_on_the_way: { label: 'Start Service', next: 'started', color: 'secondary', role: 'worker' },
  started: { label: 'Mark Completed', next: 'completed', color: 'success', role: 'worker' },
}

const BookingPage = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [ratingOpen, setRatingOpen] = useState(false)
  const [rated, setRated] = useState(false)

  const fetchBooking = useCallback(async () => {
    try {
      const data = await getBookingById(bookingId)
      setBooking(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load booking.')
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    fetchBooking()
    // Auto-refresh every 15s for live status
    const interval = setInterval(fetchBooking, 15000)
    return () => clearInterval(interval)
  }, [fetchBooking])

  const handleStatusUpdate = async (nextStatus) => {
    setUpdating(true)
    try {
      const updated = await updateBookingStatus(bookingId, nextStatus)
      setBooking(updated)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update status.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={48} />
        <Typography color="text.secondary">Loading booking details...</Typography>
      </Box>
    )
  }

  if (error && !booking) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate('/dashboard')} sx={{ mt: 2 }} variant="outlined">Back to Dashboard</Button>
      </Container>
    )
  }

  if (!booking) return null

  const isWorker = user?.role === 'worker'
  const isCustomer = user?.role === 'customer'
  const action = STATUS_ACTIONS[booking.status]
  const canAct = action && (
    (isWorker && action.role === 'worker') ||
    (isCustomer && action.role === 'customer')
  )

  const showRating =
    isCustomer &&
    booking.status === 'completed' &&
    !rated

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>{booking.service_type} Booking</Typography>
            <Typography variant="caption" color="text.secondary">ID: {booking.id}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" startIcon={<MdRefresh />} onClick={fetchBooking} disabled={updating} sx={{ borderRadius: 2 }}>
              Refresh
            </Button>
            <Button size="small" startIcon={<MdHome />} onClick={() => navigate('/dashboard')} sx={{ borderRadius: 2 }} variant="outlined">
              Dashboard
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Live Status Tracker */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.15)' }}>
          <Typography variant="h6" fontWeight={700} mb={2}>📊 Live Status</Typography>
          <BookingStepper status={booking.status} />
        </Paper>

        <Grid container spacing={3}>
          {/* Booking Details */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.15)', height: '100%' }}>
              <Typography variant="h6" fontWeight={700} mb={2}>📋 Service Details</Typography>
              {[
                ['Service', booking.service_type],
                ['Location', booking.location],
                ['Date', booking.preferred_date],
                ['Time', booking.preferred_time],
                ['Status', <Chip key="s" label={booking.status.replace(/_/g, ' ')} color={booking.status === 'completed' ? 'success' : booking.status === 'cancelled' ? 'error' : 'primary'} size="small" />],
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.8 }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="body2" fontWeight={600}>{value}</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>

          {/* Worker Info */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.15)', height: '100%' }}>
              <Typography variant="h6" fontWeight={700} mb={2}>👷 Worker Details</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  sx={{
                    width: 56, height: 56,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    fontSize: 20, fontWeight: 700,
                  }}
                >
                  {booking.worker_name?.[0]?.toUpperCase() || 'W'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>{booking.worker_name || 'Worker'}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MdStar color="#f59e0b" />
                    <Typography variant="body2">{booking.worker_rating?.toFixed(1) || 'N/A'}</Typography>
                  </Box>
                </Box>
              </Box>
              {booking.worker_phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MdPhone color="#6366f1" />
                  <Typography variant="body2">{booking.worker_phone}</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Status Action Button (for workers) */}
        {canAct && (
          <Box sx={{ mt: 3 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              color={action.color}
              disabled={updating}
              onClick={() => handleStatusUpdate(action.next)}
              sx={{
                borderRadius: 2, py: 1.5, fontWeight: 800,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' },
              }}
            >
              {updating ? <CircularProgress size={24} color="inherit" /> : action.label}
            </Button>
          </Box>
        )}

        {/* Rating CTA for completed bookings */}
        {showRating && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Paper
              sx={{
                mt: 3, p: 3, textAlign: 'center', borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(251,191,36,0.08))',
                border: '1px solid rgba(245,158,11,0.25)',
              }}
            >
              <Typography variant="h6" fontWeight={700} mb={1}>🎉 Service Completed!</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                How was your experience? Your feedback helps workers improve.
              </Typography>
              <Button
                variant="contained"
                onClick={() => setRatingOpen(true)}
                sx={{
                  borderRadius: 2, py: 1, px: 4, fontWeight: 700,
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  color: '#1a1a2e',
                  '&:hover': { background: 'linear-gradient(135deg, #d97706, #f59e0b)' },
                }}
              >
                ⭐ Rate Your Worker
              </Button>
            </Paper>
          </motion.div>
        )}
      </motion.div>

      <RatingModal
        open={ratingOpen}
        onClose={() => setRatingOpen(false)}
        booking={booking}
        onSuccess={() => {
          setRated(true)
          setRatingOpen(false)
        }}
      />
    </Container>
  )
}

export default BookingPage
