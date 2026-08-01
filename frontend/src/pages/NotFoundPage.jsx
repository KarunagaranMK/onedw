import { Box, Typography, Button, Container } from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MdHome, MdArrowBack } from 'react-icons/md'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <Container maxWidth="sm" sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 10 }}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <Box sx={{ textAlign: 'center' }}>
          {/* Illustration */}
          <motion.div
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Typography sx={{ fontSize: { xs: 100, md: 140 }, lineHeight: 1, mb: 2 }}>🔍</Typography>
          </motion.div>

          <Typography variant="h2" fontWeight={900} mb={1} sx={{
            background: 'linear-gradient(135deg, #2563eb, #14b8a6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.05em', fontSize: { xs: '4rem', md: '6rem' },
          }}>
            404
          </Typography>
          <Typography variant="h5" fontWeight={800} mb={1.5} sx={{ letterSpacing: '-0.02em' }}>
            Page not found
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={5} sx={{ maxWidth: 380, mx: 'auto', lineHeight: 1.8 }}>
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<MdHome />}
              onClick={() => navigate('/')}
              sx={{ px: 4, py: 1.5, borderRadius: 3, fontWeight: 800 }}
            >
              Back to Home
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<MdArrowBack />}
              onClick={() => navigate(-1)}
              sx={{ px: 4, py: 1.5, borderRadius: 3, fontWeight: 700 }}
            >
              Go Back
            </Button>
          </Box>
        </Box>
      </motion.div>
    </Container>
  )
}