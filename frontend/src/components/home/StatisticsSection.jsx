import { Container, Grid, Typography } from '@mui/material'

const STATS = [
  { value: '25,000+', label: 'Bookings Completed' },
  { value: '3,200+', label: 'Verified Professionals' },
  { value: '40+', label: 'Cities Covered' },
  { value: '4.8/5', label: 'Average Rating' },
]

const StatisticsSection = () => (
  <Container maxWidth="lg" sx={{ py: 8 }}>
    <Grid container spacing={4}>
      {STATS.map((s, i) => (
        <Grid item xs={6} md={3} key={i} sx={{ textAlign: 'center' }}>
          <Typography variant="h3" color="primary.main" fontWeight={800}>
            {s.value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {s.label}
          </Typography>
        </Grid>
      ))}
    </Grid>
  </Container>
)

export default StatisticsSection