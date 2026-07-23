import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  CircularProgress,
} from '@mui/material'
import { MdStar, MdStarBorder } from 'react-icons/md'
import { motion } from 'framer-motion'
import { submitRating } from '../../services/ratingService'

/**
 * RatingModal — Phase 9 component.
 * Interactive dialog to submit a 1-5 star rating + optional comment.
 */
const RatingModal = ({ open, onClose, booking, onSuccess }) => {
  const [stars, setStars] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (stars === 0) {
      setError('Please select a star rating.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await submitRating({
        bookingId: booking.id,
        workerId: booking.worker_id,
        stars,
        comment: comment.trim() || null,
      })
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit rating. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const starLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
  const displayStar = hoveredStar || stars

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '1px solid rgba(99,102,241,0.2)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
        <Typography variant="h5" fontWeight={800}>
          Rate Your Experience
        </Typography>
        {booking?.worker_name && (
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            How was your service from {booking.worker_name}?
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {/* Star Rating */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, my: 2 }}>
          {[1, 2, 3, 4, 5].map((val) => (
            <motion.div
              key={val}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              style={{ cursor: 'pointer' }}
              onClick={() => setStars(val)}
              onMouseEnter={() => setHoveredStar(val)}
              onMouseLeave={() => setHoveredStar(0)}
            >
              {val <= displayStar ? (
                <MdStar color="#f59e0b" size={48} />
              ) : (
                <MdStarBorder color="#d1d5db" size={48} />
              )}
            </motion.div>
          ))}
        </Box>

        {displayStar > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              textAlign="center"
              color="#f59e0b"
              mb={2}
            >
              {starLabels[displayStar]}
            </Typography>
          </motion.div>
        )}

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Leave a comment (optional)"
          placeholder="Share your experience to help others..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          inputProps={{ maxLength: 500 }}
          helperText={`${comment.length}/500`}
        />

        {error && (
          <Typography variant="caption" color="error" display="block" mt={1}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Skip
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || stars === 0}
          sx={{
            flex: 1,
            borderRadius: 2,
            py: 1,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            fontWeight: 700,
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            },
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Submit Rating'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RatingModal
