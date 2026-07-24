import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box, Paper, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, CircularProgress, useTheme, Chip,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdVisibility, MdVisibilityOff, MdEmail, MdLock,
  MdPerson, MdPhone, MdArrowForward, MdCheckCircle,
} from 'react-icons/md'
import { useAuth } from '../hooks/useAuth'

const ROLE_OPTIONS = [
  { value: 'customer', emoji: '🏠', title: 'I need a service', sub: 'Book trusted professionals' },
  { value: 'worker',   emoji: '🔧', title: 'I\'m a professional', sub: 'Earn money with your skills' },
]

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') === 'worker' ? 'worker' : 'customer'
  const [role, setRole] = useState(defaultRole)
  const [showPwd, setShowPwd] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!formData.name.trim()) return setError('Please enter your full name.')
    if (!formData.email.trim()) return setError('Please enter your email.')
    if (!formData.phone.trim()) return setError('Please enter your phone number.')
    if (formData.password.length < 6) return setError('Password must be at least 6 characters.')
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match.')
    setLoading(true)
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role,
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isDark
        ? 'linear-gradient(135deg, #080812 0%, #111827 100%)'
        : '#F8FAFC',
      p: 2, position: 'relative', overflow: 'hidden',
    }}>
      {/* Blobs */}
      {[
        { top: '-20%', right: '-5%', size: '450px', color: 'rgba(108,71,255,0.25)' },
        { bottom: '-15%', left: '-10%', size: '400px', color: 'rgba(0,212,170,0.18)' },
      ].map((b, i) => (
        <motion.div key={i} style={{
          position: 'absolute', ...b, width: b.size, height: b.size,
          borderRadius: '50%', background: b.color, filter: 'blur(90px)', pointerEvents: 'none',
        }} animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 7 + i * 2, repeat: Infinity }} />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="OneDW"
            sx={{ height: 56, width: 'auto', mx: 'auto', display: 'block' }}
          />
        </Box>

        <Paper sx={{
          p: { xs: 3, sm: 4 }, borderRadius: 4,
          background: isDark ? 'rgba(17,24,39,0.95)' : '#FFFFFF',
          backdropFilter: 'blur(20px)',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(108,71,255,0.12)',
          boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.6)' : '0 8px 40px rgba(108,71,255,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <Typography variant="h4" fontWeight={900} mb={0.75} textAlign="center" sx={{ letterSpacing: '-0.02em' }}>
            Create Account ✨
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
            Join thousands using OneDW every day
          </Typography>

          {/* Role Picker */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
            {ROLE_OPTIONS.map((opt) => (
              <Box
                key={opt.value}
                onClick={() => setRole(opt.value)}
                sx={{
                  flex: 1, p: 2, borderRadius: 3, cursor: 'pointer', textAlign: 'center',
                  border: `2px solid ${role === opt.value ? '#6C47FF' : 'rgba(0,0,0,0.1)'}`,
                  bgcolor: role === opt.value ? 'rgba(108,71,255,0.08)' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: '#6C47FF', bgcolor: 'rgba(108,71,255,0.05)' },
                  position: 'relative',
                }}
              >
                {role === opt.value && (
                  <MdCheckCircle color="#6C47FF" size={16} style={{ position: 'absolute', top: 8, right: 8 }} />
                )}
                <Typography fontSize={24} mb={0.5}>{opt.emoji}</Typography>
                <Typography variant="body2" fontWeight={800} sx={{ color: role === opt.value ? '#6C47FF' : 'text.primary', fontSize: 12 }}>
                  {opt.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{opt.sub}</Typography>
              </Box>
            ))}
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Full Name" name="name" required
              value={formData.name} onChange={handleChange} sx={{ mb: 2 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><MdPerson color="#6C47FF" size={18} /></InputAdornment> }}
            />
            <TextField
              fullWidth label="Email Address" name="email" type="email" required
              value={formData.email} onChange={handleChange} sx={{ mb: 2 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><MdEmail color="#6C47FF" size={18} /></InputAdornment> }}
            />
            <TextField
              fullWidth label="Phone Number" name="phone" required
              value={formData.phone} onChange={handleChange} sx={{ mb: 2 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><MdPhone color="#6C47FF" size={18} /></InputAdornment> }}
            />
            <TextField
              fullWidth label="Password" name="password"
              type={showPwd ? 'text' : 'password'} required
              value={formData.password} onChange={handleChange} sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><MdLock color="#6C47FF" size={18} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPwd((p) => !p)} size="small">
                      {showPwd ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth label="Confirm Password" name="confirmPassword"
              type="password" required
              value={formData.confirmPassword} onChange={handleChange} sx={{ mb: 3 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><MdLock color="#6C47FF" size={18} /></InputAdornment> }}
            />

            <Button
              type="submit" fullWidth variant="contained" size="large"
              disabled={loading} endIcon={!loading && <MdArrowForward />}
              sx={{ py: 1.5, fontWeight: 800, fontSize: 15, borderRadius: 2.5, mb: 2.5 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : `Create ${role === 'worker' ? 'Professional' : 'Customer'} Account`}
            </Button>

            <Typography variant="body2" textAlign="center" color="text.secondary">
              Already have an account?{' '}
              <Typography
                component={Link} to="/login" variant="body2" fontWeight={800}
                sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Sign In
              </Typography>
            </Typography>
          </Box>
        </Paper>

        <Typography variant="caption" display="block" textAlign="center" sx={{ color: 'rgba(255,255,255,0.35)', mt: 2.5 }}>
          By registering, you agree to our Terms &amp; Privacy Policy
        </Typography>
      </motion.div>
    </Box>
  )
}