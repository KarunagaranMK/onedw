import { useState, useEffect, useCallback } from 'react'
import {
  Container, Paper, Typography, TextField, MenuItem, Button, Box,
  CircularProgress, Alert, Stepper, Step, StepLabel, Chip, Radio,
  RadioGroup, FormControlLabel, FormControl, FormLabel, Slider, Grid,
  Snackbar, Divider,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  MdArrowBack, MdArrowForward, MdCloudUpload, MdDescription,
  MdCategory, MdPriorityHigh, MdAttachMoney, MdNotes, MdCheckCircle,
  MdMic, MdImage, MdVideoLibrary,
} from 'react-icons/md'
import MediaUploader from '../components/common/MediaUploader'
import VoiceRecorder from '../components/common/VoiceRecorder'
import AIAnalysisCard from '../components/common/AIAnalysisCard'
import { createBooking } from '../services/bookingService'
import { updateBookingIssue, analyzeImage, transcribeVoice, estimateCost } from '../services/issueService'
import { useAuth } from '../hooks/useAuth'

const ISSUE_CATEGORIES = {
  'Plumber': ['Pipe leakage', 'Broken tap', 'Bathroom blockage', 'Kitchen sink blockage', 'Water tank overflow', 'Other'],
  'Electrician': ['Fan not working', 'Wiring issue', 'Fuse problem', 'MCB trip', 'Switch damage', 'Other'],
  'Carpenter': ['Broken table', 'Door repair', 'Lock fitting', 'Window repair', 'Other'],
  'Painter': ['Paint peeling', 'Wall cracks', 'Water seepage', 'Other'],
  'AC Repair': ['Cooling issue', 'Water leakage', 'Noise problem', 'Other'],
  'Cleaning': ['Kitchen cleaning', 'Bathroom cleaning', 'Sofa cleaning', 'Deep cleaning', 'Other'],
  'Appliance Repair': ['Not starting', 'Making noise', 'Heating issue', 'Other'],
  'Water Tank Cleaning': ['Sediment removal', 'Algae growth', 'Full cleaning', 'Other'],
  'Gardening': ['Lawn mowing', 'Plant trimming', 'Weed removal', 'Other'],
}

const STEPS = ['Issue Details', 'Media Upload', 'AI Analysis', 'Review & Confirm']

const SEVERITY_OPTIONS = [
  { value: 'Low', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' },
  { value: 'Medium', color: '#eab308', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.3)' },
  { value: 'High', color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
  { value: 'Emergency', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
]

const MotionBox = motion.create(Box)

const StepIcon = ({ active, completed, icon }) => (
  <motion.div
    animate={active ? { scale: [1, 1.2, 1] } : { scale: 1 }}
    transition={{ duration: 1.5, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: completed
          ? 'linear-gradient(135deg, #22c55e, #16a34a)'
          : active
            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
            : 'rgba(0,0,0,0.08)',
        color: completed || active ? '#fff' : 'rgba(0,0,0,0.4)',
        fontWeight: 700,
        fontSize: '0.9rem',
        boxShadow: active
          ? '0 0 0 6px rgba(99,102,241,0.15), 0 4px 16px rgba(99,102,241,0.3)'
          : completed
            ? '0 4px 16px rgba(34,197,94,0.3)'
            : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      {completed ? <MdCheckCircle size={22} /> : icon}
    </Box>
  </motion.div>
)

const glassSx = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(99,102,241,0.15)',
  borderRadius: 4,
  boxShadow: '0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(99,102,241,0.04)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1)',
  },
}

const IssueDetailsPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const requestId = searchParams.get('requestId')
  const workerId = searchParams.get('workerId')
  const serviceType = searchParams.get('service') || searchParams.get('serviceType') || 'Plumber'
  const lat = searchParams.get('lat') || ''
  const lon = searchParams.get('lon') || ''

  const [activeStep, setActiveStep] = useState(0)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })
  const [submitting, setSubmitting] = useState(false)

  const [issueTitle, setIssueTitle] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [issueCategory, setIssueCategory] = useState('')
  const [severity, setSeverity] = useState('Medium')
  const [expectedBudget, setExpectedBudget] = useState('')
  const [preferredNotes, setPreferredNotes] = useState('')

  const [uploadedMedia, setUploadedMedia] = useState([])
  const [voiceRecording, setVoiceRecording] = useState(null)

  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [costEstimate, setCostEstimate] = useState(null)
  const [costLoading, setCostLoading] = useState(false)

  const categories = ISSUE_CATEGORIES[serviceType] || ISSUE_CATEGORIES['Plumber']

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }

  const runAiAnalysis = useCallback(async (media) => {
    const imageItem = media.find(m => m.media_type === 'image')
    if (!imageItem?.url) return

    setAiLoading(true)
    setAiError('')
    try {
      const result = await analyzeImage(imageItem.url, serviceType)
      setAiAnalysis(result)
    } catch {
      setAiError('AI analysis failed. You can continue without it.')
    } finally {
      setAiLoading(false)
    }
  }, [serviceType])

  const fetchCostEstimate = useCallback(async () => {
    setCostLoading(true)
    try {
      const result = await estimateCost(serviceType, issueCategory, severity, uploadedMedia.length)
      setCostEstimate(result)
    } catch {
    } finally {
      setCostLoading(false)
    }
  }, [serviceType, issueCategory, severity, uploadedMedia.length])

  const fetchVoiceTranscript = useCallback(async (recording) => {
    if (!recording?.url) return
    try {
      const result = await transcribeVoice(recording.url)
      setVoiceTranscript(result?.transcript || result?.text || '')
    } catch {
    }
  }, [])

  useEffect(() => {
    if (activeStep === 2 && uploadedMedia.length > 0 && !aiAnalysis && !aiLoading) {
      runAiAnalysis(uploadedMedia)
      fetchCostEstimate()
    }
    if (activeStep === 2 && voiceRecording && !voiceTranscript) {
      fetchVoiceTranscript(voiceRecording)
    }
  }, [activeStep, uploadedMedia, voiceRecording, aiAnalysis, aiLoading, voiceTranscript, runAiAnalysis, fetchCostEstimate, fetchVoiceTranscript])

  const getStepErrors = () => {
    if (activeStep === 0) {
      if (issueTitle.trim().length < 3) return 'Issue title must be at least 3 characters'
      if (issueDescription.trim().length < 10) return 'Issue description must be at least 10 characters'
      if (!issueCategory) return 'Please select an issue category'
    }
    return ''
  }

  const handleNext = () => {
    const error = getStepErrors()
    if (error) {
      showToast(error, 'error')
      return
    }
    setActiveStep(prev => Math.min(prev + 1, 3))
  }

  const handleBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 0))
  }

  const handleConfirm = async () => {
    if (!requestId || !workerId) {
      showToast('Missing request or worker information', 'error')
      return
    }

    setSubmitting(true)
    try {
      const booking = await createBooking(requestId, workerId)

      const issueDetails = {
        issue_title: issueTitle.trim(),
        issue_description: issueDescription.trim(),
        issue_category: issueCategory,
        severity: severity.toLowerCase(),
        expected_budget: expectedBudget ? Number(expectedBudget) : null,
        preferred_notes: preferredNotes.trim() || null,
        media: uploadedMedia,
        voice_recording: voiceRecording,
        ai_analysis: aiAnalysis,
        voice_transcript: voiceTranscript || null,
        cost_estimate: costEstimate,
      }

      await updateBookingIssue(booking.id, issueDetails)
      showToast('Booking confirmed! Redirecting...')
      setTimeout(() => navigate(`/booking/${booking.id}`), 1000)
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create booking. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const getSeverityColor = (val) => {
    const opt = SEVERITY_OPTIONS.find(s => s.value === val)
    return opt || SEVERITY_OPTIONS[1]
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <motion.div
            key="step-0"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
          >
            <Paper sx={{ ...glassSx, p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                }}>
                  <MdDescription size={18} />
                </Box>
                <Typography variant="h6" fontWeight={700}>Issue Details</Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Issue Title"
                    placeholder="e.g., Kitchen pipe leaking heavily"
                    value={issueTitle}
                    onChange={(e) => setIssueTitle(e.target.value)}
                    required
                    inputProps={{ minLength: 3 }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': { borderColor: '#6366f1' },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Issue Description"
                    placeholder="Describe the problem in detail..."
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    required
                    inputProps={{ minLength: 10 }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': { borderColor: '#6366f1' },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Issue Category"
                    value={issueCategory}
                    onChange={(e) => setIssueCategory(e.target.value)}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': { borderColor: '#6366f1' },
                      },
                    }}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl component="fieldset" fullWidth>
                    <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <MdPriorityHigh size={16} color="#6366f1" /> Severity
                    </FormLabel>
                    <RadioGroup
                      row
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      sx={{ gap: 1, flexWrap: 'wrap' }}
                    >
                      {SEVERITY_OPTIONS.map((opt) => (
                        <FormControlLabel
                          key={opt.value}
                          value={opt.value}
                          control={<Radio sx={{ display: 'none' }} />}
                          label={
                            <Chip
                              label={opt.value}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                bgcolor: severity === opt.value ? opt.bg : 'transparent',
                                color: severity === opt.value ? opt.color : 'rgba(0,0,0,0.5)',
                                border: `1.5px solid ${severity === opt.value ? opt.border : 'rgba(0,0,0,0.12)'}`,
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                              }}
                            />
                          }
                          sx={{ m: 0 }}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Expected Budget (INR)"
                    placeholder="Optional"
                    value={expectedBudget}
                    onChange={(e) => setExpectedBudget(e.target.value)}
                    InputProps={{
                      startAdornment: <MdAttachMoney size={18} style={{ marginRight: 4, color: 'rgba(0,0,0,0.4)' }} />,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': { borderColor: '#6366f1' },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Preferred Notes"
                    placeholder="e.g., Ring the bell, Come after 6 PM"
                    value={preferredNotes}
                    onChange={(e) => setPreferredNotes(e.target.value)}
                    InputProps={{
                      startAdornment: <MdNotes size={18} style={{ marginRight: 4, color: 'rgba(0,0,0,0.4)' }} />,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': { borderColor: '#6366f1' },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </motion.div>
        )

      case 1:
        return (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ ...glassSx, p: { xs: 3, md: 4 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: '10px',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                    }}>
                      <MdCloudUpload size={18} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>Upload Media</Typography>
                  </Box>

                  <MediaUploader
                    onMediaChange={setUploadedMedia}
                    maxImages={5}
                    maxVideos={2}
                  />

                  {uploadedMedia.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
                      {uploadedMedia.filter(m => m.media_type === 'image').length > 0 && (
                        <Chip
                          icon={<MdImage size={14} />}
                          label={`${uploadedMedia.filter(m => m.media_type === 'image').length} image(s)`}
                          size="small"
                          sx={{ fontWeight: 600, bgcolor: 'rgba(99,102,241,0.08)', color: '#6366f1' }}
                        />
                      )}
                      {uploadedMedia.filter(m => m.media_type === 'video').length > 0 && (
                        <Chip
                          icon={<MdVideoLibrary size={14} />}
                          label={`${uploadedMedia.filter(m => m.media_type === 'video').length} video(s)`}
                          size="small"
                          sx={{ fontWeight: 600, bgcolor: 'rgba(139,92,246,0.08)', color: '#8b5cf6' }}
                        />
                      )}
                    </Box>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ ...glassSx, p: { xs: 3, md: 4 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: '10px',
                      background: 'linear-gradient(135deg, #ef4444, #f97316)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                    }}>
                      <MdMic size={18} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>Voice Recording</Typography>
                    <Chip label="Optional" size="small" sx={{ ml: 1, fontWeight: 600 }} />
                  </Box>

                  <VoiceRecorder onRecordingComplete={setVoiceRecording} />
                </Paper>
              </Grid>
            </Grid>
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Paper sx={{ ...glassSx, p: { xs: 3, md: 4 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: '10px',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                    }}>
                      <MdCategory size={18} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>AI Analysis</Typography>
                  </Box>

                  {aiError && (
                    <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>{aiError}</Alert>
                  )}

                  {uploadedMedia.length === 0 && !aiLoading && (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      No images uploaded. AI analysis requires at least one image.
                    </Alert>
                  )}

                  <AIAnalysisCard analysis={aiAnalysis} loading={aiLoading} />

                  {voiceTranscript && (
                    <Paper sx={{ mt: 3, p: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.15)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <MdMic size={18} color="#6366f1" />
                        <Typography variant="subtitle2" fontWeight={700}>Voice Transcript</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        "{voiceTranscript}"
                      </Typography>
                    </Paper>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={5}>
                <Paper sx={{ ...glassSx, p: { xs: 3, md: 4 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: '10px',
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                    }}>
                      <MdAttachMoney size={18} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>Cost Estimate</Typography>
                  </Box>

                  {costLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : costEstimate ? (
                    <Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">Estimated Range</Typography>
                        <Typography variant="h5" fontWeight={800} sx={{
                          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                          backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                          ₹{costEstimate.min_cost || costEstimate.min || 0} – ₹{costEstimate.max_cost || costEstimate.max || 0}
                        </Typography>
                      </Box>
                      {costEstimate.breakdown && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>Breakdown</Typography>
                          {Object.entries(costEstimate.breakdown).map(([key, val]) => (
                            <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">{key}</Typography>
                              <Typography variant="body2" fontWeight={600}>₹{val}</Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                      {costEstimate.note && (
                        <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>{costEstimate.note}</Alert>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                      Cost estimation will appear after selecting issue details
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </motion.div>
        )

      case 3:
        const sevColor = getSeverityColor(severity)
        return (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
          >
            <Paper sx={{ ...glassSx, p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: '10px',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                }}>
                  <MdCheckCircle size={18} />
                </Box>
                <Typography variant="h6" fontWeight={700}>Review & Confirm</Typography>
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>Issue Title</Typography>
                    <Typography variant="body1" fontWeight={600} mt={0.5}>{issueTitle}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>Description</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5} sx={{ lineHeight: 1.6 }}>{issueDescription}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>Category</Typography>
                    <Typography variant="body1" fontWeight={600} mt={0.5}>{issueCategory}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>Severity</Typography>
                    <Box mt={0.5}>
                      <Chip
                        label={severity}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: sevColor.bg,
                          color: sevColor.color,
                          border: `1px solid ${sevColor.border}`,
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>

                {expectedBudget && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>Expected Budget</Typography>
                      <Typography variant="body1" fontWeight={700} mt={0.5} sx={{ color: '#22c55e' }}>₹{Number(expectedBudget).toLocaleString('en-IN')}</Typography>
                    </Box>
                  </Grid>
                )}

                {preferredNotes && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>Preferred Notes</Typography>
                      <Typography variant="body2" mt={0.5}>{preferredNotes}</Typography>
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)', textAlign: 'center' }}>
                    <MdImage size={24} color="#6366f1" />
                    <Typography variant="h6" fontWeight={700} mt={0.5}>{uploadedMedia.filter(m => m.media_type === 'image').length}</Typography>
                    <Typography variant="caption" color="text.secondary">Images</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)', textAlign: 'center' }}>
                    <MdVideoLibrary size={24} color="#8b5cf6" />
                    <Typography variant="h6" fontWeight={700} mt={0.5}>{uploadedMedia.filter(m => m.media_type === 'video').length}</Typography>
                    <Typography variant="caption" color="text.secondary">Videos</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: voiceRecording ? 'rgba(239,68,68,0.04)' : 'rgba(0,0,0,0.02)', border: `1px solid ${voiceRecording ? 'rgba(239,68,68,0.1)' : 'rgba(0,0,0,0.06)'}`, textAlign: 'center' }}>
                    <MdMic size={24} color={voiceRecording ? '#ef4444' : 'rgba(0,0,0,0.3)'} />
                    <Typography variant="h6" fontWeight={700} mt={0.5}>{voiceRecording ? 'Yes' : 'None'}</Typography>
                    <Typography variant="caption" color="text.secondary">Voice Note</Typography>
                  </Box>
                </Grid>

                {aiAnalysis && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>AI Analysis Summary</Typography>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {aiAnalysis.possible_problems?.map((p, i) => (
                          <Chip key={i} label={p} size="small" sx={{ fontWeight: 600, bgcolor: 'rgba(99,102,241,0.08)', color: '#6366f1' }} />
                        ))}
                      </Box>
                      {aiAnalysis.estimated_difficulty && (
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          Difficulty: <strong>{aiAnalysis.estimated_difficulty}</strong>
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                )}

                {costEstimate && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 2.5, borderRadius: 3, background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(22,163,74,0.06))', border: '1px solid rgba(34,197,94,0.15)' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>Estimated Cost</Typography>
                      <Typography variant="h5" fontWeight={800} mt={0.5} sx={{
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      }}>
                        ₹{costEstimate.min_cost || costEstimate.min || 0} – ₹{costEstimate.max_cost || costEstimate.max || 0}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8f9fc 0%, #eef1f8 100%)',
    }}>
      <Box sx={{
        background: 'linear-gradient(135deg, #0f0c29, #302b63)',
        py: { xs: 4, md: 5 },
        px: 2,
      }}>
        <Container maxWidth="md">
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button
              startIcon={<MdArrowBack />}
              onClick={() => navigate(-1)}
              sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'none', mb: 2, '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}
            >
              Back
            </Button>
            <Typography variant="h4" fontWeight={800} color="#fff" gutterBottom>
              Report Your Issue
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.65)' }}>
              {serviceType} service — Step {activeStep + 1} of {STEPS.length}
            </Typography>
          </MotionBox>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Paper sx={{
            ...glassSx,
            p: { xs: 2, md: 3 },
            mb: 4,
            '&::before': { display: 'none' },
          }}>
            <Stepper
              activeStep={activeStep}
              alternativeLabel
              sx={{
                '& .MuiStepLabel-label': {
                  fontWeight: 600,
                  fontSize: { xs: '0.7rem', md: '0.85rem' },
                  mt: 0.5,
                },
              }}
            >
              {STEPS.map((label, index) => (
                <Step key={label} completed={activeStep > index}>
                  <StepLabel StepIconComponent={() => (
                    <StepIcon
                      active={activeStep === index}
                      completed={activeStep > index}
                      icon={index + 1}
                    />
                  )}>
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </MotionBox>

        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>

        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, gap: 2 }}
        >
          <Button
            variant="outlined"
            startIcon={<MdArrowBack />}
            onClick={handleBack}
            disabled={activeStep === 0 || submitting}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              borderColor: 'rgba(99,102,241,0.3)',
              color: '#6366f1',
              '&:hover': { borderColor: '#6366f1', bgcolor: 'rgba(99,102,241,0.04)' },
              '&.Mui-disabled': { borderColor: 'rgba(0,0,0,0.1)', color: 'rgba(0,0,0,0.3)' },
            }}
          >
            Go Back
          </Button>

          {activeStep < 3 ? (
            <Button
              variant="contained"
              endIcon={<MdArrowForward />}
              onClick={handleNext}
              disabled={submitting}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  boxShadow: '0 6px 20px rgba(99,102,241,0.45)',
                },
              }}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <MdCheckCircle />}
              onClick={handleConfirm}
              disabled={submitting}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                px: 4,
                py: 1.2,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                boxShadow: '0 4px 16px rgba(34,197,94,0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  boxShadow: '0 6px 20px rgba(34,197,94,0.45)',
                },
              }}
            >
              {submitting ? 'Booking...' : 'Confirm & Book Worker'}
            </Button>
          )}
        </MotionBox>
      </Container>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast(prev => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default IssueDetailsPage
