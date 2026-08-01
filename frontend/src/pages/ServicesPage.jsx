import { Box, Container, Typography, Grid, Paper, useTheme, Chip } from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MdElectricBolt, MdPlumbing, MdBrush, MdCleaningServices, MdConstruction, MdAcUnit, MdDesignServices, MdSecurity, MdBuild, MdHome } from 'react-icons/md'

const SERVICES = [
  {
    icon: <MdElectricBolt />, label: 'Electrician', desc: 'Wiring, repairs, switchboard, fan installation',
    color: '#f59e0b', bg: '#fef3c7', features: ['Wiring & Repairs', 'Switchboard Fix', 'Fan Installation', 'MCB & ELCB'],
  },
  {
    icon: <MdPlumbing />, label: 'Plumber', desc: 'Leaks, pipe fitting, drainage cleaning',
    color: '#3b82f6', bg: '#dbeafe', features: ['Leak Repair', 'Pipe Fitting', 'Drainage', 'Geyser Install'],
  },
  {
    icon: <MdBrush />, label: 'Painter', desc: 'Interior, exterior, texture & waterproofing',
    color: '#ec4899', bg: '#fce7f3', features: ['Interior Paint', 'Exterior Paint', 'Texture Work', 'Waterproofing'],
  },
  {
    icon: <MdCleaningServices />, label: 'Cleaning', desc: 'Home, sofa, bathroom & deep cleaning',
    color: '#14b8a6', bg: '#ccfbf1', features: ['Home Cleaning', 'Sofa Cleaning', 'Deep Clean', 'Bathroom Cleaning'],
  },
  {
    icon: <MdConstruction />, label: 'Carpenter', desc: 'Furniture, doors, modular kitchen',
    color: '#d97706', bg: '#fef3c7', features: ['Furniture Repair', 'Door Fitting', 'Modular Kitchen', 'Wood Polish'],
  },
  {
    icon: <MdAcUnit />, label: 'AC Repair', desc: 'Service, gas refill, installation, repair',
    color: '#2563eb', bg: '#dbeafe', features: ['AC Service', 'Gas Refill', 'Installation', 'Repair'],
  },
  {
    icon: <MdDesignServices />, label: 'Interior Design', desc: 'Home & office interior design, renovation',
    color: '#7c3aed', bg: '#ede9fe', features: ['2D/3D Design', 'Renovation', 'Flooring', 'False Ceiling'],
  },
  {
    icon: <MdSecurity />, label: 'Security', desc: 'CCTV, locks, alarms, access control',
    color: '#059669', bg: '#d1fae5', features: ['CCTV Setup', 'Smart Lock', 'Alarm System', 'Access Control'],
  },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

export default function ServicesPage() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box sx={{ background: isDark ? '#060612' : '#f8fafc', minHeight: '100vh' }}>

      {/* Hero */}
      <Box sx={{
        py: { xs: 8, md: 12 }, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 50%, #14b8a6 100%)',
      }}>
        <Box sx={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Box sx={{ textAlign: 'center', color: '#fff' }}>
              <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: '0.1em' }}>50+ Professional Services</Typography>
              <Typography variant="h2" fontWeight={900} mb={2} sx={{ letterSpacing: '-0.04em', mt: 0.5 }}>
                Everything Your Home{' '}
                <Box component="span" sx={{ background: 'linear-gradient(90deg, #93c5fd, #5eead4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Needs
                </Box>
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400, maxWidth: 480, mx: 'auto' }}>
                Verified professionals for every home service. Transparent pricing. Instant booking. Guaranteed quality.
              </Typography>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Service Cards */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <Grid container spacing={3}>
            {SERVICES.map((svc) => (
              <Grid item xs={12} sm={6} md={6} lg={3} key={svc.label}>
                <motion.div variants={item} style={{ height: '100%' }}>
                  <motion.div whileHover={{ y: -6, scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 320, damping: 20 }} style={{ height: '100%' }}>
                    <Paper
                      onClick={() => navigate(`/workers?category=${svc.label}`)}
                      sx={{
                        p: 3.5, borderRadius: 4, cursor: 'pointer', height: '100%',
                        background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)'}`,
                        transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
                        '&:hover': {
                          borderColor: svc.color + '50',
                          boxShadow: `0 16px 48px ${svc.color}20`,
                          background: isDark ? svc.color + '10' : svc.bg + '66',
                        },
                        position: 'relative', overflow: 'hidden',
                      }}
                    >
                      {/* Top gradient bar */}
                      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${svc.color}, transparent)` }} />

                      {/* Icon */}
                      <Box sx={{
                        width: 60, height: 60, borderRadius: 3, mb: 2.5,
                        background: isDark ? svc.color + '20' : svc.bg,
                        border: `1px solid ${svc.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, color: svc.color,
                      }}>
                        {svc.icon}
                      </Box>

                      <Typography variant="h6" fontWeight={800} mb={1}>{svc.label}</Typography>
                      <Typography variant="body2" color="text.secondary" mb={2.5} sx={{ lineHeight: 1.6 }}>
                        {svc.desc}
                      </Typography>

                      {/* Feature tags */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {svc.features.map(f => (
                          <Chip key={f} label={f} size="small"
                            sx={{ fontSize: 10, height: 22, fontWeight: 600, bgcolor: isDark ? svc.color + '15' : svc.bg, color: svc.color, border: `1px solid ${svc.color}25` }} />
                        ))}
                      </Box>
                    </Paper>
                  </motion.div>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>
    </Box>
  )
}
