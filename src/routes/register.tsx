import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'

import { Button, Input } from '#/components/storybook'
import { useAuth } from '../auth/auth-context'
import { useRedirectIfAuthenticated } from '../auth/use-auth-redirect'
import { register } from '../../generated/api-types'

import type { RegisterRequest } from '../../generated/api-types'

export const Route = createFileRoute('/register')({ component: RegisterPage })

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  useRedirectIfAuthenticated()

  const registerMutation = useMutation({
    mutationFn: async (input: RegisterRequest) => {
      const res = await register(input)
      if (res.status === 201) return res.data // AuthResponse { token, user }
      if (res.status === 409) {
        throw new Error('An account with that email already exists.')
      }
      throw new Error('Something went wrong. Please try again.')
    },
    onSuccess: (auth) => {
      login(auth)
      void navigate({ to: '/' })
    },
  })

  const form = useForm({
    defaultValues: { name: '', email: '', password: '' },
    validators: { onSubmit: registerSchema },
    onSubmit: ({ value }) => {
      registerMutation.mutate(value)
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
        <h1 className="text-2xl font-bold">Create your account</h1>

        <form.Field name="name">
          {(field) => (
            <Input
              id={field.name}
              label="Name"
              required
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={field.state.meta.errors[0]?.message}
            />
          )}
        </form.Field>

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

        {registerMutation.isError && (
          <p className="text-sm text-red-500">
            {registerMutation.error.message}
          </p>
        )}

        <Button
          type="submit"
          disabled={registerMutation.isPending}
          className="mt-2"
        >
          {registerMutation.isPending ? 'Creating account…' : 'Sign up'}
        </Button>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
