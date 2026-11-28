import { Effect } from 'effect'
import { Command } from 'foldkit'

import { Api, toApiError } from '../../api/client'
import { AccessToken } from '../../domain/session'
import { Message } from './message'

export const FetchCurrentUser = Command.define('FetchCurrentUser', {
  args: { token: AccessToken },
  messages: [Message.SucceededFetchCurrentUser, Message.FailedFetchCurrentUser],
  execute: ({ token }) =>
    Effect.gen(function* () {
      const api = yield* Api
      const user = yield* api.authorized(token).me(undefined)
      return Message.SucceededFetchCurrentUser({ user })
    }).pipe(
      Effect.catch(error =>
        Effect.map(toApiError(error), apiError =>
          Message.FailedFetchCurrentUser({ error: apiError }),
        ),
      ),
    ),
})
