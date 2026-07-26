import { useState, useEffect, useRef } from 'react'
import {
  Container, Box, Typography, Paper, Chip, Button, TextField,
  LinearProgress, Avatar, Divider, CircularProgress,
  Alert, useTheme, Grid, IconButton, Tooltip,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import {
  MdArrowBack, MdSend, MdReportProblem, MdCheckCircle,
  MdSearch, MdPending, MdOutlineHourglassEmpty,
  MdLock, MdVerified,
} from 'react-icons/md'
import { useAuth } from '../hooks/useAuth'
import { getComplaintById, getComplaintMessages, addComplaintMessage } from '../services/complaintService'

const STATUS_CFG = {
  open:          { label: 'Open',          color: '#FF6B35', step: 0 },
  under_review:  { label: 'Under Review',  color: '#FFB800', step: 1 },
  assigned:      { label: 'Assigned',      color: '#6C47FF', step: 2 },
  investigating: { label: 'Investigating', color: '#3B82F6', step: 3 },
  resolved:      { label: 'Resolved',      color: '#22C55E', step: 4 },
  closed:        { label: 'Closed',        color: '#6B7280', step: 5 },
}

const PRIORITY_COLOR = { low: '#22C55E', medium: '#FFB800', high: '#FF6B35', critical: '#EF4444' }

const TIMELINE_STEPS = [
  { key: 'open',          label: 'Submitted' },
  { key: 'under_review',  label: 'Under Review' },
  { key: 'assigned',      label: 'Assigned' },
  { key: 'investigating', label: 'Investigating' },
  { key: 'resolved',      label: 'Resolved' },
]

export default function ComplaintDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const messagesEndRef = useRef(null)

  const [complaint, setComplaint] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMsg, setNewMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [c, m] = await Promise.all([
          getComplaintById(id),
          getComplaintMessages(id).catch(() => []),
        ])
        setComplaint(c)
        setMessages(m)
      } catch {
        setError('Could not load complaint. It may not exist or you may not have access.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!newMsg.trim()) return
    setSending(true)
    try {
      const msg = await addComplaintMessage(id, { message: newMsg.trim(), attachments: [] })
      setMessages(m => [...m, msg])
      setNewMsg('')
    } catch {
      setError('Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const glassCard = {
    borderRadius: 3, p: 3,
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.95)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(108,71,255,0.08)',
    boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(108,71,255,0.06)',
  }

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
      <CircularProgress size={48} thickness={3} />
      <Typography color="text.secondary">Loading complaint…</Typography>
    </Box>
  )

  if (error && !complaint) return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>
      <Button startIcon={<MdArrowBack />} onClick={() => navigate('/my-complaints')} sx={{ mt: 2 }}>Back to Complaints</Button>
    </Container>
  )

  const s = STATUS_CFG[complaint?.status] || STATUS_CFG.open
  const pColor = PRIORITY_COLOR[complaint?.priority] || '#FFB800'
  const currentStep = s.step

  return (
    <Box sx={{
      minHeight: '100vh',
      background: isDark ? 'linear-gradient(135deg,#08080F,#0D0D1A)' : 'linear-gradient(135deg,#F0EDFF,#FAFAFA)',
      py: { xs: 3, md: 5 },
    }}>
      <Container maxWidth="lg">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <Button startIcon={<MdArrowBack />} onClick={() => navigate('/my-complaints')} sx={{ color: 'text.secondary', mb: 2 }}>
            Back to Complaints
          </Button>
          <Paper sx={{ ...glassCard, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{
                  width: 52, height: 52, borderRadius: 3, flexShrink: 0,
                  background: `linear-gradient(135deg,${s.color},${s.color}88)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 4px 16px ${s.color}44`,
                }}>
                  <MdReportProblem color="#fff" size={26} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={900} mb={0.5}>{complaint?.title}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={complaint?.category} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                    <Chip label={(complaint?.priority || 'medium').toUpperCase()} size="small"
                      sx={{ bgcolor: `${pColor}18`, color: pColor, fontWeight: 700, fontSize: 11, border: `1px solid ${pColor}30` }} />
                    <Chip label={s.label} size="small"
                      sx={{ bgcolor: `${s.color}18`, color: s.color, fontWeight: 700, fontSize: 11 }} />
                  </Box>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Filed {complaint?.created_at ? new Date(complaint.created_at).toLocaleDateString('en-IN') : '—'}
              </Typography>
            </Box>
            {complaint?.description && (
              <Box sx={{ mt: 2.5, p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(108,71,255,0.03)', border: '1px dashed rgba(108,71,255,0.15)' }}>
                <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{complaint.description}</Typography>
              </Box>
            )}
          </Paper>
        </motion.div>

        <Grid container spacing={3}>
          {/* Left — Timeline + Chat */}
          <Grid item xs={12} md={8}>
            {/* Timeline */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Paper sx={{ ...glassCard, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={800} mb={2.5}>Status Timeline</Typography>
                {TIMELINE_STEPS.map((step, i) => {
                  const done = i <= currentStep
                  const active = i === currentStep
                  return (
                    <Box key={step.key} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2, flexShrink: 0 }}>
                        <Box sx={{
                          width: 34, height: 34, borderRadius: '50%',
                          bgcolor: done ? s.color : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: active ? `0 0 0 4px ${s.color}30` : 'none',
                          transition: 'all 0.3s',
                        }}>
                          {done ? <MdCheckCircle color="#fff" size={16} /> : <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }} />}
                        </Box>
                        {i < TIMELINE_STEPS.length - 1 && (
                          <Box sx={{ width: 2, height: 28, bgcolor: i < currentStep ? s.color : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'), transition: 'all 0.3s' }} />
                        )}
                      </Box>
                      <Box sx={{ pb: i < TIMELINE_STEPS.length - 1 ? 1.5 : 0, pt: 0.5 }}>
                        <Typography variant="body2" fontWeight={active ? 800 : 600} sx={{ color: done ? s.color : 'text.secondary' }}>
                          {step.label}
                        </Typography>
                        {active && <Typography variant="caption" color="text.secondary">Current status</Typography>}
                      </Box>
                    </Box>
                  )
                })}
                {complaint?.resolution_note && (
                  <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                      <MdVerified color="#22C55E" size={14} />
                      <Typography variant="caption" fontWeight={800} color="#22C55E">Resolution Note</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">{complaint.resolution_note}</Typography>
                  </Box>
                )}
              </Paper>
            </motion.div>

            {/* Chat */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Paper sx={glassCard}>
                <Typography variant="subtitle1" fontWeight={800} mb={2}>Support Chat</Typography>
                <Divider sx={{ mb: 2 }} />
                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

                <Box sx={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                  {messages.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography color="text.secondary">No messages yet. Start the conversation below.</Typography>
                    </Box>
                  ) : messages.map((msg, i) => {
                    const isMe = msg.sender_id === (user?.id || user?._id)
                    const isAdmin = msg.sender_role === 'admin'
                    return (
                      <motion.div key={msg.id || i} initial={{ opacity: 0, x: isMe ? 16 : -16 }} animate={{ opacity: 1, x: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: 1 }}>
                          {!isMe && (
                            <Avatar sx={{
                              width: 30, height: 30, fontSize: 12, flexShrink: 0,
                              background: isAdmin ? 'linear-gradient(135deg,#6C47FF,#9B72FF)' : 'linear-gradient(135deg,#00D4AA,#00B894)',
                            }}>
                              {isAdmin ? '👑' : (msg.sender_name?.[0] || 'U').toUpperCase()}
                            </Avatar>
                          )}
                          <Box sx={{ maxWidth: '72%' }}>
                            <Box sx={{
                              px: 2, py: 1.5,
                              borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              background: isMe
                                ? 'linear-gradient(135deg,#6C47FF,#9B72FF)'
                                : (isAdmin ? 'rgba(108,71,255,0.08)' : (isDark ? 'rgba(255,255,255,0.07)' : '#f5f5f5')),
                              border: isAdmin && !isMe ? '1px solid rgba(108,71,255,0.2)' : 'none',
                            }}>
                              {isAdmin && !isMe && (
                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 0.5 }}>
                                  <MdVerified color="#6C47FF" size={12} />
                                  <Typography variant="caption" fontWeight={800} color="primary.main">OneDW Support</Typography>
                                </Box>
                              )}
                              <Typography variant="body2" sx={{ color: isMe ? '#fff' : 'text.primary', lineHeight: 1.55 }}>
                                {msg.message}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ px: 1, display: 'block', mt: 0.3, textAlign: isMe ? 'right' : 'left' }}>
                              {msg.sender_name || ''} · {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </Typography>
                          </Box>
                        </Box>
                      </motion.div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </Box>

                {['resolved', 'closed'].includes(complaint?.status) ? (
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(107,114,128,0.08)', textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      This complaint is {complaint.status}. Thread closed.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                    <TextField
                      fullWidth multiline maxRows={4}
                      placeholder="Type your message… (Enter to send)"
                      value={newMsg}
                      onChange={e => setNewMsg(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                    />
                    <Tooltip title="Send message">
                      <span>
                        <IconButton
                          onClick={handleSend}
                          disabled={sending || !newMsg.trim()}
                          sx={{
                            background: 'linear-gradient(135deg,#6C47FF,#9B72FF)',
                            color: '#fff', width: 48, height: 48, flexShrink: 0,
                            '&:hover': { background: 'linear-gradient(135deg,#5535E0,#8060E0)', transform: 'scale(1.05)' },
                            '&:disabled': { opacity: 0.4, background: '#aaa' },
                            transition: 'all 0.2s',
                          }}
                        >
                          {sending ? <CircularProgress size={20} color="inherit" /> : <MdSend size={20} />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                )}
              </Paper>
            </motion.div>
          </Grid>

          {/* Right — Info Panel */}
          <Grid item xs={12} md={4}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Paper sx={{ ...glassCard, mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={800} mb={2}>Complaint Details</Typography>
                {[
                  { label: 'Complaint ID', value: `#${(complaint?.id || '').slice(-8).toUpperCase()}` },
                  { label: 'Category', value: complaint?.category || '—' },
                  { label: 'Priority', value: (complaint?.priority || 'medium') },
                  { label: 'Filed On', value: complaint?.created_at ? new Date(complaint.created_at).toLocaleDateString('en-IN') : '—' },
                  { label: 'Last Updated', value: complaint?.updated_at ? new Date(complaint.updated_at).toLocaleDateString('en-IN') : '—' },
                  ...(complaint?.booking_id ? [{ label: 'Related Booking', value: `#${complaint.booking_id.slice(-8).toUpperCase()}` }] : []),
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                    <Typography variant="caption" fontWeight={700} textTransform="capitalize">{value}</Typography>
                  </Box>
                ))}
              </Paper>

              <Paper sx={glassCard}>
                <Typography variant="subtitle2" fontWeight={800} mb={1.5}>What Happens Next?</Typography>
                {[
                  'Our team reviews your complaint within 24 hours.',
                  'We investigate and may contact you for more info.',
                  'Resolution is provided within 3–5 business days.',
                  'The complaint is closed after resolution.',
                ].map((text, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                    <Box sx={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0, mt: 0.2,
                      background: 'linear-gradient(135deg,#6C47FF,#9B72FF)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Typography sx={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>{i + 1}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" lineHeight={1.6}>{text}</Typography>
                  </Box>
                ))}
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
