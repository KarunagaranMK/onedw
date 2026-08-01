import { createTheme, alpha } from '@mui/material/styles'

// ── Premium OneDW Design System ───────────────────────────────────────────────
// Color palette: Urban Company / Airbnb inspired
// Primary: #2563EB (Blue) — trust, reliability
// Secondary: #14B8A6 (Teal) — fresh, modern
// Accent: #F59E0B (Amber) — attention, warmth

const P = {
  primary:       '#2563EB',
  primaryDark:   '#1d4ed8',
  primaryLight:  '#3b82f6',
  primaryXLight: '#dbeafe',
  secondary:     '#14B8A6',
  secondaryDark: '#0d9488',
  accent:        '#F59E0B',
  accentDark:    '#d97706',
  success:       '#22C55E',
  error:         '#EF4444',
  warning:       '#F59E0B',
  bgLight:       '#F8FAFC',
  bgDark:        '#060612',
  surfaceLight:  '#FFFFFF',
  surfaceDark:   '#0f172a',
}

// ─── Typography ───────────────────────────────────────────────────────────────

const baseTypography = {
  fontFamily: "'Inter', 'Plus Jakarta Sans', 'Nunito', system-ui, sans-serif",
  h1: { fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1 },
  h2: { fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 },
  h3: { fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.25 },
  h4: { fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.3 },
  h5: { fontWeight: 700, letterSpacing: '-0.01em' },
  h6: { fontWeight: 700 },
  subtitle1: { fontWeight: 600, lineHeight: 1.5 },
  subtitle2: { fontWeight: 600, lineHeight: 1.5 },
  body1: { fontWeight: 400, lineHeight: 1.75 },
  body2: { fontWeight: 400, lineHeight: 1.65 },
  button: { textTransform: 'none', fontWeight: 700, letterSpacing: 0 },
  caption: { fontWeight: 500, lineHeight: 1.5 },
  overline: { fontWeight: 700, letterSpacing: '0.1em', lineHeight: 1.5 },
}

// ─── Component overrides ──────────────────────────────────────────────────────

const makeComponents = (mode) => {
  const isDark = mode === 'dark'
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'

  return {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        body {
          font-family: 'Inter', system-ui, sans-serif !important;
          -webkit-font-smoothing: antialiased;
        }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: ${isDark ? '#334155' : '#cbd5e1'};
          border-radius: 10px;
        }
        * { box-sizing: border-box; }
      `,
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          backdropFilter: 'blur(24px)',
          backgroundColor: isDark ? 'rgba(6,6,18,0.92)' : 'rgba(255,255,255,0.94)',
          borderBottom: `1px solid ${borderCol}`,
          color: isDark ? '#f1f5f9' : '#0f172a',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 700,
          textTransform: 'none',
          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: 'none',
          '&:active': { transform: 'scale(0.98)' },
        },
        contained: {
          background: `linear-gradient(135deg, ${P.primary}, ${P.primaryLight})`,
          boxShadow: `0 4px 14px ${alpha(P.primary, 0.3)}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${P.primaryDark}, ${P.primary})`,
            boxShadow: `0 6px 20px ${alpha(P.primary, 0.4)}`,
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          borderColor: isDark ? 'rgba(37,99,235,0.4)' : alpha(P.primary, 0.35),
          '&:hover': { borderWidth: 1.5, transform: 'translateY(-1px)' },
        },
        text: {
          '&:hover': { transform: 'translateY(-1px)' },
        },
        sizeLarge: { padding: '12px 28px', fontSize: 15 },
        sizeMedium: { padding: '9px 22px', fontSize: 14 },
        sizeSmall: { padding: '6px 16px', fontSize: 13 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backgroundImage: 'none',
          boxShadow: isDark
            ? '0 4px 20px rgba(0,0,0,0.35)'
            : '0 4px 20px rgba(15,23,42,0.06)',
          border: `1px solid ${borderCol}`,
          transition: 'transform 0.28s ease, box-shadow 0.28s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: isDark
              ? '0 16px 48px rgba(0,0,0,0.5)'
              : `0 16px 48px ${alpha(P.primary, 0.1)}`,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 20, backgroundImage: 'none' },
        elevation1: {
          boxShadow: isDark
            ? '0 4px 16px rgba(0,0,0,0.3)'
            : '0 4px 16px rgba(15,23,42,0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'box-shadow 0.2s',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(P.primary, 0.5),
            },
            '&.Mui-focused': {
              boxShadow: `0 0 0 3px ${alpha(P.primary, 0.12)}`,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: P.primary,
              borderWidth: 2,
            },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: P.primary },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 24, backgroundImage: 'none' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: isDark ? '#1e293b' : '#0f172a',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, fontSize: 14 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 8 },
        bar: { borderRadius: 8 },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { fontWeight: 800 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12, fontWeight: 500 },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: { fontWeight: 700 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundImage: 'none' },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: borderCol },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.2s',
        },
      },
    },
    MuiStepper: {
      styleOverrides: { root: { padding: 0 } },
    },
  }
}

// ─── Theme factory ────────────────────────────────────────────────────────────

export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main:         P.primary,
        dark:         P.primaryDark,
        light:        P.primaryLight,
        contrastText: '#ffffff',
      },
      secondary: {
        main:         P.secondary,
        dark:         P.secondaryDark,
        light:        '#5eead4',
        contrastText: '#ffffff',
      },
      success:  { main: P.success },
      error:    { main: P.error },
      warning:  { main: P.warning },
      info:     { main: P.primaryLight },
      background: {
        default: mode === 'light' ? P.bgLight : P.bgDark,
        paper:   mode === 'light' ? P.surfaceLight : P.surfaceDark,
      },
      text: {
        primary:   mode === 'light' ? '#0f172a' : '#f1f5f9',
        secondary: mode === 'light' ? '#475569' : '#94a3b8',
        disabled:  mode === 'light' ? '#94a3b8' : '#64748b',
      },
      divider: mode === 'light' ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.07)',
    },
    typography: baseTypography,
    shape: { borderRadius: 12 },
    components: makeComponents(mode),
    shadows: [
      'none',
      mode === 'light'
        ? '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)'
        : '0 1px 3px rgba(0,0,0,0.4)',
      mode === 'light'
        ? '0 4px 8px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)'
        : '0 4px 8px rgba(0,0,0,0.3)',
      mode === 'light'
        ? '0 8px 16px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)'
        : '0 8px 16px rgba(0,0,0,0.3)',
      mode === 'light'
        ? '0 16px 32px rgba(0,0,0,0.07), 0 8px 10px rgba(0,0,0,0.04)'
        : '0 16px 32px rgba(0,0,0,0.35)',
      ...Array(20).fill(
        mode === 'light'
          ? '0 24px 48px rgba(0,0,0,0.08)'
          : '0 24px 48px rgba(0,0,0,0.4)'
      ),
    ],
  })