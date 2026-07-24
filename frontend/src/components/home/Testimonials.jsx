import { Box, Container, Grid, Typography, Avatar, Rating, useTheme } from '@mui/material'
import { motion } from 'framer-motion'
import { MdFormatQuote } from 'react-icons/md'

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Homeowner · Chennai',
    avatar: 'PS',
    rating: 5,
    text: 'Booked an electrician within 10 minutes! The professional arrived on time, the pricing was exactly what was shown, and the work quality was outstanding. Best service platform I\'ve used.',
    color: '#6C47FF',
    gradient: 'linear-gradient(135deg,#6C47FF,#9B72FF)',
  },
  {
    name: 'Ravi Kumar',
    role: 'Office Manager · Pondicherry',
    avatar: 'RK',
    rating: 5,
    text: 'Transparent pricing and verified workers — exactly what Tier-2 cities needed. Got my entire office plumbing fixed in a single day. The OTP verification gave me total confidence.',
    color: '#00D4AA',
    gradient: 'linear-gradient(135deg,#00D4AA,#00B894)',
  },
  {
    name: 'Anitha Murugan',
    role: 'Worker Partner · Vellore',
    avatar: 'AM',
    rating: 5,
    text: 'OneDW helped me get 15-20 consistent bookings per month in my area. My income has doubled since joining. The app is easy to use and the support team is always available.',
    color: '#FFB800',
    gradient: 'linear-gradient(135deg,#FFB800,#FFD54F)',
  },
  {
    name: 'Deepak Raj',
    role: 'Customer · Tiruvannamalai',
    avatar: 'DR',
    rating: 5,
    text: 'I was skeptical at first but the AI recommendation was spot on. Got a highly rated carpenter who completed a complex furniture job flawlessly. 100% recommended!',
    color: '#FF6B6B',
    gradient: 'linear-gradient(135deg,#FF6B6B,#FF8E8E)',
  },
  {
    name: 'Meena Krishnan',
    role: 'Housewife · Cuddalore',
    avatar: 'MK',
    rating: 5,
    text: 'The live tracking feature is amazing! I knew exactly when the cleaner would arrive. And the rating system ensures only the best workers get recommended. Simply brilliant!',
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg,#3B82F6,#60A5FA)',
  },
  {
    name: 'Santhosh V.',
    role: 'Professional · Salem',
    avatar: 'SV',
    rating: 5,
    text: 'As an AC technician, OneDW gave me a steady stream of clients without me having to spend on marketing. The platform is honest and the payments are always on time.',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg,#8B5CF6,#A78BFA)',
  },
]

export default function Testimonials() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box sx={{
      py: { xs: 8, md: 12 },
      bgcolor: isDark ? '#080812' : '#F6F8FC',
    }}>
      <Container maxWidth="lg">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2,
              px: 2, py: 0.6, borderRadius: 20,
              bgcolor: 'rgba(108,71,255,0.08)', border: '1px solid rgba(108,71,255,0.15)',
            }}>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.08em' }}>
                TESTIMONIALS
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight={900} mb={1.5} sx={{ letterSpacing: '-0.02em' }}>
              Loved by{' '}
              <Box component="span" sx={{ background: 'linear-gradient(135deg,#6C47FF,#9B72FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                thousands
              </Box>
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 460, mx: 'auto' }}>
              Real stories from customers and professionals who use OneDW every day.
            </Typography>
          </Box>
        </motion.div>

        <Grid container spacing={3}>
          {TESTIMONIALS.map((t, i) => (
            <Grid item xs={12} sm={6} md={4} key={t.name}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                whileHover={{ y: -6 }}
                style={{ height: '100%' }}
              >
                <Box sx={{
                  p: 3.5, borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column',
                  bgcolor: 'background.paper',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : `${t.color}15`}`,
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : `0 4px 20px ${t.color}08`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: `${t.color}40`,
                    boxShadow: `0 16px 40px ${t.color}15`,
                  },
                  position: 'relative',
                }}>
                  {/* Quote icon */}
                  <Box sx={{
                    position: 'absolute', top: 20, right: 20,
                    width: 36, height: 36, borderRadius: 2,
                    background: `${t.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <MdFormatQuote color={t.color} size={20} />
                  </Box>

                  <Rating value={t.rating} size="small" readOnly sx={{ color: '#FFB800', mb: 2 }} />

                  <Typography
                    variant="body2" color="text.secondary"
                    sx={{ lineHeight: 1.8, flex: 1, mb: 3, fontStyle: 'italic', fontSize: 14 }}
                  >
                    "{t.text}"
                  </Typography>

                  {/* Author */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{
                      width: 44, height: 44, fontSize: 14, fontWeight: 800,
                      background: t.gradient,
                    }}>
                      {t.avatar}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                        {t.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{t.role}</Typography>
                    </Box>
                    <Box sx={{ ml: 'auto', fontSize: 20 }}>
                      {['⚡', '🔧', '✨', '🏠', '🌟', '❤️'][i]}
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}