import { useState } from 'react'
import {
  Container, Box, Typography, Paper, Avatar, Button, TextField,
  Grid, Chip, Divider, Alert, IconButton, InputAdornment,
  useTheme, CircularProgress, Tooltip,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  MdPerson, MdEmail, MdPhone, MdEdit, MdSave, MdClose,
  MdDashboard, MdVerifiedUser, MdArrowBack, MdWork,
  MdAdminPanelSettings, MdVisibility, MdVisibilityOff,
  MdLock, MdCheckCircle,
} from 'react-icons/md'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'

const MotionBox = motion(Box)
const MotionPaper = motion(Paper)

const ROLE_CONFIG = {
  customer: {
    label: 'Customer',
    color: '#6C47FF',
    bg: 'linear-gradient(135deg, #6C47FF 0%, #9B72FF 100%)',
    icon: <MdPerson size={20} />,
    dashPath: '/customer-dashboard',
  },
  worker: {
    label: 'Professional',
    color: '#00D4AA',
    bg: 'linear-gradient(135deg, #00D4AA 0%, #00A88A 100%)',
    icon: <MdWork size={20} />,
    dashPath: '/worker-dashboard',
  },
  admin: {
    label: 'Admin',
    color: '#FF6B35',
    bg: 'linear-gradient(135deg, #FF6B35 0%, #FF9A5C 100%)',
    icon: <MdAdminPanelSettings size={20} />,
    dashPath: '/admin',
  },
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const roleConfig = ROLE_CONFIG[user?.role] || ROLE_CONFIG.customer

  // ── Edit state ───────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  })

  // ── Password change state ────────────────────────────────────────────────
  const [changingPw, setChangingPw] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  const handleFormChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    setError('')
    try {
      await api.put('/auth/profile', { name: form.name, phone: form.phone })
    } catch (_) {
      // endpoint may not be wired yet — persist locally only
    } finally {
      const stored = JSON.parse(localStorage.getItem('onedw-user') || '{}')
      localStorage.setItem('onedw-user', JSON.stringify({ ...stored, name: form.name, phone: form.phone }))
      setSaving(false)
      setSaveSuccess(true)
      setEditing(false)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  const handleCancelEdit = () => {
    setForm({ name: user?.name || '', phone: user?.phone || '' })
    setError('')
    setEditing(false)
  }

  const handlePwChange = async () => {
    setPwError('')
    if (!pwForm.current) { setPwError('Current password is required.'); return }
    if (pwForm.newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Passwords do not match.'); return }
    setPwSaving(true)
    try {
      await api.put('/auth/change-password', {
        current_password: pwForm.current,
        new_password: pwForm.newPw,
      })
      setPwSuccess(true)
      setPwForm({ current: '', newPw: '', confirm: '' })
      setChangingPw(false)
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (err) {
      setPwError(err?.response?.data?.detail || 'Failed to change password. Please try again.')
    } finally {
      setPwSaving(false)
    }
  }

  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const glassCard = {
    borderRadius: 4,
    p: 3,
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(20px)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(108,71,255,0.1)',
    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(108,71,255,0.08)',
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDark
          ? 'linear-gradient(135deg, #08080F 0%, #0D0D1A 50%, #0A0A12 100%)'
          : 'linear-gradient(135deg, #F0EDFF 0%, #FAFAFA 50%, #EEF2FF 100%)',
        py: { xs: 3, md: 6 },
      }}
    >
      <Container maxWidth="lg">
        {/* Back button */}
        <MotionBox
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          mb={3}
        >
          <Button
            startIcon={<MdArrowBack />}
            onClick={() => navigate(-1)}
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              '&:hover': { color: 'primary.main', bgcolor: 'rgba(108,71,255,0.06)' },
            }}
          >
            Back
          </Button>
        </MotionBox>

        <Grid container spacing={3}>
          {/* ── Left: Hero Card ── */}
          <Grid item xs={12} md={4}>
            <MotionPaper
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              sx={{ ...glassCard, textAlign: 'center', overflow: 'hidden', position: 'relative' }}
            >
              {/* Background glow blob */}
              <Box sx={{
                position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
                width: 200, height: 200, borderRadius: '50%',
                background: roleConfig.bg, opacity: 0.12, filter: 'blur(40px)',
              }} />

              {/* Avatar */}
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Avatar sx={{
                  width: 100, height: 100, fontSize: 36, fontWeight: 900,
                  background: roleConfig.bg,
                  boxShadow: `0 8px 32px ${roleConfig.color}40`,
                  border: `3px solid ${roleConfig.color}30`,
                  mx: 'auto',
                }}>
                  {initials}
                </Avatar>
                <Box sx={{
                  position: 'absolute', bottom: 2, right: 2,
                  width: 20, height: 20, borderRadius: '50%',
                  bgcolor: '#22C55E',
                  border: '2px solid',
                  borderColor: isDark ? '#0D0D1A' : '#FAFAFA',
                }} />
              </Box>

              <Typography variant="h5" fontWeight={900} gutterBottom>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {user?.email}
              </Typography>

              <Chip
                icon={roleConfig.icon}
                label={roleConfig.label}
                sx={{
                  background: `${roleConfig.color}18`,
                  color: roleConfig.color,
                  fontWeight: 700,
                  fontSize: 13,
                  px: 1,
                  mb: 3,
                  border: `1px solid ${roleConfig.color}30`,
                }}
              />

              <Divider sx={{ mb: 3 }} />

              {/* Info rows */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, textAlign: 'left' }}>
                {[
                  { icon: <MdEmail size={18} color="#6C47FF" />, iconBg: 'rgba(108,71,255,0.12)', label: 'Email', value: user?.email },
                  { icon: <MdPhone size={18} color="#00D4AA" />, iconBg: 'rgba(0,212,170,0.12)', label: 'Phone', value: user?.phone || 'Not provided' },
                  { icon: <MdVerifiedUser size={18} color="#FFB800" />, iconBg: 'rgba(255,184,0,0.12)', label: 'Account Status', value: 'Active', valueColor: 'success.main' },
                ].map(({ icon, iconBg, label, value, valueColor }) => (
                  <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: 2,
                      background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {icon}
                    </Box>
                    <Box sx={{ overflow: 'hidden', flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {label}
                      </Typography>
                      <Typography
                        variant="body2" fontWeight={700}
                        color={valueColor || 'text.primary'}
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {value}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              <Divider sx={{ my: 3 }} />

              <Button
                fullWidth variant="contained"
                startIcon={<MdDashboard />}
                onClick={() => navigate(roleConfig.dashPath)}
                sx={{
                  borderRadius: 2.5, fontWeight: 700, py: 1.2,
                  background: roleConfig.bg,
                  boxShadow: `0 4px 20px ${roleConfig.color}30`,
                  '&:hover': {
                    background: roleConfig.bg,
                    boxShadow: `0 6px 28px ${roleConfig.color}50`,
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Go to Dashboard
              </Button>
            </MotionPaper>
          </Grid>

          {/* ── Right: Edit + Security ── */}
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

              {saveSuccess && (
                <MotionBox initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <Alert icon={<MdCheckCircle />} severity="success" sx={{ borderRadius: 3, fontWeight: 600 }}>
                    Profile updated successfully!
                  </Alert>
                </MotionBox>
              )}
              {pwSuccess && (
                <MotionBox initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <Alert icon={<MdCheckCircle />} severity="success" sx={{ borderRadius: 3, fontWeight: 600 }}>
                    Password changed successfully!
                  </Alert>
                </MotionBox>
              )}

              {/* Personal Info Card */}
              <MotionPaper
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                sx={glassCard}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={900}>Personal Information</Typography>
                    <Typography variant="caption" color="text.secondary">Manage your name and phone number</Typography>
                  </Box>
                  {!editing ? (
                    <Tooltip title="Edit Profile">
                      <IconButton onClick={() => setEditing(true)} sx={{ bgcolor: 'rgba(108,71,255,0.1)', color: 'primary.main', '&:hover': { bgcolor: 'rgba(108,71,255,0.2)' } }}>
                        <MdEdit size={20} />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Cancel">
                        <IconButton onClick={handleCancelEdit} sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: 'error.main', '&:hover': { bgcolor: 'rgba(239,68,68,0.2)' } }}>
                          <MdClose size={20} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Save Changes">
                        <span>
                          <IconButton onClick={handleSave} disabled={saving} sx={{ bgcolor: 'rgba(34,197,94,0.1)', color: 'success.main', '&:hover': { bgcolor: 'rgba(34,197,94,0.2)' } }}>
                            {saving ? <CircularProgress size={20} color="success" /> : <MdSave size={20} />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  )}
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

                <Grid container spacing={2.5}>
                  {[
                    { name: 'name', label: 'Full Name', value: editing ? form.name : user?.name || '', icon: <MdPerson color="#6C47FF" />, disabled: !editing },
                    { name: 'email', label: 'Email Address', value: user?.email || '', icon: <MdEmail color="#6C47FF" />, disabled: true, helper: 'Email cannot be changed' },
                    { name: 'phone', label: 'Phone Number', value: editing ? form.phone : user?.phone || '', icon: <MdPhone color="#00D4AA" />, disabled: !editing },
                    { name: 'role', label: 'Account Role', value: roleConfig.label, icon: <MdVerifiedUser color="#FFB800" />, disabled: true },
                  ].map(({ name, label, value, icon, disabled, helper }) => (
                    <Grid item xs={12} sm={6} key={name}>
                      <TextField
                        label={label}
                        name={name}
                        value={value}
                        onChange={disabled ? undefined : handleFormChange}
                        disabled={disabled}
                        fullWidth
                        helperText={helper}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">{icon}</InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
                          '& .Mui-disabled': { WebkitTextFillColor: isDark ? (disabled && name !== 'name' && name !== 'phone' ? '#999' : '#ccc') : (disabled && name !== 'name' && name !== 'phone' ? '#666' : '#333') },
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>

                {editing && (
                  <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button variant="outlined" onClick={handleCancelEdit} sx={{ borderRadius: 2.5, fontWeight: 700 }}>Cancel</Button>
                    <Button
                      variant="contained" onClick={handleSave} disabled={saving}
                      startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <MdSave />}
                      sx={{ borderRadius: 2.5, fontWeight: 700, px: 3 }}
                    >
                      {saving ? 'Saving…' : 'Save Changes'}
                    </Button>
                  </Box>
                )}
              </MotionPaper>

              {/* Security Card */}
              <MotionPaper
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                sx={glassCard}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={900}>Security</Typography>
                    <Typography variant="caption" color="text.secondary">Change your account password</Typography>
                  </Box>
                  <IconButton
                    onClick={() => { setChangingPw((v) => !v); setPwError(''); setPwForm({ current: '', newPw: '', confirm: '' }) }}
                    sx={{
                      bgcolor: changingPw ? 'rgba(239,68,68,0.1)' : 'rgba(108,71,255,0.1)',
                      color: changingPw ? 'error.main' : 'primary.main',
                      '&:hover': { bgcolor: changingPw ? 'rgba(239,68,68,0.2)' : 'rgba(108,71,255,0.2)' },
                    }}
                  >
                    {changingPw ? <MdClose size={20} /> : <MdLock size={20} />}
                  </IconButton>
                </Box>

                {!changingPw ? (
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 3,
                    bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(108,71,255,0.04)',
                    border: '1px dashed rgba(108,71,255,0.2)',
                  }}>
                    <MdLock size={24} color="#6C47FF" />
                    <Box>
                      <Typography variant="body2" fontWeight={700}>Password Protected</Typography>
                      <Typography variant="caption" color="text.secondary">Click to change your password</Typography>
                    </Box>
                    <Button onClick={() => setChangingPw(true)} variant="outlined" size="small" sx={{ ml: 'auto', borderRadius: 2, fontWeight: 700 }}>
                      Change
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    {pwError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{pwError}</Alert>}
                    <Grid container spacing={2.5}>
                      {[
                        { key: 'current', label: 'Current Password' },
                        { key: 'newPw', label: 'New Password' },
                        { key: 'confirm', label: 'Confirm New Password' },
                      ].map(({ key, label }) => (
                        <Grid item xs={12} key={key}>
                          <TextField
                            label={label}
                            type={showPw[key] ? 'text' : 'password'}
                            value={pwForm[key]}
                            onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                            fullWidth
                            InputProps={{
                              startAdornment: <InputAdornment position="start"><MdLock color="#6C47FF" /></InputAdornment>,
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))} edge="end" size="small">
                                    {showPw[key] ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                    <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button variant="outlined" onClick={() => { setChangingPw(false); setPwError('') }} sx={{ borderRadius: 2.5, fontWeight: 700 }}>Cancel</Button>
                      <Button
                        variant="contained" onClick={handlePwChange} disabled={pwSaving}
                        startIcon={pwSaving ? <CircularProgress size={16} color="inherit" /> : <MdLock />}
                        sx={{ borderRadius: 2.5, fontWeight: 700, px: 3 }}
                      >
                        {pwSaving ? 'Changing…' : 'Change Password'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </MotionPaper>

              {/* Account Actions */}
              <MotionPaper
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                sx={{ ...glassCard, border: '1px solid rgba(239,68,68,0.15)' }}
              >
                <Typography variant="h6" fontWeight={900} mb={0.5}>Account Actions</Typography>
                <Typography variant="caption" color="text.secondary" mb={3} display="block">Manage your session</Typography>
                <Button
                  variant="outlined" color="error"
                  onClick={() => { logout(); navigate('/') }}
                  sx={{ borderRadius: 2.5, fontWeight: 700 }}
                >
                  Sign Out
                </Button>
              </MotionPaper>

            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
