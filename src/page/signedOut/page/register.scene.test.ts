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
import { Message, Register, initModel, update, view } from './register'

describe('register', () => {
  test('an email that is already registered shows an error', () => {
    scene(
      { update, view },
      given(initModel()),
      type(label('Name'), 'Ada'),
      type(label('Email'), 'ada@example.com'),
      type(label('Password'), 'secret'),
      submit(role('form')),
      Command.expectExact(Register),
      Command.resolve(
        Register,
        Message.FailedRegister({ error: ApiError.Conflict() }),
      ),
      expect(role('alert')).toHaveText('That email is already registered.'),
    )
  })

  test('a validation error from the API is shown as-is', () => {
    scene(
      { update, view },
      given(initModel()),
      type(label('Name'), 'Ada'),
      type(label('Email'), 'ada@example.com'),
      type(label('Password'), 'x'),
      submit(role('form')),
      Command.resolve(
        Register,
        Message.FailedRegister({
          error: ApiError.BadRequest({ message: 'Password is too short' }),
        }),
      ),
      expect(role('alert')).toHaveText('Password is too short'),
    )
  })
})
