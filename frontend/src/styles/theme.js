import { createTheme, alpha } from '@mui/material/styles'

// ── Premium Color Palette (Urban Company / Airbnb inspired) ─────────────────
const BRAND = {
  primary:    '#6C47FF',   // vibrant indigo-violet
  primary2:   '#9B72FF',   // lighter violet
  secondary:  '#00D4AA',   // teal-green
  accent:     '#FF6B6B',   // coral red
  gold:       '#FFB800',   // amber
  dark:       '#0A0A1A',   // deep dark
  navy:       '#111827',
  surface:    '#F8FAFC',   // professional off-white ⭐
}

const baseTypography = {
  fontFamily: "'Plus Jakarta Sans', 'Inter', 'Poppins', sans-serif",
  h1: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, letterSpacing: '-0.025em' },
  h2: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, letterSpacing: '-0.02em' },
  h3: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: '-0.015em' },
  h4: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: '-0.01em' },
  h5: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 },
  h6: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 },
  subtitle1: { fontWeight: 600 },
  subtitle2: { fontWeight: 600 },
  body1: { fontWeight: 400, lineHeight: 1.7 },
  body2: { fontWeight: 400, lineHeight: 1.6 },
  button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em' },
  caption: { fontWeight: 500 },
}

const makeComponents = (mode) => ({
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        padding: '10px 24px',
        boxShadow: 'none',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        '&:hover': {
          boxShadow: '0 4px 20px rgba(108,71,255,0.3)',
          transform: 'translateY(-1px)',
        },
        '&:active': { transform: 'translateY(0px)' },
      },
      containedPrimary: {
        background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primary2} 100%)`,
        '&:hover': {
          background: `linear-gradient(135deg, #5a38e8 0%, #8660e8 100%)`,
        },
      },
      containedSecondary: {
        background: `linear-gradient(135deg, ${BRAND.secondary} 0%, #00B894 100%)`,
      },
      outlined: {
        borderWidth: '1.5px',
        '&:hover': { borderWidth: '1.5px' },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 20,
        boxShadow: mode === 'light'
          ? '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)'
          : '0 1px 3px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: mode === 'light'
            ? '0 12px 40px rgba(108,71,255,0.12)'
            : '0 12px 40px rgba(108,71,255,0.25)',
        },
        border: `1px solid ${mode === 'light' ? 'rgba(108,71,255,0.08)' : 'rgba(255,255,255,0.06)'}`,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 20,
        backgroundImage: 'none',
      },
      elevation1: {
        boxShadow: mode === 'light'
          ? '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)'
          : '0 1px 3px rgba(0,0,0,0.3)',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        fontWeight: 600,
        fontSize: '0.75rem',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 12,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: BRAND.primary,
            borderWidth: 2,
          },
        },
      },
    },
  },
  MuiSelect: {
    styleOverrides: {
      root: { borderRadius: 12 },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: { borderRadius: 8, height: 6 },
      bar: { borderRadius: 8 },
    },
  },
  MuiStepper: {
    styleOverrides: { root: { padding: 0 } },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: 'none',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${mode === 'light' ? 'rgba(108,71,255,0.08)' : 'rgba(255,255,255,0.06)'}`,
        backgroundColor: mode === 'light'
          ? 'rgba(255,255,255,0.85)'
          : 'rgba(17,24,39,0.85)',
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: { fontWeight: 800 },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: { borderRadius: 8, fontSize: '0.75rem', fontWeight: 500 },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: { borderRadius: 0 },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: { borderRadius: 24 },
    },
  },
  MuiBadge: {
    styleOverrides: {
      badge: { fontWeight: 700 },
    },
  },
})

export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: BRAND.primary,
        light: BRAND.primary2,
        dark: '#4a28e0',
        contrastText: '#ffffff',
      },
      secondary: {
        main: BRAND.secondary,
        light: '#33DDBA',
        dark: '#00A884',
        contrastText: '#ffffff',
      },
      warning:  { main: BRAND.gold },
      success:  { main: '#22C55E' },
      error:    { main: '#FF4757' },
      info:     { main: '#3B82F6' },
      background: {
        default: mode === 'light' ? '#F8FAFC' : '#080812',
        paper:   mode === 'light' ? '#FFFFFF'  : '#111827',
      },
      text: {
        primary:   mode === 'light' ? '#0F172A' : '#F9FAFB',
        secondary: mode === 'light' ? '#64748B' : '#9CA3AF',
        disabled:  mode === 'light' ? '#CBD5E1' : '#4B5563',
      },
      divider: mode === 'light' ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.08)',
    },
    typography: baseTypography,
    shape: { borderRadius: 12 },
    components: makeComponents(mode),
    shadows: [
      'none',
      mode === 'light'
        ? '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)'
        : '0 1px 3px rgba(0,0,0,0.4)',
      mode === 'light'
        ? '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)'
        : '0 4px 6px rgba(0,0,0,0.3)',
      mode === 'light'
        ? '0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)'
        : '0 10px 15px rgba(0,0,0,0.3)',
      ...Array(21).fill(
        mode === 'light'
          ? '0 20px 25px rgba(0,0,0,0.07), 0 10px 10px rgba(0,0,0,0.04)'
          : '0 20px 25px rgba(0,0,0,0.35)'
      ),
    ],
  })