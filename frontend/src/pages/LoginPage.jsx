import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import {
  Box, Paper, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, Divider, useTheme, CircularProgress,
} from '@mui/material'
import { motion } from 'framer-motion'
import { MdVisibility, MdVisibilityOff, MdEmail, MdLock, MdArrowForward } from 'react-icons/md'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionExpired = searchParams.get('expired') === '1'
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(formData)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDark
        ? 'linear-gradient(135deg, #080812 0%, #111827 100%)'
        : '#F8FAFC',
      p: 2,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Blob bg */}
      {[
        { top: '-15%', left: '-10%', size: '400px', color: 'rgba(108,71,255,0.3)' },
        { bottom: '-10%', right: '-10%', size: '350px', color: 'rgba(0,212,170,0.2)' },
      ].map((b, i) => (
        <motion.div key={i} style={{
          position: 'absolute', ...b, width: b.size, height: b.size,
          borderRadius: '50%', background: b.color, filter: 'blur(80px)', pointerEvents: 'none',
        }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}
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
          p: { xs: 3, sm: 4.5 }, borderRadius: 4,
          background: isDark ? 'rgba(17,24,39,0.95)' : '#FFFFFF',
          backdropFilter: 'blur(20px)',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(108,71,255,0.12)',
          boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.6)' : '0 8px 40px rgba(108,71,255,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <Typography variant="h4" fontWeight={900} mb={0.75} textAlign="center" sx={{ letterSpacing: '-0.02em' }}>
            Welcome back 👋
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3.5}>
            Sign in to manage bookings and services
          </Typography>

          {sessionExpired && (
            <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
              ⚠️ Your session expired. Please log in again.
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Email Address" name="email" type="email" required
              value={formData.email} onChange={handleChange}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><MdEmail color="#6C47FF" size={18} /></InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth label="Password" name="password"
              type={showPassword ? 'text' : 'password'}
              required value={formData.password} onChange={handleChange}
              sx={{ mb: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><MdLock color="#6C47FF" size={18} /></InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((p) => !p)} edge="end" size="small">
                      {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ textAlign: 'right', mb: 3 }}>
              <Typography
                component={Link} to="/forgot-password"
                variant="caption" fontWeight={700}
                sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Forgot password?
              </Typography>
            </Box>

            <Button
              type="submit" fullWidth variant="contained" size="large"
              disabled={loading} endIcon={!loading && <MdArrowForward />}
              sx={{ py: 1.5, fontWeight: 800, fontSize: 15, borderRadius: 2.5, mb: 2.5 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>

            <Divider sx={{ mb: 2.5 }}>
              <Typography variant="caption" color="text.secondary">OR</Typography>
            </Divider>

            <Typography variant="body2" textAlign="center" color="text.secondary">
              Don't have an account?{' '}
              <Typography
                component={Link} to="/register"
                variant="body2" fontWeight={800}
                sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Create Account
              </Typography>
            </Typography>
          </Box>
        </Paper>

        <Typography variant="caption" display="block" textAlign="center" sx={{ color: 'rgba(255,255,255,0.4)', mt: 2.5 }}>
          By signing in, you agree to our Terms & Privacy Policy
        </Typography>
      </motion.div>
    </Box>
  )
}