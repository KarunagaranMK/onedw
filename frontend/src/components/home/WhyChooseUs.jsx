import { Container, Grid, Typography, Box } from '@mui/material'
import { MdVerified, MdBolt, MdSupportAgent, MdPriceCheck } from 'react-icons/md'

const REASONS = [
  { icon: MdVerified, title: 'Verified Professionals', desc: 'Every worker is background-checked and rated by real customers.' },
  { icon: MdBolt, title: 'AI-Powered Matching', desc: 'Get the best professional matched to your job instantly.' },
  { icon: MdSupportAgent, title: '24/7 Support', desc: 'Our team is always available to help resolve any issue.' },
  { icon: MdPriceCheck, title: 'Transparent Pricing', desc: 'No hidden charges — know the cost before you book.' },
]

const WhyChooseUs = () => (
  <Box sx={{ backgroundColor: 'background.paper', py: 8 }}>
    <Container maxWidth="lg">
      <Typography variant="h4" align="center" mb={5}>
        Why Choose OneDW
      </Typography>
      <Grid container spacing={4}>
        {REASONS.map((r, i) => {
          const Icon = r.icon
          return (
            <Grid item xs={12} sm={6} md={3} key={i} sx={{ textAlign: 'center' }}>
              <Icon size={36} color="#10B981" />
              <Typography variant="subtitle1" fontWeight={600} mt={2} mb={1}>
                {r.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {r.desc}
              </Typography>
            </Grid>
          )
        })}
      </Grid>
    </Container>
  </Box>
)

export default WhyChooseUs