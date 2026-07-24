import { Box, Container, Grid, Typography, IconButton, Divider, Button, useTheme } from '@mui/material'
import { Link } from 'react-router-dom'
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin, FaYoutube } from 'react-icons/fa'
import { MdEmail, MdLocationOn, MdPhone, MdArrowForward } from 'react-icons/md'
import { motion } from 'framer-motion'

const FOOTER_COLS = [
  {
    title: 'Services',
    links: [
      ['Electrician', '/workers?category=Electrician'],
      ['Plumber', '/workers?category=Plumber'],
      ['Carpenter', '/workers?category=Carpenter'],
      ['Painter', '/workers?category=Painter'],
      ['Cleaner', '/workers?category=Cleaner'],
      ['AC Repair', '/workers?category=AC Repair'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['About Us', '/about'],
      ['How It Works', '/#how-it-works'],
      ['Contact', '/contact'],
      ['Blog', '/contact'],
      ['FAQ', '/contact'],
    ],
  },
  {
    title: 'For Professionals',
    links: [
      ['Become a Pro', '/register'],
      ['Worker Dashboard', '/worker-dashboard'],
      ['Earnings', '/worker-dashboard'],
      ['Training', '/contact'],
      ['Support', '/contact'],
    ],
  },
]

const SOCIALS = [
  { Icon: FaFacebook, href: '#', color: '#1877F2' },
  { Icon: FaInstagram, href: '#', color: '#E4405F' },
  { Icon: FaTwitter, href: '#', color: '#1DA1F2' },
  { Icon: FaLinkedin, href: '#', color: '#0A66C2' },
  { Icon: FaYoutube, href: '#', color: '#FF0000' },
]

export default function Footer() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box
      component="footer"
      sx={{
        mt: 10,
        background: isDark
          ? 'linear-gradient(180deg, #080812 0%, #0d0d20 100%)'
          : 'linear-gradient(180deg, #0f0c29 0%, #1a1740 100%)',
        color: 'rgba(255,255,255,0.85)',
        pt: { xs: 6, md: 10 },
        pb: 4,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background blobs */}
      <Box sx={{
        position: 'absolute', top: '-30%', right: '-10%', width: 400, height: 400,
        borderRadius: '50%', background: 'rgba(108,71,255,0.12)', filter: 'blur(80px)', pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute', bottom: '-20%', left: '-5%', width: 300, height: 300,
        borderRadius: '50%', background: 'rgba(0,212,170,0.08)', filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 4, md: 6 }}>
          {/* Brand column */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: 2.5,
                background: 'linear-gradient(135deg, #6C47FF, #9B72FF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, boxShadow: '0 4px 16px rgba(108,71,255,0.4)',
              }}>
                🏠
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={900} sx={{
                  background: 'linear-gradient(135deg, #9B72FF, #00D4AA)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  OneDW
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: '0.1em' }}>
                  HOME SERVICES
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, mb: 3, maxWidth: 300 }}>
              India's trusted hyperlocal platform connecting you with AI-verified home service professionals in Tier-2 and Tier-3 cities.
            </Typography>

            {/* Contact info */}
            {[
              { icon: <MdEmail size={15} />, text: 'support@onedw.in' },
              { icon: <MdPhone size={15} />, text: '+91 98765 43210' },
              { icon: <MdLocationOn size={15} />, text: 'Puducherry, India' },
            ].map(({ icon, text }) => (
              <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ color: '#9B72FF' }}>{icon}</Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>{text}</Typography>
              </Box>
            ))}

            {/* Socials */}
            <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
              {SOCIALS.map(({ Icon, href, color }) => (
                <IconButton
                  key={color}
                  component="a"
                  href={href}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.6)',
                    '&:hover': { bgcolor: color, color: '#fff', borderColor: color, transform: 'translateY(-3px)' },
                    transition: 'all 0.2s ease',
                    borderRadius: 2,
                  }}
                >
                  <Icon size={14} />
                </IconButton>
              ))}
            </Box>
          </Grid>

          {/* Link columns */}
          {FOOTER_COLS.map((col) => (
            <Grid item xs={6} md={2.5} key={col.title} sx={{ '&:last-child': { md: { gridColumn: 'span 2' } } }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#fff', mb: 2.5, letterSpacing: '0.03em' }}>
                {col.title}
              </Typography>
              {col.links.map(([label, path]) => (
                <Typography
                  key={label}
                  component={Link}
                  to={path}
                  variant="body2"
                  display="block"
                  sx={{
                    textDecoration: 'none', mb: 1.5,
                    color: 'rgba(255,255,255,0.5)',
                    '&:hover': { color: '#9B72FF', paddingLeft: '4px' },
                    transition: 'all 0.2s ease',
                    fontSize: 13,
                  }}
                >
                  {label}
                </Typography>
              ))}
            </Grid>
          ))}
        </Grid>

        {/* Newsletter CTA strip */}
        <Box sx={{
          mt: 8, p: { xs: 3, md: 4 }, borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(108,71,255,0.15), rgba(0,212,170,0.1))',
          border: '1px solid rgba(108,71,255,0.2)',
          display: 'flex', flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center', justifyContent: 'space-between', gap: 2,
        }}>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', mb: 0.5 }}>
              Ready to get started? 🚀
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)' }}>
              Book your first service today and experience the difference.
            </Typography>
          </Box>
          <Button
            component={Link}
            to="/register"
            variant="contained"
            endIcon={<MdArrowForward />}
            sx={{
              borderRadius: 2, fontWeight: 800, px: 3, py: 1.5,
              background: 'linear-gradient(135deg, #6C47FF, #9B72FF)',
              whiteSpace: 'nowrap', flexShrink: 0,
              '&:hover': { background: 'linear-gradient(135deg, #5a38e8, #8660e8)' },
            }}
          >
            Get Started Free
          </Button>
        </Box>

        <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.08)' }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
            © {new Date().getFullYear()} OneDW Technologies Pvt. Ltd. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((t) => (
              <Typography key={t} variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', cursor: 'pointer', '&:hover': { color: '#9B72FF' } }}>
                {t}
              </Typography>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  )
}