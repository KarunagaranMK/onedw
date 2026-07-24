import { useState } from 'react'
import {
  AppBar, Toolbar, Box, Button, IconButton,
  Drawer, List, ListItemButton, ListItemText,
  useMediaQuery, useTheme, Avatar, Menu, MenuItem,
  Divider, Typography, Chip,
} from '@mui/material'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdMenu, MdDarkMode, MdLightMode, MdClose, MdDashboard,
  MdLogout, MdPerson, MdSearch, MdKeyboardArrowDown,
} from 'react-icons/md'
import { useThemeMode } from '../../contexts/ThemeContext'
import { useAuth } from '../../hooks/useAuth'
import NotificationBell from '../common/NotificationBell'

const NAV_LINKS = [
  { label: 'Find Professionals', to: '/workers' },
  { label: 'How It Works', to: '/#how-it-works' },
  { label: 'About', to: '/about' },
]

export default function Navbar() {
  const { mode, toggleTheme } = useThemeMode()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState(null)

  const handleLogout = () => {
    setMenuAnchor(null)
    logout()
    navigate('/')
  }

  const dashboardPath = user?.role === 'worker' ? '/worker-dashboard'
    : user?.role === 'admin' ? '/admin'
    : '/customer-dashboard'

  const isDark = mode === 'dark'

  return (
    <>
      <AppBar position="fixed" elevation={0} sx={{
        zIndex: 1200,
        bgcolor: isDark ? 'rgba(8,8,18,0.95)' : 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(20px)',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(15,23,42,0.08)',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 2px 12px rgba(15,23,42,0.06)',
      }}>
        <Toolbar sx={{ px: { xs: 2, md: 4 }, py: 1, minHeight: { xs: 64, md: 72 } }}>
          {/* Logo */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              textDecoration: 'none', mr: { xs: 'auto', md: 4 },
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="OneDW"
              sx={{
                height: { xs: 36, md: 44 },
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </Box>

          {/* Desktop Nav Links */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
              {NAV_LINKS.map((link) => {
                const active = location.pathname === link.to
                return (
                  <Button
                    key={link.to}
                    component={Link}
                    to={link.to}
                    sx={{
                      px: 2, py: 1, borderRadius: 2, fontWeight: 600, fontSize: 14,
                      color: active ? 'primary.main' : 'text.secondary',
                      bgcolor: active ? 'rgba(108,71,255,0.08)' : 'transparent',
                      '&:hover': { bgcolor: 'rgba(108,71,255,0.08)', color: 'primary.main' },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {link.label}
                  </Button>
                )
              })}
            </Box>
          )}

          {/* Right Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 }, ml: 'auto' }}>
            {/* Search icon mobile */}
            {isMobile && (
              <IconButton onClick={() => navigate('/workers')} sx={{ color: 'text.secondary' }}>
                <MdSearch size={22} />
              </IconButton>
            )}

            {/* Theme toggle */}
            <IconButton
              onClick={toggleTheme}
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderRadius: 2, '&:hover': { bgcolor: 'rgba(108,71,255,0.12)' },
              }}
            >
              {isDark
                ? <MdLightMode size={20} color="#FFB800" />
                : <MdDarkMode size={20} color="#6C47FF" />}
            </IconButton>

            {user && <NotificationBell />}

            {!isMobile && (
              user ? (
                <>
                  <Button
                    component={Link}
                    to={dashboardPath}
                    startIcon={<MdDashboard />}
                    sx={{
                      fontWeight: 700, borderRadius: 2, px: 2,
                      color: 'text.primary',
                      '&:hover': { bgcolor: 'rgba(108,71,255,0.08)' },
                    }}
                  >
                    Dashboard
                  </Button>

                  {/* User Avatar Menu */}
                  <Box
                    onClick={(e) => setMenuAnchor(e.currentTarget)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                      px: 1.5, py: 0.75, borderRadius: 3,
                      border: '1px solid rgba(108,71,255,0.2)',
                      '&:hover': { bgcolor: 'rgba(108,71,255,0.06)' },
                      transition: 'all 0.2s',
                    }}
                  >
                    <Avatar sx={{ width: 30, height: 30, background: 'linear-gradient(135deg,#6C47FF,#9B72FF)', fontSize: 13, fontWeight: 800 }}>
                      {(user.name || user.email || 'U')[0].toUpperCase()}
                    </Avatar>
                    <Typography variant="caption" fontWeight={700} sx={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name?.split(' ')[0] || 'Account'}
                    </Typography>
                    <MdKeyboardArrowDown size={16} />
                  </Box>

                  <Menu
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={() => setMenuAnchor(null)}
                    PaperProps={{
                      sx: {
                        borderRadius: 3, mt: 1, minWidth: 200,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                        border: '1px solid rgba(108,71,255,0.1)',
                      },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={800}>{user.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                      <Chip
                        label={user.role}
                        size="small"
                        sx={{ mt: 0.5, bgcolor: 'rgba(108,71,255,0.1)', color: 'primary.main', fontWeight: 700, textTransform: 'capitalize' }}
                      />
                    </Box>
                    <Divider />
                    <MenuItem onClick={() => { setMenuAnchor(null); navigate(dashboardPath) }} sx={{ gap: 1.5, py: 1.5 }}>
                      <MdDashboard size={18} color="#6C47FF" />
                      <Typography variant="body2" fontWeight={600}>Dashboard</Typography>
                    </MenuItem>
                    <MenuItem onClick={() => { setMenuAnchor(null); navigate('/profile') }} sx={{ gap: 1.5, py: 1.5 }}>
                      <MdPerson size={18} color="#6C47FF" />
                      <Typography variant="body2" fontWeight={600}>Profile</Typography>
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1.5, color: 'error.main' }}>
                      <MdLogout size={18} />
                      <Typography variant="body2" fontWeight={700} color="error">Logout</Typography>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    component={Link}
                    to="/login"
                    variant="outlined"
                    sx={{
                      borderRadius: 2, fontWeight: 700, px: 2.5,
                      borderColor: 'rgba(108,71,255,0.3)',
                      color: 'primary.main',
                      '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(108,71,255,0.06)' },
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    component={Link}
                    to="/register"
                    variant="contained"
                    sx={{ borderRadius: 2, fontWeight: 700, px: 2.5 }}
                  >
                    Get Started
                  </Button>
                </Box>
              )
            )}

            {/* Mobile hamburger */}
            {isMobile && (
              <IconButton onClick={() => setDrawerOpen(true)} sx={{ ml: 0.5 }}>
                <MdMenu size={24} />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Spacer to push content below fixed Navbar */}
      <Toolbar sx={{ minHeight: { xs: 64, md: 72 } }} />

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 300, borderRadius: '20px 0 0 20px',
            pt: 2,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, pb: 2 }}>
          <Typography variant="h6" fontWeight={900} sx={{ background: 'linear-gradient(135deg,#6C47FF,#9B72FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            OneDW
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <MdClose />
          </IconButton>
        </Box>

        <Divider />

        {user && (
          <Box sx={{ px: 2.5, py: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Avatar sx={{ background: 'linear-gradient(135deg,#6C47FF,#9B72FF)', fontWeight: 800 }}>
              {(user.name || 'U')[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={800}>{user.name}</Typography>
              <Chip label={user.role} size="small" sx={{ bgcolor: 'rgba(108,71,255,0.1)', color: 'primary.main', fontWeight: 700, textTransform: 'capitalize', fontSize: 10 }} />
            </Box>
          </Box>
        )}

        <List sx={{ px: 1.5 }}>
          {NAV_LINKS.map((link) => (
            <ListItemButton
              key={link.to}
              component={Link}
              to={link.to}
              onClick={() => setDrawerOpen(false)}
              sx={{ borderRadius: 2, mb: 0.5, fontWeight: 600 }}
            >
              <ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: 600, fontSize: 15 }} />
            </ListItemButton>
          ))}

          {user ? (
            <>
              <Divider sx={{ my: 1 }} />
              <ListItemButton component={Link} to={dashboardPath} onClick={() => setDrawerOpen(false)} sx={{ borderRadius: 2, mb: 0.5 }}>
                <ListItemText primary="Dashboard" primaryTypographyProps={{ fontWeight: 700, color: 'primary.main' }} />
              </ListItemButton>
              <ListItemButton onClick={() => { setDrawerOpen(false); handleLogout() }} sx={{ borderRadius: 2, color: 'error.main' }}>
                <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 700, color: 'error.main' }} />
              </ListItemButton>
            </>
          ) : (
            <>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ px: 1, pt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button component={Link} to="/login" variant="outlined" fullWidth onClick={() => setDrawerOpen(false)} sx={{ borderRadius: 2, fontWeight: 700 }}>
                  Login
                </Button>
                <Button component={Link} to="/register" variant="contained" fullWidth onClick={() => setDrawerOpen(false)} sx={{ borderRadius: 2, fontWeight: 700 }}>
                  Get Started
                </Button>
              </Box>
            </>
          )}
        </List>
      </Drawer>
    </>
  )
}