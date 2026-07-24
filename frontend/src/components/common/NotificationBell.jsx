import { useState, useEffect, useRef } from 'react'
import {
  IconButton, Badge, Popover, Box, Typography, List, ListItem,
  ListItemText, Divider, Button, Chip, CircularProgress,
} from '@mui/material'
import { MdNotifications, MdCheck, MdCheckCircle } from 'react-icons/md'
import { motion, AnimatePresence } from 'framer-motion'
import { getNotifications, getUnreadCount, markAllRead, markNotificationRead } from '../../services/notifOtpPaymentService'

const TYPE_COLORS = {
  info: '#6C47FF',
  success: '#00D4AA',
  warning: '#FFB800',
  error: '#FF4757',
}

const TYPE_ICONS = {
  info: '🔔',
  success: '✅',
  warning: '⚠️',
  error: '❌',
}

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const pollRef = useRef(null)

  const fetchCount = async () => {
    try {
      const count = await getUnreadCount()
      setUnread(count)
    } catch {
      // Silent fail — user may not be logged in
    }
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const data = await getNotifications()
      setNotifications(Array.isArray(data) ? data : [])
      const unreadCount = data.filter((n) => !n.read).length
      setUnread(unreadCount)
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  // Poll every 30s for new notifications
  useEffect(() => {
    fetchCount()
    pollRef.current = setInterval(fetchCount, 30000)
    return () => clearInterval(pollRef.current)
  }, [])

  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget)
    fetchNotifications()
  }

  const handleClose = () => setAnchorEl(null)

  const handleMarkAll = async () => {
    try {
      await markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnread(0)
    } catch { /* silent */ }
  }

  const handleMarkOne = async (id) => {
    try {
      await markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnread((c) => Math.max(0, c - 1))
    } catch { /* silent */ }
  }

  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <>
      <IconButton onClick={handleOpen} sx={{ color: 'inherit' }}>
        <Badge badgeContent={unread} color="error" max={9}>
          <motion.div
            animate={unread > 0 ? { rotate: [0, 20, -20, 10, -10, 0] } : {}}
            transition={{ duration: 0.6, repeat: unread > 0 ? Infinity : 0, repeatDelay: 3 }}
          >
            <MdNotifications size={24} />
          </motion.div>
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 380, maxHeight: 520, borderRadius: 4,
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            border: '1px solid rgba(108,71,255,0.15)',
          },
        }}
      >
        {/* Header */}
        <Box sx={{
          px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid rgba(108,71,255,0.08)',
          background: 'linear-gradient(135deg,rgba(108,71,255,0.05),rgba(0,212,170,0.03))',
        }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>Notifications</Typography>
            {unread > 0 && (
              <Typography variant="caption" sx={{ color: '#6C47FF', fontWeight: 700 }}>
                {unread} unread
              </Typography>
            )}
          </Box>
          {unread > 0 && (
            <Button size="small" startIcon={<MdCheck />} onClick={handleMarkAll}
              sx={{ color: '#6C47FF', fontSize: 12, fontWeight: 700 }}>
              Mark all read
            </Button>
          )}
        </Box>

        {/* List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography sx={{ fontSize: 40 }}>🔕</Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ maxHeight: 400, overflow: 'auto' }}>
            <AnimatePresence>
              {notifications.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <ListItem
                    alignItems="flex-start"
                    onClick={() => !n.read && handleMarkOne(n.id)}
                    sx={{
                      cursor: n.read ? 'default' : 'pointer',
                      bgcolor: n.read ? 'transparent' : 'rgba(108,71,255,0.04)',
                      borderLeft: `3px solid ${n.read ? 'transparent' : TYPE_COLORS[n.type] || '#6C47FF'}`,
                      '&:hover': { bgcolor: 'rgba(108,71,255,0.06)' },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Box sx={{ mr: 1.5, mt: 0.5, fontSize: 20 }}>
                      {TYPE_ICONS[n.type] || '🔔'}
                    </Box>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="body2" fontWeight={n.read ? 400 : 700} sx={{ flex: 1, pr: 1 }}>
                            {n.title}
                          </Typography>
                          {!n.read && (
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#6C47FF', mt: 0.5, flexShrink: 0,
                              boxShadow: '0 0 6px rgba(108,71,255,0.5)' }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {n.body}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {timeAgo(n.created_at)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {i < notifications.length - 1 && <Divider component="li" />}
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        )}
      </Popover>
    </>
  )
}
