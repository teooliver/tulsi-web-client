import { Match } from 'effect'
import { type Document, HtmlBuilder } from 'foldkit/html'

import { Message } from './message'
import { Model, SignedIn, SignedOut } from './model'

const title = (model: Model): string =>
  Match.value(model.route).pipe(
    Match.tagsExhaustive({
      Home: () => 'Tulsi',
      SignIn: () => 'Sign in | Tulsi',
      Register: () => 'Register | Tulsi',
      NotFound: () => 'Page not found | Tulsi',
    }),
  )

export const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: title(model),
  body: Match.value(model).pipe(
    Match.tagsExhaustive({
      SignedOut: signedOutModel =>
        h.submodel({
          slotId: 'signed-out',
          model: signedOutModel,
          view: SignedOut.view,
          toParentMessage: message => Message.GotSignedOutMessage({ message }),
        }),
      SignedIn: signedInModel =>
        h.submodel({
          slotId: 'signed-in',
          model: signedInModel,
          view: SignedIn.view,
          toParentMessage: message => Message.GotSignedInMessage({ message }),
        }),
    }),
  ),
})
