import { useState, useEffect } from 'react'
import {
  Box, Container, Typography, Grid, Paper, Avatar, Chip,
  Rating, Button, CircularProgress, TextField, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Skeleton, Divider,
  useTheme, Tooltip,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  MdSearch, MdStar, MdVerified, MdLocationOn, MdWork,
  MdArrowForward, MdAutoAwesome, MdFilterList, MdMessage,
} from 'react-icons/md'
import { useAuth } from '../hooks/useAuth'
import chatService from '../services/chatService'
import api from '../services/api'

const CATEGORIES = ['All', 'Electrician', 'Plumber', 'Painter', 'Cleaner', 'Carpenter', 'AC Repair', 'Interior', 'Security']
const SORT_OPTIONS = [
  { value: 'rating', label: 'Highest Rated' },
  { value: 'experience', label: 'Most Experienced' },
  { value: 'name', label: 'Name A–Z' },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } } }

function WorkerCard({ worker, onMessage }) {
  const navigate = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const avgRating = worker.average_rating || worker.rating || 4.8
  const jobs      = worker.completed_jobs || worker.jobs_completed || Math.floor(Math.random() * 200 + 50)
  const exp       = worker.experience_years || worker.years_experience || 3
  const isAI      = worker.ai_recommended
  const isVerified = worker.is_verified !== false

  return (
    <motion.div variants={item}>
      <Paper sx={{
        p: 0, borderRadius: 4, overflow: 'hidden',
        background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)'}`,
        transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.5)' : '0 20px 50px rgba(37,99,235,0.12)',
          borderColor: isDark ? 'rgba(37,99,235,0.3)' : 'rgba(37,99,235,0.2)',
        },
        height: '100%', display: 'flex', flexDirection: 'column',
      }}>
        {/* Cover */}
        <Box sx={{
          height: 80, position: 'relative',
          background: `linear-gradient(135deg, ${['#1e3a5f','#0d4f47','#3b1a6b','#6b1a1a'][Math.abs(worker.name?.charCodeAt(0) || 65) % 4]}, #2563eb)`,
        }}>
          {isAI && (
            <Chip size="small" icon={<MdAutoAwesome size={11} />} label="AI Recommended"
              sx={{ position: 'absolute', top: 10, right: 10, fontSize: 10, height: 22, fontWeight: 700, bgcolor: 'rgba(245,158,11,0.9)', color: '#fff' }} />
          )}
        </Box>

        <Box sx={{ px: 2.5, pb: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Avatar overlapping cover */}
          <Box sx={{ mt: -4, mb: 1.5 }}>
            <Avatar sx={{
              width: 64, height: 64, fontSize: 24, fontWeight: 900,
              background: 'linear-gradient(135deg, #2563eb, #14b8a6)',
              border: '3px solid', borderColor: 'background.paper',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              {(worker.name || 'W')[0].toUpperCase()}
            </Avatar>
          </Box>

          {/* Name + verified */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
            <Typography variant="body1" fontWeight={800} sx={{ lineHeight: 1.2 }}>{worker.name}</Typography>
            {isVerified && <MdVerified size={16} color="#22c55e" />}
          </Box>

          {/* Category */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
            <MdWork size={13} color="#2563eb" />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {worker.service_category || worker.category || 'Home Services'}
            </Typography>
            {worker.location && (
              <>
                <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled', mx: 0.5 }} />
                <MdLocationOn size={12} color="#94a3b8" />
                <Typography variant="caption" color="text.disabled">{worker.location}</Typography>
              </>
            )}
          </Box>

          {/* Stats row */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <MdStar size={14} color="#f59e0b" />
              <Typography variant="body2" fontWeight={800}>{avgRating.toFixed(1)}</Typography>
            </Box>
            <Typography variant="caption" color="text.disabled">·</Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>{jobs} jobs</Typography>
            <Typography variant="caption" color="text.disabled">·</Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>{exp}y exp</Typography>
          </Box>

          {/* Bio */}
          {worker.bio && (
            <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 1.5, lineHeight: 1.6 }}>
              {worker.bio}
            </Typography>
          )}

          <Box sx={{ mt: 'auto', pt: 1.5, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}` }}>
            <Grid container spacing={1}>
              <Grid item xs={7}>
                <Button fullWidth variant="contained" size="small"
                  onClick={() => {
                    const cat = worker.service_category || worker.category || ''
                    const wid = worker._id || worker.id || ''
                    navigate(`/create-request?category=${encodeURIComponent(cat)}&worker=${wid}`)
                  }}
                  endIcon={<MdArrowForward size={14} />}
                  sx={{ fontWeight: 700, borderRadius: 2.5, py: 0.75, fontSize: 13 }}>
                  Book Now
                </Button>
              </Grid>
              <Grid item xs={5}>
                <Button fullWidth variant="outlined" size="small"
                  onClick={() => onMessage(worker)}
                  startIcon={<MdMessage size={14} />}
                  sx={{ fontWeight: 700, borderRadius: 2.5, py: 0.75, fontSize: 13 }}>
                  Chat
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <Paper sx={{ borderRadius: 4, overflow: 'hidden', p: 0 }}>
      <Skeleton variant="rectangular" height={80} />
      <Box sx={{ p: 2.5 }}>
        <Skeleton variant="circular" width={60} height={60} sx={{ mt: -3, mb: 1.5 }} />
        <Skeleton width="60%" height={20} />
        <Skeleton width="40%" height={16} sx={{ mt: 0.5 }} />
        <Skeleton width="80%" height={14} sx={{ mt: 1.5 }} />
        <Skeleton width="100%" height={36} sx={{ mt: 2, borderRadius: 2 }} />
      </Box>
    </Paper>
  )
}

export default function WorkersList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [searchParams] = useSearchParams()

  const [workers, setWorkers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState(searchParams.get('category') || 'All')
  const [sortBy, setSortBy]     = useState('rating')

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (category && category !== 'All') params.category = category
    if (search) params.search = search
    api.get('/workers/search', { params })
      .catch(() => api.get('/workers', { params }))
      .then(r => setWorkers(r.data?.workers || r.data || []))
      .catch(() => setWorkers([]))
      .finally(() => setLoading(false))
  }, [category, search])

  const handleMessage = async (worker) => {
    if (!user) { navigate('/login'); return }
    try {
      const r = await chatService.startSession({ worker_id: worker._id || worker.id })
      navigate(`/chat/${r.data.id}`)
    } catch { navigate('/chat') }
  }

  const filtered = workers
    .filter(w => !search || w.name?.toLowerCase().includes(search.toLowerCase()) || w.service_category?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.average_rating || 4.5) - (a.average_rating || 4.5)
      if (sortBy === 'experience') return (b.experience_years || 0) - (a.experience_years || 0)
      return (a.name || '').localeCompare(b.name || '')
    })

  return (
    <Box sx={{ background: isDark ? '#060612' : '#f8fafc', minHeight: '100vh' }}>

      {/* Hero */}
      <Box sx={{
        py: { xs: 7, md: 10 }, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 50%, #0d9488 100%)',
      }}>
        <Box sx={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Box sx={{ textAlign: 'center', color: '#fff' }}>
              <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: '0.1em' }}>Discover Professionals</Typography>
              <Typography variant="h3" fontWeight={900} mb={2} sx={{ letterSpacing: '-0.04em', mt: 0.5 }}>
                Find Your Perfect{' '}
                <Box component="span" sx={{ background: 'linear-gradient(90deg, #93c5fd, #5eead4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Professional
                </Box>
              </Typography>

              {/* Search */}
              <Box sx={{ maxWidth: 560, mx: 'auto', mt: 3 }}>
                <Paper sx={{ display: 'flex', alignItems: 'center', borderRadius: 3, p: 0.75, background: 'rgba(255,255,255,0.97)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                  <MdSearch size={22} color="#2563eb" style={{ marginLeft: 12 }} />
                  <TextField
                    variant="standard" fullWidth placeholder="Search by name or service…"
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    InputProps={{ disableUnderline: true, sx: { px: 1.5, fontSize: 15, fontWeight: 500 } }}
                  />
                  <Button variant="contained" sx={{ borderRadius: 2.5, px: 3, py: 1.25, fontWeight: 800, whiteSpace: 'nowrap' }}>
                    Search
                  </Button>
                </Paper>
              </Box>
            </Box>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>

        {/* Category + Filter bar */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 4 }}>
          {/* Category chips */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flex: 1 }}>
            {CATEGORIES.map(cat => (
              <Chip key={cat} label={cat} onClick={() => setCategory(cat)}
                variant={category === cat ? 'filled' : 'outlined'}
                color={category === cat ? 'primary' : 'default'}
                sx={{ fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              />
            ))}
          </Box>

          {/* Sort */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Sort By</InputLabel>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="Sort By"
              startAdornment={<MdFilterList style={{ marginRight: 6 }} color="#94a3b8" />}>
              {SORT_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>

          <Chip label={loading ? 'Loading…' : `${filtered.length} professionals`}
            sx={{ fontWeight: 700, bgcolor: 'rgba(37,99,235,0.1)', color: '#2563eb' }} />
        </Box>

        {/* Worker grid */}
        {loading ? (
          <Grid container spacing={3}>
            {[...Array(8)].map((_, i) => <Grid item xs={12} sm={6} md={4} lg={3} key={i}><SkeletonCard /></Grid>)}
          </Grid>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <Typography variant="h1" mb={2}>👷</Typography>
            <Typography variant="h6" fontWeight={700} mb={1}>No professionals found</Typography>
            <Typography color="text.secondary" mb={3}>Try a different category or search term</Typography>
            <Button variant="contained" onClick={() => { setCategory('All'); setSearch('') }}>Clear Filters</Button>
          </Box>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={category + search} variants={container} initial="hidden" animate="show">
              <Grid container spacing={3}>
                {filtered.map((worker, i) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={worker._id || worker.id || i}>
                    <WorkerCard worker={worker} onMessage={handleMessage} />
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          </AnimatePresence>
        )}
      </Container>
    </Box>
  )
}
