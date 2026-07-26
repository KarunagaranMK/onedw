import { useState, useRef, useEffect, useCallback } from 'react'
import { Box, Typography, Button, IconButton, Paper, LinearProgress } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { MdMic, MdStop, MdPlayArrow, MdPause, MdDelete, MdCloudUpload } from 'react-icons/md'
import { uploadMedia } from '../../services/issueService'

const MAX_DURATION = 120
const ACCEPTED_TYPES = [
  { mime: 'audio/webm;codecs=opus', ext: 'webm' },
  { mime: 'audio/mp4', ext: 'm4a' },
  { mime: 'audio/wav', ext: 'wav' },
  { mime: 'audio/mpeg', ext: 'mp3' },
  { mime: 'audio/webm', ext: 'webm' },
]

const formatTime = (sec) => {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const getSupportedMime = () => {
  for (const t of ACCEPTED_TYPES) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t.mime)) {
      return t
    }
  }
  return ACCEPTED_TYPES[ACCEPTED_TYPES.length - 1]
}

const WaveformBars = ({ bars = 40, animate = false, heights = null }) => {
  const defaultHeights = useRef(
    Array.from({ length: bars }, () => 3 + Math.random() * 27)
  )
  const h = heights || defaultHeights.current
  return (
    <Box sx={{ display: 'flex', alignItems: 'end', gap: '2px', height: 32, px: 1 }}>
      {h.map((val, i) => (
        <Box
          key={i}
          sx={{
            width: 2,
            height: animate ? val : 3,
            borderRadius: 1,
            background: animate
              ? 'linear-gradient(to top, #ff416c, #ff4b2b)'
              : 'rgba(99,102,241,0.3)',
            transition: animate ? 'height 0.1s ease' : 'height 0.3s ease',
            animation: animate
              ? `waveBar 0.${3 + (i % 5)}s ease-in-out ${(i % 7) * 0.05}s infinite alternate`
              : 'none',
            '@keyframes waveBar': {
              from: { height: `${Math.max(3, val - 10)}px` },
              to: { height: `${Math.min(30, val + 8)}px` },
            },
          }}
        />
      ))}
    </Box>
  )
}

const AudioLevels = ({ active }) => (
  <Box sx={{ display: 'flex', gap: '3px', alignItems: 'center', height: 24 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <motion.div
        key={i}
        animate={active ? { scaleY: [0.2, 1, 0.2] } : { scaleY: 0.2 }}
        transition={
          active
            ? { duration: 0.5 + (i % 3) * 0.15, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.3 }
        }
        style={{
          width: 3,
          height: 20,
          background: 'linear-gradient(to top, #ff416c, #ff4b2b)',
          borderRadius: 2,
          transformOrigin: 'bottom',
        }}
      />
    ))}
  </Box>
)

const VoiceRecorder = ({ onRecordingComplete }) => {
  const [state, setState] = useState('idle')
  const [elapsed, setElapsed] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioMeta, setAudioMeta] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playProgress, setPlayProgress] = useState(0)
  const [playDuration, setPlayDuration] = useState(0)
  const [playCurrent, setPlayCurrent] = useState(0)
  const [error, setError] = useState(null)

  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const audioRef = useRef(null)
  const playTimerRef = useRef(null)
  const blobRef = useRef(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const clearPlayTimer = useCallback(() => {
    if (playTimerRef.current) {
      clearInterval(playTimerRef.current)
      playTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearTimer()
      clearPlayTimer()
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    setAudioUrl(null)
    setAudioMeta(null)
    setIsPlaying(false)
    setPlayProgress(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const { mime, ext } = getSupportedMime()
      const recorder = new MediaRecorder(stream, { mimeType: mime })
      chunksRef.current = []
      recorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: mime })
        blobRef.current = blob
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setAudioMeta({ ext, size: blob.size })
        setState('recorded')
        clearTimer()
      }

      recorder.start(100)
      setState('recording')
      setElapsed(0)

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= MAX_DURATION) {
            recorder.stop()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch {
      setError('Microphone access denied. Please allow microphone permissions.')
    }
  }, [clearTimer])

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }, [])

  const deleteRecording = useCallback(() => {
    clearTimer()
    clearPlayTimer()
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    blobRef.current = null
    setAudioUrl(null)
    setAudioMeta(null)
    setIsPlaying(false)
    setPlayProgress(0)
    setElapsed(0)
    setState('idle')
  }, [audioUrl, clearTimer, clearPlayTimer])

  const togglePlayback = useCallback(() => {
    if (!audioUrl) return

    if (!audioRef.current) {
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      audio.onloadedmetadata = () => {
        setPlayDuration(audio.duration)
      }
      audio.ontimeupdate = () => {
        setPlayCurrent(audio.currentTime)
        if (audio.duration > 0) {
          setPlayProgress((audio.currentTime / audio.duration) * 100)
        }
      }
      audio.onended = () => {
        setIsPlaying(false)
        setPlayProgress(0)
        setPlayCurrent(0)
        clearPlayTimer()
      }
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      clearPlayTimer()
    } else {
      if (playProgress >= 100) {
        audioRef.current.currentTime = 0
        setPlayCurrent(0)
        setPlayProgress(0)
      }
      audioRef.current.play()
      setIsPlaying(true)
      playTimerRef.current = setInterval(() => {
        if (audioRef.current) {
          setPlayCurrent(audioRef.current.currentTime)
        }
      }, 100)
    }
  }, [audioUrl, isPlaying, playProgress, clearPlayTimer])

  const uploadRecording = useCallback(async () => {
    if (!blobRef.current) return
    setState('uploading')
    setUploadProgress(10)

    try {
      const { ext } = audioMeta
      const mimeMap = {
        webm: 'audio/webm',
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        m4a: 'audio/mp4',
      }
      const file = new File(
        [blobRef.current],
        `recording_${Date.now()}.${ext}`,
        { type: mimeMap[ext] || 'audio/webm' }
      )

      setUploadProgress(35)
      const response = await uploadMedia(file)
      setUploadProgress(100)

      setTimeout(() => {
        setState('completed')
        onRecordingComplete?.({
          url: response.url || response.file_url || response.data?.url,
          media_type: 'audio',
          filename: file.name,
          size: file.size,
        })
      }, 400)
    } catch {
      setError('Upload failed. Please try again.')
      setState('recorded')
      setUploadProgress(0)
    }
  }, [audioMeta, onRecordingComplete])

  const maxReached = elapsed >= MAX_DURATION

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 4,
        border: '1px solid',
        borderColor: state === 'recording' ? 'rgba(255,65,108,0.3)' : 'rgba(99,102,241,0.15)',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(99,102,241,0.03))',
        backdropFilter: 'blur(20px)',
        boxShadow:
          state === 'recording'
            ? '0 0 0 4px rgba(255,65,108,0.08), 0 8px 32px rgba(255,65,108,0.12)'
            : '0 8px 32px rgba(0,0,0,0.06)',
        transition: 'all 0.4s ease',
        p: 4,
      }}
    >
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 2,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <Typography variant="body2" color="error" fontWeight={500}>
                {error}
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5 }}>
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <WaveformBars bars={40} animate={false} />
                <IconButton
                  onClick={startRecording}
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    boxShadow: '0 4px 24px rgba(99,102,241,0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                      transform: 'scale(1.08)',
                      boxShadow: '0 8px 32px rgba(99,102,241,0.5)',
                    },
                  }}
                >
                  <MdMic size={36} />
                </IconButton>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body1" fontWeight={600} color="text.primary">
                    Tap to Record
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Up to 2 minutes of audio
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          )}

          {state === 'recording' && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <WaveformBars bars={40} animate={true} />
                <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute',
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(255,65,108,0.3), transparent 70%)',
                    }}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                    style={{
                      position: 'absolute',
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(255,75,43,0.2), transparent 70%)',
                    }}
                  />
                  <IconButton
                    onClick={stopRecording}
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ff416c, #ff4b2b)',
                      color: 'white',
                      boxShadow: '0 0 0 6px rgba(255,65,108,0.2), 0 4px 24px rgba(255,65,108,0.4)',
                      position: 'relative',
                      zIndex: 1,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #e6375b, #e6431f)',
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    <MdStop size={36} />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <AudioLevels active={true} />
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    fontFamily="monospace"
                    sx={{ color: maxReached ? 'error.main' : 'text.primary', minWidth: 72, textAlign: 'center' }}
                  >
                    {formatTime(elapsed)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {maxReached ? 'Maximum recording reached' : `${formatTime(MAX_DURATION - elapsed)} remaining`}
                </Typography>
              </Box>
            </motion.div>
          )}

          {(state === 'recorded' || state === 'uploading' || state === 'completed') && (
            <motion.div
              key="review"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 280 }}>
                <WaveformBars
                  bars={40}
                  animate={state === 'uploading' || state === 'completed'}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <IconButton
                    onClick={togglePlayback}
                    disabled={state === 'uploading' || state === 'completed'}
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: 'white',
                      boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        transform: 'scale(1.06)',
                      },
                      '&.Mui-disabled': {
                        background: 'rgba(99,102,241,0.3)',
                        color: 'rgba(255,255,255,0.6)',
                      },
                    }}
                  >
                    {isPlaying ? <MdPause size={24} /> : <MdPlayArrow size={24} />}
                  </IconButton>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                      {formatTime(playCurrent)} / {formatTime(playDuration)}
                    </Typography>
                    <Box sx={{ mt: 0.5, height: 4, borderRadius: 2, background: 'rgba(99,102,241,0.1)', overflow: 'hidden' }}>
                      <Box
                        sx={{
                          height: '100%',
                          width: `${playProgress}%`,
                          borderRadius: 2,
                          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                          transition: 'width 0.1s linear',
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {audioMeta && (
                  <Typography variant="caption" color="text.secondary">
                    {audioMeta.ext.toUpperCase()} · {formatBytes(audioMeta.size)}
                  </Typography>
                )}

                {state === 'uploading' && (
                  <Box sx={{ width: '100%' }}>
                    <LinearProgress
                      variant="determinate"
                      value={uploadProgress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'rgba(99,102,241,0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }} display="block" textAlign="center">
                      Uploading... {Math.round(uploadProgress)}%
                    </Typography>
                  </Box>
                )}

                <AnimatePresence>
                  {state === 'completed' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#22c55e' }}>
                        Voice recording uploaded successfully
                      </Typography>
                    </motion.div>
                  )}
                </AnimatePresence>

                {state === 'recorded' && (
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<MdDelete />}
                      onClick={deleteRecording}
                      sx={{
                        borderColor: 'rgba(239,68,68,0.3)',
                        color: '#ef4444',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        '&:hover': {
                          borderColor: '#ef4444',
                          background: 'rgba(239,68,68,0.06)',
                        },
                      }}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<MdCloudUpload />}
                      onClick={uploadRecording}
                      sx={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                          boxShadow: '0 6px 20px rgba(99,102,241,0.45)',
                        },
                      }}
                    >
                      Upload
                    </Button>
                  </Box>
                )}

                {state !== 'uploading' && state !== 'completed' && (
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<MdMic />}
                    onClick={() => {
                      deleteRecording()
                      setTimeout(startRecording, 100)
                    }}
                    sx={{
                      textTransform: 'none',
                      color: '#6366f1',
                      fontWeight: 600,
                      '&:hover': { background: 'rgba(99,102,241,0.06)' },
                    }}
                  >
                    Re-record
                  </Button>
                )}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Paper>
  )
}

export default VoiceRecorder
