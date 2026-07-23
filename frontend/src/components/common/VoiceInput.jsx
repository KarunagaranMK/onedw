import { useState, useRef } from 'react'
import { IconButton, Tooltip, CircularProgress, Box, Typography, Chip } from '@mui/material'
import { MdMic, MdMicOff, MdStop } from 'react-icons/md'
import { processNLPText } from '../../services/aiService'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * VoiceInput — Phase 3 component.
 * Uses the Web Speech API to record voice, sends transcript to Gemini NLP,
 * and fires onResult(parsedFields) for parent to auto-fill the form.
 */
const VoiceInput = ({ onResult, onError }) => {
  const [isListening, setIsListening] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      onError?.('Voice input is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-IN'

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript('')
    }

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript
      setTranscript(text)
      setIsListening(false)
      setProcessing(true)
      try {
        const result = await processNLPText(text)
        onResult?.(result)
      } catch {
        onError?.('Failed to parse voice input. Please try again.')
      } finally {
        setProcessing(false)
      }
    }

    recognition.onerror = (e) => {
      setIsListening(false)
      setProcessing(false)
      onError?.(`Voice error: ${e.error}`)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
      <Tooltip
        title={
          isListening
            ? 'Click to stop recording'
            : processing
            ? 'Processing with AI...'
            : 'Click to speak your request'
        }
      >
        <span>
          <IconButton
            onClick={isListening ? stopListening : startListening}
            disabled={processing}
            size="large"
            sx={{
              background: isListening
                ? 'linear-gradient(135deg, #ff416c, #ff4b2b)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              width: 56,
              height: 56,
              boxShadow: isListening
                ? '0 0 0 8px rgba(255,65,108,0.25), 0 4px 20px rgba(255,65,108,0.4)'
                : '0 4px 20px rgba(99,102,241,0.4)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: isListening
                  ? 'linear-gradient(135deg, #e6375b, #e6431f)'
                  : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                transform: 'scale(1.05)',
              },
              '&.Mui-disabled': {
                background: 'rgba(99,102,241,0.4)',
                color: 'rgba(255,255,255,0.7)',
              },
            }}
          >
            {processing ? (
              <CircularProgress size={24} color="inherit" />
            ) : isListening ? (
              <MdStop size={24} />
            ) : (
              <MdMic size={24} />
            )}
          </IconButton>
        </span>
      </Tooltip>

      <Box>
        <Typography variant="caption" color="text.secondary" display="block">
          {isListening ? '🔴 Listening...' : processing ? '🤖 AI Processing...' : '🎤 Voice Input'}
        </Typography>
        <AnimatePresence>
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Typography variant="caption" sx={{ color: '#6366f1', fontStyle: 'italic' }}>
                "{transcript}"
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
        {!isListening && !processing && !transcript && (
          <Typography variant="caption" color="text.disabled">
            Say: "I need an electrician tomorrow at 5 PM near Tambaram"
          </Typography>
        )}
      </Box>

      {isListening && (
        <Box sx={{ display: 'flex', gap: '3px', alignItems: 'center', ml: 1 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              animate={{ scaleY: [0.3, 1, 0.3] }}
              transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
              style={{
                width: 4,
                height: 20,
                background: '#ff416c',
                borderRadius: 2,
                transformOrigin: 'bottom',
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

export default VoiceInput
