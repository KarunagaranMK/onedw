import { createContext, useState, useEffect } from 'react'
import api from '../services/api'

const TOKEN_KEY = 'onedw-token'
const USER_KEY = 'onedw-user'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const persistAuthSession = (data) => {
    const token = data?.access_token || data?.token
    const savedUser = data?.user

    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    }

    if (savedUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(savedUser))
      setUser(savedUser)
      return savedUser
    }

    return null
  }

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const savedUser = localStorage.getItem(USER_KEY)

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem(USER_KEY)
      }
    }

    setLoading(false)
  }, [])

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return persistAuthSession(response.data)
  }

  const register = async (payload) => {
    const response = await api.post('/auth/register', payload)
    return persistAuthSession(response.data)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}