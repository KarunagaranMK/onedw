import { Box, Typography, Rating, Avatar, Paper } from '@mui/material'

export default function ReviewCard({ review, workerName }) {
  const date = review.created_at
    ? new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

  return (
    <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(245,158,11,0.2)', mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: '#6366f1', width: 36, height: 36, fontSize: 14 }}>
          {workerName?.[0] || '?'}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Rating value={review.rating} precision={0.5} size="small" readOnly sx={{ color: '#f59e0b' }} />
            <Typography variant="caption" color="text.secondary">{date}</Typography>
          </Box>
          {review.review && (
            <Typography variant="body2" color="text.secondary" mt={0.5} fontStyle="italic">
              "{review.review}"
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  )
}
