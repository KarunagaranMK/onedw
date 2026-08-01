import { useState } from 'react'
import {
  Box, Grid, Typography, TextField, Button, Alert,
  Divider, CircularProgress, useTheme, Link as MuiLink, InputAdornment, IconButton,
} from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdArrowForward } from 'react-icons/md'
import { useAuth } from '../hooks/useAuth'

const FEATURES = [
  { icon: '⚡', text: 'Instant booking in 2 minutes' },
  { icon: '✅', text: '2000+ verified professionals' },
  { icon: '🤖', text: 'AI-powered service matching' },
  { icon: '💰', text: 'Transparent pricing, no hidden fees' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = await login(email, password)
      if (user?.role === 'worker') navigate('/worker-dashboard')
      else if (user?.role === 'admin') navigate('/admin')
      else navigate('/customer-dashboard')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', background: isDark ? '#060612' : '#f8fafc' }}>
      <Grid container sx={{ minHeight: '100vh' }}>

        {/* ── Left panel: illustration ─────────────────────────────── */}
        <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'flex' }, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{
            width: '100%', height: '100%', minHeight: '100vh',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 40%, #0d9488 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', p: 6,
          }}>
            {/* Blobs */}
            {[
              { top: '-10%', left: '-10%', size: 350, color: 'rgba(37,99,235,0.5)' },
              { bottom: '-5%', right: '-5%', size: 280, color: 'rgba(20,184,166,0.35)' },
            ].map((blob, i) => (
              <motion.div key={i}
                style={{ position: 'absolute', top: blob.top, left: blob.left, right: blob.right, bottom: blob.bottom, width: blob.size, height: blob.size, borderRadius: '50%', background: blob.color, filter: 'blur(70px)', pointerEvents: 'none' }}
                animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 6, repeat: Infinity, delay: i * 2 }}
              />
            ))}

            {/* Content */}
            <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <Typography variant="h2" fontWeight={900} sx={{ color: '#fff', mb: 2, fontSize: '2.4rem', letterSpacing: '-0.04em' }}>
                  Welcome back to OneDW
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 5, maxWidth: 380, mx: 'auto', lineHeight: 1.8 }}>
                  Your trusted platform for home services. Book professionals in minutes.
                </Typography>

                {FEATURES.map((f, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, textAlign: 'left', maxWidth: 360, mx: 'auto' }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: 2.5, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                        {f.icon}
                      </Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{f.text}</Typography>
                    </Box>
                  </motion.div>
                ))}
              </motion.div>
            </Box>
          </Box>
        </Grid>

        {/* ── Right panel: form ─────────────────────────────────────── */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 3, md: 6 } }}>
          <Box sx={{ width: '100%', maxWidth: 420 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

              {/* Mobile logo */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, mb: 4 }}>
                <Box component="img" src="/logo.png" alt="OneDW" sx={{ height: 40, width: 'auto' }} />
              </Box>

              <Typography variant="overline" sx={{ color: '#2563eb', fontWeight: 700, letterSpacing: '0.1em' }}>Welcome back</Typography>
              <Typography variant="h4" fontWeight={900} mb={0.75} mt={0.5} sx={{ letterSpacing: '-0.03em' }}>
                Sign in to your account
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={4}>
                Don't have an account?{' '}
                <MuiLink component={Link} to="/register" fontWeight={700} sx={{ color: '#2563eb', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  Create one free →
                </MuiLink>
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  autoComplete="email"
                  InputProps={{ startAdornment: <InputAdornment position="start"><MdEmail color="#94a3b8" size={18} /></InputAdornment> }}
                />
                <TextField
                  label="Password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><MdLock color="#94a3b8" size={18} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPass(p => !p)}>
                          {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <MuiLink component={Link} to="/contact" variant="caption" fontWeight={600} sx={{ color: '#2563eb', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    Forgot password?
                  </MuiLink>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  endIcon={loading ? null : <MdArrowForward />}
                  sx={{ py: 1.6, fontWeight: 800, borderRadius: 2.5, fontSize: 15, mt: 0.5 }}
                >
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
                </Button>
              </Box>

              <Divider sx={{ my: 3 }}>
                <Typography variant="caption" color="text.disabled" fontWeight={600}>OR</Typography>
              </Divider>

              {/* Quick-access admin */}
              <Box sx={{ textAlign: 'center' }}>
                <MuiLink component={Link} to="/admin/login" variant="body2" fontWeight={600}
                  sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                  Admin Login →
                </MuiLink>
              </Box>

            </motion.div>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}