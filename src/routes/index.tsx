import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { Button } from '#/components/storybook'
import { useAuth } from '../auth/auth-context'
import { useRequireAuth } from '../auth/use-auth-redirect'
import { me } from '../../generated/api-types'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { isLoading, isAuthenticated } = useRequireAuth()
  const { logout } = useAuth()

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await me()
      if (res.status === 200) return res.data
      throw new Error('Failed to load profile')
    },
    // Only fetch once we know there's a session (avoids a guaranteed 401).
    enabled: isAuthenticated,
  })

  // Avoid a flash of protected content while we resolve / redirect.
  if (isLoading || !isAuthenticated) {
    return null
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
      <p className="mt-4 text-lg">
        {meQuery.isPending
          ? 'Loading your profile…'
          : meQuery.isError
            ? 'Could not load your profile.'
            : `Signed in as ${meQuery.data.name || meQuery.data.email}.`}
      </p>
      <Button className="mt-6" variant="secondary" onClick={logout}>
        Sign out
      </Button>
    </div>
  )
}
