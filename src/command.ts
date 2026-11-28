import { Console, Effect, Schema } from 'effect'
import { KeyValueStore } from 'effect/persistence'
import { Command } from 'foldkit'
import { load, pushUrl, replaceUrl } from 'foldkit/navigation'

import { BrowserKeyValueStore } from '@effect/platform-browser'

import { SESSION_STORAGE_KEY } from './constant'
import { Session, StoredSessionJson, toStoredSession } from './domain/session'
import { Message } from './message'
import { homeRouter, signInRouter } from './route'

// SESSION

export const SaveSession = Command.define('SaveSession', {
  args: { session: Session },
  messages: [Message.SucceededSaveSession, Message.FailedSaveSession],
  execute: ({ session }) =>
    Effect.gen(function* () {
      const store = yield* KeyValueStore.KeyValueStore
      const json = yield* Schema.encodeEffect(StoredSessionJson)(
        toStoredSession(session),
      )
      yield* store.set(SESSION_STORAGE_KEY, json)
      return Message.SucceededSaveSession()
    }).pipe(
      Effect.catch(error =>
        Effect.succeed(Message.FailedSaveSession({ error: String(error) })),
      ),
      Effect.provide(BrowserKeyValueStore.layerLocalStorage),
    ),
})

export const ClearSession = Command.define('ClearSession', {
  messages: [Message.SucceededClearSession, Message.FailedClearSession],
  execute: Effect.gen(function* () {
    const store = yield* KeyValueStore.KeyValueStore
    yield* store.remove(SESSION_STORAGE_KEY)
    return Message.SucceededClearSession()
  }).pipe(
    Effect.catch(error =>
      Effect.succeed(Message.FailedClearSession({ error: String(error) })),
    ),
    Effect.provide(BrowserKeyValueStore.layerLocalStorage),
  ),
})

export const LogError = Command.define('LogError', {
  args: { entries: Schema.Array(Schema.Unknown) },
  messages: [Message.CompletedLogError],
  execute: ({ entries }) =>
    Console.error(...entries).pipe(Effect.as(Message.CompletedLogError())),
})

// NAVIGATION

export const NavigateInternal = Command.define('NavigateInternal', {
  args: { url: Schema.String },
  messages: [Message.CompletedNavigateInternal],
  execute: ({ url }) =>
    pushUrl(url).pipe(Effect.as(Message.CompletedNavigateInternal())),
})

export const LoadExternal = Command.define('LoadExternal', {
  args: { href: Schema.String },
  messages: [Message.CompletedLoadExternal],
  execute: ({ href }) =>
    load(href).pipe(Effect.as(Message.CompletedLoadExternal())),
})

export const RedirectToSignIn = Command.define('RedirectToSignIn', {
  messages: [Message.CompletedNavigateInternal],
  execute: replaceUrl(signInRouter()).pipe(
    Effect.as(Message.CompletedNavigateInternal()),
  ),
})

export const RedirectToHome = Command.define('RedirectToHome', {
  messages: [Message.CompletedNavigateInternal],
  execute: replaceUrl(homeRouter()).pipe(
    Effect.as(Message.CompletedNavigateInternal()),
  ),
})
