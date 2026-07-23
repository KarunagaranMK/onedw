import { useState } from 'react'
import {
  Container, Typography, Grid, Paper, Box, TextField, Button,
  Snackbar, Alert, Divider,
} from '@mui/material'
import { motion } from 'framer-motion'
import { MdEmail, MdPhone, MdLocationOn, MdSend } from 'react-icons/md'

const CONTACT_INFO = [
  { icon: MdEmail, label: 'Email', value: 'support@onedw.in', href: 'mailto:support@onedw.in' },
  { icon: MdPhone, label: 'Phone', value: '+91 98765 43210', href: 'tel:+919876543210' },
  { icon: MdLocationOn, label: 'Office', value: 'White Town, Puducherry, India 605001', href: null },
]

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      setForm({ name: '', email: '', subject: '', message: '' })
    }, 1000)
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="overline" sx={{ color: '#6366f1', fontWeight: 700, letterSpacing: 2 }}>
            Get In Touch
          </Typography>
          <Typography variant="h3" fontWeight={900} mt={1} mb={2}>
            Contact Us
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth={500} mx="auto">
            Have a question, complaint, or partnership inquiry? Our team responds within 24 hours.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Contact Info */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {CONTACT_INFO.map((info) => {
                const Icon = info.icon
                return (
                  <motion.div key={info.label} whileHover={{ x: 4 }}>
                    <Paper
                      sx={{
                        p: 2.5, borderRadius: 3,
                        display: 'flex', alignItems: 'center', gap: 2,
                        border: '1px solid rgba(99,102,241,0.12)',
                        cursor: info.href ? 'pointer' : 'default',
                        '&:hover': info.href ? { borderColor: '#6366f1', boxShadow: '0 4px 20px rgba(99,102,241,0.12)' } : {},
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => info.href && window.open(info.href, '_blank')}
                    >
                      <Box
                        sx={{
                          width: 48, height: 48, borderRadius: 2, flexShrink: 0,
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Icon color="white" size={22} />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">{info.label}</Typography>
                        <Typography variant="body2" fontWeight={600}>{info.value}</Typography>
                      </Box>
                    </Paper>
                  </motion.div>
                )
              })}

              {/* Office hours */}
              <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(99,102,241,0.12)' }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>🕐 Office Hours</Typography>
                {[
                  ['Monday – Friday', '9:00 AM – 6:00 PM'],
                  ['Saturday', '10:00 AM – 4:00 PM'],
                  ['Sunday', 'Closed'],
                ].map(([day, time]) => (
                  <Box key={day} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <Typography variant="caption" color="text.secondary">{day}</Typography>
                    <Typography variant="caption" fontWeight={600}>{time}</Typography>
                  </Box>
                ))}
              </Paper>
            </Box>
          </Grid>

          {/* Contact Form */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid rgba(99,102,241,0.15)', boxShadow: '0 8px 40px rgba(99,102,241,0.08)' }}>
              <Typography variant="h5" fontWeight={800} mb={3}>Send Us a Message</Typography>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Your Name"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Subject"
                      name="subject"
                      required
                      value={form.subject}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={5}
                      label="Message"
                      name="message"
                      required
                      placeholder="Describe your issue or inquiry in detail..."
                      value={form.message}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading}
                      endIcon={<MdSend />}
                      sx={{
                        borderRadius: 2, py: 1.5, px: 4, fontWeight: 800,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' },
                      }}
                    >
                      {loading ? 'Sending...' : 'Send Message'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>

      <Snackbar
        open={submitted}
        autoHideDuration={5000}
        onClose={() => setSubmitted(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          ✅ Message sent! We'll get back to you within 24 hours.
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default ContactPage
