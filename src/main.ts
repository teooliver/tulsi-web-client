import { Effect, Match, Option, Schema } from 'effect'
import { KeyValueStore } from 'effect/persistence'
import { Runtime } from 'foldkit'
import { Url } from 'foldkit/url'

import { BrowserKeyValueStore } from '@effect/platform-browser'

import { type Api } from './api/client'
import { RedirectToHome, RedirectToSignIn } from './command'
import { SESSION_STORAGE_KEY } from './constant'
import { Session, StoredSessionJson, makeSession } from './domain/session'
import { Message } from './message'
import { Model, SignedIn, SignedOut } from './model'
import { AppRoute, urlToAppRoute } from './route'
import { type UpdateReturn, verifySession } from './update'

// FLAGS

export const Flags = Schema.Struct({ maybeSession: Schema.Option(Session) })
export type Flags = typeof Flags.Type

export const flags: Effect.Effect<Flags> = Effect.gen(function* () {
  const store = yield* KeyValueStore.KeyValueStore
  const json = yield* Effect.fromOption(
    Option.fromNullishOr(yield* store.get(SESSION_STORAGE_KEY)),
  )
  const stored = yield* Schema.decodeEffect(StoredSessionJson)(json)
  return Flags.make({ maybeSession: Option.some(makeSession(stored)) })
}).pipe(
  Effect.catch(() =>
    Effect.succeed(Flags.make({ maybeSession: Option.none() })),
  ),
  Effect.provide(BrowserKeyValueStore.layerLocalStorage),
)

// INIT

const withInitReturn = Match.withReturnType<UpdateReturn>()

export const init: Runtime.RoutingApplicationInit<
  Model,
  Message,
  Flags,
  Api
> = (flags: Flags, url: Url): UpdateReturn => {
  const route = urlToAppRoute(url)

  return Option.match(flags.maybeSession, {
    onNone: () =>
      Match.value(route).pipe(
        withInitReturn,
        Match.tag('SignIn', 'Register', 'NotFound', route => ({
          model: SignedOut.init(route),
        })),
        Match.orElse(() => ({
          model: SignedOut.init(AppRoute.SignIn()),
          commands: [RedirectToSignIn()],
        })),
      ),

    onSome: session =>
      Match.value(route).pipe(
        withInitReturn,
        Match.tag('Home', 'NotFound', route => {
          const signedInModel = SignedIn.init(route, session)
          return {
            model: signedInModel,
            commands: verifySession(signedInModel),
          }
        }),
        Match.orElse(() => {
          const signedInModel = SignedIn.init(AppRoute.Home(), session)
          return {
            model: signedInModel,
            commands: [...verifySession(signedInModel), RedirectToHome()],
          }
        }),
      ),
  })
}
