import { useState } from 'react'
import {
  Box, Container, Typography, Button, Stack, InputBase,
  Paper, Chip, Avatar, AvatarGroup, useTheme,
} from '@mui/material'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { MdSearch, MdLocationOn, MdAutoAwesome, MdArrowForward } from 'react-icons/md'

const POPULAR_SERVICES = [
  { icon: '⚡', label: 'Electrician' },
  { icon: '🔧', label: 'Plumber' },
  { icon: '🎨', label: 'Painter' },
  { icon: '🧹', label: 'Cleaner' },
  { icon: '🪚', label: 'Carpenter' },
  { icon: '❄️', label: 'AC Repair' },
]

const FLOAT_CARDS = [
  { emoji: '⭐', text: '4.9 Rating', sub: '50k+ reviews', color: '#FFB800', delay: 0 },
  { emoji: '✅', text: 'Verified Pros', sub: '2000+ experts', color: '#00D4AA', delay: 0.3 },
  { emoji: '🚀', text: 'Fast Booking', sub: 'In 2 minutes', color: '#6C47FF', delay: 0.6 },
]

export default function HeroSection() {
  const navigate = useNavigate()
  const theme = useTheme()
  const [query, setQuery] = useState('')

  const handleSearch = () => {
    if (query.trim()) navigate(`/workers?category=${encodeURIComponent(query.trim())}`)
    else navigate('/workers')
  }

  const isDark = theme.palette.mode === 'dark'

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        pt: { xs: 10, md: 14 },
        pb: { xs: 8, md: 12 },
        background: isDark
          ? 'linear-gradient(135deg, #080812 0%, #111827 50%, #0a0a1a 100%)'
          : 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      }}
    >
      {/* Animated mesh gradient blobs */}
      {[
        { top: '-20%', left: '-10%', size: '500px', color: 'rgba(108,71,255,0.35)' },
        { top: '30%', right: '-15%', size: '400px', color: 'rgba(0,212,170,0.2)' },
        { bottom: '-10%', left: '30%', size: '350px', color: 'rgba(255,184,0,0.15)' },
      ].map((blob, i) => (
        <motion.div
          key={i}
          style={{ position: 'absolute', ...blob, width: blob.size, height: blob.size,
            borderRadius: '50%', background: blob.color, filter: 'blur(80px)', pointerEvents: 'none' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 5 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 1.5 }}
        />
      ))}

      {/* Grid pattern overlay */}
      <Box sx={{
        position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={6} alignItems="center">
          {/* ── Left content ── */}
          <Box flex={1}>
            {/* AI Badge */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Box sx={{
                display: 'inline-flex', alignItems: 'center', gap: 1, mb: 3,
                px: 2, py: 0.75, borderRadius: 20,
                background: 'rgba(108,71,255,0.2)',
                border: '1px solid rgba(108,71,255,0.4)',
                backdropFilter: 'blur(8px)',
              }}>
                <MdAutoAwesome color="#9B72FF" size={16} />
                <Typography variant="caption" sx={{ color: '#9B72FF', fontWeight: 700, letterSpacing: '0.05em' }}>
                  AI-POWERED HOME SERVICES
                </Typography>
              </Box>
            </motion.div>

            {/* Headline */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3.2rem', md: '3.8rem' },
                  fontWeight: 900,
                  color: '#ffffff',
                  lineHeight: 1.1,
                  mb: 2.5,
                  letterSpacing: '-0.03em',
                }}
              >
                Find Trusted{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(135deg, #9B72FF 0%, #00D4AA 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Professionals
                </Box>
                {' '}Near You
              </Typography>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 400, color: 'rgba(255,255,255,0.65)', mb: 4, maxWidth: 520, lineHeight: 1.7 }}
              >
                Book verified plumbers, electricians, carpenters and more with AI-powered matching. 
                Guaranteed quality. Transparent pricing.
              </Typography>
            </motion.div>

            {/* Search Bar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
              <Paper
                sx={{
                  display: 'flex', alignItems: 'center', borderRadius: '16px',
                  overflow: 'hidden', mb: 3, p: 0.5,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(10px)',
                  background: 'rgba(255,255,255,0.95)',
                }}
              >
                <MdSearch size={22} color="#6C47FF" style={{ marginLeft: 12, flexShrink: 0 }} />
                <InputBase
                  placeholder="What service do you need?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  sx={{ flex: 1, px: 1.5, fontSize: 15, fontWeight: 500, '& input': { py: 1.5 } }}
                />
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  endIcon={<MdArrowForward />}
                  sx={{
                    borderRadius: '12px', px: 3, py: 1.5,
                    background: 'linear-gradient(135deg, #6C47FF, #9B72FF)',
                    fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap',
                    '&:hover': { background: 'linear-gradient(135deg, #5a38e8, #8660e8)' },
                  }}
                >
                  Search
                </Button>
              </Paper>
            </motion.div>

            {/* Popular services */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mr: 0.5, alignSelf: 'center' }}>
                  Popular:
                </Typography>
                {POPULAR_SERVICES.map((s) => (
                  <Chip
                    key={s.label}
                    icon={<span style={{ fontSize: 14 }}>{s.icon}</span>}
                    label={s.label}
                    onClick={() => navigate(`/workers?category=${s.label}`)}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      fontWeight: 600, cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(108,71,255,0.3)', borderColor: '#6C47FF' },
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </Box>
            </motion.div>

            {/* Social proof */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3, flexWrap: 'wrap' }}>
                <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 34, height: 34, fontSize: 13, border: '2px solid rgba(255,255,255,0.2)' } }}>
                  {['👷', '🔧', '🎨', '⚡'].map((e, i) => (
                    <Avatar key={i} sx={{ bgcolor: ['#6C47FF', '#00D4AA', '#FFB800', '#FF6B6B'][i] }}>
                      {e}
                    </Avatar>
                  ))}
                </AvatarGroup>
                <Box>
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>
                    Join 50,000+ happy customers
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    ⭐ 4.9/5 average rating across all services
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          </Box>

          {/* ── Right: Floating cards ── */}
          <Box sx={{ flex: '0 0 auto', display: { xs: 'none', md: 'block' }, position: 'relative', width: 300, height: 380 }}>
            {FLOAT_CARDS.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 + i * 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + card.delay, duration: 0.6 }}
                style={{
                  position: 'absolute',
                  top: i === 0 ? 20 : i === 1 ? 140 : 260,
                  left: i === 1 ? 60 : 0,
                  right: i === 0 || i === 2 ? 0 : 'auto',
                }}
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                >
                  <Paper sx={{
                    p: 2.5, borderRadius: 3, minWidth: 180,
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid rgba(255,255,255,0.12)`,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)`,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 44, height: 44, borderRadius: 2,
                        background: `${card.color}25`,
                        border: `1px solid ${card.color}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20,
                      }}>
                        {card.emoji}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 800 }}>
                          {card.text}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                          {card.sub}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </motion.div>
              </motion.div>
            ))}
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}