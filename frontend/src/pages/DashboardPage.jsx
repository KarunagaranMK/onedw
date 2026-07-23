import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { CircularProgress, Box } from '@mui/material'

/**
 * Smart dashboard router — redirects to the appropriate dashboard
 * based on the user's role (customer / worker / admin).
 */
const DashboardPage = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'worker') {
        navigate('/worker-dashboard', { replace: true })
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/customer-dashboard', { replace: true })
      }
    }
  }, [user, loading, navigate])

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress />
    </Box>
  )
}

export default DashboardPage
