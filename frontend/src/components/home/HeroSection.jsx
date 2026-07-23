import { Box, Container, Typography, Button, Stack } from '@mui/material'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const HeroSection = () => (
  <Box
    sx={{
      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
      color: '#fff',
      py: { xs: 8, md: 12 },
    }}
  >
    <Container maxWidth="lg">
      <Box sx={{ maxWidth: 640 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Typography variant="h2" sx={{ fontSize: { xs: '2.2rem', md: '3rem' }, mb: 2 }}>
            Find Trusted Local Professionals Near You
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9, mb: 4 }}>
            Book verified plumbers, electricians, carpenters and more with
            AI-powered recommendations.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              component={Link}
              to="/create-request"
              variant="contained"
              size="large"
              sx={{ backgroundColor: '#fff', color: 'primary.main', '&:hover': { backgroundColor: '#F1F5F9' } }}
            >
              Book Service
            </Button>
            <Button
              component={Link}
              to="/register"
              variant="outlined"
              size="large"
              sx={{ borderColor: '#fff', color: '#fff' }}
            >
              Become a Professional
            </Button>
          </Stack>
        </motion.div>
      </Box>
    </Container>
  </Box>
)

export default HeroSection