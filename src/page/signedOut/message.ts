import { defineMessageUnion } from 'foldkit/message'

import { Session } from '../../domain/session'
import * as Register from './page/register'
import * as SignIn from './page/signIn'

// MESSAGE

export const Message = defineMessageUnion({
  GotSignInMessage: { message: SignIn.Message },
  GotRegisterMessage: { message: Register.Message },
})
export type Message = typeof Message.Type

// OUT MESSAGE

export const OutMessage = defineMessageUnion({
  SucceededAuthentication: { session: Session },
})
export type OutMessage = typeof OutMessage.Type
