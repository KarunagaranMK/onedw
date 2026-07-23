import { Box, Card, CardContent, CardActions, Button, Typography, Chip, Avatar, Divider } from '@mui/material'
import { MdStar, MdWork, MdLocationOn, MdTimer, MdVerified, MdAutoAwesome } from 'react-icons/md'
import { motion } from 'framer-motion'

/**
 * WorkerCard — Phase 5/6 component.
 * Displays worker profile with AI recommendation badge.
 */
const WorkerCard = ({
  worker,
  isRecommended = false,
  aiReason = '',
  confidence = null,
  onBook,
  loading = false,
}) => {
  const { name, skills = [], average_rating, experience_years, hourly_rate, bio, total_jobs, distance_km, is_available } = worker

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card
        sx={{
          borderRadius: 3,
          border: isRecommended
            ? '2px solid #6366f1'
            : '1px solid rgba(99,102,241,0.15)',
          boxShadow: isRecommended
            ? '0 8px 32px rgba(99,102,241,0.25)'
            : '0 4px 16px rgba(0,0,0,0.08)',
          position: 'relative',
          overflow: 'visible',
          transition: 'all 0.3s ease',
        }}
      >
        {/* AI Recommended Badge */}
        {isRecommended && (
          <Box
            sx={{
              position: 'absolute',
              top: -14,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              px: 2,
              py: 0.4,
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: 12,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            <MdAutoAwesome size={14} />
            AI Recommended
          </Box>
        )}

        <CardContent sx={{ pt: isRecommended ? 3 : 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1.5 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                fontSize: 20,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {name?.[0]?.toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="h6" fontWeight={700} noWrap>
                  {name}
                </Typography>
                <MdVerified color="#6366f1" size={18} />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', color: '#f59e0b' }}>
                  <MdStar size={16} />
                  <Typography variant="body2" fontWeight={600} ml={0.3}>
                    {average_rating?.toFixed(1)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  ({total_jobs} jobs)
                </Typography>
                {distance_km != null && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <MdLocationOn size={14} color="#6366f1" />
                    <Typography variant="caption" color="primary">
                      {distance_km?.toFixed(1)} km
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Typography variant="h6" fontWeight={800} color="primary.main">
                ₹{hourly_rate}
              </Typography>
              <Typography variant="caption" color="text.secondary">per hour</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <MdWork size={14} color="#6366f1" />
            <Typography variant="caption" color="text.secondary">
              {experience_years} years experience
            </Typography>
            <Chip
              label={is_available ? 'Available' : 'Busy'}
              size="small"
              color={is_available ? 'success' : 'error'}
              sx={{ height: 20, fontSize: 10 }}
            />
          </Box>

          {bio && (
            <Typography variant="body2" color="text.secondary" mb={1.5} sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {bio}
            </Typography>
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
            {skills.map((skill) => (
              <Chip
                key={skill}
                label={skill}
                size="small"
                variant="outlined"
                sx={{ borderColor: '#6366f1', color: '#6366f1', height: 22, fontSize: 11 }}
              />
            ))}
          </Box>

          {/* AI Reason */}
          {isRecommended && aiReason && (
            <>
              <Divider sx={{ mb: 1.5 }} />
              <Box
                sx={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
                  borderRadius: 2,
                  p: 1.5,
                  border: '1px solid rgba(99,102,241,0.15)',
                }}
              >
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
                  <MdAutoAwesome color="#6366f1" size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {aiReason}
                  </Typography>
                </Box>
                {confidence != null && (
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="primary" fontWeight={600}>
                      {Math.round(confidence * 100)}% match
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
          )}
        </CardContent>

        <CardActions sx={{ px: 2, pb: 2 }}>
          <Button
            fullWidth
            variant={isRecommended ? 'contained' : 'outlined'}
            onClick={() => onBook?.(worker)}
            disabled={!is_available || loading}
            sx={{
              borderRadius: 2,
              py: 1,
              fontWeight: 700,
              ...(isRecommended && {
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                },
              }),
            }}
          >
            {!is_available ? 'Currently Busy' : 'Book Now'}
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  )
}

export default WorkerCard
