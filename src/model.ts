import { Schema } from 'effect'

import { SignedIn, SignedOut } from './page'

export const Model = Schema.Union([SignedOut.Model, SignedIn.Model])
export type Model = typeof Model.Type

export { SignedIn, SignedOut }
