import { useState, useEffect } from 'react'
import {
  Container, Box, Typography, Paper, Rating, Chip,
  Avatar, Alert, LinearProgress, useTheme, Grid,
} from '@mui/material'
import { motion } from 'framer-motion'
import { MdVerified, MdThumbUp, MdStar } from 'react-icons/md'
import { getMyReviews } from '../services/reviewService'
import { useAuth } from '../hooks/useAuth'

const ReviewCard = ({ review }) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const date = review.created_at ? new Date(review.created_at).toLocaleDateString('en-IN') : '—'

  const subRatings = [
    { label: 'Work Quality',     value: review.work_quality },
    { label: 'Professionalism',  value: review.professionalism },
    { label: 'Communication',    value: review.communication },
    { label: 'Punctuality',      value: review.punctuality },
    { label: 'Value for Money',  value: review.value_for_money },
    { label: 'Cleanliness',      value: review.cleanliness },
  ]

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Paper sx={{
        p: 3, borderRadius: 3,
        background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
        border: '1px solid rgba(108,71,255,0.1)',
        boxShadow: '0 4px 20px rgba(108,71,255,0.06)',
      }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 800 }}>
              {(review.service_name || 'S')[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={800}>{review.service_name || 'Service'}</Typography>
              <Typography variant="caption" color="text.secondary">{date}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Rating value={review.overall_rating} readOnly size="small" />
            <Chip
              icon={<MdVerified size={14} />}
              label="Verified"
              size="small"
              sx={{ bgcolor: 'rgba(108,71,255,0.1)', color: 'primary.main', fontWeight: 700, fontSize: 11 }}
            />
          </Box>
        </Box>

        {/* Review text */}
        {review.review_text && (
          <Typography variant="body2" color="text.secondary" mb={2} sx={{
            p: 1.5, borderRadius: 2,
            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(108,71,255,0.03)',
            fontStyle: 'italic',
          }}>
            "{review.review_text}"
          </Typography>
        )}

        {/* Sub-ratings */}
        <Grid container spacing={1} mb={1.5}>
          {subRatings.map(({ label, value }) => value && (
            <Grid item xs={6} key={label}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Rating value={value} readOnly size="small" max={5} sx={{ '& .MuiSvgIcon-root': { fontSize: 14 } }} />
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Would recommend + admin reply */}
        {review.would_recommend && (
          <Chip icon={<MdThumbUp size={14} />} label="Would Recommend" size="small"
            sx={{ bgcolor: 'rgba(34,197,94,0.1)', color: '#22C55E', fontWeight: 700, mr: 1 }} />
        )}

        {review.admin_reply && (
          <Box sx={{
            mt: 2, p: 2, borderRadius: 2,
            background: 'linear-gradient(135deg,rgba(108,71,255,0.06),rgba(0,212,170,0.04))',
            border: '1px solid rgba(108,71,255,0.15)',
          }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
              <MdVerified color="#6C47FF" size={16} />
              <Typography variant="caption" fontWeight={800} color="primary.main">OneDW Team Official Reply</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">{review.admin_reply}</Typography>
          </Box>
        )}
      </Paper>
    </motion.div>
  )
}

export default function MyReviewsPage() {
  const { user } = useAuth()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyReviews()
      .then(setReviews)
      .catch(() => setError('Failed to load reviews.'))
      .finally(() => setLoading(false))
  }, [])

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.overall_rating, 0) / reviews.length).toFixed(1)
    : '—'

  return (
    <Box sx={{
      minHeight: '100vh',
      background: isDark ? 'linear-gradient(135deg,#08080F,#0D0D1A)' : 'linear-gradient(135deg,#F0EDFF,#FAFAFA)',
      py: { xs: 3, md: 6 },
    }}>
      <Container maxWidth="lg">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Typography variant="h4" fontWeight={900} mb={1}>My Reviews</Typography>
          <Typography variant="body2" color="text.secondary" mb={4}>
            Reviews you've submitted for completed services
          </Typography>
        </motion.div>

        {/* Quick stats */}
        <Grid container spacing={2} mb={4}>
          {[
            { label: 'Reviews Given', value: reviews.length, color: '#6C47FF' },
            { label: 'Avg Rating', value: avgRating, color: '#FFB800' },
          ].map((s, i) => (
            <Grid item xs={6} sm={3} key={s.label}>
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

        {loading && <LinearProgress sx={{ borderRadius: 1, mb: 3 }} />}
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

        {!loading && reviews.length === 0 ? (
          <Paper sx={{ p: 6, borderRadius: 4, textAlign: 'center', background: isDark ? 'rgba(255,255,255,0.04)' : '#fff' }}>
            <MdStar size={64} color="#FFB800" style={{ marginBottom: 16 }} />
            <Typography variant="h6" fontWeight={700} mb={1}>No reviews yet</Typography>
            <Typography color="text.secondary">
              You can leave a review after completing a booking. Your feedback helps other customers and motivates professionals!
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {reviews.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <ReviewCard review={r} />
              </motion.div>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  )
}
