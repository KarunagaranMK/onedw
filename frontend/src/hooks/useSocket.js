import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { API_BASE } from '../config/constants'

export const useSocket = (token) => {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!token) return

    const socket = io(API_BASE, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Socket connected')
    })

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message)
    })

    return () => {
      socket.disconnect()
    }
  }, [token])

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data)
  }, [])

  const on = useCallback((event, callback) => {
    socketRef.current?.on(event, callback)
    return () => socketRef.current?.off(event, callback)
  }, [])

  return { socket: socketRef.current, emit, on }
}
