import { useState, useEffect } from 'react'
import {
  Container, Box, Typography, Paper, Chip, Button,
  LinearProgress, Avatar, Divider, CircularProgress,
  Alert, useTheme, Grid,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  MdAdd, MdArrowBack, MdReportProblem, MdCheckCircle,
  MdOutlineHourglassEmpty, MdSearch, MdPending,
} from 'react-icons/md'
import { useAuth } from '../hooks/useAuth'
import { getMyComplaints } from '../services/complaintService'

const STATUS_CONFIG = {
  open:          { label: 'Open',          color: '#FF6B35', bg: 'rgba(255,107,53,0.1)',   icon: <MdReportProblem /> },
  under_review:  { label: 'Under Review',  color: '#FFB800', bg: 'rgba(255,184,0,0.1)',    icon: <MdSearch /> },
  assigned:      { label: 'Assigned',      color: '#6C47FF', bg: 'rgba(108,71,255,0.1)',   icon: <MdPending /> },
  investigating: { label: 'Investigating', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',   icon: <MdOutlineHourglassEmpty /> },
  resolved:      { label: 'Resolved',      color: '#22C55E', bg: 'rgba(34,197,94,0.1)',    icon: <MdCheckCircle /> },
  closed:        { label: 'Closed',        color: '#6B7280', bg: 'rgba(107,114,128,0.1)',  icon: <MdCheckCircle /> },
}

const PRIORITY_CONFIG = {
  low:      { color: '#22C55E', label: 'Low' },
  medium:   { color: '#FFB800', label: 'Medium' },
  high:     { color: '#FF6B35', label: 'High' },
  critical: { color: '#EF4444', label: 'Critical' },
}

const ComplaintCard = ({ complaint, onClick }) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const s = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.open
  const p = PRIORITY_CONFIG[complaint.priority] || PRIORITY_CONFIG.medium
  const date = complaint.created_at ? new Date(complaint.created_at).toLocaleDateString('en-IN') : '—'

  return (
    <motion.div whileHover={{ y: -3, scale: 1.01 }} transition={{ duration: 0.2 }}>
      <Paper
        onClick={onClick}
        sx={{
          p: 3, borderRadius: 3, cursor: 'pointer',
          border: `1px solid ${s.color}20`,
          background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
          boxShadow: `0 4px 20px ${s.color}10`,
          transition: 'all 0.2s',
          '&:hover': { boxShadow: `0 8px 32px ${s.color}25` },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={800} sx={{ flex: 1, pr: 1 }}>
            {complaint.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Chip
              label={p.label}
              size="small"
              sx={{ bgcolor: `${p.color}18`, color: p.color, fontWeight: 700, fontSize: 11, border: `1px solid ${p.color}30` }}
            />
            <Chip
              icon={s.icon}
              label={s.label}
              size="small"
              sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: 11, '& .MuiChip-icon': { color: s.color } }}
            />
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', mb: 2,
        }}>
          {complaint.description}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip label={complaint.category} size="small" variant="outlined" sx={{ fontSize: 11 }} />
          <Typography variant="caption" color="text.secondary">{date}</Typography>
        </Box>
      </Paper>
    </motion.div>
  )
}

export default function MyComplaintsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyComplaints()
      .then(setComplaints)
      .catch(() => setError('Failed to load complaints.'))
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    resolved: complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length,
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: isDark
        ? 'linear-gradient(135deg,#08080F,#0D0D1A)'
        : 'linear-gradient(135deg,#F0EDFF,#FAFAFA)',
      py: { xs: 3, md: 6 },
    }}>
      <Container maxWidth="lg">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Button startIcon={<MdArrowBack />} onClick={() => navigate(-1)} sx={{ color: 'text.secondary', mb: 1 }}>Back</Button>
              <Typography variant="h4" fontWeight={900}>My Complaints</Typography>
              <Typography variant="body2" color="text.secondary">Track and manage your submitted complaints</Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<MdAdd />}
              onClick={() => navigate('/complaint/new')}
              sx={{ borderRadius: 2.5, fontWeight: 700, px: 3, py: 1.2 }}
            >
              New Complaint
            </Button>
          </Box>
        </motion.div>

        {/* Stats */}
        <Grid container spacing={2} mb={4}>
          {[
            { label: 'Total', value: stats.total, color: '#6C47FF' },
            { label: 'Open', value: stats.open, color: '#FF6B35' },
            { label: 'Resolved', value: stats.resolved, color: '#22C55E' },
          ].map((s, i) => (
            <Grid item xs={4} key={s.label}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Paper sx={{
                  p: 2.5, borderRadius: 3, textAlign: 'center',
                  background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                  border: `1px solid ${s.color}20`,
                }}>
                  <Typography variant="h3" fontWeight={900} sx={{ color: s.color }}>{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{s.label}</Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Complaints List */}
        {loading && <LinearProgress sx={{ borderRadius: 1, mb: 3 }} />}
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

        {!loading && complaints.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Paper sx={{ p: 6, borderRadius: 4, textAlign: 'center', background: isDark ? 'rgba(255,255,255,0.04)' : '#fff' }}>
              <MdCheckCircle size={64} color="#22C55E" style={{ marginBottom: 16 }} />
              <Typography variant="h6" fontWeight={700} mb={1}>No complaints filed</Typography>
              <Typography color="text.secondary" mb={3}>Everything looks good! If you face any issues, you can raise a complaint here.</Typography>
              <Button variant="contained" startIcon={<MdAdd />} onClick={() => navigate('/complaint/new')} sx={{ borderRadius: 2.5, fontWeight: 700 }}>
                File a Complaint
              </Button>
            </Paper>
          </motion.div>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {complaints.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <ComplaintCard complaint={c} onClick={() => navigate(`/complaint/${c.id}`)} />
              </motion.div>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  )
}
