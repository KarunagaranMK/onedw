import { useState, useEffect } from 'react'
import {
  AppBar, Toolbar, Box, Button, IconButton,
  Drawer, List, ListItemButton, ListItemText,
  useMediaQuery, useTheme, Avatar, Menu, MenuItem,
  Divider, Typography, Chip, Badge, Tooltip,
} from '@mui/material'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdMenu, MdDarkMode, MdLightMode, MdClose, MdDashboard,
  MdLogout, MdPerson, MdSearch, MdKeyboardArrowDown,
  MdAccountBalanceWallet, MdNotifications, MdMessage,
  MdWork, MdStar, MdArrowForward, MdHome, MdLoyalty,
} from 'react-icons/md'
import { useThemeMode } from '../../contexts/ThemeContext'
import { useAuth } from '../../hooks/useAuth'
import chatService from '../../services/chatService'
import { getUnreadCount } from '../../services/notifOtpPaymentService'
import NotificationCenter from '../common/NotificationCenter'

const NAV_LINKS = [
  { label: 'Find Professionals', to: '/workers', icon: <MdSearch size={16} /> },
  { label: 'Services', to: '/services', icon: <MdWork size={16} /> },
  { label: 'Reviews', to: '/reviews', icon: <MdStar size={16} /> },
  { label: 'About', to: '/about', icon: <MdHome size={16} /> },
]

export default function Navbar() {
  const { mode, toggleTheme } = useThemeMode()
  const { user, logout } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const theme      = useTheme()
  const isMobile   = useMediaQuery(theme.breakpoints.down('md'))
  const isDark     = mode === 'dark'

  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [menuAnchor, setMenuAnchor]     = useState(null)
  const [scrolled, setScrolled]         = useState(false)
  const [unreadNotif, setUnreadNotif]   = useState(0)
  const [unreadMsg, setUnreadMsg]       = useState(0)
  const [notifOpen, setNotifOpen]       = useState(false)

  // Track scroll for shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Fetch unread counts (polling every 30s)
  useEffect(() => {
    if (!user) return
    const fetchCounts = async () => {
      try {
        const count = await getUnreadCount()
        setUnreadNotif(count)
      } catch (_) {}
      try {
        chatService.getUnreadCount()
          .then(r => setUnreadMsg(r.data?.count || 0))
          .catch(() => {})
        chatService.listSessions()
          .then(r => {
            const sessions = r.data || []
            const totalUnread = sessions.reduce((sum, s) => {
              return sum + (user.role === 'customer' ? (s.unread_customer || 0) : (s.unread_worker || 0))
            }, 0)
            setUnreadMsg(totalUnread)
          })
          .catch(() => {})
      } catch (_) {}
    }
    fetchCounts()
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [user, location])

  const handleLogout = () => {
    setMenuAnchor(null)
    setDrawerOpen(false)
    logout()
    navigate('/')
  }

  const dashboardPath = user?.role === 'worker' ? '/worker-dashboard'
    : user?.role === 'admin' ? '/admin'
    : '/customer-dashboard'

  const isLanding = location.pathname === '/'

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: 1200,
          transition: 'all 0.3s ease',
          boxShadow: scrolled
            ? (isDark ? '0 4px 30px rgba(0,0,0,0.5)' : '0 4px 30px rgba(15,23,42,0.1)')
            : 'none',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 4 }, py: 1, minHeight: { xs: 64, md: 72 }, gap: 2 }}>

          {/* ── Logo ───────────────────────────────────────────────── */}
          <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', flexShrink: 0 }}>
            <Box component="img" src="/logo.png" alt="OneDW" sx={{ height: { xs: 36, md: 42 }, width: 'auto', objectFit: 'contain' }} />
          </Box>

          {/* ── Desktop Nav Links ────────────────────────────────── */}
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
                      px: 1.75, py: 1, borderRadius: 2.5, fontWeight: 600, fontSize: 13.5,
                      color: active ? 'primary.main' : 'text.secondary',
                      bgcolor: active ? (isDark ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.07)') : 'transparent',
                      position: 'relative',
                      '&:hover': { bgcolor: isDark ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.06)', color: 'primary.main' },
                      '&::after': active ? {
                        content: '""', position: 'absolute', bottom: 4, left: '50%',
                        transform: 'translateX(-50%)', width: 16, height: 2, borderRadius: 1,
                        background: '#2563eb',
                      } : {},
                      transition: 'all 0.2s',
                    }}
                  >
                    {link.label}
                  </Button>
                )
              })}
            </Box>
          )}

          {/* ── Right Controls ─────────────────────────────────────── */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 0.75 }, ml: !isMobile ? 0 : 'auto' }}>

            {/* Search (mobile) */}
            {isMobile && (
              <IconButton onClick={() => navigate('/workers')} sx={{ color: 'text.secondary' }}>
                <MdSearch size={22} />
              </IconButton>
            )}

            {/* Theme toggle */}
            <Tooltip title={isDark ? 'Light mode' : 'Dark mode'}>
              <IconButton onClick={toggleTheme} sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
                borderRadius: 2.5, width: 38, height: 38,
                '&:hover': { bgcolor: isDark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.08)' },
                transition: 'all 0.2s',
              }}>
                {isDark
                  ? <MdLightMode size={18} style={{ color: '#f59e0b' }} />
                  : <MdDarkMode size={18} style={{ color: '#475569' }} />}
              </IconButton>
            </Tooltip>

            {user && (
              <>
                {/* Messages */}
                {!isMobile && (
                  <Tooltip title="Messages">
                    <IconButton component={Link} to="/chat" sx={{
                      bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
                      borderRadius: 2.5, width: 38, height: 38,
                      '&:hover': { bgcolor: isDark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.08)' },
                    }}>
                      <Badge badgeContent={unreadMsg} color="error" max={9}>
                        <MdMessage size={18} style={{ color: isDark ? '#94a3b8' : '#475569' }} />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                )}

                {/* Wallet */}
                {!isMobile && (
                  <Tooltip title="Wallet">
                    <IconButton component={Link} to="/wallet" sx={{
                      bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
                      borderRadius: 2.5, width: 38, height: 38,
                      '&:hover': { bgcolor: isDark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.08)' },
                    }}>
                      <MdAccountBalanceWallet size={18} style={{ color: isDark ? '#94a3b8' : '#475569' }} />
                    </IconButton>
                  </Tooltip>
                )}

                {/* Notifications */}
                {!isMobile && (
                  <Tooltip title="Notifications">
                    <IconButton
                      onClick={() => setNotifOpen(true)}
                      sx={{
                        bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
                        borderRadius: 2.5, width: 38, height: 38,
                        '&:hover': { bgcolor: isDark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.08)' },
                      }}
                    >
                      <Badge badgeContent={unreadNotif} color="error" max={9}>
                        <MdNotifications size={18} style={{ color: isDark ? '#94a3b8' : '#475569' }} />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}

            {!isMobile && (
              user ? (
                <>
                  {/* Dashboard button */}
                  <Button
                    component={Link} to={dashboardPath}
                    startIcon={<MdDashboard size={16} />}
                    sx={{
                      fontWeight: 700, borderRadius: 2.5, px: 2, fontSize: 13.5,
                      color: 'text.primary',
                      '&:hover': { bgcolor: isDark ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.06)', color: 'primary.main' },
                    }}
                  >
                    Dashboard
                  </Button>

                  {/* User menu trigger */}
                  <Box
                    onClick={(e) => setMenuAnchor(e.currentTarget)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                      px: 1.5, py: 0.75, borderRadius: 3,
                      border: `1.5px solid ${isDark ? 'rgba(37,99,235,0.25)' : 'rgba(37,99,235,0.2)'}`,
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.05)',
                        borderColor: '#2563eb',
                      },
                      transition: 'all 0.2s',
                    }}
                  >
                    <Avatar sx={{
                      width: 30, height: 30, fontSize: 13, fontWeight: 800,
                      background: 'linear-gradient(135deg, #2563eb, #14b8a6)',
                    }}>
                      {(user.name || user.email || 'U')[0].toUpperCase()}
                    </Avatar>
                    <Typography variant="caption" fontWeight={700} sx={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.primary' }}>
                      {user.name?.split(' ')[0] || 'Account'}
                    </Typography>
                    <MdKeyboardArrowDown size={16} color="#64748b" />
                  </Box>

                  {/* User dropdown */}
                  <Menu
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={() => setMenuAnchor(null)}
                    PaperProps={{
                      sx: {
                        borderRadius: 3, mt: 1.5, minWidth: 220,
                        boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.6)' : '0 20px 60px rgba(15,23,42,0.15)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}`,
                        overflow: 'visible',
                      },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    {/* User info header */}
                    <Box sx={{ px: 2.5, py: 2, background: isDark ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.04)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 40, height: 40, fontWeight: 800, fontSize: 16, background: 'linear-gradient(135deg, #2563eb, #14b8a6)' }}>
                          {(user.name || 'U')[0].toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={800} noWrap sx={{ maxWidth: 130 }}>{user.name}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 130, display: 'block' }}>{user.email}</Typography>
                          <Chip label={user.role} size="small" sx={{ mt: 0.5, height: 18, fontSize: 10, bgcolor: 'rgba(37,99,235,0.1)', color: 'primary.main', fontWeight: 700, textTransform: 'capitalize' }} />
                        </Box>
                      </Box>
                    </Box>
                    <Divider />
                    {[
                      { icon: <MdDashboard size={17} />, label: 'Dashboard', to: dashboardPath },
                      { icon: <MdPerson size={17} />, label: 'Profile', to: '/profile' },
                      { icon: <MdMessage size={17} />, label: 'Messages', to: '/chat', badge: unreadMsg },
                      { icon: <MdAccountBalanceWallet size={17} />, label: 'Wallet', to: '/wallet' },
                      ...(user?.role === 'customer' ? [{ icon: <MdLoyalty size={17} />, label: 'Loyalty Points', to: '/loyalty' }] : []),
                    ].map(({ icon, label, to, badge }) => (
                      <MenuItem key={to} onClick={() => { setMenuAnchor(null); navigate(to) }}
                        sx={{ gap: 1.5, py: 1.25, '&:hover': { bgcolor: isDark ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.05)' } }}>
                        <Box sx={{ color: 'primary.main' }}>{icon}</Box>
                        <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>{label}</Typography>
                        {badge > 0 && <Chip label={badge} size="small" color="error" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />}
                      </MenuItem>
                    ))}
                    <Divider />
                    <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1.25, color: 'error.main', '&:hover': { bgcolor: 'rgba(239,68,68,0.06)' } }}>
                      <MdLogout size={17} />
                      <Typography variant="body2" fontWeight={700} color="error">Logout</Typography>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button component={Link} to="/login" variant="outlined"
                    sx={{ borderRadius: 2.5, fontWeight: 700, px: 2.5, fontSize: 13.5 }}>
                    Login
                  </Button>
                  <Button component={Link} to="/register" variant="contained"
                    sx={{ borderRadius: 2.5, fontWeight: 700, px: 2.5, fontSize: 13.5 }}>
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

      {/* ── Notification Center Drawer ──────────────────────────────── */}
      {user && (
        <NotificationCenter
          open={notifOpen}
          onClose={() => setNotifOpen(false)}
          onUnreadChange={(count) => setUnreadNotif(count)}
        />
      )}

      {/* Spacer */}
      <Toolbar sx={{ minHeight: { xs: 64, md: 72 } }} />

      {/* ── Mobile Drawer ──────────────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 300,
            borderRadius: '20px 0 0 20px',
            background: isDark ? '#0f172a' : '#fff',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 2 }}>
          <Box component="img" src="/logo.png" alt="OneDW" sx={{ height: 36, width: 'auto' }} />
          <IconButton onClick={() => setDrawerOpen(false)}>
            <MdClose />
          </IconButton>
        </Box>

        {user && (
          <Box sx={{ mx: 2, mb: 2, p: 2, borderRadius: 3, background: isDark ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.06)', display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Avatar sx={{ background: 'linear-gradient(135deg, #2563eb, #14b8a6)', fontWeight: 800 }}>
              {(user.name || 'U')[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={800}>{user.name}</Typography>
              <Chip label={user.role} size="small" sx={{ bgcolor: 'rgba(37,99,235,0.1)', color: 'primary.main', fontWeight: 700, textTransform: 'capitalize', fontSize: 10 }} />
            </Box>
          </Box>
        )}

        <Divider sx={{ mx: 2 }} />

        <List sx={{ px: 1.5, pt: 1 }}>
          {NAV_LINKS.map(link => (
            <ListItemButton key={link.to} component={Link} to={link.to} onClick={() => setDrawerOpen(false)}
              selected={location.pathname === link.to}
              sx={{ borderRadius: 2.5, mb: 0.5, '&.Mui-selected': { bgcolor: 'rgba(37,99,235,0.08)', color: 'primary.main' } }}>
              <Box sx={{ mr: 1.5, color: location.pathname === link.to ? 'primary.main' : 'text.secondary' }}>{link.icon}</Box>
              <ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: 600, fontSize: 15 }} />
            </ListItemButton>
          ))}

          {user ? (
            <>
              <Divider sx={{ my: 1.5 }} />
              {[
                { label: 'Dashboard', to: dashboardPath, icon: <MdDashboard size={16} /> },
                { label: 'Messages', to: '/chat', icon: <MdMessage size={16} />, badge: unreadMsg },
                { label: 'Wallet', to: '/wallet', icon: <MdAccountBalanceWallet size={16} /> },
                { label: 'Profile', to: '/profile', icon: <MdPerson size={16} /> },
              ].map(({ label, to, icon, badge }) => (
                <ListItemButton key={to} component={Link} to={to} onClick={() => setDrawerOpen(false)} sx={{ borderRadius: 2.5, mb: 0.5 }}>
                  <Box sx={{ mr: 1.5, color: 'primary.main' }}>{icon}</Box>
                  <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 600, fontSize: 15, color: 'primary.main' }} />
                  {badge > 0 && <Chip label={badge} size="small" color="error" sx={{ height: 20, fontSize: 10, fontWeight: 700 }} />}
                </ListItemButton>
              ))}
              <Divider sx={{ my: 1.5 }} />
              <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2.5, color: 'error.main' }}>
                <MdLogout size={16} style={{ marginRight: 12 }} />
                <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 700, color: 'error.main' }} />
              </ListItemButton>
            </>
          ) : (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ px: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button component={Link} to="/login" variant="outlined" fullWidth onClick={() => setDrawerOpen(false)} sx={{ borderRadius: 2.5, fontWeight: 700, py: 1.25 }}>Login</Button>
                <Button component={Link} to="/register" variant="contained" fullWidth onClick={() => setDrawerOpen(false)} sx={{ borderRadius: 2.5, fontWeight: 700, py: 1.25 }}>Get Started</Button>
              </Box>
            </>
          )}

          {/* Become a professional CTA */}
          {!user && (
            <Box sx={{ mt: 3, p: 2, borderRadius: 3, background: 'linear-gradient(135deg, #2563eb, #14b8a6)', color: '#fff', cursor: 'pointer' }}
              onClick={() => { navigate('/register'); setDrawerOpen(false) }}>
              <Typography variant="body2" fontWeight={800} mb={0.25}>Become a Professional</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>Join 10,000+ service providers</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                <Typography variant="caption" fontWeight={700}>Learn more</Typography>
                <MdArrowForward size={14} />
              </Box>
            </Box>
          )}
        </List>
      </Drawer>
    </>
  )
}