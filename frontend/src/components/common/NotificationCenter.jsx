import { useState, useEffect, useCallback } from 'react'
import {
  Drawer, Box, Typography, IconButton, Tabs, Tab, Badge,
  List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction,
  Chip, Button, Divider, CircularProgress, Tooltip, Avatar,
  useTheme, Fade, Collapse,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdNotifications, MdClose, MdDoneAll, MdDeleteSweep, MdDelete,
  MdCircle, MdBookOnline, MdAccountBalanceWallet, MdPayment,
  MdMoneyOff, MdWarning, MdLocalOffer, MdBuild, MdVerified,
  MdLoyalty, MdInfo, MdNotificationsActive, MdFilterList,
} from 'react-icons/md'
import {
  getNotifications, getNotificationStats, markAllRead,
  markNotificationRead, deleteNotification, deleteAllNotifications,
} from '../../services/notifOtpPaymentService'

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'all', label: 'All', icon: MdNotifications, color: '#6C47FF' },
  { key: 'booking', label: 'Bookings', icon: MdBookOnline, color: '#3B82F6' },
  { key: 'wallet', label: 'Wallet', icon: MdAccountBalanceWallet, color: '#10B981' },
  { key: 'payment', label: 'Payments', icon: MdPayment, color: '#F59E0B' },
  { key: 'refund', label: 'Refunds', icon: MdMoneyOff, color: '#EF4444' },
  { key: 'emergency', label: 'Emergency', icon: MdWarning, color: '#DC2626' },
  { key: 'promotion', label: 'Promotions', icon: MdLocalOffer, color: '#EC4899' },
  { key: 'loyalty', label: 'Loyalty', icon: MdLoyalty, color: '#8B5CF6' },
  { key: 'system', label: 'System', icon: MdInfo, color: '#6B7280' },
]

function getCategoryConfig(category) {
  return CATEGORIES.find(c => c.key === category) || CATEGORIES.find(c => c.key === 'system')
}

function timeAgo(date) {
  if (!date) return ''
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Single notification card ─────────────────────────────────────────────────
const NotifCard = ({ notif, onRead, onDelete }) => {
  const theme = useTheme()
  const cfg = getCategoryConfig(notif.category || notif.type)
  const Icon = cfg.icon
  const isUnread = !notif.read

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25 }}
    >
      <ListItem
        onClick={() => !notif.read && onRead(notif.id)}
        sx={{
          gap: 1.5,
          py: 1.5,
          px: 2,
          cursor: isUnread ? 'pointer' : 'default',
          bgcolor: isUnread
            ? (theme.palette.mode === 'dark' ? `${cfg.color}14` : `${cfg.color}08`)
            : 'transparent',
          borderLeft: isUnread ? `3px solid ${cfg.color}` : '3px solid transparent',
          borderRadius: 2,
          mb: 0.5,
          transition: 'all 0.2s',
          '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
        }}
        disableGutters
      >
        <Avatar
          sx={{
            width: 40, height: 40, flexShrink: 0,
            background: `linear-gradient(135deg, ${cfg.color}33, ${cfg.color}22)`,
            border: `1px solid ${cfg.color}44`,
          }}
        >
          <Icon size={20} color={cfg.color} />
        </Avatar>

        <ListItemText
          primary={
            <Typography variant="body2" fontWeight={isUnread ? 700 : 500} sx={{ color: 'text.primary', lineHeight: 1.4 }}>
              {notif.title}
            </Typography>
          }
          secondary={
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25, lineHeight: 1.4 }}>
                {notif.body}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5, alignItems: 'center' }}>
                <Chip
                  label={cfg.label}
                  size="small"
                  sx={{
                    height: 16, fontSize: 9, fontWeight: 700,
                    bgcolor: `${cfg.color}22`, color: cfg.color,
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
                  {timeAgo(notif.created_at)}
                </Typography>
                {isUnread && <MdCircle size={6} color={cfg.color} />}
              </Box>
            </Box>
          }
        />

        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onDelete(notif.id) }}
            sx={{ flexShrink: 0, opacity: 0.4, '&:hover': { opacity: 1, color: 'error.main' }, transition: 'all 0.2s' }}
          >
            <MdDelete size={16} />
          </IconButton>
        </Tooltip>
      </ListItem>
    </motion.div>
  )
}

// ─── Main Notification Center Drawer ─────────────────────────────────────────
export default function NotificationCenter({ open, onClose, onUnreadChange }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [tab, setTab] = useState('all')
  const [notifications, setNotifications] = useState([])
  const [stats, setStats] = useState({ total_unread: 0, by_category: {} })
  const [loading, setLoading] = useState(false)
  const [pushGranted, setPushGranted] = useState(false)

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const [notifs, statsData] = await Promise.all([
        getNotifications(tab),
        getNotificationStats(),
      ])
      setNotifications(notifs)
      setStats(statsData)
      onUnreadChange?.(statsData.total_unread)
    } catch (_) { }
    finally { setLoading(false) }
  }, [tab, onUnreadChange])

  useEffect(() => {
    if (open) loadNotifications()
  }, [open, loadNotifications])

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setStats(prev => ({ ...prev, total_unread: Math.max(0, prev.total_unread - 1) }))
      onUnreadChange?.(Math.max(0, stats.total_unread - 1))
    } catch (_) { }
  }

  const handleDelete = async (id) => {
    const notif = notifications.find(n => n.id === id)
    try {
      await deleteNotification(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (notif && !notif.read) {
        setStats(prev => ({ ...prev, total_unread: Math.max(0, prev.total_unread - 1) }))
        onUnreadChange?.(Math.max(0, stats.total_unread - 1))
      }
    } catch (_) { }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setStats(prev => ({ ...prev, total_unread: 0 }))
      onUnreadChange?.(0)
    } catch (_) { }
  }

  const handleDeleteAll = async () => {
    try {
      await deleteAllNotifications()
      setNotifications([])
      setStats({ total_unread: 0, by_category: {} })
      onUnreadChange?.(0)
    } catch (_) { }
  }

  const handlePushPermission = async () => {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    if (perm === 'granted') setPushGranted(true)
  }

  const unreadInTab = tab === 'all'
    ? stats.total_unread
    : (stats.by_category?.[tab] || 0)

  const headerGradient = isDark
    ? 'linear-gradient(135deg, #1a0a3d 0%, #0f1a35 100%)'
    : 'linear-gradient(135deg, #f8f5ff 0%, #eef2ff 100%)'

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100vw', sm: 400 },
          background: isDark ? '#0f1117' : '#ffffff',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ background: headerGradient, px: 2.5, pt: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{
              width: 38, height: 38, borderRadius: 2,
              background: 'linear-gradient(135deg, #6C47FF, #4F35CB)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(108,71,255,0.4)',
            }}>
              <MdNotificationsActive size={20} color="white" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary', lineHeight: 1.2 }}>
                Notifications
              </Typography>
              {stats.total_unread > 0 && (
                <Typography variant="caption" color="primary.main" fontWeight={700}>
                  {stats.total_unread} unread
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
            <MdClose size={20} />
          </IconButton>
        </Box>

        {/* Push notification prompt */}
        {!pushGranted && 'Notification' in window && Notification.permission === 'default' && (
          <Button
            size="small"
            variant="outlined"
            onClick={handlePushPermission}
            startIcon={<MdNotificationsActive size={14} />}
            fullWidth
            sx={{
              mb: 1.5, fontSize: 11, fontWeight: 700, borderRadius: 2,
              borderColor: '#6C47FF44', color: '#6C47FF',
              '&:hover': { borderColor: '#6C47FF', bgcolor: '#6C47FF11' },
            }}
          >
            Enable Push Notifications
          </Button>
        )}

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small" onClick={handleMarkAllRead} startIcon={<MdDoneAll size={14} />}
            disabled={stats.total_unread === 0}
            sx={{ flex: 1, fontSize: 11, fontWeight: 700, borderRadius: 2, bgcolor: isDark ? 'rgba(108,71,255,0.15)' : 'rgba(108,71,255,0.08)', color: '#6C47FF', '&:hover': { bgcolor: 'rgba(108,71,255,0.2)' } }}
          >
            Mark All Read
          </Button>
          <Button
            size="small" onClick={handleDeleteAll} startIcon={<MdDeleteSweep size={14} />}
            disabled={notifications.length === 0}
            sx={{ flex: 1, fontSize: 11, fontWeight: 700, borderRadius: 2, bgcolor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)', color: '#EF4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.15)' } }}
          >
            Clear All
          </Button>
        </Box>
      </Box>

      {/* Category Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': { minWidth: 'unset', fontSize: 11, fontWeight: 700, px: 1.5, py: 1.25 },
            '& .Mui-selected': { color: '#6C47FF' },
            '& .MuiTabs-indicator': { bgcolor: '#6C47FF' },
          }}
        >
          {CATEGORIES.map(cat => {
            const catUnread = cat.key === 'all' ? stats.total_unread : (stats.by_category?.[cat.key] || 0)
            return (
              <Tab
                key={cat.key}
                value={cat.key}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {cat.label}
                    {catUnread > 0 && (
                      <Badge
                        badgeContent={catUnread}
                        sx={{
                          '& .MuiBadge-badge': {
                            bgcolor: cat.color, color: '#fff', fontSize: 9,
                            minWidth: 16, height: 16, borderRadius: '8px',
                            position: 'relative', transform: 'none', top: 'unset', right: 'unset',
                          },
                        }}
                      />
                    )}
                  </Box>
                }
              />
            )
          })}
        </Tabs>
      </Box>

      {/* Notification List */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 1.5, py: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
            <CircularProgress size={36} sx={{ color: '#6C47FF' }} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', pt: 8, px: 3 }}>
            <Box sx={{
              width: 72, height: 72, borderRadius: '50%', mx: 'auto', mb: 2,
              background: 'linear-gradient(135deg, #6C47FF22, #6C47FF11)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MdNotifications size={32} color="#6C47FF66" />
            </Box>
            <Typography variant="body1" fontWeight={700} color="text.secondary" gutterBottom>
              No notifications
            </Typography>
            <Typography variant="caption" color="text.disabled">
              You're all caught up! New notifications will appear here.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            <AnimatePresence initial={false}>
              {notifications.map(notif => (
                <NotifCard
                  key={notif.id}
                  notif={notif}
                  onRead={handleMarkRead}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </List>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{
        px: 2, py: 1.5, borderTop: 1, borderColor: 'divider',
        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
      }}>
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10, textAlign: 'center', display: 'block' }}>
          📱 Push notification ready — notifications sync in real time
        </Typography>
      </Box>
    </Drawer>
  )
}
