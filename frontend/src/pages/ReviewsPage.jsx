import { useState, useEffect } from 'react'
import {
  Box, Container, Typography, Grid, Paper, Avatar, Rating,
  Chip, Divider, CircularProgress, useTheme, InputAdornment,
  TextField, Select, MenuItem, FormControl, InputLabel,
  LinearProgress, Tooltip,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { MdVerified, MdThumbUp, MdSearch, MdStar, MdFilterList } from 'react-icons/md'
import api from '../services/api'

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } } }

function StarBar({ value, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
      <Typography variant="caption" fontWeight={700} sx={{ width: 8, textAlign: 'right' }}>{value}</Typography>
      <MdStar size={13} color="#f59e0b" />
      <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 6, borderRadius: 4, bgcolor: 'rgba(0,0,0,0.07)', '& .MuiLinearProgress-bar': { background: '#f59e0b' } }} />
      <Typography variant="caption" color="text.secondary" sx={{ width: 28, textAlign: 'right' }}>{count}</Typography>
    </Box>
  )
}

function ReviewCard({ review, i }) {
  const [liked, setLiked] = useState(false)
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const initials = review.reviewer_name?.[0]?.toUpperCase() || 'U'

  return (
    <motion.div variants={item}>
      <Paper sx={{
        p: { xs: 2.5, md: 3.5 }, borderRadius: 4, height: '100%',
        background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)'}`,
        transition: 'all 0.28s ease',
        '&:hover': { boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.4)' : '0 12px 40px rgba(37,99,235,0.1)', transform: 'translateY(-4px)' },
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {/* Rating stars */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Rating value={review.rating || 5} readOnly precision={0.5} size="small" sx={{ '& .MuiRating-iconFilled': { color: '#f59e0b' } }} />
          <Chip
            label={RATING_LABELS[Math.round(review.rating)] || 'Excellent'}
            size="small"
            sx={{ fontSize: 11, fontWeight: 700, bgcolor: '#fef3c7', color: '#d97706' }}
          />
        </Box>

        {/* Review text */}
        <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.75, flex: 1, fontStyle: 'italic' }}>
          "{review.comment || review.review || 'Great service, highly recommended!'}"
        </Typography>

        {/* Service chip */}
        {review.service_type && (
          <Chip label={`🔧 ${review.service_type}`} size="small" variant="outlined"
            sx={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 600, borderColor: 'rgba(37,99,235,0.3)', color: '#2563eb' }} />
        )}

        <Divider />

        {/* Reviewer info */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{
              width: 38, height: 38, fontWeight: 800, fontSize: 14,
              background: `linear-gradient(135deg, ${'#2563eb'}, #14b8a6)`,
            }}>
              {initials}
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" fontWeight={800}>{review.reviewer_name || 'Verified Customer'}</Typography>
                <MdVerified size={14} color="#22c55e" />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {review.created_at ? new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
              </Typography>
            </Box>
          </Box>

          <Tooltip title={liked ? 'Liked!' : 'Mark helpful'}>
            <Box
              onClick={() => setLiked(l => !l)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.5, borderRadius: 2,
                cursor: 'pointer', border: '1px solid',
                borderColor: liked ? '#2563eb' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'),
                color: liked ? '#2563eb' : 'text.secondary',
                bgcolor: liked ? 'rgba(37,99,235,0.07)' : 'transparent',
                transition: 'all 0.2s',
                '&:hover': { borderColor: '#2563eb', color: '#2563eb', bgcolor: 'rgba(37,99,235,0.06)' },
              }}
            >
              <MdThumbUp size={14} />
              <Typography variant="caption" fontWeight={700}>Helpful</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Paper>
    </motion.div>
  )
}

export default function ReviewsPage() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [reviews, setReviews]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')

  useEffect(() => {
    api.get('/reviews/all')
      .then(r => setReviews(r.data || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = reviews.filter(r => {
    const matchSearch = !search || (r.reviewer_name?.toLowerCase().includes(search.toLowerCase()) || r.comment?.toLowerCase().includes(search.toLowerCase()))
    const matchFilter = filter === 'all' || String(Math.round(r.rating || 0)) === filter
    return matchSearch && matchFilter
  })

  // Aggregate stats
  const avg = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length).toFixed(1) : '5.0'
  const counts = [5,4,3,2,1].map(v => ({ v, count: reviews.filter(r => Math.round(r.rating || 5) === v).length }))

  return (
    <Box sx={{ background: isDark ? '#060612' : '#f8fafc', minHeight: '100vh' }}>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <Box sx={{
        py: { xs: 8, md: 12 },
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 50%, #14b8a6 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Box sx={{ textAlign: 'center', color: '#fff' }}>
              <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: '0.1em' }}>What customers say</Typography>
              <Typography variant="h2" fontWeight={900} mb={1.5} sx={{ letterSpacing: '-0.04em', mt: 0.5 }}>
                Real Reviews, Real Experiences
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400, mb: 4, maxWidth: 500, mx: 'auto' }}>
                Thousands of verified reviews from customers across India
              </Typography>

              {/* Average rating card */}
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 3, px: 4, py: 2.5, borderRadius: 4, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" fontWeight={900} sx={{ color: '#fbbf24', lineHeight: 1, letterSpacing: '-0.04em' }}>{avg}</Typography>
                  <Rating value={parseFloat(avg)} readOnly precision={0.1} size="small" sx={{ '& .MuiRating-iconFilled': { color: '#fbbf24' } }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{reviews.length} reviews</Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />
                <Box>
                  {counts.map(({ v, count }) => <StarBar key={v} value={v} count={count} total={reviews.length} />)}
                </Box>
              </Box>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small" placeholder="Search reviews…" value={search}
            onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 220 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><MdSearch color="#94a3b8" /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Rating Filter</InputLabel>
            <Select value={filter} onChange={(e) => setFilter(e.target.value)} label="Rating Filter"
              startAdornment={<MdFilterList color="#94a3b8" style={{ marginRight: 6 }} />}>
              <MenuItem value="all">All Ratings</MenuItem>
              {[5,4,3,2,1].map(v => <MenuItem key={v} value={String(v)}>{v} Stars</MenuItem>)}
            </Select>
          </FormControl>
          <Chip
            label={`${filtered.length} review${filtered.length !== 1 ? 's' : ''}`}
            sx={{ fontWeight: 700, bgcolor: 'rgba(37,99,235,0.1)', color: '#2563eb' }}
          />
        </Box>
      </Container>

      {/* ── Reviews Grid ──────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 10 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: '#2563eb' }} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h2" mb={2}>📭</Typography>
            <Typography variant="h6" fontWeight={700} mb={1}>No reviews found</Typography>
            <Typography color="text.secondary">Try adjusting your search or filters</Typography>
          </Box>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show">
            <Grid container spacing={3}>
              {filtered.map((review, i) => (
                <Grid item xs={12} sm={6} lg={4} key={review._id || review.id || i}>
                  <ReviewCard review={review} i={i} />
                </Grid>
              ))}
            </Grid>
          </motion.div>
        )}
      </Container>
    </Box>
  )
}
