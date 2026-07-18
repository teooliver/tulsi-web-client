import type { AuthResponse, User } from '../../generated/api-types'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

const isBrowser = typeof window !== 'undefined'

export function getToken(): string | null {
  return isBrowser ? localStorage.getItem(TOKEN_KEY) : null
}

export function getStoredUser(): User | null {
  if (!isBrowser) return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null

  const parsed = parseUser(raw)
  if (!parsed) localStorage.removeItem(USER_KEY)
  return parsed
}

export function setSession(auth: AuthResponse): void {
  if (!isBrowser) return
  localStorage.setItem(TOKEN_KEY, auth.token)
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user))
}

export function clearSession(): void {
  if (!isBrowser) return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function parseUser(raw: string): User | null {
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}
