import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Box, Container, Grid, Typography, Skeleton,
  Alert, Chip, Pagination, useMediaQuery, useTheme,
  Drawer, IconButton, Button, Divider, Paper, Badge,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MdTune, MdClose, MdLocationOn } from 'react-icons/md'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import SearchBar from '../components/workers/SearchBar'
import FilterSidebar from '../components/workers/FilterSidebar'
import WorkerCard from '../components/workers/WorkerCard'
import WorkerProfileModal from '../components/workers/WorkerProfileModal'

const PER_PAGE = 9

const filterKey = (f) =>
  `${f.priceRange?.[1]}-${f.minRating}-${f.minExp}-${(f.days || []).join(',')}-${f.onlineOnly}`

const WorkerSkeleton = () => (
  <Paper sx={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(108,71,255,0.08)' }}>
    <Skeleton variant="rectangular" height={6} sx={{ bgcolor: 'rgba(108,71,255,0.12)' }} />
    <Box sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Skeleton variant="circular" width={62} height={62} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="70%" height={22} />
          <Skeleton variant="text" width="45%" height={18} />
          <Skeleton variant="text" width="55%" height={16} />
        </Box>
      </Box>
      <Skeleton variant="text" width="90%" height={14} />
      <Skeleton variant="text" width="75%" height={14} sx={{ mb: 1.5 }} />
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        {[60, 80, 50].map((w, i) => <Skeleton key={i} variant="rounded" width={w} height={22} />)}
      </Box>
      <Skeleton variant="rectangular" height={1} sx={{ mb: 1.5 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {[1, 2, 3].map((i) => <Skeleton key={i} variant="text" width={60} height={18} />)}
      </Box>
    </Box>
    <Box sx={{ px: 2.5, pb: 2.5, display: 'flex', gap: 1 }}>
      <Skeleton variant="rounded" height={36} sx={{ flex: 1 }} />
      <Skeleton variant="rounded" height={36} sx={{ flex: 1 }} />
    </Box>
  </Paper>
)

export default function WorkersList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [searchParams] = useSearchParams()

  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [filters, setFilters] = useState({
    priceRange: [0, 2000], minRating: 0, minExp: 0, days: [], onlineOnly: false,
  })

  const lastFetchRef = useRef(null)
  const category = searchParams.get('category') || ''
  const [search, setSearch] = useState({ service: category, query: '' })

  const fetchWorkers = useCallback(async (svc, q, loc, f) => {
    const key = `${svc}|${q}|${loc?.lat}|${loc?.lon}|${filterKey(f)}`
    if (lastFetchRef.current === key) return
    lastFetchRef.current = key
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (svc && svc !== 'All Services') params.append('service', svc)
      if (q && q.trim()) params.append('query', q.trim())
      if (f?.minRating > 0) params.append('min_rating', f.minRating)
      if (f?.minExp > 0) params.append('min_experience', f.minExp)
      if (f?.priceRange?.[1] < 2000) params.append('max_price', f.priceRange[1])
      if (f?.onlineOnly) params.append('is_available', 'true')
      if (f?.days?.length) params.append('availability', f.days[0])
      if (loc?.lat) { params.append('lat', loc.lat); params.append('lon', loc.lon) }
      const endpoint = params.toString() ? `/workers/search?${params}` : '/workers'
      const { data } = await api.get(endpoint)
      setWorkers(Array.isArray(data) ? data : [])
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || ''
      if (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please make sure the backend is running on port 8000.')
      } else if (err?.response?.status === 404) {
        setWorkers([]) // No workers found is not an error
      } else {
        setError(msg || 'Failed to load professionals. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const searchService = search.service
  const searchQuery = search.query
  const locLat = userLocation?.lat
  const locLon = userLocation?.lon
  const fKey = filterKey(filters)

  useEffect(() => {
    fetchWorkers(searchService, searchQuery, userLocation, filters)
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchService, searchQuery, locLat, locLon, fKey])

  const handleSearch = (s) => { lastFetchRef.current = null; setSearch(s); setPage(1) }
  const handleDetectLocation = () => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      setUserLocation({ lat: coords.latitude, lon: coords.longitude })
    })
  }
  const handleFilters = (f) => { setFilters(f); setFilterOpen(false) }
  const handleBook = (worker) => {
    if (!user) { navigate('/login'); return }
    navigate('/create-request', { state: { worker } })
  }

  const paginated = workers.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(workers.length / PER_PAGE)
  const activeFilterCount = [
    filters.minRating > 0, filters.minExp > 0,
    filters.priceRange[1] < 2000, filters.onlineOnly, filters.days.length > 0,
  ].filter(Boolean).length

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* ── Dark hero header ── */}
      <Box sx={{
        background: isDark
          ? 'linear-gradient(135deg,#080812,#1a1740)'
          : 'linear-gradient(135deg,#0f0c29,#302b63)',
        pt: { xs: 4, md: 6 }, pb: { xs: 7, md: 9 },
      }}>
        <Container maxWidth="xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Typography variant="h4" fontWeight={900} mb={0.75} sx={{ color: '#fff', letterSpacing: '-0.02em' }}>
              Find Skilled Professionals
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                {loading ? 'Searching…' : `${workers.length} verified professional${workers.length !== 1 ? 's' : ''} found`}
              </Typography>
              {userLocation && (
                <Chip
                  icon={<MdLocationOn size={12} />} label="Near me" size="small"
                  sx={{ bgcolor: 'rgba(0,212,170,0.2)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.3)', fontWeight: 700 }}
                />
              )}
              {search.service && search.service !== 'All Services' && (
                <Chip
                  label={search.service} size="small"
                  onDelete={() => setSearch({ service: '', query: '' })}
                  sx={{ bgcolor: 'rgba(108,71,255,0.2)', color: '#9B72FF', border: '1px solid rgba(108,71,255,0.3)', fontWeight: 700 }}
                />
              )}
              {search.query && (
                <Chip
                  label={`"${search.query}"`} size="small"
                  onDelete={() => setSearch((s) => ({ ...s, query: '' }))}
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 700 }}
                />
              )}
            </Box>
            <SearchBar initialService={search.service} onSearch={handleSearch} onDetectLocation={handleDetectLocation} />
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: '-24px', pb: 6, position: 'relative', zIndex: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Grid container spacing={3}>
          {/* Desktop filter sidebar */}
          {!isMobile && (
            <Grid item md={3}>
              <FilterSidebar filters={filters} onChange={handleFilters} />
            </Grid>
          )}

          {/* Worker grid */}
          <Grid item xs={12} md={9}>
            {isMobile && (
              <Box sx={{ mb: 2.5 }}>
                <Badge badgeContent={activeFilterCount} color="primary">
                  <Button
                    startIcon={<MdTune />} variant="outlined"
                    onClick={() => setFilterOpen(true)}
                    sx={{ borderRadius: 2.5, fontWeight: 700, borderColor: 'rgba(108,71,255,0.3)', color: 'primary.main' }}
                  >
                    Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
                  </Button>
                </Badge>
              </Box>
            )}

            {loading ? (
              <Grid container spacing={2.5}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Grid item xs={12} sm={6} lg={4} key={i}><WorkerSkeleton /></Grid>
                ))}
              </Grid>
            ) : paginated.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Box sx={{
                  textAlign: 'center', py: 12, px: 4,
                  bgcolor: 'background.paper', borderRadius: 4,
                  border: '1px solid rgba(108,71,255,0.1)',
                }}>
                  <Typography sx={{ fontSize: 72, mb: 2 }}>🔍</Typography>
                  <Typography variant="h5" fontWeight={800} mb={1}>No Professionals Found</Typography>
                  <Typography color="text.secondary" mb={3.5} sx={{ maxWidth: 400, mx: 'auto' }}>
                    Try adjusting your search or filters. Professionals from 20+ categories are available.
                  </Typography>
                  <Button
                    variant="contained" size="large"
                    onClick={() => {
                      lastFetchRef.current = null
                      setSearch({ service: '', query: '' })
                      setFilters({ priceRange: [0, 2000], minRating: 0, minExp: 0, days: [], onlineOnly: false })
                    }}
                    sx={{ borderRadius: 2.5, fontWeight: 800, px: 4 }}
                  >
                    Clear All Filters
                  </Button>
                </Box>
              </motion.div>
            ) : (
              <>
                <AnimatePresence>
                  <Grid container spacing={2.5}>
                    {paginated.map((worker, idx) => (
                      <Grid item xs={12} sm={6} lg={4} key={worker.id}>
                        <WorkerCard worker={worker} index={idx} onBook={handleBook} onViewProfile={setSelectedWorker} />
                      </Grid>
                    ))}
                  </Grid>
                </AnimatePresence>

                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                    <Pagination
                      count={totalPages} page={page}
                      onChange={(_, p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      color="primary" size="large"
                      sx={{
                        '& .MuiPaginationItem-root': { borderRadius: 2, fontWeight: 700 },
                        '& .Mui-selected': { background: 'linear-gradient(135deg,#6C47FF,#9B72FF) !important', color: '#fff' },
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="bottom" open={filterOpen} onClose={() => setFilterOpen(false)}
        PaperProps={{ sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85vh', overflow: 'auto' } }}
      >
        <Box sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="h6" fontWeight={800}>Filter Professionals</Typography>
            <IconButton onClick={() => setFilterOpen(false)} sx={{ bgcolor: 'rgba(0,0,0,0.06)', borderRadius: 2 }}>
              <MdClose />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <FilterSidebar filters={filters} onChange={handleFilters} />
        </Box>
      </Drawer>

      <WorkerProfileModal
        worker={selectedWorker} open={!!selectedWorker}
        onClose={() => setSelectedWorker(null)} onBook={handleBook}
      />
    </Box>
  )
}
