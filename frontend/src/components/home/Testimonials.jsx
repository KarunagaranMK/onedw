import { Container, Grid, Typography, Card, CardContent, Avatar, Box } from '@mui/material'

const TESTIMONIALS = [
  { name: 'Priya S.', role: 'Customer', text: 'Booked an electrician within 10 minutes. Super smooth experience!' },
  { name: 'Ravi K.', role: 'Customer', text: 'Transparent pricing and verified workers — exactly what I needed.' },
  { name: 'Anitha M.', role: 'Worker Partner', text: 'OneDW helped me get consistent bookings in my area.' },
]

const Testimonials = () => (
  <Box sx={{ backgroundColor: 'background.paper', py: 8 }}>
    <Container maxWidth="lg">
      <Typography variant="h4" align="center" mb={5}>
        What People Say
      </Typography>
      <Grid container spacing={3}>
        {TESTIMONIALS.map((t, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Card sx={{ p: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="body1" mb={3} fontStyle="italic">
                  “{t.text}”
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar>{t.name[0]}</Avatar>
                  <Box>
                    <Typography fontWeight={600}>{t.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t.role}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  </Box>
)

export default Testimonials