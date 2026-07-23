import { Card, CardContent, Typography, Chip, Box } from '@mui/material'
import { motion } from 'framer-motion'
import { MdLocationOn, MdCalendarToday, MdAccessTime } from 'react-icons/md'

const STATUS_COLORS = {
  pending: 'warning',
  accepted: 'info',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'error',
}

const RequestCard = ({ request }) => (
  <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
    <Card sx={{ p: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Typography variant="h6" fontWeight={600}>
            {request.service_type}
          </Typography>
          <Chip
            label={request.status.replace('_', ' ')}
            color={STATUS_COLORS[request.status] || 'default'}
            size="small"
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <MdLocationOn color="#64748B" />
          <Typography variant="body2" color="text.secondary">
            {request.location}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <MdCalendarToday color="#64748B" />
          <Typography variant="body2" color="text.secondary">
            {request.preferred_date}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MdAccessTime color="#64748B" />
          <Typography variant="body2" color="text.secondary">
            {request.preferred_time}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  </motion.div>
)

export default RequestCard