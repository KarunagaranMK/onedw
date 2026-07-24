import {
  Card, CardContent, CardActions, Avatar, Box, Typography,
  Chip, Button, Rating, Divider, Tooltip, useTheme,
} from '@mui/material'
import { motion } from 'framer-motion'
import {
  MdVerified, MdLocationOn, MdWork, MdCurrencyRupee,
  MdStar, MdCheck,
} from 'react-icons/md'
import { FaToolbox } from 'react-icons/fa'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_FULL   = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function WorkerCard({ worker, onBook, onViewProfile, index = 0 }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const initials = worker.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -6 }}
      style={{ height: '100%' }}
    >
      <Card sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        borderRadius: '20px',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,71,255,0.1)'}`,
        boxShadow: isDark
          ? '0 4px 24px rgba(0,0,0,0.4)'
          : '0 4px 24px rgba(108,71,255,0.06)',
        '&:hover': {
          borderColor: 'rgba(108,71,255,0.3)',
          boxShadow: '0 16px 48px rgba(108,71,255,0.15)',
        },
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'visible',
      }}>

        {/* Top banner with gradient */}
        <Box sx={{
          height: 6, borderRadius: '20px 20px 0 0',
          background: worker.is_available
            ? 'linear-gradient(90deg, #6C47FF, #00D4AA)'
            : 'linear-gradient(90deg, #9CA3AF, #6B7280)',
        }} />

        <CardContent sx={{ flex: 1, p: 2.5 }}>
          {/* Header row */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <Avatar
                src={worker.profile_photo}
                sx={{
                  width: 62, height: 62,
                  background: 'linear-gradient(135deg, #6C47FF, #9B72FF)',
                  fontSize: 20, fontWeight: 900, border: '3px solid rgba(108,71,255,0.15)',
                }}
              >
                {worker.profile_photo ? null : (initials || <FaToolbox />)}
              </Avatar>
              {/* Online dot */}
              {worker.is_available && (
                <Box sx={{
                  position: 'absolute', bottom: 2, right: 2,
                  width: 12, height: 12, borderRadius: '50%',
                  bgcolor: '#00D4AA', border: '2px solid white',
                  boxShadow: '0 0 6px rgba(0,212,170,0.6)',
                }} />
              )}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                <Typography variant="subtitle1" fontWeight={800} noWrap sx={{ fontSize: 15 }}>
                  {worker.name}
                </Typography>
                {worker.verified && (
                  <Tooltip title="Verified Professional">
                    <span><MdVerified color="#6C47FF" size={16} /></span>
                  </Tooltip>
                )}
              </Box>

              <Chip
                label={worker.service_type || 'Professional'}
                size="small"
                sx={{
                  bgcolor: 'rgba(108,71,255,0.1)', color: '#6C47FF',
                  fontWeight: 700, fontSize: 11, height: 20, mb: 0.5,
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <MdStar color="#FFB800" size={14} />
                <Typography variant="caption" fontWeight={700} color="#FFB800">
                  {worker.average_rating?.toFixed(1) || '0.0'}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  ({worker.total_jobs} jobs)
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Bio */}
          {worker.bio && (
            <Typography
              variant="body2" color="text.secondary" mb={1.5}
              sx={{
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                lineHeight: 1.6, fontSize: 13,
              }}
            >
              {worker.bio}
            </Typography>
          )}

          {/* Skills */}
          {worker.skills?.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
              {worker.skills.slice(0, 3).map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  size="small"
                  icon={<MdCheck size={10} />}
                  sx={{
                    fontSize: 10, height: 22,
                    border: '1px solid rgba(108,71,255,0.2)',
                    bgcolor: 'transparent',
                    color: 'text.secondary',
                    '& .MuiChip-icon': { color: '#6C47FF', ml: 0.8 },
                  }}
                />
              ))}
              {worker.skills.length > 3 && (
                <Chip
                  label={`+${worker.skills.length - 3} more`}
                  size="small"
                  sx={{ fontSize: 10, height: 22, bgcolor: 'rgba(0,0,0,0.04)' }}
                />
              )}
            </Box>
          )}

          <Divider sx={{ mb: 1.5, opacity: 0.6 }} />

          {/* Stats row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <MdWork color="#6C47FF" size={14} />
              <Typography variant="caption" fontWeight={700}>
                {worker.experience_years}y exp
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <MdCurrencyRupee color="#00D4AA" size={14} />
              <Typography variant="caption" fontWeight={800} color="#00D4AA">
                {worker.hourly_rate > 0 ? `₹${worker.hourly_rate}/hr` : 'Ask'}
              </Typography>
            </Box>

            {worker.distance_km != null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <MdLocationOn color="#FFB800" size={14} />
                <Typography variant="caption" fontWeight={700} color="#FFB800">
                  {worker.distance_km} km
                </Typography>
              </Box>
            )}
          </Box>

          {/* Address */}
          {worker.address && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
              <MdLocationOn color="#9CA3AF" size={13} />
              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 180 }}>
                {worker.address}
              </Typography>
            </Box>
          )}

          {/* Availability days */}
          {worker.availability?.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.4, flexWrap: 'wrap' }}>
              {DAY_LABELS.map((d, i) => {
                const active = worker.availability.includes(DAY_FULL[i])
                return (
                  <Box key={d} sx={{
                    px: 0.8, py: 0.2, borderRadius: 1,
                    fontSize: 10, fontWeight: 700,
                    bgcolor: active ? 'rgba(108,71,255,0.12)' : 'rgba(0,0,0,0.04)',
                    color: active ? '#6C47FF' : '#9CA3AF',
                    border: `1px solid ${active ? 'rgba(108,71,255,0.2)' : 'transparent'}`,
                  }}>
                    {d}
                  </Box>
                )
              })}
            </Box>
          )}
        </CardContent>

        <CardActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            fullWidth
            onClick={() => onViewProfile?.(worker)}
            sx={{
              borderRadius: 2, fontWeight: 700, fontSize: 12,
              borderColor: 'rgba(108,71,255,0.25)',
              color: '#6C47FF',
              '&:hover': { borderColor: '#6C47FF', bgcolor: 'rgba(108,71,255,0.06)' },
            }}
          >
            View Profile
          </Button>
          <Button
            variant="contained"
            size="small"
            fullWidth
            onClick={() => onBook?.(worker)}
            sx={{
              borderRadius: 2, fontWeight: 800, fontSize: 12,
              background: 'linear-gradient(135deg, #6C47FF, #9B72FF)',
              '&:hover': { background: 'linear-gradient(135deg, #5a38e8, #8660e8)' },
            }}
          >
            Book Now
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  )
}
