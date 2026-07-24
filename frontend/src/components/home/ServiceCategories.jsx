import { Box, Container, Typography, Grid, useTheme } from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { SERVICE_CATEGORIES } from '../../utils/constants'

const CATEGORY_GRADIENTS = [
  'linear-gradient(135deg,#6C47FF,#9B72FF)',
  'linear-gradient(135deg,#00D4AA,#00B894)',
  'linear-gradient(135deg,#FF6B6B,#FF8E8E)',
  'linear-gradient(135deg,#FFB800,#FFD54F)',
  'linear-gradient(135deg,#3B82F6,#60A5FA)',
  'linear-gradient(135deg,#EC4899,#F472B6)',
  'linear-gradient(135deg,#8B5CF6,#A78BFA)',
  'linear-gradient(135deg,#14B8A6,#2DD4BF)',
]

export default function ServiceCategories() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2,
              px: 2, py: 0.6, borderRadius: 20,
              bgcolor: 'rgba(108,71,255,0.08)',
              border: '1px solid rgba(108,71,255,0.15)',
            }}>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.08em' }}>
                ALL SERVICES
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight={900} mb={1.5} sx={{ letterSpacing: '-0.02em' }}>
              What are you looking for?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, mx: 'auto', lineHeight: 1.7 }}>
              Choose from our most popular hyperlocal home services — all verified, all trusted.
            </Typography>
          </Box>
        </motion.div>

        {/* Cards Grid */}
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {SERVICE_CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon
            const gradient = CATEGORY_GRADIENTS[idx % CATEGORY_GRADIENTS.length]
            return (
              <Grid item xs={6} sm={4} md={3} key={cat.id}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06, duration: 0.4 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Box
                    onClick={() => navigate(`/workers?category=${cat.id}`)}
                    sx={{
                      p: 3, borderRadius: 4, textAlign: 'center',
                      cursor: 'pointer',
                      bgcolor: 'background.paper',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,71,255,0.08)'}`,
                      boxShadow: isDark
                        ? '0 4px 20px rgba(0,0,0,0.3)'
                        : '0 4px 20px rgba(108,71,255,0.06)',
                      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                      '&:hover': {
                        borderColor: 'rgba(108,71,255,0.3)',
                        boxShadow: '0 16px 40px rgba(108,71,255,0.15)',
                      },
                    }}
                  >
                    {/* Gradient icon container */}
                    <Box sx={{
                      width: 64, height: 64, borderRadius: 3, mx: 'auto', mb: 2,
                      background: gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 8px 24px rgba(108,71,255,0.2)`,
                      transition: 'transform 0.3s ease',
                      '&:hover': { transform: 'scale(1.1) rotate(5deg)' },
                    }}>
                      <Icon size={28} color="#fff" />
                    </Box>

                    <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
                      {cat.name}
                    </Typography>
                    {cat.count && (
                      <Typography variant="caption" color="text.secondary">
                        {cat.count}+ professionals
                      </Typography>
                    )}
                  </Box>
                </motion.div>
              </Grid>
            )
          })}
        </Grid>
      </Container>
    </Box>
  )
}