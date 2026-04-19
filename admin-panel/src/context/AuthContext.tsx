import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import api from '../lib/api'

interface User {
  id: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      api
        .get('/v1/users/me')
        .then((res) => {
          const u = res.data.data
          if (u.role !== 'ADMIN') {
            logout()
          } else {
            setUser(u)
          }
        })
        .catch(() => {
          logout()
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [token])

  const login = async (email: string, password: string) => {
    const res = await api.post('/v1/auth/login', { email, password })
    const { access_token } = res.data.data
    localStorage.setItem('admin_token', access_token)
    setToken(access_token)
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user && user.role === 'ADMIN',
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
