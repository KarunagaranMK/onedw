import { Box, Container, Typography, Grid, Card, CardActionArea } from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { SERVICE_CATEGORIES } from '../../utils/constants'

const ServiceCategories = () => {
  const navigate = useNavigate()

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h4" align="center" mb={1}>
        What are you looking for?
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" mb={5}>
        Choose from our most popular hyperlocal services
      </Typography>

      <Grid container spacing={3}>
        {SERVICE_CATEGORIES.map((cat) => {
          const Icon = cat.icon
          return (
            <Grid item xs={6} sm={4} md={3} key={cat.id}>
              <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
                <Card>
                  <CardActionArea
                    sx={{ p: 3, textAlign: 'center' }}
                    onClick={() => navigate(`/create-request?category=${cat.id}`)}
                  >
                    <Icon size={32} color="#2563EB" style={{ marginBottom: 12 }} />
                    <Typography variant="subtitle1" fontWeight={600}>
                      {cat.name}
                    </Typography>
                  </CardActionArea>
                </Card>
              </motion.div>
            </Grid>
          )
        })}
      </Grid>
    </Container>
  )
}

export default ServiceCategories