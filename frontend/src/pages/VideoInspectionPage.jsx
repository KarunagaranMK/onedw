import { useState, useEffect } from 'react'
import {
  Box, Typography, Paper, TextField, Button, Grid, Chip,
  CircularProgress, Alert, Avatar, Divider, useTheme, List,
  ListItem, ListItemText, LinearProgress,
} from '@mui/material'
import { motion } from 'framer-motion'
import {
  MdVideocam, MdCheckCircle, MdBuild, MdAttachMoney,
  MdAccessTime, MdSave, MdArrowBack,
} from 'react-icons/md'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import chatService from '../services/chatService'

export default function VideoInspectionPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const { user } = useAuth()

  const [videoSession, setVideoSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  // Inspection form
  const [cost, setCost]           = useState('')
  const [time, setTime]           = useState('')
  const [notes, setNotes]         = useState('')
  const [recommendation, setRec]  = useState('')
  const [materials, setMaterials] = useState('')

  const isWorker = user?.role === 'worker'

  useEffect(() => {
    chatService.getVideoSession(sessionId)
      .then(r => setVideoSession(r.data))
      .catch(() => setError('Video session not found.'))
      .finally(() => setLoading(false))
  }, [sessionId])

  const handleSaveSummary = async () => {
    setSaving(true)
    try {
      const payload = {
        estimated_cost: cost,
        time_required: time,
        worker_notes: notes,
        recommendation,
        materials_required: materials.split('\n').map(m => m.trim()).filter(Boolean),
      }
      const r = await chatService.saveInspectionSummary(sessionId, payload)
      setVideoSession(r.data)
      setSaved(true)
    } catch { setError('Could not save summary.') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
      <CircularProgress sx={{ color: '#2563eb' }} />
      <Typography color="text.secondary">Loading video session…</Typography>
    </Box>
  )

  if (error || !videoSession) return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Typography variant="h1" mb={2}>📵</Typography>
      <Typography variant="h6" fontWeight={700} mb={1}>{error || 'Session not found'}</Typography>
      <Button onClick={() => navigate(-1)} startIcon={<MdArrowBack />} variant="outlined" sx={{ borderRadius: 2, mt: 2 }}>Go Back</Button>
    </Box>
  )

  const summary = videoSession.inspection_summary

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 4 }, background: isDark ? '#080812' : '#f8fafc' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button onClick={() => navigate(-1)} startIcon={<MdArrowBack />} variant="outlined" sx={{ borderRadius: 2 }}>Back</Button>
          <Box>
            <Typography variant="overline" sx={{ color: '#2563eb', fontWeight: 700 }}>Video Inspection</Typography>
            <Typography variant="h5" fontWeight={900}>Live Video Session</Typography>
          </Box>
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        {/* ── Jitsi Video ────────────────────────────────────────────── */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
            <Box sx={{
              p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
              background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
              color: '#fff',
            }}>
              <MdVideocam size={22} />
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={800}>Video Inspection Call</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Room: {videoSession.jitsi_room} · Powered by Jitsi Meet
                </Typography>
              </Box>
              <Chip label={videoSession.status} size="small"
                sx={{ background: videoSession.status === 'active' ? '#22c55e' : 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }} />
            </Box>

            {/* Jitsi iframe */}
            <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
              <iframe
                title="Video Inspection"
                src={videoSession.jitsi_url}
                allow="camera; microphone; fullscreen; display-capture"
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '100%', height: '100%',
                  border: 'none',
                }}
              />
            </Box>

            <Box sx={{ p: 2, background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
              <Typography variant="caption" color="text.secondary">
                📱 Share link to join: <strong>{videoSession.jitsi_url}</strong>
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* ── Inspection Summary Panel ────────────────────────────────── */}
        <Grid item xs={12} lg={4}>
          {/* Existing summary (read-only for customer) */}
          {summary ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Paper sx={{ p: 3, borderRadius: 4, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <MdCheckCircle size={20} color="#22c55e" />
                  <Typography variant="h6" fontWeight={800}>Inspection Summary</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {[
                  { icon: <MdAttachMoney size={18} color="#22c55e" />, label: 'Estimated Cost', value: summary.estimated_cost || '—' },
                  { icon: <MdAccessTime size={18} color="#f59e0b" />, label: 'Time Required', value: summary.time_required || '—' },
                  { icon: <MdBuild size={18} color="#2563eb" />, label: 'Recommendation', value: summary.recommendation || '—' },
                ].map(({ icon, label, value }) => (
                  <Box key={label} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      {icon}
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>{label}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600}>{value}</Typography>
                  </Box>
                ))}
                {summary.materials_required?.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.75}>Materials Required</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {summary.materials_required.map((m, i) => <Chip key={i} label={m} size="small" sx={{ fontSize: 11 }} />)}
                    </Box>
                  </Box>
                )}
                {summary.worker_notes && (
                  <Box sx={{ p: 1.5, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.5}>Worker Notes</Typography>
                    <Typography variant="body2">{summary.worker_notes}</Typography>
                  </Box>
                )}
              </Paper>
            </motion.div>
          ) : isWorker ? (
            /* Worker fills inspection form */
            <Paper sx={{ p: 3, borderRadius: 4, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
              <Typography variant="h6" fontWeight={800} mb={0.5}>Inspection Report</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2.5}>
                Fill in after inspecting the issue via video
              </Typography>

              {saved && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>Summary saved!</Alert>}

              <TextField fullWidth label="Estimated Cost (₹)" value={cost} onChange={e => setCost(e.target.value)} sx={{ mb: 2 }} placeholder="e.g. ₹500 – ₹800" />
              <TextField fullWidth label="Time Required" value={time} onChange={e => setTime(e.target.value)} sx={{ mb: 2 }} placeholder="e.g. 2–3 hours" />
              <TextField fullWidth multiline rows={2} label="Materials Required (one per line)" value={materials} onChange={e => setMaterials(e.target.value)} sx={{ mb: 2 }} placeholder="e.g. Copper wire 5m&#10;Electrical tape" />
              <TextField fullWidth multiline rows={2} label="Recommendation" value={recommendation} onChange={e => setRec(e.target.value)} sx={{ mb: 2 }} placeholder="Summary of what needs to be done…" />
              <TextField fullWidth multiline rows={2} label="Notes" value={notes} onChange={e => setNotes(e.target.value)} sx={{ mb: 3 }} />

              <Button fullWidth variant="contained" size="large" onClick={handleSaveSummary} disabled={saving}
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <MdSave />}
                sx={{ py: 1.5, fontWeight: 800, borderRadius: 2.5, background: 'linear-gradient(135deg, #2563eb, #3b82f6)', '&:hover': { background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' } }}>
                {saving ? 'Saving…' : 'Save Inspection Summary'}
              </Button>
            </Paper>
          ) : (
            <Paper sx={{ p: 3, borderRadius: 4, textAlign: 'center', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
              <Typography variant="h2" mb={2}>⏳</Typography>
              <Typography fontWeight={700}>Waiting for worker…</Typography>
              <Typography variant="caption" color="text.secondary">The worker will share their inspection summary after the call</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}
