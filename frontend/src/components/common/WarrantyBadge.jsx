import { Box, Typography, Paper, Chip, Button, Divider } from '@mui/material'
import { motion } from 'framer-motion'
import { MdShield, MdCheckCircle, MdSchedule, MdWarning } from 'react-icons/md'

const STATUS_COLORS = {
  active: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', label: 'Active' },
  expired: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Expired' },
  claimed: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Claimed' },
}

const WarrantyBadge = ({ warranty, onClaim, compact }) => {
  if (!warranty || warranty.status === 'none') return null

  const statusCfg = STATUS_COLORS[warranty.status] || STATUS_COLORS.active
  const endDate = warranty.end_date ? new Date(warranty.end_date) : null
  const daysLeft = endDate ? Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))) : 0

  if (compact) {
    return (
      <Chip
        icon={<MdShield size={12} />}
        label={`${statusCfg.label} · ${warranty.duration_days}d`}
        size="small"
        sx={{
          bgcolor: statusCfg.bg,
          color: statusCfg.color,
          fontWeight: 700,
          fontSize: '0.7rem',
        }}
      />
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Paper sx={{
        p: 3, borderRadius: 3,
        background: 'linear-gradient(135deg,rgba(34,197,94,0.06),rgba(22,163,74,0.06))',
        border: '1px solid rgba(34,197,94,0.2)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: 2.5,
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
            }}>
              <MdShield color="white" size={24} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>Warranty Protection</Typography>
              <Typography variant="caption" color="text.secondary">
                {warranty.duration_days}-day coverage
              </Typography>
            </Box>
          </Box>
          <Chip
            icon={warranty.status === 'active' ? <MdCheckCircle size={14} /> : <MdWarning size={14} />}
            label={statusCfg.label}
            sx={{ bgcolor: statusCfg.bg, color: statusCfg.color, fontWeight: 700 }}
            size="small"
          />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">Start Date</Typography>
          <Typography variant="body2" fontWeight={600}>
            {warranty.start_date ? new Date(warranty.start_date).toLocaleDateString() : 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">End Date</Typography>
          <Typography variant="body2" fontWeight={600}>
            {endDate ? endDate.toLocaleDateString() : 'N/A'}
          </Typography>
        </Box>
        {warranty.status === 'active' && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Days Remaining</Typography>
            <Typography variant="body2" fontWeight={700} color="#22c55e">
              <MdSchedule style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {daysLeft} days
            </Typography>
          </Box>
        )}

        {warranty.covered_services && warranty.covered_services.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Covered Services
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {warranty.covered_services.map((svc, i) => (
                <Chip key={i} label={svc} size="small" sx={{ bgcolor: 'rgba(34,197,94,0.08)', color: '#16a34a', fontWeight: 600 }} />
              ))}
            </Box>
          </Box>
        )}

        {warranty.status === 'active' && onClaim && (
          <Button
            variant="outlined"
            size="small"
            fullWidth
            onClick={() => onClaim(warranty)}
            sx={{
              mt: 2, borderRadius: 2, fontWeight: 700, borderColor: '#22c55e', color: '#22c55e',
              '&:hover': { borderColor: '#16a34a', bgcolor: 'rgba(34,197,94,0.06)' },
            }}
          >
            File Warranty Claim
          </Button>
        )}
      </Paper>
    </motion.div>
  )
}

export default WarrantyBadge
