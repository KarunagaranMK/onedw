import { useState, useEffect, useCallback } from 'react'
import {
  Container, Typography, Box, CircularProgress, Alert, Paper,
  Chip, Button, Divider, Avatar, Grid, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Rating,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MdPhone, MdStar, MdRefresh, MdHome, MdKey, MdPayment,
  MdContentCopy, MdCheckCircle, MdImage, MdDescription,
  MdWarning, MdAttachMoney, MdNotes, MdAutoAwesome,
  MdShield, MdSend,
} from 'react-icons/md'
import { getBookingById, updateBookingStatus } from '../services/bookingService'
import { generateOTP, verifyOTP } from '../services/notifOtpPaymentService'
import {
  getBookingIssue, getBookingImages, getBookingWarranty,
  sendCounterOffer, uploadBeforeImage, uploadAfterImage,
} from '../services/issueService'
import { useAuth } from '../hooks/useAuth'
import BookingStepper from '../components/common/BookingStepper'
import RatingModal from '../components/common/RatingModal'
import AIAnalysisCard from '../components/common/AIAnalysisCard'
import BeforeAfterSlider from '../components/common/BeforeAfterSlider'
import WarrantyBadge from '../components/common/WarrantyBadge'

const STATUS_ACTIONS = {
  accepted: { label: 'Mark On The Way', next: 'worker_on_the_way', role: 'worker' },
  worker_on_the_way: { label: 'I Have Arrived', next: 'arrived', role: 'worker' },
  arrived: { label: 'Enter OTP to Start Job', next: null, role: 'worker' },
  started: { label: 'Mark Job Completed', next: 'completed', role: 'worker' },
}

const SEVERITY_COLORS = {
  low: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  high: { color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  emergency: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
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

  const [otpData, setOtpData] = useState(null)
  const [otpGenerating, setOtpGenerating] = useState(false)
  const [otpInput, setOtpInput] = useState('')
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [otpCopied, setOtpCopied] = useState(false)

  const [issueDetails, setIssueDetails] = useState(null)
  const [images, setImages] = useState({ before_images: [], after_images: [] })
  const [warranty, setWarranty] = useState(null)
  const [counterOfferOpen, setCounterOfferOpen] = useState(false)
  const [counterPrice, setCounterPrice] = useState('')
  const [counterMessage, setCounterMessage] = useState('')
  const [counterDuration, setCounterDuration] = useState('')
  const [counterSending, setCounterSending] = useState(false)
  const [beforeUploadFile, setBeforeUploadFile] = useState(null)
  const [afterUploadFile, setAfterUploadFile] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const fetchBooking = useCallback(async () => {
    try {
      const data = await getBookingById(bookingId)
      setBooking(data)

      try {
        const issue = await getBookingIssue(bookingId)
        if (issue && issue.issue_title) setIssueDetails(issue)
      } catch { /* no issue details yet */ }

      try {
        const imgs = await getBookingImages(bookingId)
        setImages(imgs)
      } catch { /* no images yet */ }

      try {
        const warr = await getBookingWarranty(bookingId)
        if (warr && warr.status !== 'none') setWarranty(warr)
      } catch { /* no warranty yet */ }
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
      await fetchBooking()
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

  const handleSendCounterOffer = async () => {
    if (!counterPrice || parseFloat(counterPrice) <= 0) return
    setCounterSending(true)
    try {
      await sendCounterOffer(bookingId, parseFloat(counterPrice), counterMessage, counterDuration)
      setCounterOfferOpen(false)
      setCounterPrice('')
      setCounterMessage('')
      setCounterDuration('')
      await fetchBooking()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send counter offer.')
    } finally {
      setCounterSending(false)
    }
  }

  const handleBeforeUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      await uploadBeforeImage(bookingId, file)
      const imgs = await getBookingImages(bookingId)
      setImages(imgs)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload before photo.')
    } finally {
      setUploadingPhoto(false)
      setBeforeUploadFile(null)
    }
  }

  const handleAfterUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      await uploadAfterImage(bookingId, file)
      const imgs = await getBookingImages(bookingId)
      setImages(imgs)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload after photo.')
    } finally {
      setUploadingPhoto(false)
      setAfterUploadFile(null)
    }
  }

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
      <CircularProgress size={48} />
      <Typography color="text.secondary">Loading booking details...</Typography>
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
  const showWarranty = isCustomer && booking.status === 'completed'
  const showBeforeAfter = booking.status === 'started' || booking.status === 'completed'

  const showGenerateOTP = isCustomer && ['accepted', 'worker_on_the_way', 'arrived'].includes(booking.status)
  const showVerifyOTP = isWorker && booking.status === 'arrived'

  const severityCfg = SEVERITY_COLORS[issueDetails?.severity] || SEVERITY_COLORS.medium

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

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

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.15)' }}>
          <Typography variant="h6" fontWeight={700} mb={2}>Live Status</Typography>
          <BookingStepper status={booking.status} />
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.15)', height: '100%' }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Service Details</Typography>
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

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.15)', height: '100%' }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Worker Details</Typography>
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

        {issueDetails && issueDetails.issue_title && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Paper sx={{
              mt: 3, p: 3, borderRadius: 3,
              background: 'linear-gradient(135deg,rgba(99,102,241,0.04),rgba(139,92,246,0.04))',
              border: '1px solid rgba(99,102,241,0.15)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MdDescription color="#6366f1" size={22} />
                  <Typography variant="h6" fontWeight={800}>Issue Details</Typography>
                </Box>
                <Chip
                  label={issueDetails.severity?.toUpperCase()}
                  size="small"
                  sx={{ bgcolor: severityCfg.bg, color: severityCfg.color, fontWeight: 700 }}
                />
              </Box>

              <Typography variant="subtitle1" fontWeight={700} mb={0.5}>{issueDetails.issue_title}</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>{issueDetails.issue_description}</Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {issueDetails.issue_category && (
                  <Chip label={issueDetails.issue_category} size="small" sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#6366f1', fontWeight: 600 }} />
                )}
                {issueDetails.expected_budget && (
                  <Chip icon={<MdAttachMoney size={14} />} label={`Budget: Rs.${issueDetails.expected_budget}`} size="small"
                    sx={{ bgcolor: 'rgba(34,197,94,0.1)', color: '#16a34a', fontWeight: 600 }} />
                )}
              </Box>

              {issueDetails.preferred_notes && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, bgcolor: 'rgba(245,158,11,0.06)', borderRadius: 2, mb: 2 }}>
                  <MdNotes color="#f59e0b" size={18} style={{ marginTop: 2 }} />
                  <Typography variant="body2" color="text.secondary">{issueDetails.preferred_notes}</Typography>
                </Box>
              )}

              {issueDetails.issue_images && issueDetails.issue_images.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" mb={1} display="block">
                    <MdImage style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {issueDetails.issue_images.length} image(s) uploaded
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                    {issueDetails.issue_images.map((img, i) => (
                      <Box key={i} component="img" src={img.thumbnail_url || img.url} alt={`Issue ${i + 1}`}
                        sx={{ width: 80, height: 80, borderRadius: 2, objectFit: 'cover', border: '2px solid rgba(99,102,241,0.2)' }} />
                    ))}
                  </Box>
                </Box>
              )}

              {issueDetails.voice_recording && (
                <Box sx={{ mb: 1 }}>
                  <audio controls src={issueDetails.voice_recording.url} style={{ width: '100%', height: 36 }} />
                  {issueDetails.voice_transcript && (
                    <Typography variant="caption" color="text.secondary" mt={0.5} display="block" fontStyle="italic">
                      Transcript: "{issueDetails.voice_transcript}"
                    </Typography>
                  )}
                </Box>
              )}

              {issueDetails.ai_analysis && (
                <Box sx={{ mt: 2 }}>
                  <AIAnalysisCard analysis={issueDetails.ai_analysis} />
                </Box>
              )}

              {issueDetails.estimated_cost && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(34,197,94,0.06)', borderRadius: 2, border: '1px solid rgba(34,197,94,0.15)' }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>Estimated Cost Range</Typography>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Minimum</Typography>
                      <Typography variant="body2" fontWeight={700} color="#22c55e">Rs.{issueDetails.estimated_cost.minimum_cost}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Average</Typography>
                      <Typography variant="body2" fontWeight={700} color="#6366f1">Rs.{issueDetails.estimated_cost.average_cost}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Maximum</Typography>
                      <Typography variant="body2" fontWeight={700} color="#f59e0b">Rs.{issueDetails.estimated_cost.maximum_cost}</Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Paper>
          </motion.div>
        )}

        {booking.worker_quote && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Paper sx={{
              mt: 3, p: 3, borderRadius: 3,
              background: 'linear-gradient(135deg,rgba(245,158,11,0.06),rgba(251,191,36,0.06))',
              border: '1px solid rgba(245,158,11,0.2)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MdSend color="#f59e0b" size={22} />
                <Typography variant="h6" fontWeight={800}>Worker Quote</Typography>
              </Box>
              <Typography variant="h4" fontWeight={900} color="#f59e0b" mb={1}>
                Rs.{booking.worker_quote.price}
              </Typography>
              {booking.worker_quote.message && (
                <Typography variant="body2" color="text.secondary" mb={1}>{booking.worker_quote.message}</Typography>
              )}
              {booking.worker_quote.duration && (
                <Typography variant="caption" color="text.secondary">Estimated Duration: {booking.worker_quote.duration}</Typography>
              )}
            </Paper>
          </motion.div>
        )}

        {(showBeforeAfter) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Paper sx={{ mt: 3, p: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.15)' }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Before & After Photos</Typography>

              {(images.before_images.length > 0 || images.after_images.length > 0) ? (
                <BeforeAfterSlider beforeImages={images.before_images} afterImages={images.after_images} />
              ) : (
                <Typography variant="body2" color="text.secondary" mb={2}>No before/after photos uploaded yet.</Typography>
              )}

              {isWorker && booking.status === 'started' && (
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button variant="outlined" component="label" disabled={uploadingPhoto} sx={{ borderRadius: 2, fontWeight: 700 }}>
                    {uploadingPhoto ? <CircularProgress size={18} /> : 'Upload Before Photo'}
                    <input type="file" hidden accept="image/*" onChange={handleBeforeUpload} />
                  </Button>
                  <Button variant="outlined" component="label" disabled={uploadingPhoto} sx={{ borderRadius: 2, fontWeight: 700 }}>
                    {uploadingPhoto ? <CircularProgress size={18} /> : 'Upload After Photo'}
                    <input type="file" hidden accept="image/*" onChange={handleAfterUpload} />
                  </Button>
                </Box>
              )}
            </Paper>
          </motion.div>
        )}

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
                    <Button variant="contained" onClick={handleGenerateOTP} disabled={otpGenerating}
                      sx={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontWeight: 700, borderRadius: 2 }}>
                      {otpGenerating ? <CircularProgress size={22} color="inherit" /> : 'Generate OTP'}
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
                    <TextField label="Enter OTP" value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      size="small" inputProps={{ maxLength: 6, style: { letterSpacing: 6, fontWeight: 800, fontSize: 20 } }}
                      sx={{ width: 180 }} onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()} />
                    <Button variant="contained" onClick={handleVerifyOTP} disabled={otpVerifying || otpInput.length !== 6}
                      sx={{ background: 'linear-gradient(135deg,#10b981,#059669)', fontWeight: 700, borderRadius: 2, py: 1 }}>
                      {otpVerifying ? <CircularProgress size={22} color="inherit" /> : 'Verify & Start'}
                    </Button>
                  </Box>
                  {otpError && <Alert severity="error" sx={{ mt: 1 }}>{otpError}</Alert>}
                </>
              )}
            </Paper>
          </motion.div>
        )}

        {isWorker && booking.status === 'accepted' && (
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button fullWidth variant="contained" size="large" disabled={updating}
              onClick={() => handleStatusUpdate(action.next)}
              sx={{ borderRadius: 2, py: 1.5, fontWeight: 800, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {updating ? <CircularProgress size={24} color="inherit" /> : action.label}
            </Button>
            <Button fullWidth variant="outlined" size="large"
              onClick={() => setCounterOfferOpen(true)}
              sx={{ borderRadius: 2, py: 1.5, fontWeight: 800, borderColor: '#f59e0b', color: '#f59e0b' }}>
              <MdAttachMoney style={{ marginRight: 6 }} /> Send Quote
            </Button>
          </Box>
        )}

        {canAct && action.next && booking.status !== 'accepted' && (
          <Box sx={{ mt: 3 }}>
            <Button fullWidth variant="contained" size="large" disabled={updating}
              onClick={() => handleStatusUpdate(action.next)}
              sx={{ borderRadius: 2, py: 1.5, fontWeight: 800, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {updating ? <CircularProgress size={24} color="inherit" /> : action.label}
            </Button>
          </Box>
        )}

        {showPayment && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Paper sx={{
              mt: 3, p: 3, borderRadius: 3,
              background: 'linear-gradient(135deg,rgba(16,185,129,0.06),rgba(5,150,105,0.06))',
              border: '1px solid rgba(16,185,129,0.2)',
            }}>
              <Typography variant="h6" fontWeight={700} mb={1}>Pay & Get Invoice</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Service completed! Pay securely and get your invoice instantly.
              </Typography>
              <Button variant="contained" startIcon={<MdPayment />}
                onClick={() => navigate(`/payment/${bookingId}`)}
                sx={{ background: 'linear-gradient(135deg,#10b981,#059669)', fontWeight: 800, borderRadius: 2 }}>
                Pay & View Invoice
              </Button>
            </Paper>
          </motion.div>
        )}

        {showWarranty && (
          <Box sx={{ mt: 3 }}>
            <WarrantyBadge warranty={warranty} />
          </Box>
        )}

        {showRating && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Paper sx={{
              mt: 3, p: 3, textAlign: 'center', borderRadius: 3,
              background: 'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(251,191,36,0.08))',
              border: '1px solid rgba(245,158,11,0.25)',
            }}>
              <Typography variant="h6" fontWeight={700} mb={1}>How was your experience?</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Your feedback helps workers improve and helps others choose the best professional.
              </Typography>
              <Button variant="contained" onClick={() => setRatingOpen(true)}
                sx={{ borderRadius: 2, py: 1, px: 4, fontWeight: 700, background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#1a1a2e' }}>
                <MdStar style={{ marginRight: 6 }} /> Rate Your Worker
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

      <Dialog open={counterOfferOpen} onClose={() => setCounterOfferOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, border: '1px solid rgba(245,158,11,0.2)' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          <MdAttachMoney style={{ verticalAlign: 'middle', marginRight: 8, color: '#f59e0b' }} />
          Send Quote to Customer
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Estimated Price (Rs.)" type="number" value={counterPrice}
            onChange={(e) => setCounterPrice(e.target.value)} sx={{ mt: 1, mb: 2 }} />
          <TextField fullWidth label="Estimated Duration" placeholder="e.g. 1-2 hours"
            value={counterDuration} onChange={(e) => setCounterDuration(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth multiline rows={3} label="Message to customer (optional)"
            value={counterMessage} onChange={(e) => setCounterMessage(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCounterOfferOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSendCounterOffer} disabled={counterSending || !counterPrice}
            sx={{ borderRadius: 2, fontWeight: 700, background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#1a1a2e' }}>
            {counterSending ? <CircularProgress size={20} color="inherit" /> : 'Send Quote'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default BookingPage
