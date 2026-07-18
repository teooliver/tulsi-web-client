import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { useAuth } from './auth-context'

/** Redirect to `/login` when there is no active session. */
export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({ to: redirectTo })
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo])

  return { isAuthenticated, isLoading }
}

/** Redirect away (e.g. to `/`) when the user is already signed in. */
export function useRedirectIfAuthenticated(redirectTo = '/') {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      void navigate({ to: redirectTo })
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo])

  return { isAuthenticated, isLoading }
}
