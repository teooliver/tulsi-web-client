import { Schema } from 'effect'
import { defineMessageUnion } from 'foldkit/message'
import { UrlRequest } from 'foldkit/navigation'
import { Url } from 'foldkit/url'

import { SignedIn, SignedOut } from './page'

export const Message = defineMessageUnion({
  ClickedLink: { request: UrlRequest },
  ChangedUrl: { url: Url },
  CompletedNavigateInternal: {},
  CompletedLoadExternal: {},
  SucceededSaveSession: {},
  FailedSaveSession: { error: Schema.String },
  SucceededClearSession: {},
  FailedClearSession: { error: Schema.String },
  CompletedLogError: {},
  GotSignedOutMessage: { message: SignedOut.Message },
  GotSignedInMessage: { message: SignedIn.Message },
})
export type Message = typeof Message.Type
