import { Box, Container, Typography, Grid, useTheme } from '@mui/material'
import { motion } from 'framer-motion'

const STEPS = [
  {
    step: '01',
    icon: '🔍',
    title: 'Search & Discover',
    desc: 'Enter what service you need. Our AI finds the best-matched professionals near you instantly.',
    color: '#6C47FF',
    gradient: 'linear-gradient(135deg,#6C47FF,#9B72FF)',
  },
  {
    step: '02',
    icon: '📅',
    title: 'Book Instantly',
    desc: 'View profiles, ratings, and pricing. Book your preferred professional in under 2 minutes.',
    color: '#00D4AA',
    gradient: 'linear-gradient(135deg,#00D4AA,#00B894)',
  },
  {
    step: '03',
    icon: '🔑',
    title: 'OTP Verified Start',
    desc: 'Get a secure OTP when your worker arrives. Share it to begin — 100% safety guaranteed.',
    color: '#FFB800',
    gradient: 'linear-gradient(135deg,#FFB800,#FFD54F)',
  },
  {
    step: '04',
    icon: '⭐',
    title: 'Pay & Rate',
    desc: 'Get an itemized invoice, pay securely, and rate your experience to help the community.',
    color: '#FF6B6B',
    gradient: 'linear-gradient(135deg,#FF6B6B,#FF8E8E)',
  },
]

export default function HowItWorks() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box id="how-it-works" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2,
              px: 2, py: 0.6, borderRadius: 20,
              bgcolor: 'rgba(108,71,255,0.08)', border: '1px solid rgba(108,71,255,0.15)',
            }}>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.08em' }}>
                HOW IT WORKS
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight={900} mb={1.5} sx={{ letterSpacing: '-0.02em' }}>
              Book a service in{' '}
              <Box component="span" sx={{ background: 'linear-gradient(135deg,#6C47FF,#00D4AA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                4 simple steps
              </Box>
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 460, mx: 'auto' }}>
              From search to service — the entire journey takes less than 5 minutes.
            </Typography>
          </Box>
        </motion.div>

        <Grid container spacing={4} sx={{ position: 'relative' }}>
          {/* Connector line — desktop only */}
          <Box sx={{
            display: { xs: 'none', md: 'block' },
            position: 'absolute', top: 60, left: '12.5%', right: '12.5%', height: 2,
            background: 'linear-gradient(90deg, #6C47FF, #00D4AA, #FFB800, #FF6B6B)',
            opacity: 0.25, borderRadius: 1,
          }} />

          {STEPS.map((step, i) => (
            <Grid item xs={12} sm={6} md={3} key={step.step}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
              >
                <Box sx={{ textAlign: 'center', px: 1 }}>
                  {/* Step circle with icon */}
                  <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                    >
                      <Box sx={{
                        width: 80, height: 80, borderRadius: '50%', mx: 'auto',
                        background: step.gradient,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32,
                        boxShadow: `0 12px 32px ${step.color}35`,
                      }}>
                        {step.icon}
                      </Box>
                    </motion.div>
                    {/* Step number badge */}
                    <Box sx={{
                      position: 'absolute', top: -6, right: -6,
                      width: 26, height: 26, borderRadius: '50%',
                      background: step.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `3px solid ${isDark ? '#080812' : '#F6F8FC'}`,
                    }}>
                      <Typography sx={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>{step.step}</Typography>
                    </Box>
                  </Box>

                  <Typography variant="h6" fontWeight={800} mb={1}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {step.desc}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}