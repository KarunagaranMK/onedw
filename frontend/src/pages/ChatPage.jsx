import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box, Typography, Avatar, IconButton, TextField, Paper,
  Chip, CircularProgress, Tooltip, Divider, Badge,
  useTheme, List, ListItem, ListItemAvatar, ListItemText,
  InputAdornment, Skeleton, Alert,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdSend, MdMic, MdMicOff, MdImage, MdClose, MdCall,
  MdVideocam, MdDoneAll, MdDone, MdArrowBack,
  MdSmartToy, MdSearch, MdAttachFile, MdEmojiEmotions,
  MdPerson,
} from 'react-icons/md'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import chatService from '../services/chatService'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatTime = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const formatDate = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => resolve(reader.result.split(',')[1])
  reader.onerror = reject
})

// ─── Typing Indicator Dots ────────────────────────────────────────────────────

function TypingDots() {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, px: 2, py: 1.5, alignItems: 'center' }}>
      {[0, 0.2, 0.4].map(delay => (
        <motion.div key={delay}
          animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, delay, repeat: Infinity }}
          style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8' }}
        />
      ))}
    </Box>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function Bubble({ msg, isOwn, isDark }) {
  const isAI = msg.sender_role === 'ai'
  const bg = isOwn
    ? 'linear-gradient(135deg, #2563eb, #3b82f6)'
    : isAI
    ? (isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7')
    : (isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9')

  const time = formatTime(msg.created_at)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', gap: 8, marginBottom: 6, alignItems: 'flex-end' }}
    >
      {!isOwn && (
        <Avatar sx={{ width: 28, height: 28, mb: 0.5, flexShrink: 0, background: isAI ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #14b8a6, #0d9488)', fontSize: 12 }}>
          {isAI ? <MdSmartToy size={14} /> : (msg.sender_name || 'W')[0].toUpperCase()}
        </Avatar>
      )}
      <Box sx={{ maxWidth: '72%' }}>
        {isAI && !isOwn && (
          <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 700, display: 'block', mb: 0.25, pl: 0.5 }}>
            🤖 AI Assistant (worker offline)
          </Typography>
        )}
        <Box sx={{
          px: 2, py: 1.25, borderRadius: isOwn ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
          background: bg, color: isOwn ? '#fff' : 'inherit', position: 'relative',
          border: isAI && !isOwn ? '1px solid rgba(245,158,11,0.3)' : 'none',
        }}>
          {/* Image attachment */}
          {msg.message_type === 'image' && msg.image_base64 && (
            <Box component="img"
              src={`data:image/jpeg;base64,${msg.image_base64}`}
              alt="attachment"
              sx={{ width: '100%', maxWidth: 260, borderRadius: 2, display: 'block', mb: msg.content ? 1 : 0 }}
            />
          )}
          {/* Voice message */}
          {msg.message_type === 'voice' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MdMic size={18} />
              <Box sx={{ flex: 1, height: 4, borderRadius: 2, background: isOwn ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.15)', position: 'relative' }}>
                <Box sx={{ width: '60%', height: '100%', borderRadius: 2, background: isOwn ? '#fff' : '#64748b' }} />
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>{msg.voice_duration ? `${Math.round(msg.voice_duration)}s` : '—'}</Typography>
            </Box>
          )}
          {/* Text content */}
          {msg.content && (
            <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: isOwn ? '#fff' : 'inherit' }}>
              {msg.content}
            </Typography>
          )}
        </Box>
        {/* Time + read receipt */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25, justifyContent: isOwn ? 'flex-end' : 'flex-start', px: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10 }}>{time}</Typography>
          {isOwn && (
            msg.is_read
              ? <MdDoneAll size={14} color="#2563eb" />
              : <MdDone size={14} color="#94a3b8" />
          )}
        </Box>
      </Box>
    </motion.div>
  )
}

// ─── Session List Item ────────────────────────────────────────────────────────

function SessionItem({ session, isActive, onClick, currentUserId, isDark }) {
  const isCustomer = session.customer_id === currentUserId
  const otherName  = isCustomer ? session.worker_name : session.customer_name
  const unread     = isCustomer ? session.unread_customer : session.unread_worker

  return (
    <ListItem
      onClick={() => onClick(session.id)}
      sx={{
        borderRadius: 2, mb: 0.5, cursor: 'pointer',
        background: isActive
          ? (isDark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.08)')
          : 'transparent',
        '&:hover': { background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
        transition: 'background 0.2s',
      }}
    >
      <ListItemAvatar>
        <Badge overlap="circular" badgeContent={unread || 0} color="error" max={99}>
          <Avatar sx={{ background: 'linear-gradient(135deg, #14b8a6, #2563eb)', fontWeight: 700 }}>
            {otherName?.[0]?.toUpperCase() || 'U'}
          </Avatar>
        </Badge>
      </ListItemAvatar>
      <ListItemText
        primary={<Typography variant="body2" fontWeight={700} noWrap>{otherName}</Typography>}
        secondary={
          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 160, display: 'block' }}>
            {session.last_message || 'Start a conversation…'}
          </Typography>
        }
      />
      {session.worker_online && isCustomer && (
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
      )}
    </ListItem>
  )
}

// ─── Main Chat Page ────────────────────────────────────────────────────────────

export default function ChatPage() {
  const theme  = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const { user } = useAuth()
  const navigate  = useNavigate()
  const { sessionId } = useParams()
  const [searchParams] = useSearchParams()

  const [sessions, setSessions]       = useState([])
  const [activeId, setActiveId]       = useState(sessionId || null)
  const [messages, setMessages]       = useState([])
  const [activeSession, setActiveSess] = useState(null)
  const [input, setInput]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [msgsLoading, setMsgsLoading] = useState(false)
  const [typingOther, setTypingOther] = useState(false)
  const [workerOnline, setWorkerOnline] = useState(false)
  const [imageFile, setImageFile]     = useState(null)
  const [recording, setRecording]     = useState(false)
  const [error, setError]             = useState(null)
  const [sessionSearch, setSessionSearch] = useState('')
  const [isMobileView, setIsMobileView] = useState(false)
  const [showList, setShowList]       = useState(true)

  const wsRef          = useRef(null)
  const messagesEndRef = useRef(null)
  const fileInputRef   = useRef(null)
  const typingTimerRef = useRef(null)
  const mediaRef       = useRef(null)
  const chunksRef      = useRef([])

  // Use the same token key as api.js
  const token = localStorage.getItem('onedw-token') || ''

  // ── Fetch sessions ──────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true)
    chatService.listSessions()
      .then(r => setSessions(Array.isArray(r.data) ? r.data : []))
      .catch((err) => {
        // Only show error for genuine failures (not 404 / empty)
        const status = err?.response?.status
        if (status && status !== 404 && status !== 422) {
          setError('Could not load chats. Please check your connection.')
        } else {
          setSessions([])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Auto-start session from query param ─────────────────────────────────────

  useEffect(() => {
    const workerId = searchParams.get('worker')
    const bookingId = searchParams.get('booking')
    if (workerId && !activeId) {
      chatService.startSession({ worker_id: workerId, booking_id: bookingId })
        .then(r => {
          const id = r.data.id
          setActiveId(id)
          setSessions(prev => {
            const exists = prev.find(s => s.id === id)
            return exists ? prev : [r.data, ...prev]
          })
        })
        .catch(() => {})
    }
  }, [searchParams])

  // ── Load messages when session changes ──────────────────────────────────────

  useEffect(() => {
    if (!activeId) return
    setMsgsLoading(true)
    chatService.getMessages(activeId, { limit: 60 })
      .then(r => setMessages(r.data || []))
      .catch(() => {})
      .finally(() => setMsgsLoading(false))

    chatService.getSession(activeId)
      .then(r => {
        setActiveSess(r.data)
        setWorkerOnline(r.data?.worker_online || false)
      })
      .catch(() => {})

    chatService.markRead(activeId).catch(() => {})

    // Update unread count in sidebar
    setSessions(prev => prev.map(s => {
      if (s.id !== activeId) return s
      const isCustomer = s.customer_id === user?._id
      return isCustomer ? { ...s, unread_customer: 0 } : { ...s, unread_worker: 0 }
    }))
  }, [activeId, user])

  // ── WebSocket ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!activeId || !token) return

    // Close existing WS
    if (wsRef.current) wsRef.current.close()

    const ws = chatService.createWebSocket(activeId, token)
    wsRef.current = ws

    ws.onopen = () => console.log('WS connected')

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data)
        if (event.type === 'message') {
          setMessages(prev => {
            const exists = prev.find(m => m.id === event.data.id)
            return exists ? prev : [...prev, event.data]
          })
          // Update sidebar last message
          setSessions(prev => prev.map(s => s.id === activeId
            ? { ...s, last_message: event.data.content || '📎 Attachment', last_message_at: event.data.created_at }
            : s
          ))
        } else if (event.type === 'typing') {
          setTypingOther(event.data.is_typing)
          if (event.data.is_typing) {
            clearTimeout(typingTimerRef.current)
            typingTimerRef.current = setTimeout(() => setTypingOther(false), 3000)
          }
        } else if (event.type === 'read') {
          setMessages(prev => prev.map(m => m.sender_id === user?._id ? { ...m, is_read: true } : m))
        } else if (event.type === 'online_status') {
          setWorkerOnline(event.data.worker_online)
        }
      } catch {}
    }

    ws.onerror = () => {
      // Fallback to polling if WS fails
      console.warn('WS unavailable — using polling fallback')
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [activeId, token])

  // ── Polling fallback (every 4s if WS is closed) ─────────────────────────────

  useEffect(() => {
    if (!activeId) return
    const interval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        chatService.getMessages(activeId, { limit: 60 })
          .then(r => setMessages(r.data || []))
          .catch(() => {})
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [activeId])

  // ── Auto-scroll ──────────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingOther])

  // ── Send text message ────────────────────────────────────────────────────────

  const sendText = useCallback(async () => {
    const text = input.trim()
    if (!text && !imageFile) return
    setInput('')

    const payload = { content: text, message_type: 'text' }
    if (imageFile) {
      payload.image_base64 = await toBase64(imageFile)
      payload.message_type = 'image'
      payload.content = text || ''
      setImageFile(null)
    }

    // Optimistic UI
    const tempId = `temp-${Date.now()}`
    const optimistic = {
      id: tempId, sender_id: user?._id, sender_name: user?.name,
      sender_role: user?.role, ...payload, is_read: false, created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'message', data: payload }))
      } else {
        const r = await chatService.sendMessage(activeId, payload)
        setMessages(prev => prev.map(m => m.id === tempId ? r.data : m))
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setError('Message failed to send.')
    }
  }, [input, imageFile, activeId, user])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText() }
  }

  // ── Typing indicator ─────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', data: { is_typing: true } }))
      clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN)
          wsRef.current.send(JSON.stringify({ type: 'typing', data: { is_typing: false } }))
      }, 2000)
    }
  }

  // ── Voice recording ─────────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      mediaRef.current = rec
      chunksRef.current = []
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const base64 = await toBase64(blob)
        const payload = { content: '', message_type: 'voice', voice_base64: base64.split(',')[1], voice_duration: 5 }
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'message', data: payload }))
        } else {
          chatService.sendMessage(activeId, payload).then(r => setMessages(prev => [...prev, r.data])).catch(() => {})
        }
        stream.getTracks().forEach(t => t.stop())
      }
      rec.start()
      setRecording(true)
    } catch { setError('Microphone access denied.') }
  }

  const stopRecording = () => { mediaRef.current?.stop(); setRecording(false) }

  // ── Start video call ─────────────────────────────────────────────────────────

  const startVideoCall = async () => {
    if (!activeId) return
    try {
      const r = await chatService.createVideoSession({ session_id: activeId })
      navigate(`/video/${r.data.id}`)
    } catch { setError('Could not start video call.') }
  }

  // ── Responsive ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const selectSession = (id) => {
    setActiveId(id)
    if (isMobileView) setShowList(false)
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const isCustomer    = user?.role === 'customer'
  const otherName     = isCustomer ? activeSession?.worker_name : activeSession?.customer_name
  const filteredSessions = sessions.filter(s => {
    const name = isCustomer ? s.worker_name : s.customer_name
    return name?.toLowerCase().includes(sessionSearch.toLowerCase())
  })

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const date = formatDate(msg.created_at)
    if (!acc[date]) acc[date] = []
    acc[date].push(msg)
    return acc
  }, {})

  const showListPanel  = !isMobileView || showList
  const showChatPanel  = !isMobileView || !showList

  return (
    <Box sx={{ height: 'calc(100vh - 72px)', display: 'flex', overflow: 'hidden', background: isDark ? '#080812' : '#f8fafc' }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}
          sx={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, minWidth: 300, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── Session List ──────────────────────────────────────────────── */}
      {showListPanel && (
        <Box sx={{
          width: isMobileView ? '100%' : 340, flexShrink: 0,
          borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          display: 'flex', flexDirection: 'column',
          background: isDark ? '#0f0f1a' : '#fff',
        }}>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
            <Typography variant="h6" fontWeight={900} mb={1.5}>Messages</Typography>
            <TextField size="small" fullWidth placeholder="Search conversations…"
              value={sessionSearch} onChange={(e) => setSessionSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><MdSearch color="#94a3b8" /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
          </Box>

          {/* Sessions */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1, scrollbarWidth: 'thin' }}>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, p: 1.5, mb: 0.5 }}>
                  <Skeleton variant="circular" width={44} height={44} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="80%" />
                  </Box>
                </Box>
              ))
            ) : filteredSessions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                <Typography variant="h2" mb={1}>💬</Typography>
                <Typography fontWeight={700} mb={0.5}>No conversations yet</Typography>
                <Typography variant="caption" color="text.secondary">Book a service to start chatting with a worker</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {filteredSessions.map(session => (
                  <SessionItem key={session.id} session={session} isActive={session.id === activeId}
                    onClick={selectSession} currentUserId={user?._id} isDark={isDark} />
                ))}
              </List>
            )}
          </Box>
        </Box>
      )}

      {/* ── Chat Thread ───────────────────────────────────────────────── */}
      {showChatPanel && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!activeId ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h1">💬</Typography>
              <Typography variant="h6" fontWeight={700} color="text.secondary">Select a conversation</Typography>
              <Typography variant="body2" color="text.disabled">Choose from the list to start messaging</Typography>
            </Box>
          ) : (
            <>
              {/* Chat Header */}
              <Box sx={{
                px: 2, py: 1.5, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                display: 'flex', alignItems: 'center', gap: 1.5,
                background: isDark ? '#0f0f1a' : '#fff',
              }}>
                {isMobileView && (
                  <IconButton onClick={() => setShowList(true)}><MdArrowBack /></IconButton>
                )}
                <Avatar sx={{ background: 'linear-gradient(135deg, #14b8a6, #2563eb)', fontWeight: 700 }}>
                  {otherName?.[0]?.toUpperCase() || 'U'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" fontWeight={800}>{otherName || '—'}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: workerOnline ? '#22c55e' : '#94a3b8' }} />
                    <Typography variant="caption" color="text.secondary">
                      {workerOnline ? 'Online' : 'Offline — AI will reply'}
                    </Typography>
                    {!workerOnline && (
                      <Chip size="small" label="🤖 AI active" sx={{ fontSize: 10, height: 18, background: 'rgba(245,158,11,0.15)', color: '#d97706', fontWeight: 700 }} />
                    )}
                  </Box>
                </Box>
                <Tooltip title="Video Inspection">
                  <IconButton onClick={startVideoCall} sx={{ color: '#2563eb' }}><MdVideocam size={22} /></IconButton>
                </Tooltip>
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 1.5, md: 3 }, py: 2, scrollbarWidth: 'thin', background: isDark ? '#0a0a14' : '#f8fafc' }}>
                {msgsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={32} sx={{ color: '#2563eb' }} />
                  </Box>
                ) : messages.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h2" mb={1}>👋</Typography>
                    <Typography fontWeight={700} color="text.secondary">Say hello!</Typography>
                    <Typography variant="caption" color="text.disabled">This is the beginning of your conversation.</Typography>
                  </Box>
                ) : (
                  Object.entries(groupedMessages).map(([date, msgs]) => (
                    <Box key={date}>
                      <Box sx={{ textAlign: 'center', my: 2 }}>
                        <Chip label={date} size="small" sx={{ fontSize: 11, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
                      </Box>
                      {msgs.map(msg => (
                        <Bubble key={msg.id} msg={msg} isOwn={msg.sender_id === user?._id} isDark={isDark} />
                      ))}
                    </Box>
                  ))
                )}

                {/* Typing indicator */}
                {typingOther && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, background: 'linear-gradient(135deg, #14b8a6, #2563eb)', fontSize: 12 }}>
                        {otherName?.[0]?.toUpperCase() || 'U'}
                      </Avatar>
                      <Paper sx={{ borderRadius: '4px 18px 18px 18px', background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }}>
                        <TypingDots />
                      </Paper>
                    </Box>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Image preview */}
              {imageFile && (
                <Box sx={{ px: 2, py: 1, background: isDark ? '#0f0f1a' : '#f8fafc', display: 'flex', alignItems: 'center', gap: 1, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
                  <Box component="img" src={URL.createObjectURL(imageFile)} alt="preview" sx={{ height: 56, width: 56, objectFit: 'cover', borderRadius: 1.5 }} />
                  <Typography variant="caption" fontWeight={600} sx={{ flex: 1 }}>{imageFile.name}</Typography>
                  <IconButton size="small" onClick={() => setImageFile(null)}><MdClose size={16} /></IconButton>
                </Box>
              )}

              {/* Input bar */}
              <Box sx={{
                px: 2, py: 1.5, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                background: isDark ? '#0f0f1a' : '#fff',
                display: 'flex', alignItems: 'flex-end', gap: 1,
              }}>
                {/* Attach image */}
                <Tooltip title="Attach image">
                  <IconButton size="small" onClick={() => fileInputRef.current?.click()} sx={{ color: '#94a3b8', '&:hover': { color: '#2563eb' } }}>
                    <MdImage size={22} />
                  </IconButton>
                </Tooltip>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setImageFile(e.target.files[0])} />

                <TextField multiline maxRows={4} fullWidth size="small"
                  placeholder="Type a message…"
                  value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />

                {/* Voice */}
                <Tooltip title={recording ? 'Stop recording' : 'Voice message'}>
                  <IconButton size="small" onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
                    sx={{ color: recording ? '#ef4444' : '#94a3b8', '&:hover': { color: recording ? '#dc2626' : '#2563eb' }, background: recording ? 'rgba(239,68,68,0.1)' : 'transparent' }}>
                    {recording ? <MdMicOff size={22} /> : <MdMic size={22} />}
                  </IconButton>
                </Tooltip>

                {/* Send */}
                <IconButton
                  onClick={sendText}
                  disabled={!input.trim() && !imageFile}
                  sx={{
                    background: input.trim() || imageFile ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : (isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'),
                    color: input.trim() || imageFile ? '#fff' : '#94a3b8',
                    borderRadius: 2.5, width: 42, height: 42,
                    transition: 'all 0.2s',
                    '&:hover': { background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', transform: 'scale(1.05)' },
                  }}>
                  <MdSend size={20} />
                </IconButton>
              </Box>
            </>
          )}
        </Box>
      )}
    </Box>
  )
}
