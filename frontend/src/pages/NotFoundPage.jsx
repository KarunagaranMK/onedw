import { Box, Typography, Button } from '@mui/material'
import { Link } from 'react-router-dom'

const NotFoundPage = () => (
  <Box sx={{ textAlign: 'center', py: 12 }}>
    <Typography variant="h1" fontWeight={800} color="primary.main">
      404
    </Typography>
    <Typography variant="h6" mb={3}>
      Page not found
    </Typography>
    <Button component={Link} to="/" variant="contained">
      Back to Home
    </Button>
  </Box>
)

export default NotFoundPage