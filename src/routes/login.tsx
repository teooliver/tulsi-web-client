import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'

import { Button, Input } from '#/components/storybook'
import { useAuth } from '../auth/auth-context'
import { useRedirectIfAuthenticated } from '../auth/use-auth-redirect'
import { login as loginRequest } from '../../generated/api-types'

import type { LoginRequest } from '../../generated/api-types'

export const Route = createFileRoute('/login')({ component: LoginPage })

const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  useRedirectIfAuthenticated()

  const loginMutation = useMutation({
    mutationFn: async (input: LoginRequest) => {
      const res = await loginRequest(input)
      if (res.status === 200) return res.data // AuthResponse { token, user }
      if (res.status === 401) throw new Error('Incorrect email or password.')
      throw new Error('Something went wrong. Please try again.')
    },
    onSuccess: (auth) => {
      login(auth)
      void navigate({ to: '/' })
    },
  })

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: loginSchema },
    onSubmit: ({ value }) => {
      loginMutation.mutate(value)
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          void form.handleSubmit()
        }}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        <h1 className="text-2xl font-bold">Sign in</h1>

        <form.Field name="email">
          {(field) => (
            <Input
              id={field.name}
              label="Email"
              type="email"
              required
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={field.state.meta.errors[0]?.message}
            />
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <Input
              id={field.name}
              label="Password"
              type="password"
              required
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={field.state.meta.errors[0]?.message}
            />
          )}
        </form.Field>

        {loginMutation.isError && (
          <p className="text-sm text-red-500">{loginMutation.error.message}</p>
        )}

        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="mt-2"
        >
          {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  )
}
