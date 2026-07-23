import { Container, Typography, Grid, Paper, Box, Avatar, Divider } from '@mui/material'
import { motion } from 'framer-motion'
import { MdVerified, MdAutoAwesome, MdLocationOn, MdGroup } from 'react-icons/md'

const STATS = [
  { label: 'Cities Covered', value: '50+', icon: '🏙️' },
  { label: 'Verified Workers', value: '2,000+', icon: '👷' },
  { label: 'Happy Customers', value: '15,000+', icon: '😊' },
  { label: 'Services Completed', value: '48,000+', icon: '✅' },
]

const TEAM = [
  { name: 'Arjun Rajan', role: 'Founder & CEO', avatar: 'A', bg: '#6366f1' },
  { name: 'Priya Suresh', role: 'CTO', avatar: 'P', bg: '#8b5cf6' },
  { name: 'Manoj Kumar', role: 'Head of Operations', avatar: 'M', bg: '#0ea5e9' },
]

const VALUES = [
  { icon: MdVerified, title: 'Trust & Safety', desc: 'Every worker is background-verified, skill-tested, and ID-checked before listing.' },
  { icon: MdAutoAwesome, title: 'AI-Powered Matching', desc: 'Gemini AI ranks professionals by rating, proximity, and experience for your exact need.' },
  { icon: MdLocationOn, title: 'Hyperlocal Focus', desc: 'We focus on Tier-2 and Tier-3 cities where quality service was previously hard to find.' },
  { icon: MdGroup, title: 'Community First', desc: 'We uplift local workers by giving them a dignified digital platform to grow their income.' },
]

const AboutPage = () => (
  <Container maxWidth="lg" sx={{ py: 6 }}>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

      {/* Hero */}
      <Box sx={{ textAlign: 'center', mb: 8 }}>
        <Typography variant="overline" sx={{ color: '#6366f1', fontWeight: 700, letterSpacing: 2 }}>
          Our Story
        </Typography>
        <Typography variant="h3" fontWeight={900} mt={1} mb={2}>
          About OneDW
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth={640} mx="auto" lineHeight={1.8}>
          OneDW (One Door World) was born from a simple frustration — finding a reliable
          electrician or plumber in India's smaller cities was nearly impossible.
          We set out to change that with AI-powered matching, verified workers, and a
          seamless digital experience.
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} mb={8}>
        {STATS.map((s, i) => (
          <Grid item xs={6} md={3} key={s.label}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Paper
                sx={{
                  p: 3, textAlign: 'center', borderRadius: 3,
                  border: '1px solid rgba(99,102,241,0.15)',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.08)',
                }}
              >
                <Typography sx={{ fontSize: 32, mb: 1 }}>{s.icon}</Typography>
                <Typography variant="h4" fontWeight={900} color="primary">{s.value}</Typography>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Values */}
      <Box mb={8}>
        <Typography variant="h4" fontWeight={800} textAlign="center" mb={4}>
          Our Values
        </Typography>
        <Grid container spacing={3}>
          {VALUES.map((val, i) => {
            const Icon = val.icon
            return (
              <Grid item xs={12} sm={6} key={val.title}>
                <motion.div initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                  <Paper sx={{ p: 3, borderRadius: 3, display: 'flex', gap: 2, border: '1px solid rgba(99,102,241,0.1)' }}>
                    <Box
                      sx={{
                        width: 52, height: 52, borderRadius: 2, flexShrink: 0,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Icon color="white" size={24} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={700} mb={0.5}>{val.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{val.desc}</Typography>
                    </Box>
                  </Paper>
                </motion.div>
              </Grid>
            )
          })}
        </Grid>
      </Box>

      {/* Team */}
      <Box>
        <Typography variant="h4" fontWeight={800} textAlign="center" mb={4}>
          Meet the Team
        </Typography>
        <Grid container spacing={3} justifyContent="center">
          {TEAM.map((member, i) => (
            <Grid item xs={12} sm={4} key={member.name}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -6 }}
              >
                <Paper
                  sx={{
                    p: 4, textAlign: 'center', borderRadius: 4,
                    border: '1px solid rgba(99,102,241,0.12)',
                    boxShadow: '0 8px 32px rgba(99,102,241,0.1)',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 80, height: 80, mx: 'auto', mb: 2,
                      background: `linear-gradient(135deg, ${member.bg}, ${member.bg}aa)`,
                      fontSize: 32, fontWeight: 800,
                    }}
                  >
                    {member.avatar}
                  </Avatar>
                  <Typography variant="h6" fontWeight={800}>{member.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{member.role}</Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Box>

    </motion.div>
  </Container>
)

export default AboutPage
