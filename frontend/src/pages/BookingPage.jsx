import { useState, useEffect, useCallback } from 'react'
import {
  Container, Typography, Box, CircularProgress, Alert, Paper,
  Chip, Button, Divider, Avatar, Grid, TextField, InputAdornment,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MdPhone, MdStar, MdRefresh, MdHome, MdKey, MdPayment,
  MdContentCopy, MdCheckCircle,
} from 'react-icons/md'
import { getBookingById, updateBookingStatus } from '../services/bookingService'
import { generateOTP, verifyOTP } from '../services/notifOtpPaymentService'
import { useAuth } from '../hooks/useAuth'
import BookingStepper from '../components/common/BookingStepper'
import RatingModal from '../components/common/RatingModal'

const STATUS_ACTIONS = {
  accepted: { label: 'Mark On The Way', next: 'worker_on_the_way', role: 'worker' },
  worker_on_the_way: { label: 'I Have Arrived', next: 'arrived', role: 'worker' },
  arrived: { label: 'Enter OTP to Start Job', next: null, role: 'worker' },
  started: { label: 'Mark Job Completed', next: 'completed', role: 'worker' },
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

  // OTP state
  const [otpData, setOtpData] = useState(null)      // { otp, message }
  const [otpGenerating, setOtpGenerating] = useState(false)
  const [otpInput, setOtpInput] = useState('')
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [otpCopied, setOtpCopied] = useState(false)

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
    const interval = setInterval(fetchBooking, 15000)
    return () => clearInterval(interval)
  }, [fetchBooking])

  const handleStatusUpdate = async (nextStatus) => {
    if (!nextStatus) return
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

  const handleGenerateOTP = async () => {
    setOtpGenerating(true)
    setOtpError('')
    try {
      const result = await generateOTP(bookingId)
      setOtpData(result)
    } catch (err) {
      setOtpError(err.response?.data?.detail || 'Failed to generate OTP.')
    } finally {
      setOtpGenerating(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otpInput.trim()) { setOtpError('Enter the OTP from the customer.'); return }
    setOtpVerifying(true)
    setOtpError('')
    try {
      await verifyOTP(bookingId, otpInput.trim())
      await fetchBooking()   // refresh booking status to 'started'
      setOtpInput('')
    } catch (err) {
      setOtpError(err.response?.data?.detail || 'Incorrect OTP. Try again.')
    } finally {
      setOtpVerifying(false)
    }
  }

  const copyOTP = () => {
    if (otpData?.otp) {
      navigator.clipboard.writeText(otpData.otp)
      setOtpCopied(true)
      setTimeout(() => setOtpCopied(false), 2000)
    }
  }

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
      <CircularProgress size={48} />
      <Typography color="text.secondary">Loading booking details…</Typography>
    </Box>
  )

  if (error && !booking) return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Alert severity="error">{error}</Alert>
      <Button onClick={() => navigate('/dashboard')} sx={{ mt: 2 }} variant="outlined">Back to Dashboard</Button>
    </Container>
  )

  if (!booking) return null

  const isWorker = user?.role === 'worker'
  const isCustomer = user?.role === 'customer'
  const action = STATUS_ACTIONS[booking.status]
  const canAct = action && ((isWorker && action.role === 'worker') || (isCustomer && action.role === 'customer'))
  const showRating = isCustomer && booking.status === 'completed' && !rated
  const showPayment = isCustomer && booking.status === 'completed'

  // OTP: customer sees "Generate OTP" when booking is accepted/arrived
  const showGenerateOTP = isCustomer && ['accepted', 'worker_on_the_way', 'arrived'].includes(booking.status)
  // OTP: worker sees OTP entry form when status is 'arrived'
  const showVerifyOTP = isWorker && booking.status === 'arrived'

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
                ['Status', <Chip key="s" label={booking.status.replace(/_/g, ' ')}
                  color={booking.status === 'completed' ? 'success' : booking.status === 'cancelled' ? 'error' : 'primary'} size="small" />],
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
                <Avatar sx={{ width: 56, height: 56, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontSize: 20, fontWeight: 700 }}>
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

        {/* ─── OTP SECTION ─── */}
        {(showGenerateOTP || showVerifyOTP) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Paper sx={{
              mt: 3, p: 3, borderRadius: 3,
              background: 'linear-gradient(135deg,rgba(99,102,241,0.06),rgba(139,92,246,0.06))',
              border: '1px solid rgba(99,102,241,0.2)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MdKey size={22} color="#6366f1" />
                <Typography variant="h6" fontWeight={800}>OTP Verification</Typography>
              </Box>

              {showGenerateOTP && (
                <>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Generate an OTP and share it with your worker to confirm they've arrived.
                  </Typography>

                  {!otpData ? (
                    <Button
                      variant="contained"
                      onClick={handleGenerateOTP}
                      disabled={otpGenerating}
                      sx={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontWeight: 700, borderRadius: 2 }}
                    >
                      {otpGenerating ? <CircularProgress size={22} color="inherit" /> : '🔑 Generate OTP'}
                    </Button>
                  ) : (
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                      <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 2,
                        bgcolor: 'rgba(16,185,129,0.1)', border: '2px solid #10b981',
                        borderRadius: 2, px: 3, py: 2,
                      }}>
                        <Typography variant="h3" fontWeight={900} letterSpacing={8} color="#10b981">
                          {otpData.otp}
                        </Typography>
                        <Button size="small" startIcon={otpCopied ? <MdCheckCircle /> : <MdContentCopy />}
                          onClick={copyOTP} sx={{ color: otpCopied ? '#10b981' : '#6366f1' }}>
                          {otpCopied ? 'Copied!' : 'Copy'}
                        </Button>
                      </Box>
                      <Typography variant="caption" color="text.secondary" mt={1} display="block">
                        Share this OTP with your worker. Valid for 30 minutes.
                      </Typography>
                      <Button size="small" onClick={handleGenerateOTP} disabled={otpGenerating} sx={{ mt: 1, color: '#6366f1' }}>
                        Regenerate
                      </Button>
                    </motion.div>
                  )}
                </>
              )}

              {showVerifyOTP && (
                <>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Enter the 6-digit OTP from the customer to start the job.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <TextField
                      label="Enter OTP"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      size="small"
                      inputProps={{ maxLength: 6, style: { letterSpacing: 6, fontWeight: 800, fontSize: 20 } }}
                      sx={{ width: 180 }}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                    />
                    <Button
                      variant="contained"
                      onClick={handleVerifyOTP}
                      disabled={otpVerifying || otpInput.length !== 6}
                      sx={{ background: 'linear-gradient(135deg,#10b981,#059669)', fontWeight: 700, borderRadius: 2, py: 1 }}
                    >
                      {otpVerifying ? <CircularProgress size={22} color="inherit" /> : '✅ Verify & Start'}
                    </Button>
                  </Box>
                  {otpError && <Alert severity="error" sx={{ mt: 1 }}>{otpError}</Alert>}
                </>
              )}
            </Paper>
          </motion.div>
        )}

        {/* Worker status action button */}
        {canAct && action.next && (
          <Box sx={{ mt: 3 }}>
            <Button fullWidth variant="contained" size="large"
              disabled={updating} onClick={() => handleStatusUpdate(action.next)}
              sx={{ borderRadius: 2, py: 1.5, fontWeight: 800, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {updating ? <CircularProgress size={24} color="inherit" /> : action.label}
            </Button>
          </Box>
        )}

        {/* Payment CTA for completed bookings */}
        {showPayment && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Paper sx={{
              mt: 3, p: 3, borderRadius: 3,
              background: 'linear-gradient(135deg,rgba(16,185,129,0.06),rgba(5,150,105,0.06))',
              border: '1px solid rgba(16,185,129,0.2)',
            }}>
              <Typography variant="h6" fontWeight={700} mb={1}>💳 Pay & Get Invoice</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Service completed! Pay securely and get your invoice instantly.
              </Typography>
              <Button
                variant="contained"
                startIcon={<MdPayment />}
                onClick={() => navigate(`/payment/${bookingId}`)}
                sx={{ background: 'linear-gradient(135deg,#10b981,#059669)', fontWeight: 800, borderRadius: 2 }}
              >
                Pay & View Invoice
              </Button>
            </Paper>
          </motion.div>
        )}

        {/* Rating CTA */}
        {showRating && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Paper sx={{
              mt: 3, p: 3, textAlign: 'center', borderRadius: 3,
              background: 'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(251,191,36,0.08))',
              border: '1px solid rgba(245,158,11,0.25)',
            }}>
              <Typography variant="h6" fontWeight={700} mb={1}>🎉 How was your experience?</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Your feedback helps workers improve and helps others choose the best professional.
              </Typography>
              <Button variant="contained" onClick={() => setRatingOpen(true)}
                sx={{ borderRadius: 2, py: 1, px: 4, fontWeight: 700, background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#1a1a2e' }}>
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
        onSuccess={() => { setRated(true); setRatingOpen(false) }}
      />
    </Container>
  )
}

export default BookingPage
