import { Option } from 'effect'
import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { type Api } from '../../api/client'
import { Message, OutMessage } from './message'
import { Model } from './model'
import * as Register from './page/register'
import * as SignIn from './page/signIn'

const foldSignIn = Update.foldChild({
  update: SignIn.update,
  read: (model: Model) => Option.some(model.signInModel),
  write: (model, nextSignInModel) =>
    modifyFields(model, { signInModel: () => nextSignInModel }),
  toParentMessage: message => Message.GotSignInMessage({ message }),
  toParentOutMessage: SignIn.OutMessage.match<OutMessage>({
    SucceededSignIn: ({ session }) =>
      OutMessage.SucceededAuthentication({ session }),
  }),
})

const foldRegister = Update.foldChild({
  update: Register.update,
  read: (model: Model) => Option.some(model.registerModel),
  write: (model, nextRegisterModel) =>
    modifyFields(model, { registerModel: () => nextRegisterModel }),
  toParentMessage: message => Message.GotRegisterMessage({ message }),
  toParentOutMessage: Register.OutMessage.match<OutMessage>({
    SucceededRegister: ({ session }) =>
      OutMessage.SucceededAuthentication({ session }),
  }),
})

export const update = (model: Model, message: Message) =>
  Message.match<Update.ReturnWithOutMessage<Model, Message, OutMessage, Api>>(
    message,
    {
      GotSignInMessage: ({ message }) => foldSignIn(model, message),
      GotRegisterMessage: ({ message }) => foldRegister(model, message),
    },
  )
