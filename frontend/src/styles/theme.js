import { createTheme } from '@mui/material/styles'

const baseTypography = {
  fontFamily: "'Inter', 'Poppins', sans-serif",
  h1: { fontFamily: "'Poppins', sans-serif", fontWeight: 700 },
  h2: { fontFamily: "'Poppins', sans-serif", fontWeight: 700 },
  h3: { fontFamily: "'Poppins', sans-serif", fontWeight: 600 },
  h4: { fontFamily: "'Poppins', sans-serif", fontWeight: 600 },
  h5: { fontFamily: "'Poppins', sans-serif", fontWeight: 600 },
  h6: { fontFamily: "'Poppins', sans-serif", fontWeight: 600 },
  button: { textTransform: 'none', fontWeight: 600 },
}

const componentOverrides = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        padding: '10px 24px',
        boxShadow: 'none',
        '&:hover': { boxShadow: 'none' },
      },
      containedPrimary: {
        '&:hover': { backgroundColor: '#1D4ED8' },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 8, fontWeight: 500 },
    },
  },
}

export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: { main: '#2563EB' },
      secondary: { main: '#10B981' },
      warning: { main: '#F59E0B' },
      success: { main: '#22C55E' },
      error: { main: '#EF4444' },
      background: {
        default: mode === 'light' ? '#F8FAFC' : '#0F172A',
        paper: mode === 'light' ? '#FFFFFF' : '#1E293B',
      },
      text: {
        primary: mode === 'light' ? '#1E293B' : '#F1F5F9',
      },
    },
    typography: baseTypography,
    shape: { borderRadius: 12 },
    components: componentOverrides,
  })