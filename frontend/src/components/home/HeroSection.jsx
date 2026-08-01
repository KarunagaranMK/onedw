import { useState } from 'react'
import {
  Box, Container, Typography, Button, Stack, InputBase,
  Paper, Chip, Avatar, AvatarGroup, useTheme,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MdSearch, MdArrowForward, MdAutoAwesome, MdLocationOn, MdVerified } from 'react-icons/md'

const POPULAR_SERVICES = [
  { icon: '⚡', label: 'Electrician' },
  { icon: '🔧', label: 'Plumber' },
  { icon: '🎨', label: 'Painter' },
  { icon: '🧹', label: 'Cleaner' },
  { icon: '🪚', label: 'Carpenter' },
  { icon: '❄️', label: 'AC Repair' },
]

const FLOAT_CARDS = [
  { emoji: '⭐', text: '4.9 Rating', sub: '50k+ reviews', color: '#F59E0B', delay: 0 },
  { emoji: '✅', text: 'Verified Pros', sub: '2000+ experts', color: '#22C55E', delay: 0.3 },
  { emoji: '🚀', text: 'Fast Booking', sub: '< 2 minutes', color: '#2563EB', delay: 0.6 },
]

export default function HeroSection() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [query, setQuery] = useState('')

  const handleSearch = () => {
    navigate(query.trim() ? `/workers?category=${encodeURIComponent(query.trim())}` : '/workers')
  }

  return (
    <Box sx={{
      position: 'relative', overflow: 'hidden',
      pt: { xs: 10, md: 14 }, pb: { xs: 10, md: 16 },
      background: isDark
        ? 'linear-gradient(135deg, #06060f 0%, #0f172a 50%, #06060f 100%)'
        : 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 40%, #0d9488 100%)',
    }}>
      {/* Animated blobs */}
      {[
        { top: '-15%', left: '-8%', size: '600px', color: 'rgba(37,99,235,0.4)' },
        { top: '25%', right: '-10%', size: '500px', color: 'rgba(20,184,166,0.25)' },
        { bottom: '-8%', left: '35%', size: '400px', color: 'rgba(245,158,11,0.15)' },
      ].map((blob, i) => (
        <motion.div key={i}
          style={{ position: 'absolute', top: blob.top, left: blob.left, right: blob.right, bottom: blob.bottom, width: blob.size, height: blob.size, borderRadius: '50%', background: blob.color, filter: 'blur(90px)', pointerEvents: 'none' }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 5 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 1.5 }}
        />
      ))}

      {/* Grid overlay */}
      <Box sx={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={6} alignItems="center">

          {/* ── Left ─────────────────────────────────────────────────── */}
          <Box flex={1}>
            {/* AI badge */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Box sx={{
                display: 'inline-flex', alignItems: 'center', gap: 1, mb: 3,
                px: 2, py: 0.75, borderRadius: 20,
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
              }}>
                <MdAutoAwesome color="#93c5fd" size={15} />
                <Typography variant="caption" sx={{ color: '#93c5fd', fontWeight: 700, letterSpacing: '0.06em' }}>
                  AI-POWERED · VERIFIED · INSTANT BOOKING
                </Typography>
              </Box>
            </motion.div>

            {/* Headline */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <Typography variant="h1" sx={{
                fontSize: { xs: '2.4rem', sm: '3rem', md: '3.6rem' },
                fontWeight: 900, color: '#fff', lineHeight: 1.1, mb: 2.5,
                letterSpacing: '-0.03em',
              }}>
                Find Trusted{' '}
                <Box component="span" sx={{
                  background: 'linear-gradient(135deg, #93c5fd 0%, #5eead4 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Professionals
                </Box>
                {' '}Near You
              </Typography>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <Typography variant="h6" sx={{ fontWeight: 400, color: 'rgba(255,255,255,0.7)', mb: 4, maxWidth: 500, lineHeight: 1.7 }}>
                Book verified plumbers, electricians, painters and more with AI-powered matching.
                Guaranteed quality. Transparent pricing. Instant confirmation.
              </Typography>
            </motion.div>

            {/* Search bar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
              <Paper sx={{
                display: 'flex', alignItems: 'center', borderRadius: 3,
                overflow: 'hidden', mb: 3, p: 0.75,
                boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
                background: 'rgba(255,255,255,0.97)',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 1 }}>
                  <MdSearch size={22} color="#2563eb" style={{ marginLeft: 12, flexShrink: 0 }} />
                  <InputBase
                    placeholder="What service do you need?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    sx={{ flex: 1, fontSize: 15, fontWeight: 500, color: '#0f172a', '& input': { py: 1.5 } }}
                  />
                </Box>
                <Button variant="contained" onClick={handleSearch} endIcon={<MdArrowForward />}
                  sx={{
                    borderRadius: 2.5, px: 3, py: 1.5, fontWeight: 800, fontSize: 14,
                    whiteSpace: 'nowrap', background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                    boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                    '&:hover': { background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' },
                  }}>
                  Search
                </Button>
              </Paper>
            </motion.div>

            {/* Popular chips */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Popular:</Typography>
                {POPULAR_SERVICES.map((s) => (
                  <Chip key={s.label}
                    icon={<span style={{ fontSize: 13 }}>{s.icon}</span>}
                    label={s.label}
                    onClick={() => navigate(`/workers?category=${s.label}`)}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)',
                      border: '1px solid rgba(255,255,255,0.15)', fontWeight: 600, cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(37,99,235,0.4)', borderColor: 'rgba(147,197,253,0.5)' },
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </Box>
            </motion.div>

            {/* Social proof */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3, flexWrap: 'wrap' }}>
                <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 34, height: 34, fontSize: 13, border: '2px solid rgba(255,255,255,0.15)' } }}>
                  {['#2563eb', '#14b8a6', '#f59e0b', '#22c55e'].map((bg, i) => (
                    <Avatar key={i} sx={{ bgcolor: bg }}>{['A','B','C','D'][i]}</Avatar>
                  ))}
                </AvatarGroup>
                <Box>
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>50,000+ happy customers</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>⭐ 4.9/5 · 1000+ cities · Instant booking</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.5, borderRadius: 20, background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <MdVerified size={14} color="#4ade80" />
                  <Typography variant="caption" sx={{ color: '#4ade80', fontWeight: 700 }}>All Verified</Typography>
                </Box>
              </Box>
            </motion.div>
          </Box>

          {/* ── Right: Floating cards ─────────────────────────────────── */}
          <Box sx={{ flex: '0 0 auto', display: { xs: 'none', md: 'block' }, position: 'relative', width: 300, height: 390 }}>
            {FLOAT_CARDS.map((card, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 40 + i * 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + card.delay, duration: 0.6 }}
                style={{ position: 'absolute', top: [20, 150, 270][i], left: i === 1 ? 60 : 0, right: i !== 1 ? 0 : 'auto' }}
              >
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}>
                  <Paper sx={{
                    p: 2.5, borderRadius: 3, minWidth: 180,
                    background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: 2, background: `${card.color}22`, border: `1px solid ${card.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                        {card.emoji}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 800 }}>{card.text}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{card.sub}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </motion.div>
              </motion.div>
            ))}
          </Box>
        </Stack>
      </Container>

      {/* Wave divider */}
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
          style={{ width: '100%', height: 60, display: 'block' }}>
          <path d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z"
            fill={isDark ? '#060612' : '#f8fafc'} />
        </svg>
      </Box>
    </Box>
  )
}