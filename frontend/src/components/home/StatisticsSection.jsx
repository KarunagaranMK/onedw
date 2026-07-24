import { useEffect, useState, useRef } from 'react'
import { Container, Grid, Box, Typography, Paper } from '@mui/material'
import { motion, useInView, useMotionValue, useSpring, animate } from 'framer-motion'
import api from '../../services/api'

// Animated counter component
function AnimatedCounter({ target, suffix = '' }) {
  const ref = useRef(null)
  const [display, setDisplay] = useState(0)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, target, {
      duration: 1.8,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, target])

  return (
    <span ref={ref}>
      {display.toLocaleString('en-IN')}{suffix}
    </span>
  )
}



export default function StatisticsSection() {
  const [stats, setStats] = useState({
    total_customers: 0,
    total_workers: 0,
    total_bookings: 0,
    completed_jobs: 0,
  })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/request/platform-stats')
        setStats({
          total_customers: data.total_customers || 0,
          total_workers: data.total_workers || 0,
          total_bookings: data.total_bookings || 0,
          completed_jobs: data.completed_jobs || 0,
        })
      } catch {
        // Keep defaults at 0 if API unavailable
      } finally {
        setLoaded(true)
      }
    }
    fetchStats()
  }, [])

  const cards = [
    {
      icon: '👥',
      label: 'Happy Customers',
      value: stats.total_customers,
      suffix: '+',
      color: '#6C47FF',
      gradient: 'linear-gradient(135deg,#6C47FF,#9B72FF)',
    },
    {
      icon: '🔧',
      label: 'Verified Professionals',
      value: stats.total_workers,
      suffix: '+',
      color: '#00D4AA',
      gradient: 'linear-gradient(135deg,#00D4AA,#00B894)',
    },
    {
      icon: '📋',
      label: 'Total Bookings',
      value: stats.total_bookings,
      suffix: '+',
      color: '#FFB800',
      gradient: 'linear-gradient(135deg,#FFB800,#FFD54F)',
    },
    {
      icon: '✅',
      label: 'Jobs Completed',
      value: stats.completed_jobs,
      suffix: '+',
      color: '#3B82F6',
      gradient: 'linear-gradient(135deg,#3B82F6,#60A5FA)',
    },
  ]


  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        py: 10,
      }}
    >
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="overline"
              sx={{ color: '#6366f1', fontWeight: 700, letterSpacing: 3 }}
            >
              📊 LIVE PLATFORM DATA
            </Typography>
            <Typography variant="h3" fontWeight={900} sx={{ color: '#fff', mt: 1, mb: 1.5 }}>
              Trusted by Thousands
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: 500, mx: 'auto' }}>
              Real-time numbers from our platform — every customer and professional counted.
            </Typography>
          </Box>
        </motion.div>

        <Grid container spacing={3}>
          {cards.map((card, idx) => (
            <Grid item xs={6} md={3} key={card.label}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.12, duration: 0.5 }}
                whileHover={{ y: -6 }}
              >
                <Box sx={{
                    p: 3, textAlign: 'center', borderRadius: 4,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${card.color}33`,
                    backdropFilter: 'blur(12px)',
                    boxShadow: `0 8px 32px ${card.color}22`,
                    transition: 'all 0.3s ease',
                    '&:hover': { background: 'rgba(255,255,255,0.08)', boxShadow: `0 16px 48px ${card.color}44` },
                  }}>
                  <Box sx={{
                    width: 60, height: 60, borderRadius: 3, mx: 'auto', mb: 2,
                    background: card.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, boxShadow: `0 8px 24px ${card.color}40`,
                  }}>{card.icon}</Box>
                  <Typography variant="h3" fontWeight={900}
                    sx={{ color: card.color, fontSize: { xs: '1.8rem', md: '2.4rem' } }}
                  >
                    {loaded ? <AnimatedCounter target={card.value} suffix={card.suffix} /> : '—'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5, fontWeight: 600 }}>
                    {card.label}
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