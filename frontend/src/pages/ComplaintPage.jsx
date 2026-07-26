import { useState } from 'react'
import {
  Container, Box, Typography, Paper, Button, TextField,
  MenuItem, Grid, Chip, Alert, CircularProgress, useTheme,
  Stepper, Step, StepLabel,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MdArrowBack, MdSend, MdReportProblem, MdCheckCircle } from 'react-icons/md'
import { createComplaint } from '../services/complaintService'

const CATEGORIES = [
  "Worker didn't arrive", "Poor work quality", "Overcharging",
  "Wrong service", "Damage to property", "Inappropriate behavior",
  "Safety issue", "Payment issue", "Fake worker", "Fake customer",
  "Refund request", "Warranty claim", "Other",
]

const PRIORITIES = [
  { value: 'low',      label: '🟢 Low',      desc: 'Minor issue, no urgency' },
  { value: 'medium',   label: '🟡 Medium',   desc: 'Moderate impact, timely response needed' },
  { value: 'high',     label: '🟠 High',     desc: 'Significant impact, urgent attention required' },
  { value: 'critical', label: '🔴 Critical', desc: 'Severe issue, immediate action needed' },
]

export default function ComplaintPage() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    booking_id: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.description.trim() || form.description.length < 10) e.description = 'Please provide a detailed description (min 10 characters)'
    if (!form.category) e.category = 'Please select a category'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(er => ({ ...er, [e.target.name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await createComplaint({
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        booking_id: form.booking_id || undefined,
      })
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err?.response?.data?.detail || 'Failed to submit complaint. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const glassCard = {
    borderRadius: 4, p: { xs: 3, md: 4 },
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.92)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(108,71,255,0.1)',
    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(108,71,255,0.08)',
  }

  if (submitted) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isDark ? 'linear-gradient(135deg,#08080F,#0D0D1A)' : 'linear-gradient(135deg,#F0EDFF,#FAFAFA)' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
          <Paper sx={{ ...glassCard, textAlign: 'center', maxWidth: 480, mx: 'auto' }}>
            <MdCheckCircle size={80} color="#22C55E" style={{ marginBottom: 16 }} />
            <Typography variant="h5" fontWeight={900} mb={1}>Complaint Submitted!</Typography>
            <Typography color="text.secondary" mb={3}>
              Our support team will review your complaint and respond within 24–48 hours.
              You can track its status from your complaints page.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={() => navigate('/my-complaints')} sx={{ borderRadius: 2.5, fontWeight: 700 }}>
                View My Complaints
              </Button>
              <Button variant="contained" onClick={() => navigate('/customer-dashboard')} sx={{ borderRadius: 2.5, fontWeight: 700 }}>
                Go to Dashboard
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Box>
    )
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: isDark ? 'linear-gradient(135deg,#08080F,#0D0D1A)' : 'linear-gradient(135deg,#F0EDFF,#FAFAFA)',
      py: { xs: 3, md: 6 },
    }}>
      <Container maxWidth="md">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Button startIcon={<MdArrowBack />} onClick={() => navigate(-1)} sx={{ color: 'text.secondary', mb: 2 }}>Back</Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Box sx={{ width: 52, height: 52, borderRadius: 3, background: 'linear-gradient(135deg,#FF6B35,#FF9A5C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(255,107,53,0.3)' }}>
              <MdReportProblem size={28} color="#fff" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={900}>File a Complaint</Typography>
              <Typography variant="body2" color="text.secondary">We take every complaint seriously and resolve it promptly</Typography>
            </Box>
          </Box>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Paper sx={glassCard} component="form" onSubmit={handleSubmit}>
            {submitError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{submitError}</Alert>}

            <Grid container spacing={3}>
              {/* Title */}
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Complaint Title" name="title"
                  value={form.title} onChange={handleChange}
                  error={!!errors.title} helperText={errors.title}
                  placeholder="Brief summary of your issue"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                />
              </Grid>

              {/* Category + Priority */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select fullWidth label="Category" name="category"
                  value={form.category} onChange={handleChange}
                  error={!!errors.category} helperText={errors.category}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                >
                  {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select fullWidth label="Priority" name="priority"
                  value={form.priority} onChange={handleChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                >
                  {PRIORITIES.map(p => (
                    <MenuItem key={p.value} value={p.value}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{p.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{p.desc}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Booking ID (optional) */}
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Related Booking ID (Optional)" name="booking_id"
                  value={form.booking_id} onChange={handleChange}
                  placeholder="Paste your booking ID if this relates to a specific booking"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth multiline rows={6}
                  label="Detailed Description" name="description"
                  value={form.description} onChange={handleChange}
                  error={!!errors.description} helperText={errors.description || `${form.description.length}/3000 characters`}
                  placeholder="Please describe your issue in detail — what happened, when, and how it affected you..."
                  inputProps={{ maxLength: 3000 }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                />
              </Grid>

              {/* Priority indicator */}
              <Grid item xs={12}>
                <Box sx={{
                  p: 2, borderRadius: 3,
                  bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(108,71,255,0.04)',
                  border: '1px dashed rgba(108,71,255,0.2)',
                }}>
                  <Typography variant="body2" fontWeight={700} mb={0.5}>📋 What happens next?</Typography>
                  <Typography variant="caption" color="text.secondary">
                    1. Your complaint is submitted and assigned a tracking ID.<br />
                    2. Our support team reviews it within 24 hours.<br />
                    3. We investigate and contact you if more information is needed.<br />
                    4. Resolution is provided and the complaint is closed.
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit" fullWidth variant="contained" size="large"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <MdSend />}
                  sx={{
                    borderRadius: 2.5, py: 1.5, fontWeight: 800, fontSize: '1rem',
                    background: 'linear-gradient(135deg,#FF6B35,#FF9A5C)',
                    boxShadow: '0 8px 32px rgba(255,107,53,0.35)',
                    '&:hover': { background: 'linear-gradient(135deg,#E55A24,#E8874A)', transform: 'translateY(-1px)' },
                    transition: 'all 0.2s',
                  }}
                >
                  {submitting ? 'Submitting Complaint…' : 'Submit Complaint'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  )
}
