import { useState, useRef } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  TextField, Box, CircularProgress, Rating, Divider, IconButton, Chip,
} from '@mui/material'
import { MdStar, MdStarBorder, MdThumbUp, MdThumbDown, MdImage, MdClose } from 'react-icons/md'
import { motion } from 'framer-motion'
import { submitRating } from '../../services/ratingService'
import { uploadMedia } from '../../services/issueService'

const CATEGORIES = [
  { key: 'punctuality', label: 'Punctuality' },
  { key: 'behavior', label: 'Behavior' },
  { key: 'work_quality', label: 'Work Quality' },
  { key: 'communication', label: 'Communication' },
  { key: 'value_for_money', label: 'Value for Money' },
  { key: 'cleanliness', label: 'Cleanliness' },
]

const RatingModal = ({ open, onClose, booking, onSuccess }) => {
  const [stars, setStars] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState({})
  const [recommend, setRecommend] = useState(true)
  const [reviewImages, setReviewImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

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
        review: review.trim() || null,
        punctuality: categories.punctuality || null,
        behavior: categories.behavior || null,
        work_quality: categories.work_quality || null,
        communication: categories.communication || null,
        value_for_money: categories.value_for_money || null,
        cleanliness: categories.cleanliness || null,
        recommend,
        review_images: reviewImages,
      })
      onSuccess?.()
      onClose()
      resetForm()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit rating. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStars(0)
    setReview('')
    setCategories({})
    setRecommend(true)
    setReviewImages([])
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    try {
      for (const file of files) {
        const media = await uploadMedia(file)
        setReviewImages((prev) => [...prev, media])
      }
    } catch (err) {
      setError('Failed to upload image.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeImage = (idx) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleCategoryChange = (key, value) => {
    setCategories((prev) => ({ ...prev, [key]: value }))
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
        <Typography variant="h5" fontWeight={800}>Rate Your Experience</Typography>
        {booking?.worker_name && (
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            How was your service from {booking.worker_name}?
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, my: 2 }}>
          {[1, 2, 3, 4, 5].map((val) => (
            <motion.div key={val} whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.9 }}
              style={{ cursor: 'pointer' }} onClick={() => setStars(val)}
              onMouseEnter={() => setHoveredStar(val)} onMouseLeave={() => setHoveredStar(0)}>
              {val <= displayStar ? <MdStar color="#f59e0b" size={48} /> : <MdStarBorder color="#d1d5db" size={48} />}
            </motion.div>
          ))}
        </Box>

        {displayStar > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Typography variant="h6" fontWeight={700} textAlign="center" color="#f59e0b" mb={2}>
              {starLabels[displayStar]}
            </Typography>
          </motion.div>
        )}

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Rate Specific Categories</Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
          {CATEGORIES.map((cat) => (
            <Box key={cat.key} sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>{cat.label}</Typography>
              <Rating size="small" value={categories[cat.key] || 0}
                onChange={(e, v) => handleCategoryChange(cat.key, v)} sx={{ mt: 0.5 }} />
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button variant={recommend ? 'contained' : 'outlined'} size="small"
            startIcon={<MdThumbUp />} onClick={() => setRecommend(true)}
            sx={{ borderRadius: 2, fontWeight: 700, ...(recommend && { background: '#22c55e' }) }}>
            Recommend
          </Button>
          <Button variant={!recommend ? 'contained' : 'outlined'} size="small"
            startIcon={<MdThumbDown />} onClick={() => setRecommend(false)}
            sx={{ borderRadius: 2, fontWeight: 700, ...(!recommend && { background: '#ef4444' }) }}>
            Don't Recommend
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1}>Add Photos (optional)</Typography>
          <input ref={fileRef} type="file" hidden accept="image/*" multiple onChange={handleImageUpload} />
          <Button variant="outlined" size="small" startIcon={uploading ? <CircularProgress size={14} /> : <MdImage />}
            onClick={() => fileRef.current?.click()} disabled={uploading} sx={{ borderRadius: 2 }}>
            {uploading ? 'Uploading...' : 'Add Photos'}
          </Button>
          {reviewImages.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              {reviewImages.map((img, i) => (
                <Box key={i} sx={{ position: 'relative' }}>
                  <Box component="img" src={img.thumbnail_url || img.url}
                    sx={{ width: 60, height: 60, borderRadius: 1.5, objectFit: 'cover' }} />
                  <IconButton size="small" onClick={() => removeImage(i)}
                    sx={{ position: 'absolute', top: -6, right: -6, bgcolor: 'error.main', color: 'white', p: 0.3 }}>
                    <MdClose fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <TextField fullWidth multiline rows={3} label="Write a review (optional)"
          placeholder="Share your experience to help others..."
          value={review} onChange={(e) => setReview(e.target.value)}
          inputProps={{ maxLength: 1000 }} helperText={`${review.length}/1000`} />

        {error && (
          <Typography variant="caption" color="error" display="block" mt={1}>{error}</Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={() => { resetForm(); onClose() }} variant="outlined" sx={{ borderRadius: 2 }}>Skip</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || stars === 0}
          sx={{
            flex: 1, borderRadius: 2, py: 1, fontWeight: 700,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' },
          }}>
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Submit Rating'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RatingModal
