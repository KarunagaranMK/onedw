import { useState, useCallback, useRef } from 'react'
import {
  Box, Typography, Button, IconButton, LinearProgress, Paper, Alert, Chip,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdCloudUpload, MdClose, MdRefresh, MdImage, MdVideocam, MdError,
} from 'react-icons/md'
import { uploadMedia } from '../../services/issueService'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime']
const IMAGE_MAX_SIZE = 20 * 1024 * 1024
const VIDEO_MAX_SIZE = 100 * 1024 * 1024

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const getFileType = (file) => {
  if (ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'image'
  if (ACCEPTED_VIDEO_TYPES.includes(file.type)) return 'video'
  return null
}

const validateFile = (file, imageCount, videoCount, maxImages, maxVideos) => {
  const type = getFileType(file)
  if (!type) {
    return 'Unsupported file type. Use JPG, PNG, WebP for images or MP4, MOV for videos.'
  }
  if (type === 'image') {
    if (file.size > IMAGE_MAX_SIZE) return `Image exceeds ${formatBytes(IMAGE_MAX_SIZE)} limit.`
    if (imageCount >= maxImages) return `Maximum ${maxImages} images allowed.`
  }
  if (type === 'video') {
    if (file.size > VIDEO_MAX_SIZE) return `Video exceeds ${formatBytes(VIDEO_MAX_SIZE)} limit.`
    if (videoCount >= maxVideos) return `Maximum ${maxVideos} videos allowed.`
  }
  return null
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const MediaThumbnail = ({ item, onRemove, onRetry }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.25 }}
  >
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        width: 120,
        height: 120,
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: item.status === 'error' ? 'error.main' : 'divider',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.3s ease',
        '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.15)' },
      }}
    >
      {item.status === 'uploading' && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 3,
          }}
        >
          <LinearProgress
            variant="determinate"
            value={item.progress || 0}
            sx={{
              height: 4,
              backgroundColor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              },
            }}
          />
        </Box>
      )}

      {item.status === 'error' && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(239,68,68,0.08)',
            zIndex: 2,
          }}
        >
          <MdError size={28} color="#ef4444" />
          <Typography variant="caption" color="error" fontWeight={600} mt={0.5} sx={{ fontSize: '0.65rem' }}>
            Failed
          </Typography>
          <IconButton
            size="small"
            onClick={() => onRetry(item.id)}
            sx={{
              mt: 0.5,
              backgroundColor: 'rgba(239,68,68,0.12)',
              '&:hover': { backgroundColor: 'rgba(239,68,68,0.25)' },
              width: 24,
              height: 24,
            }}
          >
            <MdRefresh size={14} color="#ef4444" />
          </IconButton>
        </Box>
      )}

      {item.type === 'video' && item.status !== 'error' && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4))',
          }}
        >
          {item.preview ? (
            <Box
              component="video"
              src={item.preview}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <MdVideocam size={32} color="white" />
          )}
          <Box
            sx={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              backgroundColor: 'rgba(0,0,0,0.65)',
              borderRadius: 1,
              px: 0.5,
              py: 0.15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MdVideocam size={12} color="white" />
          </Box>
        </Box>
      )}

      {item.type === 'image' && item.preview && item.status !== 'error' && (
        <Box
          component="img"
          src={item.preview}
          alt={item.filename}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {item.type === 'image' && !item.preview && item.status !== 'error' && (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
          }}
        >
          <MdImage size={32} color="#6366f1" />
        </Box>
      )}

      {item.status !== 'uploading' && (
        <IconButton
          size="small"
          onClick={() => onRemove(item.id)}
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            zIndex: 4,
            backgroundColor: 'rgba(0,0,0,0.55)',
            color: 'white',
            width: 24,
            height: 24,
            '&:hover': { backgroundColor: 'rgba(239,68,68,0.85)' },
            transition: 'background-color 0.2s ease',
          }}
        >
          <MdClose size={14} />
        </IconButton>
      )}

      {item.status !== 'error' && (
        <Box
          sx={{
            position: 'absolute',
            bottom: item.type === 'video' ? 26 : 4,
            left: 4,
            backgroundColor: 'rgba(0,0,0,0.55)',
            borderRadius: 1,
            px: 0.5,
            py: 0.1,
          }}
        >
          <Typography variant="caption" color="white" sx={{ fontSize: '0.6rem' }}>
            {formatBytes(item.size)}
          </Typography>
        </Box>
      )}
    </Paper>
  </motion.div>
)

const MediaUploader = ({
  onMediaChange,
  maxImages = 10,
  maxVideos = 2,
  existingMedia = [],
}) => {
  const [items, setItems] = useState(() =>
    existingMedia.map((m) => ({
      id: generateId(),
      type: m.media_type,
      filename: m.filename,
      size: m.size || 0,
      preview: m.thumbnail_url || m.url,
      url: m.url,
      media_type: m.media_type,
      status: 'completed',
      progress: 100,
    }))
  )
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const getMediaCounts = useCallback(
    (list) => {
      const images = list.filter((i) => i.type === 'image').length
      const videos = list.filter((i) => i.type === 'video').length
      return { images, videos }
    },
    []
  )

  const notifyChange = useCallback(
    (list) => {
      const uploaded = list
        .filter((i) => i.status === 'completed')
        .map((i) => ({
          url: i.url,
          media_type: i.media_type,
          filename: i.filename,
          size: i.size,
          thumbnail_url: i.preview,
        }))
      onMediaChange?.(uploaded)
    },
    [onMediaChange]
  )

  const removeItem = useCallback(
    (id) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== id)
        notifyChange(next)
        return next
      })
      setError('')
    },
    [notifyChange]
  )

  const uploadMediaWithProgress = useCallback(
    async (file, id) => {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'uploading', progress: 15 } : i))
      )

      try {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, progress: 40 } : i))
        )

        const response = await uploadMedia(file)

        setItems((prev) => {
          const next = prev.map((i) => {
            if (i.id !== id) return i
            return {
              ...i,
              status: 'completed',
              progress: 100,
              url: response.url || response.file_url || response.data?.url,
              media_type: response.media_type || response.file_type || i.media_type,
              preview: response.thumbnail_url || response.url || i.preview,
            }
          })
          notifyChange(next)
          return next
        })
      } catch (err) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, status: 'error', progress: 0 } : i))
        )
      }
    },
    [notifyChange]
  )

  const retryUpload = useCallback(
    async (id) => {
      let fileRef = null
      setItems((prev) => {
        const item = prev.find((i) => i.id === id)
        if (!item?.file) return prev
        fileRef = item.file
        return prev.map((i) => (i.id === id ? { ...i, status: 'uploading', progress: 0 } : i))
      })
      if (fileRef) {
        uploadMediaWithProgress(fileRef, id)
      }
    },
    [uploadMediaWithProgress]
  )

  const processFiles = useCallback(
    async (fileList) => {
      setError('')
      const files = Array.from(fileList)

      if (files.length === 0) return

      const { images: currentImages, videos: currentVideos } = getMediaCounts(items)
      let pendingImages = currentImages
      let pendingVideos = currentVideos

      const validItems = []
      for (const file of files) {
        const type = getFileType(file)
        const validationError = validateFile(file, pendingImages, pendingVideos, maxImages, maxVideos)
        if (validationError) {
          setError(validationError)
          continue
        }
        if (type === 'image') pendingImages++
        if (type === 'video') pendingVideos++

        const id = generateId()
        const preview = type === 'image' ? URL.createObjectURL(file) : null
        validItems.push({
          id,
          file,
          type,
          filename: file.name,
          size: file.size,
          media_type: type,
          preview,
          url: null,
          status: 'uploading',
          progress: 0,
        })
      }

      if (validItems.length === 0) return

      setItems((prev) => {
        const next = [...prev, ...validItems]
        return next
      })

      for (const item of validItems) {
        uploadMediaWithProgress(item.file, item.id)
      }
    },
    [items, getMediaCounts, maxImages, maxVideos, uploadMediaWithProgress]
  )

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      if (e.dataTransfer.files?.length) {
        processFiles(e.dataTransfer.files)
      }
    },
    [processFiles]
  )

  const handleFileSelect = useCallback(
    (e) => {
      if (e.target.files?.length) {
        processFiles(e.target.files)
        e.target.value = ''
      }
    },
    [processFiles]
  )

  const { images: imageCount, videos: videoCount } = getMediaCounts(items)
  const totalMedia = imageCount + videoCount
  const canAddMore = imageCount < maxImages || videoCount < maxVideos

  return (
    <Box sx={{ width: '100%' }}>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert
              severity="error"
              onClose={() => setError('')}
              sx={{ mb: 2, borderRadius: 2 }}
            >
              {error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Paper
        elevation={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => canAddMore && fileInputRef.current?.click()}
        sx={{
          position: 'relative',
          border: '2px dashed',
          borderColor: isDragging ? '#6366f1' : 'rgba(99,102,241,0.25)',
          borderRadius: 3,
          p: 4,
          textAlign: 'center',
          cursor: canAddMore ? 'pointer' : 'default',
          background: isDragging
            ? 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))'
            : 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(99,102,241,0.03))',
          transition: 'all 0.3s ease',
          boxShadow: isDragging
            ? '0 0 0 4px rgba(99,102,241,0.12), 0 8px 32px rgba(99,102,241,0.15)'
            : '0 2px 12px rgba(0,0,0,0.04)',
          '&:hover': canAddMore
            ? {
                borderColor: '#6366f1',
                boxShadow: '0 0 0 4px rgba(99,102,241,0.08), 0 8px 24px rgba(0,0,0,0.06)',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(139,92,246,0.04))',
              }
            : {},
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/quicktime"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <motion.div
          animate={isDragging ? { scale: 1.05, y: -4 } : { scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))',
              transition: 'all 0.3s ease',
            }}
          >
            <MdCloudUpload size={32} color="#6366f1" />
          </Box>
        </motion.div>

        <Typography variant="subtitle1" fontWeight={700} color="text.primary" gutterBottom>
          {isDragging ? 'Drop your files here' : 'Drag & drop media here'}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          or click to browse your files
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Chip
            icon={<MdImage size={14} />}
            label={`${imageCount}/${maxImages} images`}
            size="small"
            variant="outlined"
            sx={{
              borderColor: 'rgba(99,102,241,0.3)',
              color: imageCount >= maxImages ? '#ef4444' : '#6366f1',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
          <Chip
            icon={<MdVideocam size={14} />}
            label={`${videoCount}/${maxVideos} videos`}
            size="small"
            variant="outlined"
            sx={{
              borderColor: 'rgba(139,92,246,0.3)',
              color: videoCount >= maxVideos ? '#ef4444' : '#8b5cf6',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" mt={1.5} sx={{ opacity: 0.7 }}>
          JPG, PNG, WebP up to 20MB · MP4, MOV up to 100MB
        </Typography>
      </Paper>

      <AnimatePresence>
        {totalMedia > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Box sx={{ mt: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.primary" mb={1.5}>
                Selected Media ({totalMedia})
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  p: 2,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.03), rgba(139,92,246,0.03))',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <MediaThumbnail
                      key={item.id}
                      item={item}
                      onRemove={removeItem}
                      onRetry={retryUpload}
                    />
                  ))}
                </AnimatePresence>
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}

export default MediaUploader
