import { taggedStruct } from 'foldkit/schema'

import { SignedOutRoute } from '../../route'
import * as Register from './page/register'
import * as SignIn from './page/signIn'

// MODEL

export const Model = taggedStruct('SignedOut', {
  route: SignedOutRoute,
  signInModel: SignIn.Model,
  registerModel: Register.Model,
})
export type Model = typeof Model.Type

// INIT

export const init = (route: SignedOutRoute): Model =>
  Model({
    route,
    signInModel: SignIn.initModel(),
    registerModel: Register.initModel(),
  })
