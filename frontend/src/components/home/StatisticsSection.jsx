import { Box, Container, Typography, Grid, useTheme } from '@mui/material'
import { motion } from 'framer-motion'

const STATS = [
  { value: '50K+', label: 'Happy Customers', icon: '😊', color: '#2563eb' },
  { value: '2000+', label: 'Verified Professionals', icon: '✅', color: '#14b8a6' },
  { value: '100+', label: 'Service Categories', icon: '🛠️', color: '#f59e0b' },
  { value: '4.9★', label: 'Average Rating', icon: '⭐', color: '#ec4899' },
]

export default function StatisticsSection() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box sx={{
      py: { xs: 8, md: 10 },
      background: isDark
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #14b8a6 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background circles */}
      <Box sx={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {STATS.map((stat, i) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Box sx={{ textAlign: 'center', py: { xs: 2, md: 3 } }}>
                  <Typography sx={{ fontSize: { xs: 28, md: 36 }, mb: 0.5 }}>{stat.icon}</Typography>
                  <Typography variant="h3" fontWeight={900} sx={{
                    color: '#fff', fontSize: { xs: '1.8rem', md: '2.5rem' },
                    letterSpacing: '-0.04em', mb: 0.5,
                  }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                    {stat.label}
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