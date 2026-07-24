import { Box, Container, Typography, Grid, useTheme } from '@mui/material'
import { motion } from 'framer-motion'

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI-Powered Matching',
    desc: 'Our Gemini AI recommends the best professional for your exact need, considering skill, distance, and ratings.',
    color: '#6C47FF',
    gradient: 'linear-gradient(135deg,#6C47FF,#9B72FF)',
  },
  {
    icon: '✅',
    title: 'Verified Professionals',
    desc: 'Every professional is background-checked, skill-verified, and rated by real customers before joining.',
    color: '#00D4AA',
    gradient: 'linear-gradient(135deg,#00D4AA,#00B894)',
  },
  {
    icon: '💰',
    title: 'Transparent Pricing',
    desc: 'See the full cost upfront — no hidden fees, no surprises. Fixed rates with itemized invoices.',
    color: '#FFB800',
    gradient: 'linear-gradient(135deg,#FFB800,#FFD54F)',
  },
  {
    icon: '📍',
    title: 'Hyperlocal Focus',
    desc: 'We serve Tier-2 and Tier-3 cities, bringing premium home services to underserved communities.',
    color: '#FF6B6B',
    gradient: 'linear-gradient(135deg,#FF6B6B,#FF8E8E)',
  },
  {
    icon: '🔒',
    title: 'Secure Payments',
    desc: 'OTP-verified job starts, multiple payment options, and insured service delivery for your peace of mind.',
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg,#3B82F6,#60A5FA)',
  },
  {
    icon: '⚡',
    title: 'Rapid Booking',
    desc: 'Book in under 2 minutes. Get a professional confirmed the same day. Available 7 days a week.',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg,#8B5CF6,#A78BFA)',
  },
]

export default function WhyChooseUs() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: isDark ? '#080812' : '#F6F8FC' }}>
      <Container maxWidth="lg">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2,
              px: 2, py: 0.6, borderRadius: 20,
              bgcolor: 'rgba(108,71,255,0.08)', border: '1px solid rgba(108,71,255,0.15)',
            }}>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.08em' }}>
                WHY ONEDW
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight={900} mb={1.5} sx={{ letterSpacing: '-0.02em' }}>
              Why 50,000+ customers{' '}
              <Box component="span" sx={{ background: 'linear-gradient(135deg,#6C47FF,#9B72FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                trust us
              </Box>
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
              We're not just a marketplace. We're a quality guarantee for every service you book.
            </Typography>
          </Box>
        </motion.div>

        <Grid container spacing={3}>
          {FEATURES.map((f, i) => (
            <Grid item xs={12} sm={6} md={4} key={f.title}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                whileHover={{ y: -6 }}
              >
                <Box sx={{
                  p: 3.5, borderRadius: 4, height: '100%',
                  bgcolor: 'background.paper',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : `${f.color}15`}`,
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : `0 4px 20px ${f.color}08`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: `${f.color}40`,
                    boxShadow: `0 16px 40px ${f.color}15`,
                  },
                }}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: 3, mb: 2.5,
                    background: f.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, boxShadow: `0 6px 16px ${f.color}30`,
                  }}>
                    {f.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={800} mb={1} sx={{ color: 'text.primary' }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {f.desc}
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