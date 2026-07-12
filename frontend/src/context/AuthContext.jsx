import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import axiosClient from '../api/axiosClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('transitops_user')
    return raw ? JSON.parse(raw) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('transitops_token'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      // Matches backend/app/routers/auth.py -> POST /auth/login
      // Expects { access_token, token_type, user: { id, name, email, role } }
      const { data } = await axiosClient.post('/auth/login', { email, password })
      localStorage.setItem('transitops_token', data.access_token)
      localStorage.setItem('transitops_user', JSON.stringify(data.user))
      setToken(data.access_token)
      setUser(data.user)
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.detail || 'Invalid email or password.'
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('transitops_token')
    localStorage.removeItem('transitops_user')
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      role: user?.role ?? null,
      loading,
      error,
      login,
      logout,
    }),
    [user, token, loading, error, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
