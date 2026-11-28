import { Match } from 'effect'
import { Submodel } from 'foldkit'

import { signInRouter } from '../../route'
import { notFoundView } from '../notFound'
import { Message } from './message'
import { Model } from './model'
import * as Register from './page/register'
import * as SignIn from './page/signIn'

export const view = Submodel.defineView<Model, Message>((model, h) =>
  Match.value(model.route).pipe(
    Match.tagsExhaustive({
      SignIn: () =>
        h.submodel({
          slotId: 'sign-in',
          model: model.signInModel,
          view: SignIn.view,
          toParentMessage: message => Message.GotSignInMessage({ message }),
        }),
      Register: () =>
        h.submodel({
          slotId: 'register',
          model: model.registerModel,
          view: Register.view,
          toParentMessage: message => Message.GotRegisterMessage({ message }),
        }),
      NotFound: ({ path }) =>
        notFoundView(path, signInRouter(), 'Go to sign in', h),
    }),
  ),
)
