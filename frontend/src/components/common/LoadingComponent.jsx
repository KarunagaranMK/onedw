import { Box, CircularProgress, Typography } from '@mui/material'

const LoadingComponent = ({ label = 'Loading...' }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 8,
      gap: 2,
    }}
  >
    <CircularProgress color="primary" />
    <Typography color="text.secondary">{label}</Typography>
  </Box>
)

export default LoadingComponent