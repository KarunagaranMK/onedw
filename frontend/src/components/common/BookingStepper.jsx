import { Box, Typography, Stepper, Step, StepLabel, Chip } from '@mui/material'
import { MdPending, MdCheckCircle, MdDirectionsWalk, MdBuild, MdDoneAll } from 'react-icons/md'
import { motion } from 'framer-motion'

const STEPS = [
  { key: 'pending', label: 'Pending', icon: MdPending, color: '#f59e0b' },
  { key: 'accepted', label: 'Accepted', icon: MdCheckCircle, color: '#6366f1' },
  { key: 'worker_on_the_way', label: 'On The Way', icon: MdDirectionsWalk, color: '#0ea5e9' },
  { key: 'started', label: 'In Progress', icon: MdBuild, color: '#8b5cf6' },
  { key: 'completed', label: 'Completed', icon: MdDoneAll, color: '#10b981' },
]

const STATUS_LABELS = {
  pending: 'Awaiting acceptance from a worker',
  accepted: 'Worker has accepted your request',
  worker_on_the_way: 'Worker is on the way to your location',
  started: 'Service is in progress',
  completed: 'Service completed successfully! 🎉',
  cancelled: 'Booking was cancelled',
}

/**
 * BookingStepper — Phase 8 component.
 * Visual 5-step progress tracker for live booking status.
 */
const BookingStepper = ({ status }) => {
  if (status === 'cancelled') {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Chip label="❌ Booking Cancelled" color="error" size="medium" />
        <Typography variant="body2" color="text.secondary" mt={1}>
          This booking was cancelled.
        </Typography>
      </Box>
    )
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status)
  const activeStep = currentIdx === -1 ? 0 : currentIdx

  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2 }}>
        {STEPS.map((step, idx) => {
          const Icon = step.icon
          const isCompleted = idx < activeStep
          const isActive = idx === activeStep
          return (
            <Step key={step.key} completed={isCompleted}>
              <StepLabel
                StepIconComponent={() => (
                  <motion.div
                    animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isCompleted || isActive
                          ? `linear-gradient(135deg, ${step.color}, ${step.color}cc)`
                          : 'rgba(0,0,0,0.08)',
                        boxShadow: isActive
                          ? `0 0 0 4px ${step.color}33, 0 4px 12px ${step.color}44`
                          : 'none',
                        transition: 'all 0.4s ease',
                      }}
                    >
                      <Icon
                        size={20}
                        color={isCompleted || isActive ? 'white' : '#aaa'}
                      />
                    </Box>
                  </motion.div>
                )}
              >
                <Typography
                  variant="caption"
                  fontWeight={isActive ? 700 : 400}
                  color={isActive ? step.color : 'text.secondary'}
                >
                  {step.label}
                </Typography>
              </StepLabel>
            </Step>
          )
        })}
      </Stepper>

      <Box
        sx={{
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))',
          borderRadius: 2,
          py: 1.5,
          px: 2,
          border: '1px solid rgba(99,102,241,0.12)',
        }}
      >
        <Typography variant="body2" fontWeight={600} color="text.primary">
          {STATUS_LABELS[status] || 'Status updating...'}
        </Typography>
      </Box>
    </Box>
  )
}

export default BookingStepper
