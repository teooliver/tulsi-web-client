import {
  Command,
  expect,
  given,
  label,
  role,
  scene,
  submit,
  type,
} from 'foldkit/scene'
import { describe, test } from 'vitest'

import { ApiError } from '../../../api/client'
import { Message, SignIn, initModel, update, view } from './signIn'

const signInButton = role('button', { name: 'Sign in' })

describe('sign in', () => {
  test('the button is disabled until both fields are filled in', () => {
    scene(
      { update, view },
      given(initModel()),
      expect(signInButton).toBeDisabled(),
      type(label('Email'), 'ada@example.com'),
      expect(signInButton).toBeDisabled(),
      type(label('Password'), 'secret'),
      expect(signInButton).toBeEnabled(),
    )
  })

  test('wrong credentials show an error', () => {
    scene(
      { update, view },
      given(initModel()),
      type(label('Email'), 'ada@example.com'),
      type(label('Password'), 'wrong'),
      submit(role('form')),
      expect(role('button', { name: 'Signing in…' })).toBeDisabled(),
      Command.resolve(
        SignIn,
        Message.FailedSignIn({ error: ApiError.Unauthorized() }),
      ),
      expect(role('alert')).toHaveText('Incorrect email or password.'),
      expect(signInButton).toBeEnabled(),
    )
  })

  test('an unreachable API shows a connection error', () => {
    scene(
      { update, view },
      given(initModel()),
      type(label('Email'), 'ada@example.com'),
      type(label('Password'), 'secret'),
      submit(role('form')),
      Command.resolve(
        SignIn,
        Message.FailedSignIn({ error: ApiError.NetworkError() }),
      ),
      expect(role('alert')).toHaveText(
        "Can't reach Tulsi right now. Check your connection and try again.",
      ),
    )
  })
})
