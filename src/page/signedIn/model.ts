import { taggedStruct } from 'foldkit/schema'

import { Session } from '../../domain/session'
import { SignedInRoute } from '../../route'

// MODEL

export const Model = taggedStruct('SignedIn', {
  route: SignedInRoute,
  session: Session,
})
export type Model = typeof Model.Type

// INIT

export const init = (route: SignedInRoute, session: Session): Model =>
  Model({ route, session })
