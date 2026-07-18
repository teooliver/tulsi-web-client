import { createContext, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import {
  clearSession,
  getStoredUser,
  getToken,
  setSession,
} from './token-storage'

import type { AuthResponse, User } from '../../generated/api-types'

interface AuthContextValue {
  token: string | null
  user: User | null
  /** True until the stored session has been read from localStorage. */
  isLoading: boolean
  isAuthenticated: boolean
  login: (auth: AuthResponse) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // localStorage is browser-only, so hydrate after mount to avoid SSR mismatch.
  useEffect(() => {
    setToken(getToken())
    setUser(getStoredUser())
    setIsLoading(false)
  }, [])

  function login(auth: AuthResponse) {
    setSession(auth)
    setToken(auth.token)
    setUser(auth.user)
  }

  function logout() {
    clearSession()
    setToken(null)
    setUser(null)
    // Drop any cached per-user data (e.g. the `me` query) so a later login
    // can't briefly surface the previous user's data.
    queryClient.clear()
  }

  const value: AuthContextValue = {
    token,
    user,
    isLoading,
    isAuthenticated: token !== null,
    login,
    logout,
  }

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
