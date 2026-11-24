import { Match, Option } from 'effect'
import { Command, Update } from 'foldkit'
import { UrlRequest } from 'foldkit/navigation'
import { modifyFields } from 'foldkit/struct'
import { toString as urlToString } from 'foldkit/url'

import { type Api } from './api/client'
import {
  ClearSession,
  LoadExternal,
  LogError,
  NavigateInternal,
  RedirectToHome,
  RedirectToSignIn,
  SaveSession,
} from './command'
import { Message } from './message'
import { Model, SignedIn, SignedOut } from './model'
import { AppRoute, urlToAppRoute } from './route'

export type UpdateReturn = Update.Return<Model, Message, Api>
const withUpdateReturn = Match.withReturnType<UpdateReturn>()

const signOut = (): UpdateReturn => ({
  model: SignedOut.init(AppRoute.SignIn()),
  commands: [ClearSession(), RedirectToSignIn()],
})

const foldSignedOut = Update.foldChild({
  update: SignedOut.update,
  read: (model: Model) =>
    Match.value(model).pipe(
      Match.tagsExhaustive({
        SignedOut: signedOutModel => Option.some(signedOutModel),
        SignedIn: () => Option.none(),
      }),
    ),
  write: (_model, nextSignedOut) => nextSignedOut,
  toParentMessage: message => Message.GotSignedOutMessage({ message }),
  foldOutMessage: SignedOut.OutMessage.match<Update.Step<Model, Message, Api>>({
    SucceededAuthentication:
      ({ session }) =>
      () => ({
        model: SignedIn.init(AppRoute.Home(), session),
        commands: [SaveSession({ session }), RedirectToHome()],
      }),
  }),
})

const foldSignedIn = Update.foldChild({
  update: SignedIn.update,
  read: (model: Model) =>
    Match.value(model).pipe(
      Match.tagsExhaustive({
        SignedOut: () => Option.none(),
        SignedIn: signedInModel => Option.some(signedInModel),
      }),
    ),
  write: (_model, nextSignedIn) => nextSignedIn,
  toParentMessage: message => Message.GotSignedInMessage({ message }),
  foldOutMessage: SignedIn.OutMessage.match<Update.Step<Model, Message, Api>>({
    RequestedSignOut: () => signOut,
    ExpiredSession: () => signOut,
  }),
})

export const verifySession = (signedInModel: SignedIn.Model) =>
  Command.mapMessages(SignedIn.verifySession(signedInModel), message =>
    Message.GotSignedInMessage({ message }),
  )

export const update = (model: Model, message: Message) =>
  Message.match<UpdateReturn>(message, {
    ClickedLink: ({ request }) =>
      UrlRequest.match<UpdateReturn>(request, {
        Internal: ({ url }) => ({
          model,
          commands: [NavigateInternal({ url: urlToString(url) })],
        }),
        External: ({ href }) => ({
          model,
          commands: [LoadExternal({ href })],
        }),
      }),

    ChangedUrl: ({ url }) => {
      const route = urlToAppRoute(url)

      return Match.value(model).pipe(
        withUpdateReturn,
        Match.tagsExhaustive({
          SignedOut: signedOutModel =>
            Match.value(route).pipe(
              withUpdateReturn,
              Match.tag('SignIn', 'Register', 'NotFound', route => ({
                model: modifyFields(signedOutModel, { route: () => route }),
              })),
              Match.orElse(() => ({ model, commands: [RedirectToSignIn()] })),
            ),

          SignedIn: signedInModel =>
            Match.value(route).pipe(
              withUpdateReturn,
              Match.tag('Home', 'NotFound', route => ({
                model: modifyFields(signedInModel, { route: () => route }),
              })),
              Match.orElse(() => ({ model, commands: [RedirectToHome()] })),
            ),
        }),
      )
    },

    FailedSaveSession: ({ error }) => ({
      model,
      commands: [LogError({ entries: ['Failed to save the Session:', error] })],
    }),

    FailedClearSession: ({ error }) => ({
      model,
      commands: [
        LogError({ entries: ['Failed to clear the Session:', error] }),
      ],
    }),

    GotSignedOutMessage: ({ message }) => foldSignedOut(model, message),
    GotSignedInMessage: ({ message }) => foldSignedIn(model, message),

    CompletedNavigateInternal: () => ({ model }),
    CompletedLoadExternal: () => ({ model }),
    SucceededSaveSession: () => ({ model }),
    SucceededClearSession: () => ({ model }),
    CompletedLogError: () => ({ model }),
  })
