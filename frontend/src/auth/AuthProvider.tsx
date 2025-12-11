import { createContext, useContext, useMemo, useState } from 'react'
import { login, register } from '../api/client'

type AuthCtx = {
  token: string | null
  setToken: (t: string | null) => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (p: { email: string, password: string, firstName: string, lastName: string }) => Promise<void>
}

const C = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const value = useMemo<AuthCtx>(() => ({
    token,
    setToken: (t) => { t ? localStorage.setItem('token', t) : localStorage.removeItem('token'); setToken(t) },
    signIn: async (email, password) => { const r = await login(email, password); value.setToken(r.token) },
    signUp: async (p) => { const r = await register(p); value.setToken(r.token) }
  }), [token])
  return <C.Provider value={value}>{children}</C.Provider>
}

export function useAuth() {
  const v = useContext(C)
  if (!v) throw new Error('AuthProvider manquant')
  return v
}

