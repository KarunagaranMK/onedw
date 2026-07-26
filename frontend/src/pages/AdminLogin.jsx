import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Paper, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, FormControlLabel, Checkbox, CircularProgress, Divider,
} from '@mui/material'
import { MdVisibility, MdVisibilityOff, MdEmail, MdLock, MdAdminPanelSettings, MdShield, MdSecurity } from 'react-icons/md'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

const FEATURE_CHIPS = ['Analytics', 'Revenue', 'Verification', 'Reports', 'Support', 'AI Tools']

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, logout } = useAuth()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Please enter your credentials.'); return }
    setError('')
    setLoading(true)
    try {
      const user = await login({ email: form.email, password: form.password })
      if (!user || user.role !== 'admin') {
        logout()
        setError('Access denied. This portal is for OneDW administrators only.')
        return
      }
      navigate('/admin')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Sign in failed. Please check your credentials.')
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
      p: 3,
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(135deg,#050511 0%,#0c0c1e 40%,#0f0b25 100%)',
    }}>
      {/* Animated background blobs */}
      {[
        { x: '-8%', y: '-8%', w: 420, color: 'rgba(108,71,255,0.18)' },
        { x: '65%', y: '55%', w: 360, color: 'rgba(0,212,170,0.12)' },
        { x: '50%', y: '-15%', w: 280, color: 'rgba(59,130,246,0.1)' },
      ].map((b, i) => (
        <motion.div key={i}
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 1.5 }}
          style={{
            position: 'absolute', left: b.x, top: b.y,
            width: b.w, height: b.w, borderRadius: '50%',
            background: `radial-gradient(circle, ${b.color}, transparent 70%)`,
            filter: 'blur(32px)', pointerEvents: 'none',
          }}
        />
      ))}

      {/* Subtle grid lines */}
      <Box sx={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
        backgroundImage: 'linear-gradient(rgba(108,71,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(108,71,255,1) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}
      >
        {/* Logo / Brand */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Box sx={{
              width: 76, height: 76, borderRadius: 4, mx: 'auto', mb: 2,
              background: 'linear-gradient(135deg,#6C47FF,#9B72FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 40px rgba(108,71,255,0.5), 0 0 0 1px rgba(108,71,255,0.3)',
            }}>
              <MdAdminPanelSettings size={40} color="#fff" />
            </Box>
          </motion.div>

          <Typography variant="h4" fontWeight={900} sx={{
            color: '#fff', letterSpacing: '-0.03em', mb: 0.5,
            background: 'linear-gradient(135deg,#fff 40%,rgba(108,71,255,0.9))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            OneDW Team
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', mb: 1.5, fontWeight: 600, letterSpacing: 0.3 }}>
            Internal Administration Portal
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', display: 'block', maxWidth: 380, mx: 'auto', lineHeight: 1.6 }}>
            Manage customers, workers, bookings, revenue, verification, analytics, reports, and the complete OneDW platform.
          </Typography>

          {/* Feature chips */}
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', justifyContent: 'center', mt: 2 }}>
            {FEATURE_CHIPS.map((chip, i) => (
              <motion.div key={chip} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.06 }}>
                <Box sx={{
                  px: 1.2, py: 0.4, borderRadius: 100, fontSize: 11, fontWeight: 700,
                  border: '1px solid rgba(108,71,255,0.3)',
                  color: 'rgba(255,255,255,0.55)',
                  bgcolor: 'rgba(108,71,255,0.08)',
                }}>
                  {chip}
                </Box>
              </motion.div>
            ))}
          </Box>
        </Box>

        {/* Login Card */}
        <Paper sx={{
          p: { xs: 3, sm: 4.5 }, borderRadius: 4,
          bgcolor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}>
          {/* Security badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, p: 1.5, borderRadius: 2, bgcolor: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <MdShield color="#22C55E" size={16} />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
              Secured with JWT · Role-based access · 256-bit encryption
            </Typography>
          </Box>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5, bgcolor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                {error}
              </Alert>
            </motion.div>
          )}

          <Box component="form" onSubmit={submit}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }} display="block" mb={0.8}>
              Admin Email
            </Typography>
            <TextField
              fullWidth
              name="email"
              type="email"
              placeholder="admin@onedw.in"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.05)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(108,71,255,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#6C47FF' },
                  input: { color: '#fff' },
                },
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><MdEmail color="#6C47FF" size={20} /></InputAdornment>,
              }}
            />

            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }} display="block" mb={0.8}>
              Password
            </Typography>
            <TextField
              fullWidth
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.05)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(108,71,255,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#6C47FF' },
                  input: { color: '#fff' },
                },
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><MdLock color="#6C47FF" size={20} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(s => !s)} sx={{ color: 'rgba(255,255,255,0.4)' }}>
                      {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.remember}
                    onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                    sx={{ color: 'rgba(255,255,255,0.3)', '&.Mui-checked': { color: '#6C47FF' } }}
                  />
                }
                label={<Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 600 }}>Remember me</Typography>}
              />
              <Typography
                component="a"
                href="/forgot-password"
                sx={{ color: 'rgba(108,71,255,0.9)', fontSize: 13, fontWeight: 700, textDecoration: 'none', '&:hover': { color: '#9B72FF' } }}
              >
                Forgot password?
              </Typography>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.7, fontWeight: 900, borderRadius: 2.5, fontSize: '1rem', letterSpacing: 0.3,
                background: 'linear-gradient(135deg,#6C47FF,#9B72FF)',
                boxShadow: '0 8px 32px rgba(108,71,255,0.45)',
                '&:hover': { background: 'linear-gradient(135deg,#5535E0,#8060E0)', transform: 'translateY(-1px)', boxShadow: '0 12px 40px rgba(108,71,255,0.55)' },
                '&:disabled': { background: 'rgba(108,71,255,0.3)', color: 'rgba(255,255,255,0.4)' },
                transition: 'all 0.25s ease',
              }}
            >
              {loading ? <><CircularProgress size={20} color="inherit" sx={{ mr: 1.5 }} /> Authenticating…</> : '🔐  Sign In to Admin Portal'}
            </Button>
          </Box>

          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.07)' }} />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            {[
              { icon: <MdShield size={14} />, text: 'Encrypted' },
              { icon: <MdSecurity size={14} />, text: 'Role-Verified' },
              { icon: <MdAdminPanelSettings size={14} />, text: 'Admin Only' },
            ].map(({ icon, text }) => (
              <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <Box sx={{ color: 'rgba(108,71,255,0.7)' }}>{icon}</Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{text}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)', display: 'block', textAlign: 'center', mt: 3 }}>
          © {new Date().getFullYear()} OneDW · Unauthorised access is strictly prohibited
        </Typography>
      </motion.div>
    </Box>
  )
}
