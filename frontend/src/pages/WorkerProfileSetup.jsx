import { useState, useEffect, useRef } from 'react'
import {
  Box, Container, Paper, Typography, TextField, Button,
  Grid, FormControl, InputLabel, Select, MenuItem,
  Chip, Checkbox, FormControlLabel, FormGroup,
  CircularProgress, Alert, InputAdornment, Divider, Avatar, LinearProgress,
} from '@mui/material'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import {
  MdMyLocation, MdUpload, MdBadge, MdPhone, MdWork,
  MdCurrencyRupee, MdAccessTime, MdLocationOn,
} from 'react-icons/md'

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const SERVICE_OPTIONS = [
  'Electrician', 'Plumber', 'Painter', 'Cleaner', 'Mechanic',
  'Carpenter', 'AC Technician', 'Appliance Repair', 'Home Cleaning',
]

const LANGUAGE_OPTIONS = ['Tamil', 'English', 'Hindi', 'Telugu', 'Kannada', 'Malayalam', 'Marathi']

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const PROOF_TYPES = ['Aadhaar', 'Driving License', 'PAN']

// Map click handler component
function LocationPicker({ onLocationChange }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function WorkerProfileSetup() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const photoRef = useRef()
  const proofRef = useRef()

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [proofPreview, setProofPreview] = useState('')

  const [form, setForm] = useState({
    phone: user?.phone || '',
    service_type: '',
    experience_years: '',
    hourly_rate: '',
    bio: '',
    languages: [],
    availability: [],
    working_hours: { start: '09:00', end: '18:00' },
    emergency_contact: '',
    whatsapp_number: '',
    address: '',
    latitude: 12.9236,
    longitude: 80.1258,
    identity_proof_type: '',
    profile_photo: '',
    identity_proof_url: '',
  })

  // Load existing profile
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/worker/profile')
        setForm((prev) => ({
          ...prev,
          phone: data.phone || prev.phone,
          service_type: data.service_type || '',
          experience_years: data.experience_years || '',
          hourly_rate: data.hourly_rate || '',
          bio: data.bio || '',
          languages: data.languages || [],
          availability: data.availability || [],
          working_hours: data.working_hours || { start: '09:00', end: '18:00' },
          emergency_contact: data.emergency_contact || '',
          whatsapp_number: data.whatsapp_number || '',
          address: data.address || '',
          latitude: data.latitude || 12.9236,
          longitude: data.longitude || 80.1258,
          identity_proof_type: data.identity_proof_type || '',
          profile_photo: data.profile_photo || '',
          identity_proof_url: data.identity_proof_url || '',
        }))
        if (data.profile_photo) setPhotoPreview(data.profile_photo)
        if (data.profile_complete) navigate('/worker-dashboard')
      } catch {
        // new profile — stay on setup
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleHoursChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, working_hours: { ...prev.working_hours, [key]: e.target.value } }))
  }

  const toggleLanguage = (lang) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }))
  }

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      availability: prev.availability.includes(day)
        ? prev.availability.filter((d) => d !== day)
        : [...prev.availability, day],
    }))
  }

  const handleLocationChange = (lat, lng) => {
    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))
  }

  const detectLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => handleLocationChange(coords.latitude, coords.longitude),
      () => setError('Location access denied. Please enable GPS.'),
    )
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result)
      setForm((prev) => ({ ...prev, profile_photo: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleProofChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setProofPreview(reader.result)
      setForm((prev) => ({ ...prev, identity_proof_url: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.service_type) return setError('Please select a service category.')
    if (!form.experience_years) return setError('Please enter your years of experience.')
    if (!form.hourly_rate) return setError('Please enter your hourly rate.')

    setLoading(true)
    try {
      await api.put('/worker/profile', {
        ...form,
        experience_years: parseInt(form.experience_years),
        hourly_rate: parseFloat(form.hourly_rate),
        skills: [form.service_type],
      })
      setSuccess('Profile saved successfully! Redirecting...')
      setTimeout(() => navigate('/worker-dashboard'), 1500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  const completionScore = [
    form.service_type, form.experience_years, form.hourly_rate, form.bio,
    form.phone, form.address, form.languages.length > 0, form.availability.length > 0,
  ].filter(Boolean).length

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="overline" sx={{ color: '#6366f1', fontWeight: 700 }}>
            Step 1 of 1
          </Typography>
          <Typography variant="h4" fontWeight={900} mt={0.5} mb={1}>
            Complete Your Professional Profile
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Complete your profile to start receiving job requests. Fields marked * are required.
          </Typography>
          {/* Progress bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LinearProgress
              variant="determinate"
              value={(completionScore / 8) * 100}
              sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: 'rgba(99,102,241,0.1)',
                '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' } }}
            />
            <Typography variant="caption" fontWeight={700} color="primary">
              {Math.round((completionScore / 8) * 100)}%
            </Typography>
          </Box>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          {/* ── Basic Info ── */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.1)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <MdBadge size={20} color="#6366f1" />
              <Typography variant="h6" fontWeight={700}>Basic Information</Typography>
            </Box>

            {/* Profile photo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
              <Avatar
                src={photoPreview}
                sx={{ width: 80, height: 80, bgcolor: '#6366f1', fontSize: 32, cursor: 'pointer' }}
                onClick={() => photoRef.current?.click()}
              >
                {user?.name?.[0]?.toUpperCase() || 'W'}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={600} mb={0.5}>Profile Photo</Typography>
                <Button variant="outlined" size="small" startIcon={<MdUpload />} onClick={() => photoRef.current?.click()}
                  sx={{ borderColor: '#6366f1', color: '#6366f1' }}>
                  Upload Photo
                </Button>
                <input ref={photoRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                  JPG, PNG up to 5MB
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Full Name" value={user?.name || ''} disabled
                  helperText="Name from your account" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email Address" value={user?.email || ''} disabled
                  helperText="Email from your account" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Phone Number *" value={form.phone}
                  onChange={handleChange('phone')} InputProps={{ startAdornment: <InputAdornment position="start"><MdPhone /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="WhatsApp Number" value={form.whatsapp_number}
                  onChange={handleChange('whatsapp_number')} placeholder="+91 98765 43210" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Emergency Contact" value={form.emergency_contact}
                  onChange={handleChange('emergency_contact')} />
              </Grid>
            </Grid>
          </Paper>

          {/* ── Professional Info ── */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.1)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <MdWork size={20} color="#6366f1" />
              <Typography variant="h6" fontWeight={700}>Professional Information</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Service Category *</InputLabel>
                  <Select label="Service Category *" value={form.service_type} onChange={handleChange('service_type')}>
                    {SERVICE_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth type="number" label="Years of Experience *" value={form.experience_years}
                  onChange={handleChange('experience_years')} inputProps={{ min: 0, max: 50 }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth type="number" label="Hourly Rate *" value={form.hourly_rate}
                  onChange={handleChange('hourly_rate')} inputProps={{ min: 0 }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><MdCurrencyRupee /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={3} label="Short Bio"
                  placeholder="Professional electrician with 8 years of experience in residential wiring..."
                  value={form.bio} onChange={handleChange('bio')} />
              </Grid>
            </Grid>
          </Paper>

          {/* ── Languages ── */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.1)' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Languages Known</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {LANGUAGE_OPTIONS.map((lang) => (
                <Chip key={lang} label={lang} clickable
                  onClick={() => toggleLanguage(lang)}
                  color={form.languages.includes(lang) ? 'primary' : 'default'}
                  variant={form.languages.includes(lang) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Paper>

          {/* ── Availability ── */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.1)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <MdAccessTime size={20} color="#6366f1" />
              <Typography variant="h6" fontWeight={700}>Availability & Working Hours</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={1.5}>Select your working days:</Typography>
            <FormGroup row sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
              {DAYS.map((day) => (
                <FormControlLabel key={day}
                  control={<Checkbox checked={form.availability.includes(day)} onChange={() => toggleDay(day)} size="small" />}
                  label={day.slice(0, 3)} sx={{ mr: 1 }}
                />
              ))}
            </FormGroup>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth type="time" label="Start Time" value={form.working_hours.start}
                  onChange={handleHoursChange('start')} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth type="time" label="End Time" value={form.working_hours.end}
                  onChange={handleHoursChange('end')} InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>
          </Paper>

          {/* ── Address & Location ── */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.1)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <MdLocationOn size={20} color="#6366f1" />
              <Typography variant="h6" fontWeight={700}>Address & Location</Typography>
            </Box>
            <TextField fullWidth multiline rows={2} label="Full Address" value={form.address}
              onChange={handleChange('address')} placeholder="Street, Area, City, State, PIN"
              sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <TextField label="Latitude" value={form.latitude.toFixed(6)} size="small"
                InputProps={{ readOnly: true }} sx={{ width: 160 }} />
              <TextField label="Longitude" value={form.longitude.toFixed(6)} size="small"
                InputProps={{ readOnly: true }} sx={{ width: 160 }} />
              <Button variant="contained" startIcon={<MdMyLocation />} onClick={detectLocation}
                sx={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontWeight: 700 }}>
                Detect My Location
              </Button>
            </Box>
            {/* Map */}
            <Box sx={{ height: 280, borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(99,102,241,0.2)' }}>
              <MapContainer center={[form.latitude, form.longitude]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <LocationPicker onLocationChange={handleLocationChange} />
                <Marker position={[form.latitude, form.longitude]} />
              </MapContainer>
            </Box>
            <Typography variant="caption" color="text.secondary" mt={1} display="block">
              Click on the map to set your location precisely.
            </Typography>
          </Paper>

          {/* ── Identity Proof ── */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid rgba(99,102,241,0.1)' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Identity Proof</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={5}>
                <FormControl fullWidth>
                  <InputLabel>Proof Type</InputLabel>
                  <Select label="Proof Type" value={form.identity_proof_type} onChange={handleChange('identity_proof_type')}>
                    {PROOF_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={7}>
                <Button variant="outlined" fullWidth startIcon={<MdUpload />}
                  onClick={() => proofRef.current?.click()}
                  sx={{ height: 56, borderColor: '#6366f1', color: '#6366f1' }}>
                  Upload ID Proof (PDF / JPG)
                </Button>
                <input ref={proofRef} type="file" accept="image/*,application/pdf" hidden onChange={handleProofChange} />
                {proofPreview && (
                  <Typography variant="caption" color="success.main" display="block" mt={0.5}>
                    ✅ Document uploaded
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* Submit */}
          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
            sx={{
              py: 2, fontWeight: 800, fontSize: '1rem', borderRadius: 2,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' },
            }}>
            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : '💾 Save Professional Profile'}
          </Button>
        </Box>
      </motion.div>
    </Container>
  )
}
