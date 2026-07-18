import { clearSession, getToken } from '../auth/token-storage'

const isBrowser = typeof window !== 'undefined'

// The endpoint that validates the current session. A 401 here means the token
// is genuinely no longer valid, so it's the only one we treat as "logged out".
const SESSION_ENDPOINT = '/auth/me'

/**
 * Custom fetch used by the generated API client (configured as orval's
 * `mutator`). Injects the stored bearer token and, when the session-validation
 * endpoint reports 401, clears the session and bounces to `/login`.
 */
export const customFetch = async <T>(
  url: string,
  options: RequestInit,
): Promise<T> => {
  const token = getToken()

  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(url, { ...options, headers })

  // Force a logout only when /auth/me rejects a token we actually sent. A 401
  // from any other endpoint is surfaced to the caller instead of tearing down
  // the whole session, so one misbehaving endpoint can't sign the user out.
  if (response.status === 401 && token && isSessionEndpoint(url)) {
    clearSession()
    if (isBrowser) window.location.assign('/login')
  }

  const body = [204, 205, 304].includes(response.status)
    ? null
    : await response.text()
  const data = body ? JSON.parse(body) : {}

  return { data, status: response.status, headers: response.headers } as T
}

function isSessionEndpoint(url: string): boolean {
  // `url` is the path produced by the generated client (may carry a query string).
  const path = url.split('?')[0] ?? url
  return path.endsWith(SESSION_ENDPOINT)
}
