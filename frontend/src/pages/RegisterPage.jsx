import { useState } from 'react'
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link as MuiLink,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import { motion } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const RegisterPage = () => {
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') === 'worker' ? 'worker' : 'customer'

  const [role, setRole] = useState(defaultRole)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  if (!formData.name.trim()) {
    setError("Please enter your full name.");
    return;
  }

  if (!formData.email.trim()) {
    setError("Please enter your email.");
    return;
  }

  if (!formData.phone.trim()) {
    setError("Please enter your phone number.");
    return;
  }

  if (formData.password.length < 6) {
    setError("Password must be at least 6 characters.");
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    setError("Passwords do not match.");
    return;
  }

  setLoading(true);

  try {
    const userData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      password: formData.password,
      role,
    };

    console.log("Register Request:", userData);

    const response = await register(userData);

    console.log("Register Success:", response);

    navigate("/dashboard");
  } catch (err) {
    console.error("Register Error:", err);

    const errorMessage =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message ||
      "Registration failed. Please try again.";

    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Paper sx={{ p: { xs: 3, sm: 5 } }}>
          <Typography variant="h4" fontWeight={700} mb={1} textAlign="center">
            Create Your Account
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mb={4}
          >
            Join OneDW as a customer or a professional
          </Typography>

          <ToggleButtonGroup
            value={role}
            exclusive
            onChange={(_, val) => val && setRole(val)}
            fullWidth
            sx={{ mb: 4 }}
          >
            <ToggleButton value="customer">I need a service</ToggleButton>
            <ToggleButton value="worker">I'm a professional</ToggleButton>
          </ToggleButtonGroup>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              sx={{ mb: 4 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mb: 3 }}
            >
              {loading ? 'Creating account...' : 'Register'}
            </Button>

            <Typography variant="body2" textAlign="center" color="text.secondary">
              Already have an account?{' '}
              <MuiLink component={Link} to="/login" fontWeight={600}>
                Login
              </MuiLink>
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  )
}

export default RegisterPage