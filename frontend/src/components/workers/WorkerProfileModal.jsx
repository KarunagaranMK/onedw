import {
  Dialog, DialogContent, DialogTitle, Avatar, Box, Typography,
  Chip, Rating, Button, Divider, IconButton, Grid, Paper,
} from '@mui/material'
import { MdClose, MdVerified, MdLocationOn, MdWork, MdPhone, MdAccessTime, MdCurrencyRupee } from 'react-icons/md'

export default function WorkerProfileModal({ worker, open, onClose, onBook }) {
  if (!worker) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
      {/* Purple gradient header */}
      <Box sx={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', px: 3, pt: 3, pb: 5, position: 'relative' }}>
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12, color: '#fff' }}>
          <MdClose />
        </IconButton>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <Avatar src={worker.profile_photo}
            sx={{ width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.25)', fontSize: 28, fontWeight: 800, border: '3px solid rgba(255,255,255,0.5)' }}>
            {worker.name?.[0]}
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" fontWeight={800} sx={{ color: '#fff' }}>{worker.name}</Typography>
              {worker.verified && <MdVerified color="#fbbf24" size={22} />}
            </Box>
            <Chip label={worker.service_type || 'Professional'} size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, mb: 0.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating value={worker.average_rating || 0} precision={0.1} size="small" readOnly sx={{ color: '#fbbf24' }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                {worker.average_rating?.toFixed(1) || '0.0'} · {worker.total_jobs} jobs
              </Typography>
            </Box>
            {worker.is_available && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981' }} />
                <Typography sx={{ color: '#10b981', fontSize: 12, fontWeight: 700 }}>Available Now</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ pt: 0 }}>
        {/* Stats strip */}
        <Grid container spacing={1} sx={{ mt: -3, mb: 2 }}>
          {[
            { icon: <MdWork />, label: 'Experience', val: `${worker.experience_years} yrs` },
            { icon: <MdCurrencyRupee />, label: 'Rate', val: worker.hourly_rate > 0 ? `₹${worker.hourly_rate}/hr` : 'Ask' },
            { icon: '⭐', label: 'Jobs Done', val: worker.total_jobs },
          ].map(({ icon, label, val }) => (
            <Grid item xs={4} key={label}>
              <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, boxShadow: '0 2px 8px rgba(99,102,241,0.12)' }}>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#6366f1' }}>{val}</Typography>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Bio */}
        {worker.bio && (
          <>
            <Typography variant="subtitle2" fontWeight={700} mb={0.5}>About</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>{worker.bio}</Typography>
          </>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Skills */}
        {worker.skills?.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Skills</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {worker.skills.map((s) => (
                <Chip key={s} label={s} size="small" variant="outlined"
                  sx={{ borderColor: '#6366f1', color: '#6366f1' }} />
              ))}
            </Box>
          </Box>
        )}

        {/* Contact & Location */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          {worker.phone && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <MdPhone color="#6366f1" />
              <Typography variant="body2">{worker.phone}</Typography>
            </Box>
          )}
          {worker.address && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <MdLocationOn color="#6366f1" />
              <Typography variant="body2">{worker.address}</Typography>
            </Box>
          )}
          {worker.distance_km != null && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <MdLocationOn color="#f59e0b" />
              <Typography variant="body2" fontWeight={700} color="#f59e0b">{worker.distance_km} km away</Typography>
            </Box>
          )}
          {worker.working_hours?.start && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <MdAccessTime color="#6366f1" />
              <Typography variant="body2">{worker.working_hours.start} – {worker.working_hours.end}</Typography>
            </Box>
          )}
        </Box>

        {/* Availability Days */}
        {worker.availability?.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Available Days</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d) => (
                <Box key={d} sx={{
                  px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: 12, fontWeight: 700,
                  bgcolor: worker.availability.includes(d) ? 'rgba(99,102,241,0.12)' : 'rgba(0,0,0,0.04)',
                  color: worker.availability.includes(d) ? '#6366f1' : '#9ca3af',
                }}>{d.slice(0,3)}</Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Languages */}
        {worker.languages?.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Languages</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {worker.languages.map((l) => <Chip key={l} label={l} size="small" />)}
            </Box>
          </Box>
        )}

        {/* Reviews preview */}
        {worker.reviews?.length > 0 && (
          <>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Recent Reviews</Typography>
            {worker.reviews.slice(0, 3).map((r, i) => (
              <Box key={i} sx={{ mb: 1.5, p: 1.5, bgcolor: 'rgba(99,102,241,0.04)', borderRadius: 2 }}>
                <Rating value={r.rating} size="small" readOnly sx={{ color: '#f59e0b' }} />
                <Typography variant="body2" color="text.secondary" mt={0.5}>{r.review}</Typography>
              </Box>
            ))}
          </>
        )}

        {/* Book button */}
        <Button variant="contained" fullWidth size="large" onClick={() => onBook?.(worker)}
          sx={{ mt: 1, fontWeight: 800, borderRadius: 2,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            '&:hover': { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' } }}>
          🚀 Book {worker.name?.split(' ')[0]}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
