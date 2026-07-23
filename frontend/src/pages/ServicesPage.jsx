import { Container, Typography, Grid, Paper, Box, Button } from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MdElectricBolt, MdPlumbing, MdCarpenter, MdFormatPaint, MdCleaningServices, MdAcUnit, MdBuild, MdSpa } from 'react-icons/md'

const SERVICES_LIST = [
  { icon: MdElectricBolt, name: 'Electrician', desc: 'Wiring, panel upgrades, fan/light installation, short circuit fixes.', color: '#f59e0b', id: 'electrician' },
  { icon: MdPlumbing, name: 'Plumber', desc: 'Pipe repair, leak fixing, bathroom fittings, water heater installation.', color: '#0ea5e9', id: 'plumber' },
  { icon: MdCarpenter, name: 'Carpenter', desc: 'Furniture assembly, door/window repair, wardrobes, false ceilings.', color: '#92400e', id: 'carpenter' },
  { icon: MdFormatPaint, name: 'Painter', desc: 'Interior/exterior painting, waterproofing, texture finish, wood polish.', color: '#ec4899', id: 'painter' },
  { icon: MdCleaningServices, name: 'Home Cleaning', desc: 'Deep cleaning, sofa/carpet cleaning, kitchen/bathroom scrub, post-renovation clean.', color: '#10b981', id: 'cleaning' },
  { icon: MdAcUnit, name: 'AC Repair', desc: 'AC installation, gas refilling, servicing, cooling issues diagnosis.', color: '#6366f1', id: 'ac-repair' },
  { icon: MdBuild, name: 'Appliance Repair', desc: 'Washing machine, refrigerator, microwave, geyser, TV repair.', color: '#8b5cf6', id: 'appliance-repair' },
  { icon: MdSpa, name: 'Gardening', desc: 'Lawn maintenance, plant care, garden design, tree trimming.', color: '#16a34a', id: 'gardening' },
]

const ServicesPage = () => {
  const navigate = useNavigate()

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="overline"
            sx={{ color: '#6366f1', fontWeight: 700, letterSpacing: 2 }}
          >
            What We Offer
          </Typography>
          <Typography variant="h3" fontWeight={900} mt={1} mb={2}>
            Our Services
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth={560} mx="auto">
            From electrical repairs to deep cleaning — OneDW connects you with
            verified professionals for all your home service needs.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {SERVICES_LIST.map((svc, i) => {
            const Icon = svc.icon
            return (
              <Grid item xs={12} sm={6} md={4} key={svc.id}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -6 }}
                >
                  <Paper
                    sx={{
                      p: 3.5,
                      borderRadius: 4,
                      height: '100%',
                      border: `1px solid ${svc.color}22`,
                      boxShadow: `0 4px 24px ${svc.color}15`,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: `0 12px 40px ${svc.color}30`,
                        borderColor: svc.color,
                      },
                    }}
                    onClick={() => navigate(`/create-request?category=${svc.id}`)}
                  >
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${svc.color}, ${svc.color}aa)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        boxShadow: `0 8px 20px ${svc.color}40`,
                      }}
                    >
                      <Icon color="white" size={28} />
                    </Box>
                    <Typography variant="h6" fontWeight={800} mb={1}>
                      {svc.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {svc.desc}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{
                        borderRadius: 2,
                        borderColor: svc.color,
                        color: svc.color,
                        fontWeight: 700,
                        '&:hover': { background: `${svc.color}11`, borderColor: svc.color },
                      }}
                    >
                      Book Now →
                    </Button>
                  </Paper>
                </motion.div>
              </Grid>
            )
          })}
        </Grid>

        {/* CTA */}
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h5" fontWeight={800} mb={2}>
            Don't see your service?
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Contact us and we'll connect you with the right professional.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/create-request')}
            sx={{
              borderRadius: 2,
              py: 1.5,
              px: 5,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' },
            }}
          >
            Request Custom Service
          </Button>
        </Box>
      </motion.div>
    </Container>
  )
}

export default ServicesPage
