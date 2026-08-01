import { Box, Container, Typography, Grid, useTheme } from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const CATEGORIES = [
  { icon: '⚡', label: 'Electrician', desc: 'Wiring, repairs, installation', color: '#f59e0b', bg: '#fef3c7' },
  { icon: '🔧', label: 'Plumber', desc: 'Leaks, pipes, drainage', color: '#3b82f6', bg: '#dbeafe' },
  { icon: '🎨', label: 'Painter', desc: 'Interior & exterior painting', color: '#ec4899', bg: '#fce7f3' },
  { icon: '🧹', label: 'Cleaning', desc: 'Home & office cleaning', color: '#14b8a6', bg: '#ccfbf1' },
  { icon: '🪚', label: 'Carpenter', desc: 'Furniture, doors, windows', color: '#d97706', bg: '#fef3c7' },
  { icon: '❄️', label: 'AC Repair', desc: 'Service, gas refill, install', color: '#2563eb', bg: '#dbeafe' },
  { icon: '🏠', label: 'Interior', desc: 'Design & renovation', color: '#7c3aed', bg: '#ede9fe' },
  { icon: '🔒', label: 'Security', desc: 'CCTV, locks, alarms', color: '#059669', bg: '#d1fae5' },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } } }

export default function ServiceCategories() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, background: isDark ? '#060612' : '#f8fafc' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}>
            <Typography variant="overline" sx={{ color: '#2563eb', fontWeight: 700, letterSpacing: '0.1em', mb: 1, display: 'block' }}>
              Our Services
            </Typography>
            <Typography variant="h3" fontWeight={900} mb={2} sx={{ letterSpacing: '-0.03em' }}>
              What do you need{' '}
              <Box component="span" sx={{ background: 'linear-gradient(135deg, #2563eb, #14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                help with?
              </Box>
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, mx: 'auto' }}>
              Browse 50+ professional services. AI-matched to your location, budget, and availability.
            </Typography>
          </Box>
        </motion.div>

        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <Grid container spacing={2.5}>
            {CATEGORIES.map((cat) => (
              <Grid item xs={6} sm={4} md={3} key={cat.label}>
                <motion.div variants={item}>
                  <motion.div whileHover={{ scale: 1.04, y: -4 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 350, damping: 20 }}>
                    <Box
                      onClick={() => navigate(`/workers?category=${cat.label}`)}
                      sx={{
                        p: 3, borderRadius: 4, cursor: 'pointer', textAlign: 'center',
                        background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)'}`,
                        boxShadow: isDark ? 'none' : '0 4px 16px rgba(15,23,42,0.06)',
                        transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
                        '&:hover': {
                          borderColor: cat.color + '60',
                          boxShadow: `0 12px 32px ${cat.color}22`,
                          background: isDark ? cat.bg + '15' : cat.bg + '55',
                        },
                        position: 'relative', overflow: 'hidden',
                      }}
                    >
                      {/* Color accent top bar */}
                      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${cat.color}, transparent)`, opacity: 0.6 }} />

                      {/* Icon */}
                      <Box sx={{
                        width: 56, height: 56, borderRadius: 3, mx: 'auto', mb: 1.5,
                        background: isDark ? cat.color + '20' : cat.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 26,
                        border: `1px solid ${cat.color}30`,
                      }}>
                        {cat.icon}
                      </Box>
                      <Typography variant="body2" fontWeight={800} mb={0.5}>{cat.label}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>{cat.desc}</Typography>
                    </Box>
                  </motion.div>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* View all */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
          <Box sx={{ textAlign: 'center', mt: 5 }}>
            <Box
              onClick={() => navigate('/workers')}
              sx={{
                display: 'inline-flex', alignItems: 'center', gap: 1,
                px: 3, py: 1.5, borderRadius: 3, cursor: 'pointer',
                border: '1.5px solid rgba(37,99,235,0.3)', color: '#2563eb',
                fontWeight: 700, fontSize: 14,
                '&:hover': { background: 'rgba(37,99,235,0.06)', borderColor: '#2563eb' },
                transition: 'all 0.2s',
              }}
            >
              View All Services →
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  )
}