import {
  Dialog, DialogContent, DialogTitle, Box, Typography,
  Rating, TextField, Button, CircularProgress, Alert,
} from '@mui/material'
import { useState } from 'react'
import api from '../../services/api'
import { motion } from 'framer-motion'

export default function ReviewDialog({ open, onClose, booking, onSuccess }) {
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!rating) return setError('Please select a star rating.')
    if (!booking?.id) return setError('Invalid booking.')
    setLoading(true)
    setError('')
    try {
      await api.post('/rating/create', {
        booking_id: booking.id,
        worker_id: booking.worker_id,
        rating,
        review,
      })
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit review.')
    } finally {
      setLoading(false)
    }
  }

  const LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
        <Typography variant="h5" fontWeight={900}>⭐ Rate Your Service</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          {booking?.service_type || 'Service'} by {booking?.worker_name || 'Worker'}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Star Rating */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 3, gap: 1 }}>
          <Rating
            value={rating}
            onChange={(_, v) => setRating(v)}
            size="large"
            sx={{ fontSize: 48, color: '#f59e0b' }}
          />
          {rating > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#f59e0b' }}>
                {LABELS[rating]}
              </Typography>
            </motion.div>
          )}
        </Box>

        <TextField
          fullWidth multiline rows={3}
          label="Write a review (optional)"
          placeholder="Very professional and completed work on time..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button variant="contained" fullWidth size="large" onClick={handleSubmit} disabled={loading}
          sx={{ fontWeight: 800, borderRadius: 2, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Submit Review'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
