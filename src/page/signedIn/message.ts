import { defineMessageUnion } from 'foldkit/message'

import { ApiError } from '../../api/client'
import { User } from '../../api/generated'

// MESSAGE

export const Message = defineMessageUnion({
  ClickedSignOut: {},
  SucceededFetchCurrentUser: { user: User },
  FailedFetchCurrentUser: { error: ApiError },
})
export type Message = typeof Message.Type

// OUT MESSAGE

export const OutMessage = defineMessageUnion({
  RequestedSignOut: {},
  ExpiredSession: {},
})
export type OutMessage = typeof OutMessage.Type
