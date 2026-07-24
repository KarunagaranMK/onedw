import { useState, useEffect } from 'react'
import {
  Container, Typography, Box, Paper, Grid, Button, Divider,
  Chip, CircularProgress, Alert, Radio, RadioGroup,
  FormControlLabel, FormControl, FormLabel, Avatar, TextField,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MdPayment, MdCurrencyRupee, MdReceipt, MdCheckCircle,
  MdPhone, MdCreditCard, MdAccountBalanceWallet,
} from 'react-icons/md'
import { getInvoice, createPayment, getPaymentForBooking } from '../services/notifOtpPaymentService'

const METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash', icon: <MdCurrencyRupee />, desc: 'Pay in hand to worker' },
  { value: 'upi', label: 'UPI', icon: <MdPhone />, desc: 'Pay via UPI (GPay, PhonePe, Paytm)' },
  { value: 'card', label: 'Card', icon: <MdCreditCard />, desc: 'Debit / Credit card' },
  { value: 'wallet', label: 'Wallet', icon: <MdAccountBalanceWallet />, desc: 'OneDW Wallet balance' },
]

export default function PaymentPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [existingPayment, setExistingPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [method, setMethod] = useState('cash')
  const [upiId, setUpiId] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [inv, pay] = await Promise.all([
          getInvoice(bookingId),
          getPaymentForBooking(bookingId),
        ])
        setInvoice(inv)
        if (pay?.status === 'completed') setExistingPayment(pay)
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load invoice.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [bookingId])

  const handlePay = async () => {
    setPaying(true)
    setError('')
    try {
      await createPayment(bookingId, invoice.total, method, upiId ? `UPI ID: ${upiId}` : '')
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment failed. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">Loading invoice…</Typography>
      </Box>
    )
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          <Box sx={{
            width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(16,185,129,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3,
          }}>
            <MdCheckCircle size={60} color="#10b981" />
          </Box>
          <Typography variant="h4" fontWeight={900} mb={1}>Payment Successful! 🎉</Typography>
          <Typography color="text.secondary" mb={1}>
            ₹{invoice?.total} paid via {method.toUpperCase()}
          </Typography>
          <Typography variant="caption" color="text.secondary" mb={4} display="block">
            Invoice #{invoice?.invoice_number}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/customer-dashboard')}
            sx={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontWeight: 700, borderRadius: 2 }}>
            Back to Dashboard
          </Button>
        </motion.div>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Typography variant="h4" fontWeight={900} mb={3}>
          <MdPayment style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Payment & Invoice
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {existingPayment ? (
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ This booking has already been paid via <strong>{existingPayment.method?.toUpperCase()}</strong>
          </Alert>
        ) : null}

        <Grid container spacing={3}>
          {/* Invoice */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.12)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>Invoice</Typography>
                  <Typography variant="caption" color="text.secondary">#{invoice?.invoice_number}</Typography>
                </Box>
                <Chip label={invoice?.payment_status === 'paid' ? '✅ Paid' : '🔴 Unpaid'}
                  color={invoice?.payment_status === 'paid' ? 'success' : 'error'} size="small" />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={1} mb={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Customer</Typography>
                  <Typography variant="body2" fontWeight={700}>{invoice?.customer_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Worker</Typography>
                  <Typography variant="body2" fontWeight={700}>{invoice?.worker_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Service</Typography>
                  <Typography variant="body2" fontWeight={700}>{invoice?.service_type}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Date</Typography>
                  <Typography variant="body2" fontWeight={700}>{invoice?.service_date}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Line Items */}
              {invoice?.items?.map((item, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                  <Typography variant="body2" fontWeight={600}>₹{item.amount}</Typography>
                </Box>
              ))}

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2">₹{invoice?.subtotal}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary">Platform Fee (10%)</Typography>
                <Typography variant="body2">₹{invoice?.platform_fee}</Typography>
              </Box>

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                <Typography variant="h6" fontWeight={900}>Total</Typography>
                <Typography variant="h6" fontWeight={900} color="#6366f1">₹{invoice?.total}</Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Payment Method */}
          <Grid item xs={12} md={5}>
            {!existingPayment && (
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(99,102,241,0.12)' }}>
                <Typography variant="h6" fontWeight={800} mb={2}>
                  <MdReceipt style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Pay ₹{invoice?.total}
                </Typography>

                <FormControl fullWidth>
                  <FormLabel sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>Payment Method</FormLabel>
                  <RadioGroup value={method} onChange={(e) => setMethod(e.target.value)}>
                    {METHOD_OPTIONS.map((m) => (
                      <Paper key={m.value} sx={{
                        mb: 1.5, px: 2, py: 1.5, borderRadius: 2, cursor: 'pointer',
                        border: `2px solid ${method === m.value ? '#6366f1' : 'rgba(0,0,0,0.1)'}`,
                        transition: 'all 0.2s ease',
                        background: method === m.value ? 'rgba(99,102,241,0.04)' : 'transparent',
                      }} onClick={() => setMethod(m.value)}>
                        <FormControlLabel
                          value={m.value}
                          control={<Radio sx={{ color: '#6366f1', '&.Mui-checked': { color: '#6366f1' } }} />}
                          label={
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ color: '#6366f1' }}>{m.icon}</Box>
                                <Typography variant="body2" fontWeight={700}>{m.label}</Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">{m.desc}</Typography>
                            </Box>
                          }
                          sx={{ m: 0, width: '100%' }}
                        />
                      </Paper>
                    ))}
                  </RadioGroup>
                </FormControl>

                {method === 'upi' && (
                  <TextField
                    fullWidth
                    size="small"
                    label="UPI ID"
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    sx={{ mt: 1, mb: 2 }}
                  />
                )}

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={paying}
                  onClick={handlePay}
                  sx={{
                    mt: 2, fontWeight: 800, borderRadius: 2, py: 1.5,
                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    '&:hover': { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' },
                  }}
                >
                  {paying ? <CircularProgress size={22} color="inherit" /> : `Pay ₹${invoice?.total}`}
                </Button>
              </Paper>
            )}
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  )
}
