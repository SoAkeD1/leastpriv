import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, setAuthToken, type LoginInput, type SignupInput, type UserOut } from './api'

interface AuthContextValue {
  user: UserOut | null
  loading: boolean
  login: (input: LoginInput) => Promise<void>
  signup: (input: SignupInput) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'leastpriv_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setLoading(false); return }
    setAuthToken(token)
    api.me()
      .then(setUser)
      .catch(() => { localStorage.removeItem(TOKEN_KEY); setAuthToken(null) })
      .finally(() => setLoading(false))
  }, [])

  async function login(input: LoginInput) {
    const res = await api.login(input)
    localStorage.setItem(TOKEN_KEY, res.access_token)
    setAuthToken(res.access_token)
    setUser(res.user)
  }

  async function signup(input: SignupInput) {
    const res = await api.signup(input)
    localStorage.setItem(TOKEN_KEY, res.access_token)
    setAuthToken(res.access_token)
    setUser(res.user)
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setAuthToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
