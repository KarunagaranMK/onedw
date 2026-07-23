import { useState, useEffect } from 'react'
import { Container, Typography, Grid, Alert } from '@mui/material'
import { getMyRequests } from '../services/requestService'
import RequestCard from '../components/requests/RequestCard'
import LoadingComponent from '../components/common/LoadingComponent'
import EmptyState from '../components/common/EmptyState'
import { useNavigate } from 'react-router-dom'

const MyRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getMyRequests()
        setRequests(data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load your requests.')
      } finally {
        setLoading(false)
      }
    }
    fetchRequests()
  }, [])

  if (loading) return <LoadingComponent label="Loading your requests..." />

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h4" fontWeight={700} mb={4}>
        My Requests
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!error && requests.length === 0 ? (
        <EmptyState
          title="No requests yet"
          description="You haven't raised any service requests."
          actionLabel="Create a Request"
          onAction={() => navigate('/create-request')}
        />
      ) : (
        <Grid container spacing={3}>
          {requests.map((req) => (
            <Grid item xs={12} sm={6} md={4} key={req.id}>
              <RequestCard request={req} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  )
}

export default MyRequests