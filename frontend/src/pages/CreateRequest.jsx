import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import {
  Container, Paper, Typography, TextField, MenuItem, Button, Box,
  Snackbar, Alert, Divider, Chip, CircularProgress,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MdMyLocation } from 'react-icons/md'
import { createRequest } from '../services/requestService'
import { SERVICE_CATEGORIES } from '../utils/constants'
import VoiceInput from '../components/common/VoiceInput'

// Lazy-load map to prevent SSR issues
const Map = lazy(() => import('../components/common/Map'))

const initialFormState = {
  service_type: '',
  location: '',
  latitude: 12.9236,
  longitude: 80.1258,
  description: '',
  preferred_date: '',
  preferred_time: '',
}

const CreateRequest = () => {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState(initialFormState)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const navigate = useNavigate()

  // Pre-fill service type from URL query param
  useEffect(() => {
    const categoryId = searchParams.get('category')
    if (categoryId) {
      const matched = SERVICE_CATEGORIES.find((cat) => cat.id === categoryId)
      if (matched) setFormData((prev) => ({ ...prev, service_type: matched.name }))
    }
  }, [searchParams])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.service_type) newErrors.service_type = 'Service type is required'
    if (!formData.location.trim()) newErrors.location = 'Location is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.preferred_date) newErrors.preferred_date = 'Preferred date is required'
    if (!formData.preferred_time) newErrors.preferred_time = 'Preferred time is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Phase 3: Voice NLP result handler
  const handleVoiceResult = useCallback((parsed) => {
    setFormData((prev) => {
      const updates = {}

      if (parsed.service) {
        // Match against SERVICE_CATEGORIES
        const matched = SERVICE_CATEGORIES.find(
          (c) => c.name.toLowerCase() === parsed.service.toLowerCase()
        )
        if (matched) updates.service_type = matched.name
      }
      if (parsed.location) updates.location = parsed.location

      // Resolve "tomorrow" / "today" dates
      if (parsed.date) {
        const today = new Date()
        if (parsed.date.toLowerCase() === 'tomorrow') {
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          updates.preferred_date = tomorrow.toISOString().split('T')[0]
        } else if (parsed.date.toLowerCase() === 'today') {
          updates.preferred_date = today.toISOString().split('T')[0]
        } else if (/\d{4}-\d{2}-\d{2}/.test(parsed.date)) {
          updates.preferred_date = parsed.date
        }
      }
      if (parsed.time) updates.preferred_time = parsed.time

      return { ...prev, ...updates }
    })
    setSnackbar({ open: true, message: '🎤 Form auto-filled from voice input!', severity: 'success' })
  }, [])

  // Phase 4: Get GPS coordinates
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setSnackbar({ open: true, message: 'Geolocation not supported by your browser.', severity: 'warning' })
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }))
        setLocating(false)
        setSnackbar({ open: true, message: '📍 Location detected!', severity: 'success' })
      },
      () => {
        setLocating(false)
        setSnackbar({ open: true, message: 'Could not get location. Please allow permission.', severity: 'error' })
      }
    )
  }

  // Phase 4: Map click sets location
  const handleMapLocationSelect = (lat, lon) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lon }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const created = await createRequest(formData)
      setSnackbar({ open: true, message: '✅ Service request submitted!', severity: 'success' })
      setTimeout(() => navigate(`/find-workers?requestId=${created.id}&service=${encodeURIComponent(formData.service_type)}&lat=${formData.latitude}&lon=${formData.longitude}`), 1200)
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || 'Failed to create request. Please try again.',
        severity: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Paper
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            border: '1px solid rgba(99,102,241,0.15)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          }}
        >
          <Typography variant="h4" fontWeight={800} mb={0.5}>
            Request a Service
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Tell us what you need — we'll match you with the best verified professional nearby.
          </Typography>

          {/* Phase 3: Voice Input */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              mb: 3,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))',
              borderRadius: 3,
              border: '1px dashed rgba(99,102,241,0.3)',
            }}
          >
            <VoiceInput
              onResult={handleVoiceResult}
              onError={(msg) => setSnackbar({ open: true, message: msg, severity: 'error' })}
            />
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              select
              fullWidth
              label="Service Type"
              name="service_type"
              value={formData.service_type}
              onChange={handleChange}
              error={!!errors.service_type}
              helperText={errors.service_type}
              sx={{ mb: 3 }}
            >
              {SERVICE_CATEGORIES.map((cat) => (
                <MenuItem key={cat.id} value={cat.name}>
                  {cat.name}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                label="Location / Area"
                name="location"
                placeholder="e.g. Tambaram, Chennai"
                value={formData.location}
                onChange={handleChange}
                error={!!errors.location}
                helperText={errors.location}
              />
              <Button
                variant="outlined"
                onClick={handleGetLocation}
                disabled={locating}
                startIcon={locating ? <CircularProgress size={16} /> : <MdMyLocation />}
                sx={{ mt: 0, height: 56, minWidth: 140, borderRadius: 2, flexShrink: 0 }}
              >
                {locating ? 'Locating...' : 'My Location'}
              </Button>
            </Box>

            {/* Phase 4: Leaflet Map */}
            <Box mb={3}>
              <Typography variant="caption" color="text.secondary" mb={1} display="block">
                📍 Click on the map to set your exact location
              </Typography>
              <Suspense fallback={<Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>}>
                <Map
                  center={[formData.latitude, formData.longitude]}
                  zoom={13}
                  customerLocation={{
                    lat: formData.latitude,
                    lon: formData.longitude,
                    label: formData.location || 'Your location',
                  }}
                  onLocationSelect={handleMapLocationSelect}
                  height={300}
                />
              </Suspense>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip size="small" label={`Lat: ${formData.latitude.toFixed(4)}`} variant="outlined" />
                <Chip size="small" label={`Lon: ${formData.longitude.toFixed(4)}`} variant="outlined" />
              </Box>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              name="description"
              placeholder="Describe the issue or work needed in detail..."
              value={formData.description}
              onChange={handleChange}
              error={!!errors.description}
              helperText={errors.description}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="Preferred Date"
                name="preferred_date"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: today }}
                value={formData.preferred_date}
                onChange={handleChange}
                error={!!errors.preferred_date}
                helperText={errors.preferred_date}
              />
              <TextField
                fullWidth
                type="time"
                label="Preferred Time"
                name="preferred_time"
                InputLabelProps={{ shrink: true }}
                value={formData.preferred_time}
                onChange={handleChange}
                error={!!errors.preferred_time}
                helperText={errors.preferred_time}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                borderRadius: 2,
                py: 1.5,
                fontWeight: 800,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : '🚀 Submit & Find Workers'}
            </Button>
          </Box>
        </Paper>
      </motion.div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default CreateRequest