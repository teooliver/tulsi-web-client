import { type Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { type Api, ApiError } from '../../api/client'
import { FetchCurrentUser } from './command'
import { Message, OutMessage } from './message'
import { Model } from './model'

type UpdateReturn = Update.ReturnWithOutMessage<Model, Message, OutMessage, Api>

/** Confirms a restored Session is still accepted by the API. */
export const verifySession = (model: Model) => [
  FetchCurrentUser({ token: model.session.token }),
]

export const update = (model: Model, message: Message) =>
  Message.match<UpdateReturn>(message, {
    ClickedSignOut: () => ({
      model,
      outMessage: OutMessage.RequestedSignOut(),
    }),

    SucceededFetchCurrentUser: ({ user }) => ({
      model: modifyFields(model, {
        session: session => modifyFields(session, { user: () => user }),
      }),
    }),

    FailedFetchCurrentUser: ({ error }) =>
      ApiError.match<UpdateReturn>(error, {
        Unauthorized: () => ({
          model,
          outMessage: OutMessage.ExpiredSession(),
        }),
        NotFound: () => ({ model }),
        Conflict: () => ({ model }),
        BadRequest: () => ({ model }),
        ServerError: () => ({ model }),
        NetworkError: () => ({ model }),
        InvalidResponse: () => ({ model }),
      }),
  })
