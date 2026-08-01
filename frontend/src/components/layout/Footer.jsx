import { Box, Container, Grid, Typography, Link as MuiLink, Divider, useTheme, IconButton, Chip } from '@mui/material'
import { Link } from 'react-router-dom'
import { MdEmail, MdPhone, MdLocationOn } from 'react-icons/md'

const FOOTER_LINKS = {
  Company:  [{ label: 'About Us', to: '/about' }, { label: 'Careers', to: '/about' }, { label: 'Blog', to: '/about' }, { label: 'Press', to: '/about' }],
  Services: [{ label: 'Electrician', to: '/workers?category=Electrician' }, { label: 'Plumber', to: '/workers?category=Plumber' }, { label: 'AC Repair', to: '/workers?category=AC+Repair' }, { label: 'Cleaning', to: '/workers?category=Cleaning' }],
  Support:  [{ label: 'Help Center', to: '/contact' }, { label: 'Contact Us', to: '/contact' }, { label: 'Reviews', to: '/reviews' }, { label: 'File Complaint', to: '/complaint/new' }],
}

const SOCIAL = ['𝕏', '𝕗', '▶', '📸']

export default function Footer() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box component="footer" sx={{
      background: isDark ? '#060612' : '#0f172a',
      color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.7)',
      pt: { xs: 6, md: 10 }, pb: 3,
    }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {/* Brand */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2 }}>
              <Box component="img" src="/logo.png" alt="OneDW" sx={{ height: 40, filter: 'brightness(0) invert(1)', mb: 2 }} />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, maxWidth: 280, mb: 2.5 }}>
                India's most trusted AI-powered home services platform. Book verified professionals instantly.
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                {['⭐ 4.9 Rated', '✅ Verified Pros', '🔒 Secure'].map(tag => (
                  <Chip key={tag} label={tag} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600 }} />
                ))}
              </Box>
            </Box>
            {/* Contact */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { icon: <MdEmail size={14} />, text: 'support@onedw.in' },
                { icon: <MdPhone size={14} />, text: '+91 98765 43210' },
                { icon: <MdLocationOn size={14} />, text: 'Bangalore, India' },
              ].map(({ icon, text }) => (
                <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ color: '#3b82f6' }}>{icon}</Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{text}</Typography>
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <Grid item xs={6} md={2.5} key={title}>
              <Typography variant="caption" fontWeight={700} sx={{ color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', mb: 2 }}>
                {title}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {links.map(link => (
                  <MuiLink key={link.label} component={Link} to={link.to} underline="none"
                    sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 13.5, fontWeight: 500, transition: 'color 0.2s', '&:hover': { color: '#3b82f6' } }}>
                    {link.label}
                  </MuiLink>
                ))}
              </Box>
            </Grid>
          ))}

          {/* App / Newsletter */}
          <Grid item xs={12} md={3}>
            <Typography variant="caption" fontWeight={700} sx={{ color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', mb: 2 }}>
              Get The App
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[{ label: '📱 Download on App Store', bg: '#1c1c1e' }, { label: '🤖 Get on Google Play', bg: '#1c1c1e' }].map(btn => (
                <Box key={btn.label} sx={{
                  px: 2, py: 1.25, borderRadius: 2, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                  fontWeight: 600, fontSize: 13, color: 'rgba(255,255,255,0.8)',
                  '&:hover': { background: 'rgba(37,99,235,0.2)', borderColor: 'rgba(59,130,246,0.4)' },
                  transition: 'all 0.2s',
                }}>
                  {btn.label}
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>
            © {new Date().getFullYear()} OneDW Technologies Pvt. Ltd. · Privacy Policy · Terms of Service
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {SOCIAL.map((s, i) => (
              <Box key={i} sx={{
                width: 32, height: 32, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: 14,
                '&:hover': { background: 'rgba(37,99,235,0.3)' }, transition: 'all 0.2s',
              }}>
                {s}
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  )
}