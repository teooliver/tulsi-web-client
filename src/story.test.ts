import { Option } from 'effect'
import { Command, given, message, model, story } from 'foldkit/story'
import { describe, expect, test } from 'vitest'

import { ApiError } from './api/client'
import { ClearSession, RedirectToHome, RedirectToSignIn } from './command'
import { init } from './main'
import { Message } from './message'
import { SignedIn } from './model'
import { FetchCurrentUser } from './page/signedIn/command'
import { Message as SignedInMessage } from './page/signedIn/message'
import { AppRoute } from './route'
import { ada, adaSession } from './testing/fixture'
import { update } from './update'

const url = (pathname: string) => ({
  protocol: 'http:',
  host: 'localhost:3000',
  port: Option.some('3000'),
  pathname,
  search: Option.none(),
  hash: Option.none(),
})

describe('init', () => {
  test('without a Session, Home redirects to sign in', () => {
    const init_ = init({ maybeSession: Option.none() }, url('/'))
    expect(init_.model._tag).toBe('SignedOut')
    expect(init_.commands?.map(command => command.name)).toEqual([
      RedirectToSignIn.name,
    ])
  })

  test('a restored Session is verified against the API', () => {
    const init_ = init({ maybeSession: Option.some(adaSession) }, url('/'))
    expect(init_.model._tag).toBe('SignedIn')
    expect(init_.commands?.map(command => command.name)).toEqual([
      FetchCurrentUser.name,
    ])
  })

  test('a restored Session on the sign in page redirects Home', () => {
    const init_ = init(
      { maybeSession: Option.some(adaSession) },
      url('/sign-in'),
    )
    expect(init_.commands?.map(command => command.name)).toEqual([
      FetchCurrentUser.name,
      RedirectToHome.name,
    ])
  })
})

describe('update', () => {
  test('a rejected Session signs the User out', () => {
    story(
      update,
      given(SignedIn.init(AppRoute.Home(), adaSession)),
      message(
        Message.GotSignedInMessage({
          message: SignedInMessage.FailedFetchCurrentUser({
            error: ApiError.Unauthorized(),
          }),
        }),
      ),
      Command.expectExact(ClearSession, RedirectToSignIn),
      model(model => {
        expect(model._tag).toBe('SignedOut')
        expect(model.route).toEqual(AppRoute.SignIn())
      }),
      Command.resolveAll(
        [ClearSession, Message.SucceededClearSession()],
        [RedirectToSignIn, Message.CompletedNavigateInternal()],
      ),
    )
  })

  test('a network failure while verifying keeps the User signed in', () => {
    story(
      update,
      given(SignedIn.init(AppRoute.Home(), adaSession)),
      message(
        Message.GotSignedInMessage({
          message: SignedInMessage.FailedFetchCurrentUser({
            error: ApiError.NetworkError(),
          }),
        }),
      ),
      Command.expectNone(),
      model(model => {
        expect(model._tag).toBe('SignedIn')
      }),
    )
  })

  test('verifying refreshes the User', () => {
    story(
      update,
      given(SignedIn.init(AppRoute.Home(), adaSession)),
      message(
        Message.GotSignedInMessage({
          message: SignedInMessage.SucceededFetchCurrentUser({
            user: { ...ada, name: 'Ada Lovelace' },
          }),
        }),
      ),
      model(model => {
        expect(model._tag === 'SignedIn' && model.session.user.name).toBe(
          'Ada Lovelace',
        )
      }),
    )
  })
})
