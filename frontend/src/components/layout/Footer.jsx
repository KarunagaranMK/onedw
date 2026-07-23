import { Box, Container, Grid, Typography, IconButton, Divider } from '@mui/material'
import { Link } from 'react-router-dom'
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin } from 'react-icons/fa'

const Footer = () => (
  <Box component="footer" sx={{ backgroundColor: 'background.paper', mt: 8, pt: 6, pb: 3 }}>
    <Container maxWidth="lg">
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Typography variant="h5" sx={{ color: 'primary.main', mb: 1 }}>
            OneDW
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hyperlocal AI-powered home services for Tier-2 and Tier-3 cities —
            connecting you with trusted local professionals.
          </Typography>
          <Box sx={{ mt: 2 }}>
            {[FaFacebook, FaInstagram, FaTwitter, FaLinkedin].map((Icon, i) => (
              <IconButton key={i} size="small" sx={{ mr: 1 }}>
                <Icon />
              </IconButton>
            ))}
          </Box>
        </Grid>

        <Grid item xs={6} md={2}>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>
            Company
          </Typography>
          {['About', 'Contact', 'FAQ'].map((item) => (
            <Typography
              key={item}
              component={Link}
              to={`/${item.toLowerCase()}`}
              variant="body2"
              display="block"
              color="text.secondary"
              sx={{ textDecoration: 'none', mb: 1 }}
            >
              {item}
            </Typography>
          ))}
        </Grid>

        <Grid item xs={6} md={2}>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>
            For Professionals
          </Typography>
          <Typography
            component={Link}
            to="/register"
            variant="body2"
            display="block"
            color="text.secondary"
            sx={{ textDecoration: 'none' }}
          >
            Become a Professional
          </Typography>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>
            Contact
          </Typography>
          <Typography variant="body2" color="text.secondary">
            support@onedw.in
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Puducherry, India
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Typography variant="body2" color="text.secondary" align="center">
        © {new Date().getFullYear()} OneDW. All rights reserved.
      </Typography>
    </Container>
  </Box>
)

export default Footer