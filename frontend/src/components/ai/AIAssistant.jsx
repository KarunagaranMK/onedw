import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Box, Paper, Typography, TextField, IconButton, Avatar,
  Chip, Divider, useTheme, CircularProgress, Tooltip,
  Collapse, Badge, Tab, Tabs, LinearProgress, Button,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdClose, MdSend, MdMic, MdMicOff, MdSmartToy,
  MdWarning, MdPerson, MdMinimize, MdOpenInFull,
  MdAutoAwesome, MdImage, MdTranslate, MdVolumeUp,
  MdVolumeOff, MdCloudUpload, MdRefresh, MdChat,
  MdHealthAndSafety, MdBuild, MdAttachMoney, MdAccessTime,
  MdCheckCircle, MdArrowBack,
} from 'react-icons/md'
import {
  sendChat, saveChatHistory, getChatHistory,
  analyzeImage, SUPPORTED_LANGUAGES, SPEECH_LANG_CODES,
  getOrCreateSessionId,
} from '../../services/aiService'

// ─── Constants ────────────────────────────────────────────────────────────────

const EMERGENCY_TIPS = ['Gas Leak', 'Electric Sparks', 'Burst Pipe', 'Sparking', 'Flooding']

const QUICK_QUESTIONS = [
  '❄️ My AC is not cooling',
  '🔧 My washing machine makes noise',
  '💧 There is water leakage',
  '⚡ My switchboard is sparking',
  '💰 How much does a plumber cost?',
]

const SEVERITY_COLORS = {
  Low:      { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  Medium:   { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  High:     { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  Critical: { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
}

// ─── DiagnosticCard ───────────────────────────────────────────────────────────

function DiagnosticCard({ msg, isDark }) {
  const hasDiag = msg.problem_detected || (msg.possible_causes && msg.possible_causes.length > 0)
  if (!hasDiag) return null
  return (
    <Box sx={{ mt: 1.5, borderRadius: 2, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,71,255,0.15)'}` }}>
      {msg.problem_detected && (
        <Box sx={{ px: 1.5, py: 1, background: isDark ? 'rgba(108,71,255,0.15)' : 'rgba(108,71,255,0.06)' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#6c47ff', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MdBuild size={12} /> Problem Detected
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 0.25, color: isDark ? '#e5e7eb' : '#374151' }}>
            {msg.problem_detected}
          </Typography>
        </Box>
      )}
      {msg.possible_causes && msg.possible_causes.length > 0 && (
        <Box sx={{ px: 1.5, py: 0.75, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'}` }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#f59e0b' }}>⚡ Possible Causes</Typography>
          {msg.possible_causes.slice(0, 3).map((c, i) => (
            <Typography key={i} variant="caption" display="block" sx={{ color: isDark ? '#d1d5db' : '#4b5563', pl: 1 }}>• {c}</Typography>
          ))}
        </Box>
      )}
      {msg.recommended_worker && (
        <Box sx={{ px: 1.5, py: 0.75, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'}`, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip size="small" label={`👷 ${msg.recommended_worker}`} sx={{ background: 'rgba(108,71,255,0.1)', color: '#6c47ff', fontWeight: 700, fontSize: 10 }} />
          {msg.estimated_repair_cost && <Chip size="small" label={msg.estimated_repair_cost} sx={{ background: 'rgba(16,185,129,0.1)', color: '#059669', fontWeight: 700, fontSize: 10 }} />}
          {msg.estimated_repair_time && <Chip size="small" label={`⏱️ ${msg.estimated_repair_time}`} sx={{ background: 'rgba(245,158,11,0.1)', color: '#d97706', fontWeight: 700, fontSize: 10 }} />}
        </Box>
      )}
      {msg.safety_tips && msg.safety_tips.length > 0 && (
        <Box sx={{ px: 1.5, py: 0.75, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'}`, background: isDark ? 'rgba(220,38,38,0.08)' : '#fff7f7' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#dc2626' }}>🛡️ Safety Tips</Typography>
          {msg.safety_tips.slice(0, 2).map((t, i) => (
            <Typography key={i} variant="caption" display="block" sx={{ color: isDark ? '#fca5a5' : '#991b1b', pl: 1 }}>• {t}</Typography>
          ))}
        </Box>
      )}
      {msg.preventive_maintenance_tips && msg.preventive_maintenance_tips.length > 0 && (
        <Box sx={{ px: 1.5, py: 0.75, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'}` }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#0891b2' }}>🔄 Preventive Tips</Typography>
          {msg.preventive_maintenance_tips.slice(0, 2).map((t, i) => (
            <Typography key={i} variant="caption" display="block" sx={{ color: isDark ? '#a5f3fc' : '#164e63', pl: 1 }}>• {t}</Typography>
          ))}
        </Box>
      )}
    </Box>
  )
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, isDark }) {
  const isUser = msg.role === 'user'
  const isEmergency = msg.emergency_flag
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 10 }}
    >
      {!isUser && (
        <Avatar sx={{ width: 28, height: 28, mr: 1, mt: 0.5, flexShrink: 0, background: 'linear-gradient(135deg, #6c47ff, #a78bfa)' }}>
          <MdSmartToy size={14} />
        </Avatar>
      )}
      <Box sx={{ maxWidth: '82%' }}>
        {isEmergency && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, p: '4px 10px', borderRadius: 2, background: '#fee2e2', border: '1px solid #fca5a5' }}>
            <MdWarning size={14} color="#dc2626" />
            <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700 }}>🚨 EMERGENCY DETECTED</Typography>
          </Box>
        )}
        <Box sx={{
          p: '10px 14px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
          background: isUser ? 'linear-gradient(135deg, #6c47ff, #a78bfa)' : isDark ? 'rgba(255,255,255,0.07)' : '#f3f4f6',
          color: isUser ? '#fff' : 'inherit',
          border: !isUser && !isDark ? '1px solid rgba(0,0,0,0.06)' : 'none',
        }}>
          <Typography
            variant="body2"
            sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
          />
        </Box>
        {(msg.recommended_service || msg.estimated_price_range) && !msg.problem_detected && (
          <Box sx={{ mt: 0.75, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {msg.recommended_service && <Chip size="small" label={`🔧 ${msg.recommended_service}`} sx={{ background: 'rgba(108,71,255,0.12)', color: '#6c47ff', fontWeight: 700, fontSize: 11 }} />}
            {msg.estimated_price_range && <Chip size="small" label={`💰 ${msg.estimated_price_range}`} sx={{ background: 'rgba(16,185,129,0.12)', color: '#059669', fontWeight: 700, fontSize: 11 }} />}
          </Box>
        )}
        {!isUser && <DiagnosticCard msg={msg} isDark={isDark} />}
      </Box>
      {isUser && (
        <Avatar sx={{ width: 28, height: 28, ml: 1, mt: 0.5, flexShrink: 0, bgcolor: '#e5e7eb' }}>
          <MdPerson size={14} color="#6b7280" />
        </Avatar>
      )}
    </motion.div>
  )
}

// ─── ImageAnalysisResult ──────────────────────────────────────────────────────

function ImageAnalysisResult({ result, isDark }) {
  if (!result) return null
  const confidence = Math.round((result.confidence || 0) * 100)
  const sev = result.severity || 'Medium'
  const sevStyle = SEVERITY_COLORS[sev] || SEVERITY_COLORS.Medium
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Box sx={{ mt: 2, borderRadius: 3, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,71,255,0.15)'}` }}>
        <Box sx={{ px: 2, py: 1.5, background: 'linear-gradient(135deg, #6c47ff, #a78bfa)', color: '#fff' }}>
          <Typography variant="body2" fontWeight={800}>🔍 AI Image Analysis Result</Typography>
        </Box>
        {result.problem && (
          <Box sx={{ px: 2, py: 1.25, background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#6c47ff', display: 'block' }}>Problem Detected</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>{result.problem}</Typography>
          </Box>
        )}
        <Box sx={{ px: 2, py: 1.25, display: 'flex', gap: 2, alignItems: 'center', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0'}` }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>Confidence</Typography>
            <LinearProgress variant="determinate" value={confidence} sx={{ height: 8, borderRadius: 4, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb', '& .MuiLinearProgress-bar': { background: confidence >= 80 ? '#10b981' : confidence >= 60 ? '#f59e0b' : '#ef4444', borderRadius: 4 } }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: confidence >= 80 ? '#10b981' : confidence >= 60 ? '#f59e0b' : '#ef4444' }}>{confidence}%</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>Severity</Typography>
            <Chip size="small" label={sev} sx={{ background: sevStyle.bg, color: sevStyle.text, border: `1px solid ${sevStyle.border}`, fontWeight: 800, fontSize: 11 }} />
          </Box>
        </Box>
        <Box sx={{ px: 2, py: 1, display: 'flex', flexWrap: 'wrap', gap: 0.75, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0'}` }}>
          {result.suggested_worker && <Chip size="small" label={`👷 ${result.suggested_worker}`} sx={{ background: 'rgba(108,71,255,0.1)', color: '#6c47ff', fontWeight: 700, fontSize: 10 }} />}
          {result.estimated_cost && <Chip size="small" label={`💰 ${result.estimated_cost}`} sx={{ background: 'rgba(16,185,129,0.1)', color: '#059669', fontWeight: 700, fontSize: 10 }} />}
          {result.estimated_duration && <Chip size="small" label={`⏱️ ${result.estimated_duration}`} sx={{ background: 'rgba(245,158,11,0.1)', color: '#d97706', fontWeight: 700, fontSize: 10 }} />}
        </Box>
        {result.required_materials && result.required_materials.length > 0 && (
          <Box sx={{ px: 2, py: 1, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0'}` }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#0891b2', display: 'block', mb: 0.5 }}>🔩 Required Materials</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {result.required_materials.map((m, i) => (
                <Chip key={i} size="small" label={m} sx={{ fontSize: 10, background: isDark ? 'rgba(8,145,178,0.15)' : '#ecfeff', color: '#0e7490' }} />
              ))}
            </Box>
          </Box>
        )}
        {result.safety_advice && result.safety_advice.length > 0 && (
          <Box sx={{ px: 2, py: 1, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0'}`, background: isDark ? 'rgba(220,38,38,0.06)' : '#fff7f7' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#dc2626', display: 'block', mb: 0.25 }}>🛡️ Safety Advice</Typography>
            {result.safety_advice.map((a, i) => (
              <Typography key={i} variant="caption" display="block" sx={{ color: isDark ? '#fca5a5' : '#991b1b' }}>• {a}</Typography>
            ))}
          </Box>
        )}
        {result.additional_notes && (
          <Box sx={{ px: 2, py: 1, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0'}` }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block' }}>📝 Notes</Typography>
            <Typography variant="caption" color="text.secondary">{result.additional_notes}</Typography>
          </Box>
        )}
      </Box>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIAssistant() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [open, setOpen]           = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [unread, setUnread]       = useState(0)
  const [emergencyAlert, setEmergencyAlert] = useState(false)
  const [language, setLanguage]   = useState('en')

  const [messages, setMessages]   = useState([{
    role: 'assistant',
    content: "Hello! I'm **OneDW AI** 👋\n\nI can help you book services, detect emergencies, estimate costs, and answer any questions.\n\nWhat can I help you with today?",
    recommended_service: null,
  }])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [listening, setListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)

  const [imageFile, setImageFile]           = useState(null)
  const [imagePreview, setImagePreview]     = useState(null)
  const [imageLoading, setImageLoading]     = useState(false)
  const [imageResult, setImageResult]       = useState(null)
  const [imageDragging, setImageDragging]   = useState(false)
  const [imageServiceType, setImageServiceType] = useState('')

  const sessionId = getOrCreateSessionId()
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const inputRef       = useRef(null)
  const fileInputRef   = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])
  useEffect(() => { if (!open && messages.length > 1) setUnread(prev => prev + 1) }, [messages])
  useEffect(() => { if (open) setUnread(0) }, [open])

  useEffect(() => {
    if (open && messages.length === 1) {
      getChatHistory(sessionId).then(history => {
        if (history && history.messages && history.messages.length > 0) {
          setMessages(history.messages.map(m => ({ role: m.role, content: m.content })))
          setLanguage(history.language || 'en')
        }
      }).catch(() => {})
    }
  }, [open])

  useEffect(() => {
    if (messages.length <= 1) return
    const timer = setTimeout(() => {
      saveChatHistory(sessionId, messages, language).catch(() => {})
    }, 2000)
    return () => clearTimeout(timer)
  }, [messages, language, sessionId])

  const speak = useCallback((text) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/[•🚨🔧💰⚡❄️💧🛡️🔄📝🔩👷]/g, ''))
    utter.lang = SPEECH_LANG_CODES[language] || 'en-IN'
    utter.rate = 0.95
    const voices = window.speechSynthesis.getVoices()
    const langVoice = voices.find(v => v.lang.startsWith(language === 'en' ? 'en' : language + '-'))
    if (langVoice) utter.voice = langVoice
    window.speechSynthesis.speak(utter)
  }, [ttsEnabled, language])

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed || loading) return
    setInput('')
    const userMsg = { role: 'user', content: trimmed, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const data = await sendChat(trimmed, history, language, sessionId)
      const assistantMsg = {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        recommended_service: data.recommended_service,
        estimated_price_range: data.estimated_price_range || data.estimated_repair_cost,
        emergency_flag: data.emergency_flag,
        problem_detected: data.problem_detected,
        possible_causes: data.possible_causes,
        recommended_worker: data.recommended_worker,
        safety_tips: data.safety_tips,
        estimated_repair_cost: data.estimated_repair_cost,
        estimated_repair_time: data.estimated_repair_time,
        preventive_maintenance_tips: data.preventive_maintenance_tips,
      }
      setMessages(prev => [...prev, assistantMsg])
      speak(data.reply)
      if (data.emergency_flag) {
        setEmergencyAlert(true)
        setTimeout(() => setEmergencyAlert(false), 8000)
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please try again.", timestamp: new Date().toISOString() }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, loading, messages, language, sessionId, speak])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported. Try Chrome.')
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = SPEECH_LANG_CODES[language] || 'en-IN'
    recognition.interimResults = false
    recognition.onstart = () => setListening(true)
    recognition.onend   = () => setListening(false)
    recognition.onresult = (e) => setInput(e.results[0][0].transcript)
    recognition.onerror = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
  }

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false) }

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setImageFile(file)
    setImageResult(null)
    setImagePreview(URL.createObjectURL(file))
  }

  const runImageAnalysis = async () => {
    if (!imageFile) return
    setImageLoading(true)
    setImageResult(null)
    try {
      const result = await analyzeImage(imageFile, imageServiceType || null, language)
      setImageResult(result)
    } catch {
      setImageResult({ problem: 'Analysis failed. Please try again.', confidence: 0, severity: 'Medium' })
    } finally {
      setImageLoading(false)
    }
  }

  const clearImage = () => { setImageFile(null); setImagePreview(null); setImageResult(null) }
  const clearChat  = () => setMessages([{ role: 'assistant', content: "Chat cleared! How can I help you?", timestamp: new Date().toISOString() }])

  const selectedLang = SUPPORTED_LANGUAGES.find(l => l.code === language)

  return (
    <>
      {/* Emergency Banner */}
      <AnimatePresence>
        {emergencyAlert && (
          <motion.div initial={{ y: -80 }} animate={{ y: 0 }} exit={{ y: -80 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999, background: 'linear-gradient(90deg, #dc2626, #ef4444)', color: '#fff', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <MdWarning size={22} />
              <Typography fontWeight={800} fontSize={14}>🚨 EMERGENCY DETECTED — Call 112 if life-threatening. Emergency worker alerted.</Typography>
            </Box>
            <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setEmergencyAlert(false)}><MdClose /></IconButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
            style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, cursor: 'pointer' }}
            onClick={() => setOpen(true)}>
            <Badge badgeContent={unread} color="error" max={9}>
              <Box sx={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #6c47ff 0%, #a78bfa 100%)', boxShadow: '0 8px 32px rgba(108,71,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <MdAutoAwesome size={30} />
              </Box>
            </Badge>
            {/* Language flag dot */}
            <Box sx={{ position: 'absolute', bottom: 2, right: 2, background: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              {selectedLang?.flag}
            </Box>
            <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 2.5, repeat: Infinity }}
              style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '2px solid rgba(108,71,255,0.5)', pointerEvents: 'none' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, scale: 0.8, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 40 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9998, width: 400, maxWidth: 'calc(100vw - 32px)' }}>
            <Paper sx={{ borderRadius: 4, overflow: 'hidden', background: isDark ? '#111827' : '#fff', boxShadow: '0 24px 80px rgba(0,0,0,0.3)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,71,255,0.15)'}` }}>

              {/* Header */}
              <Box sx={{ background: 'linear-gradient(135deg, #6c47ff, #a78bfa)', p: '12px 14px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 38, height: 38, background: 'rgba(255,255,255,0.2)' }}><MdSmartToy size={20} /></Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={800} color="#fff">OneDW AI Assistant</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Online · {selectedLang?.native} · Gemini AI
                    </Typography>
                  </Box>
                </Box>
                <Tooltip title={ttsEnabled ? 'Mute' : 'Enable voice'}>
                  <IconButton size="small" sx={{ color: ttsEnabled ? '#4ade80' : 'rgba(255,255,255,0.6)' }} onClick={() => setTtsEnabled(t => !t)}>
                    {ttsEnabled ? <MdVolumeUp size={16} /> : <MdVolumeOff size={16} />}
                  </IconButton>
                </Tooltip>
                <Tooltip title={minimized ? 'Expand' : 'Minimize'}>
                  <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.8)' }} onClick={() => setMinimized(m => !m)}>
                    {minimized ? <MdOpenInFull size={16} /> : <MdMinimize size={16} />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Close">
                  <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.8)' }} onClick={() => setOpen(false)}>
                    <MdClose size={16} />
                  </IconButton>
                </Tooltip>
              </Box>

              <Collapse in={!minimized}>
                {/* Tabs */}
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="fullWidth"
                  sx={{ minHeight: 40, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0'}`, '& .MuiTab-root': { minHeight: 40, fontSize: 11, fontWeight: 700, py: 0 }, '& .Mui-selected': { color: '#6c47ff' }, '& .MuiTabs-indicator': { backgroundColor: '#6c47ff' } }}>
                  <Tab icon={<MdChat size={14} />} iconPosition="start" label="Chat" />
                  <Tab icon={<MdImage size={14} />} iconPosition="start" label="Analyse" />
                  <Tab icon={<MdTranslate size={14} />} iconPosition="start" label="Language" />
                </Tabs>

                {/* ── TAB 0: CHAT ─────────────────────────────────────── */}
                {activeTab === 0 && (
                  <Box>
                    <Box sx={{ px: 1.5, py: 0.75, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'}` }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>🚨 Emergency:</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                        {EMERGENCY_TIPS.map(kw => (
                          <Chip key={kw} label={kw} size="small" onClick={() => sendMessage(kw)}
                            sx={{ background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 10, cursor: 'pointer', '&:hover': { background: '#fecaca' } }} />
                        ))}
                      </Box>
                    </Box>
                    <Box sx={{ height: 310, overflowY: 'auto', p: 1.5, scrollbarWidth: 'thin' }}>
                      {messages.map((msg, i) => <MessageBubble key={i} msg={msg} isDark={isDark} />)}
                      {loading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                          <Avatar sx={{ width: 28, height: 28, background: 'linear-gradient(135deg, #6c47ff, #a78bfa)' }}><MdSmartToy size={14} /></Avatar>
                          <Box sx={{ p: '10px 14px', borderRadius: '4px 16px 16px 16px', background: isDark ? 'rgba(255,255,255,0.07)' : '#f3f4f6', display: 'flex', gap: 0.5 }}>
                            {[0, 0.2, 0.4].map(d => (
                              <motion.div key={d} animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, delay: d, repeat: Infinity }}
                                style={{ width: 7, height: 7, borderRadius: '50%', background: '#6c47ff' }} />
                            ))}
                          </Box>
                        </motion.div>
                      )}
                      <div ref={messagesEndRef} />
                    </Box>
                    <Box sx={{ px: 1.5, py: 0.75, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'}` }}>
                      <Box sx={{ display: 'flex', gap: 0.6, overflowX: 'auto', pb: 0.25, scrollbarWidth: 'none' }}>
                        {QUICK_QUESTIONS.map(q => (
                          <Chip key={q} label={q} size="small" onClick={() => sendMessage(q)}
                            sx={{ cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 10, fontWeight: 600, '&:hover': { background: 'rgba(108,71,255,0.12)', color: '#6c47ff' } }} />
                        ))}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, p: 1.25, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'}` }}>
                      <TextField inputRef={inputRef} multiline maxRows={3} fullWidth size="small"
                        placeholder={`Ask in ${selectedLang?.native || 'English'}…`}
                        value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={loading}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
                      <Tooltip title={listening ? 'Stop' : `Speak in ${selectedLang?.native}`}>
                        <IconButton size="small" onClick={listening ? stopListening : startListening}
                          sx={{ color: listening ? '#dc2626' : '#6c47ff', background: listening ? '#fee2e2' : 'rgba(108,71,255,0.1)', mb: 0.25 }}>
                          {listening ? <MdMicOff size={18} /> : <MdMic size={18} />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Clear chat">
                        <IconButton size="small" onClick={clearChat} sx={{ color: '#9ca3af', mb: 0.25 }}><MdRefresh size={16} /></IconButton>
                      </Tooltip>
                      <IconButton size="small" onClick={() => sendMessage()} disabled={!input.trim() || loading}
                        sx={{ background: 'linear-gradient(135deg, #6c47ff, #a78bfa)', color: '#fff', mb: 0.25, '&:hover': { background: 'linear-gradient(135deg, #5a38e0, #9268f5)' }, '&:disabled': { background: '#e5e7eb' } }}>
                        {loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <MdSend size={18} />}
                      </IconButton>
                    </Box>
                  </Box>
                )}

                {/* ── TAB 1: IMAGE ANALYSE ────────────────────────────── */}
                {activeTab === 1 && (
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <IconButton size="small" onClick={() => setActiveTab(0)} sx={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6', color: '#6c47ff', '&:hover': { background: 'rgba(108,71,255,0.12)' } }}>
                        <MdArrowBack size={16} />
                      </IconButton>
                      <Typography variant="body2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <MdImage size={16} color="#6c47ff" /> AI Image Analysis
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                      Upload a photo of your home issue. Gemini AI will diagnose it instantly.
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                      <InputLabel>Service Type (optional)</InputLabel>
                      <Select value={imageServiceType} onChange={e => setImageServiceType(e.target.value)} label="Service Type (optional)" sx={{ borderRadius: 2 }}>
                        <MenuItem value="">Auto Detect</MenuItem>
                        {['Electrician','Plumber','AC Repair','Carpenter','Painter','Cleaning','Appliance Repair'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                    {!imagePreview ? (
                      <Box onDragOver={(e) => { e.preventDefault(); setImageDragging(true) }} onDragLeave={() => setImageDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setImageDragging(false); handleImageFile(e.dataTransfer.files[0]) }}
                        onClick={() => fileInputRef.current?.click()}
                        sx={{ border: `2px dashed ${imageDragging ? '#6c47ff' : isDark ? 'rgba(255,255,255,0.2)' : '#d1d5db'}`, borderRadius: 3, p: 3, textAlign: 'center', cursor: 'pointer', background: imageDragging ? 'rgba(108,71,255,0.05)' : 'transparent', transition: 'all 0.2s', mb: 1.5, '&:hover': { borderColor: '#6c47ff', background: 'rgba(108,71,255,0.04)' } }}>
                        <MdCloudUpload size={36} color="#6c47ff" />
                        <Typography variant="body2" fontWeight={700} sx={{ mt: 1 }}>Drop image here</Typography>
                        <Typography variant="caption" color="text.secondary">or click to browse</Typography>
                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageFile(e.target.files[0])} />
                      </Box>
                    ) : (
                      <Box sx={{ mb: 1.5, position: 'relative' }}>
                        <Box component="img" src={imagePreview} alt="Preview" sx={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 2, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}` }} />
                        <IconButton size="small" onClick={clearImage} sx={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: '#fff' }}><MdClose size={14} /></IconButton>
                      </Box>
                    )}
                    {imageFile && !imageResult && (
                      <Button fullWidth variant="contained" onClick={runImageAnalysis} disabled={imageLoading}
                        startIcon={imageLoading ? <CircularProgress size={16} color="inherit" /> : <MdHealthAndSafety />}
                        sx={{ background: 'linear-gradient(135deg, #6c47ff, #a78bfa)', borderRadius: 2.5, fontWeight: 700, mb: 1, '&:hover': { background: 'linear-gradient(135deg, #5a38e0, #9268f5)' } }}>
                        {imageLoading ? 'Analysing with Gemini…' : 'Analyse with AI'}
                      </Button>
                    )}
                    <Box sx={{ maxHeight: 320, overflowY: 'auto', scrollbarWidth: 'thin' }}>
                      {imageLoading && (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                          <CircularProgress size={36} sx={{ color: '#6c47ff' }} />
                          <Typography variant="caption" display="block" sx={{ mt: 1, color: '#6c47ff', fontWeight: 600 }}>Gemini is analysing your image…</Typography>
                        </Box>
                      )}
                      <ImageAnalysisResult result={imageResult} isDark={isDark} />
                      {imageResult && (
                        <Button fullWidth size="small" variant="outlined" startIcon={<MdRefresh />} onClick={clearImage}
                          sx={{ mt: 1, borderRadius: 2, borderColor: '#6c47ff', color: '#6c47ff', fontWeight: 700 }}>
                          Analyse Another Image
                        </Button>
                      )}
                    </Box>
                  </Box>
                )}

                {/* ── TAB 2: LANGUAGE ─────────────────────────────────── */}
                {activeTab === 2 && (
                  <Box sx={{ p: 2 }}>
                    {/* Back button row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <IconButton size="small" onClick={() => setActiveTab(0)}
                        sx={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6', color: '#6c47ff', '&:hover': { background: 'rgba(108,71,255,0.12)' } }}>
                        <MdArrowBack size={16} />
                      </IconButton>
                      <Typography variant="body2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#6c47ff' }}>
                        <MdTranslate size={16} /> Language & Voice Settings
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      The AI responds in your chosen language. Voice mic also uses it.
                    </Typography>

                    {/* Language grid — 2×3 with real flag emojis */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <motion.div key={lang.code} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Box onClick={() => setLanguage(lang.code)}
                            sx={{
                              p: 1.5, borderRadius: 2.5, cursor: 'pointer', textAlign: 'center', position: 'relative',
                              border: `2px solid ${language === lang.code ? '#6c47ff' : isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
                              background: language === lang.code ? 'linear-gradient(135deg, rgba(108,71,255,0.12), rgba(167,139,250,0.08))' : 'transparent',
                              transition: 'all 0.2s',
                            }}>
                            {/* Real emoji flag — fontSize ensures it renders as emoji not text */}
                            <Box component="span" sx={{ fontSize: '1.8rem', lineHeight: 1, display: 'block', mb: 0.5 }}>
                              {lang.flag}
                            </Box>
                            <Typography variant="caption" fontWeight={800} display="block"
                              sx={{ color: language === lang.code ? '#6c47ff' : 'inherit', fontSize: 12, lineHeight: 1.3 }}>
                              {lang.native}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{lang.name}</Typography>
                            {language === lang.code && (
                              <Box sx={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: '#6c47ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MdCheckCircle size={12} color="#fff" />
                              </Box>
                            )}
                          </Box>
                        </motion.div>
                      ))}
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* TTS */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 2.5, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`, mb: 1.5 }}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>🔊 Text to Speech</Typography>
                        <Typography variant="caption" color="text.secondary">AI reads responses aloud</Typography>
                      </Box>
                      <IconButton onClick={() => setTtsEnabled(t => !t)}
                        sx={{ background: ttsEnabled ? 'linear-gradient(135deg, #6c47ff, #a78bfa)' : (isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'), color: ttsEnabled ? '#fff' : 'inherit', width: 44, height: 44 }}>
                        {ttsEnabled ? <MdVolumeUp size={20} /> : <MdVolumeOff size={20} />}
                      </IconButton>
                    </Box>

                    {/* Voice recognition info */}
                    <Box sx={{ p: 1.5, borderRadius: 2.5, background: isDark ? 'rgba(108,71,255,0.1)' : 'rgba(108,71,255,0.06)', border: `1px solid rgba(108,71,255,0.2)`, mb: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#6c47ff', display: 'block', mb: 0.5 }}>🎤 Voice Recognition</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tap the mic in Chat tab. Listens in <strong>{selectedLang?.native}</strong> ({SPEECH_LANG_CODES[language]}). Best on Chrome/Edge.
                      </Typography>
                    </Box>

                    {/* Back to Chat CTA */}
                    <Button fullWidth variant="contained" onClick={() => setActiveTab(0)} startIcon={<MdChat size={16} />}
                      sx={{ borderRadius: 2.5, fontWeight: 700, background: 'linear-gradient(135deg, #6c47ff, #a78bfa)', '&:hover': { background: 'linear-gradient(135deg, #5a38e0, #9268f5)' } }}>
                      Back to Chat
                    </Button>
                  </Box>
                )}
              </Collapse>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
