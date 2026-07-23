import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { CircularProgress, Box } from '@mui/material'
import api from '../services/api'

/**
 * Smart dashboard router — redirects to the appropriate dashboard
 * based on the user's role. For workers, checks profile completeness
 * and redirects to /worker/profile/setup if not yet complete.
 */
const DashboardPage = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (loading || !user) return

    const route = async () => {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true })
        return
      }

      if (user.role === 'customer') {
        navigate('/customer-dashboard', { replace: true })
        return
      }

      // Worker — check if profile is complete
      if (user.role === 'worker') {
        setChecking(true)
        try {
          const { data } = await api.get('/worker/profile')
          if (data.profile_complete) {
            navigate('/worker-dashboard', { replace: true })
          } else {
            navigate('/worker/profile/setup', { replace: true })
          }
        } catch {
          // Can't check profile — send to setup
          navigate('/worker/profile/setup', { replace: true })
        } finally {
          setChecking(false)
        }
        return
      }

      // Unknown role fallback
      navigate('/customer-dashboard', { replace: true })
    }

    route()
  }, [user, loading, navigate])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 2 }}>
      <CircularProgress />
      {checking && <span style={{ color: '#6366f1', fontSize: 14 }}>Checking your profile...</span>}
    </Box>
  )
}

export default DashboardPage
