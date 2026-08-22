import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import api, { ensureSession } from '../lib/api'
import {
  clearSession,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '../lib/tokenStore'

interface User {
  id: string
  email: string
  role: string
  display_name?: string
  avatar_url?: string
}

interface AuthContextType {
  user: User | null
  loginWithGoogle: (idToken: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    const refreshToken = getRefreshToken()
    clearSession()
    setUser(null)

    // Best effort: revoke the chain server-side rather than leaving it alive
    // until it expires. A failure here must not trap the admin in the panel.
    if (refreshToken) {
      void api
        .post('/v1/auth/logout', { refresh_token: refreshToken })
        .catch(() => {})
    }
  }, [])

  // On load there is no access token — it only ever lived in memory — so the
  // stored refresh token is what restores the session.
  useEffect(() => {
    let active = true

    const restore = async () => {
      const token = await ensureSession()
      if (!token) {
        if (active) setIsLoading(false)
        return
      }

      try {
        // Admin access is enforced server-side by the email allowlist on the
        // /admin endpoints, so any authenticated user may load the panel; the
        // API simply returns 403 for non-admins.
        const res = await api.get('/v1/users/me')
        if (active) setUser(res.data.data)
      } catch {
        clearSession()
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void restore()
    return () => {
      active = false
    }
  }, [])

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const res = await api.post('/v1/auth/oauth/google', { id_token: idToken })
    const session = res.data.data

    setAccessToken(session.access_token)
    setRefreshToken(session.refresh_token)
    setUser(session.user)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loginWithGoogle,
        logout,
        isAuthenticated: !!user,
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
