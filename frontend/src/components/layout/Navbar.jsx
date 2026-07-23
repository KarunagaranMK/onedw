import { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MdMenu, MdDarkMode, MdLightMode } from 'react-icons/md'
import { useThemeMode } from '../../contexts/ThemeContext'
import { useAuth } from '../../hooks/useAuth'
import { NAV_LINKS } from '../../utils/constants'

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { mode, toggleTheme } = useThemeMode()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
        <Box
          component={motion.div}
          whileHover={{ scale: 1.03 }}
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <Box
            component="span"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 800,
              fontSize: '1.5rem',
              color: theme.palette.primary.main,
            }}
          >
            One<Box component="span" sx={{ color: theme.palette.secondary.main }}>DW</Box>
          </Box>
        </Box>

        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {NAV_LINKS.map((link) => (
              <Button
                key={link.path}
                component={Link}
                to={link.path}
                sx={{ color: 'text.primary', fontWeight: 500 }}
              >
                {link.label}
              </Button>
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={toggleTheme} aria-label="Toggle dark mode">
            {mode === 'light' ? <MdDarkMode /> : <MdLightMode />}
          </IconButton>

          {!isMobile ? (
            user ? (
              <>
                <Button component={Link} to="/dashboard" sx={{ fontWeight: 500 }}>
                  Dashboard
                </Button>
                <Button variant="contained" color="primary" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button component={Link} to="/login" sx={{ fontWeight: 500 }}>
                  Login
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  color="primary"
                >
                  Register
                </Button>
              </>
            )
          ) : (
            <IconButton onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              <MdMenu />
            </IconButton>
          )}
        </Box>
      </Toolbar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 260, pt: 2 }} role="presentation">
          <List>
            {NAV_LINKS.map((link) => (
              <ListItemButton
                key={link.path}
                component={Link}
                to={link.path}
                onClick={() => setDrawerOpen(false)}
              >
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}
            {user ? (
              <>
                <ListItemButton component={Link} to="/dashboard" onClick={() => setDrawerOpen(false)}>
                  <ListItemText primary="Dashboard" />
                </ListItemButton>
                <ListItemButton onClick={() => { setDrawerOpen(false); handleLogout() }}>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </>
            ) : (
              <>
                <ListItemButton component={Link} to="/login" onClick={() => setDrawerOpen(false)}>
                  <ListItemText primary="Login" />
                </ListItemButton>
                <ListItemButton component={Link} to="/register" onClick={() => setDrawerOpen(false)}>
                  <ListItemText primary="Register" />
                </ListItemButton>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  )
}

export default Navbar