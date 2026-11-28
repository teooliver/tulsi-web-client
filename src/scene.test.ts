import {
  Command,
  click,
  expect,
  given,
  label,
  role,
  scene,
  submit,
  text,
  type,
} from 'foldkit/scene'
import { describe, test } from 'vitest'

import {
  ClearSession,
  RedirectToHome,
  RedirectToSignIn,
  SaveSession,
} from './command'
import { Message } from './message'
import { SignedIn, SignedOut } from './model'
import { SignIn, Message as SignInMessage } from './page/signedOut/page/signIn'
import { AppRoute } from './route'
import { adaSession } from './testing/fixture'
import { update } from './update'
import { view } from './view'

describe('session flow', () => {
  test('signing in saves the Session and lands on Home', () => {
    scene(
      { update, view },
      given(SignedOut.init(AppRoute.SignIn())),
      type(label('Email'), 'ada@example.com'),
      type(label('Password'), 'secret'),
      submit(role('form')),
      Command.resolve(
        SignIn,
        SignInMessage.SucceededSignIn({ session: adaSession }),
      ),
      Command.expectExact(SaveSession, RedirectToHome),
      Command.resolveAll(
        [SaveSession, Message.SucceededSaveSession()],
        [RedirectToHome, Message.CompletedNavigateInternal()],
      ),
      expect(role('heading', { name: 'Welcome, Ada.' })).toExist(),
      expect(text('Signed in as ada@example.com')).toExist(),
    )
  })

  test('signing out clears the Session and returns to sign in', () => {
    scene(
      { update, view },
      given(SignedIn.init(AppRoute.Home(), adaSession)),
      click(role('button', { name: 'Sign out' })),
      Command.expectExact(ClearSession, RedirectToSignIn),
      Command.resolveAll(
        [ClearSession, Message.SucceededClearSession()],
        [RedirectToSignIn, Message.CompletedNavigateInternal()],
      ),
      expect(role('heading', { name: 'Sign in' })).toExist(),
    )
  })
})
