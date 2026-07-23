import { Container, Grid, Typography, Box } from '@mui/material'

const STEPS = [
  { step: '01', title: 'Search a Service', desc: 'Tell us what you need — plumbing, electrical, cleaning, and more.' },
  { step: '02', title: 'Get Matched', desc: 'Our AI matches you with the nearest verified professional.' },
  { step: '03', title: 'Book & Relax', desc: 'Confirm your booking and track your professional in real time.' },
]

const HowItWorks = () => (
  <Container maxWidth="lg" sx={{ py: 8 }} id="how-it-works">
    <Typography variant="h4" align="center" mb={5}>
      How It Works
    </Typography>
    <Grid container spacing={4}>
      {STEPS.map((s) => (
        <Grid item xs={12} md={4} key={s.step}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" color="primary.main" fontWeight={800} mb={1}>
              {s.step}
            </Typography>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              {s.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {s.desc}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  </Container>
)

export default HowItWorks