import { Redacted } from 'effect'
import { Command, given, message, model, story } from 'foldkit/story'
import { modifyFields } from 'foldkit/struct'
import { describe, expect, test } from 'vitest'

import { ApiError } from '../../../api/client'
import { makePassword } from '../../../domain/password'
import { Submission } from '../submission'
import { Message, SignIn, initModel, update } from './signIn'

const filledIn = modifyFields(initModel(), {
  email: () => '  ada@example.com ',
  password: () => makePassword('secret'),
})

describe('sign in', () => {
  test('submitting an incomplete form does nothing', () => {
    story(
      update,
      given(initModel()),
      message(Message.SubmittedForm()),
      Command.expectNone(),
    )
  })

  test('submitting sends the trimmed email and keeps the password redacted', () => {
    const submit = update(filledIn, Message.SubmittedForm())

    expect(submit.model.submission).toEqual(Submission.Submitting())
    const args = submit.commands?.[0]?.args
    expect(args?.['email']).toBe('ada@example.com')
    expect(Redacted.isRedacted(args?.['password'])).toBe(true)
  })

  test('submitting again while a sign in is in flight does nothing', () => {
    story(
      update,
      given(
        modifyFields(filledIn, { submission: () => Submission.Submitting() }),
      ),
      message(Message.SubmittedForm()),
      Command.expectNone(),
    )
  })

  test('a failed sign in keeps the form and records the error', () => {
    story(
      update,
      given(filledIn),
      message(Message.SubmittedForm()),
      Command.resolve(
        SignIn,
        Message.FailedSignIn({ error: ApiError.Unauthorized() }),
      ),
      model(model => {
        expect(model.email).toBe('  ada@example.com ')
        expect(model.submission).toEqual(
          Submission.Failed({ error: ApiError.Unauthorized() }),
        )
      }),
    )
  })
})
