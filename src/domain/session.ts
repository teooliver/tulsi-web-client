import { Redacted, Schema } from 'effect'

import { User } from '../api/generated'

const ACCESS_TOKEN_LABEL = 'access token'

export const AccessToken = Schema.Redacted(Schema.String, {
  label: ACCESS_TOKEN_LABEL,
  disallowJsonEncode: true,
})
export type AccessToken = typeof AccessToken.Type

export const makeAccessToken = (token: string): AccessToken =>
  Redacted.make(token, { label: ACCESS_TOKEN_LABEL })

export const Session = Schema.Struct({ token: AccessToken, user: User })
export type Session = typeof Session.Type

export const makeSession = (
  response: Readonly<{ token: string; user: User }>,
): Session => ({ token: makeAccessToken(response.token), user: response.user })

const StoredSession = Schema.Struct({ token: Schema.String, user: User })

export const StoredSessionJson = Schema.fromJsonString(
  Schema.toCodecJson(StoredSession),
)

export const toStoredSession = (session: Session) => ({
  token: Redacted.value(session.token),
  user: session.user,
})
