import { Context, Effect, Layer, Match, Option, Redacted, Schema } from 'effect'
import {
  HttpClient,
  HttpClientError,
  HttpClientRequest,
  type HttpClientResponse,
} from 'effect/http'
import { Http } from 'foldkit'
import { defineTaggedUnion } from 'foldkit/schema'

import { type TulsiApi, make } from './generated'

// CONFIG

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

// ERROR

export const ApiError = defineTaggedUnion({
  Unauthorized: {},
  NotFound: {},
  Conflict: {},
  BadRequest: { message: Schema.String },
  ServerError: {},
  NetworkError: {},
  InvalidResponse: {},
})
export type ApiError = typeof ApiError.Type

const ErrorBody = Schema.Struct({ error: Schema.String })

const DEFAULT_BAD_REQUEST_MESSAGE = 'The request was not valid.'

const readErrorMessage = (response: HttpClientResponse.HttpClientResponse) =>
  response.json.pipe(
    Effect.flatMap(Schema.decodeUnknownEffect(ErrorBody)),
    Effect.map(body => body.error),
    Effect.orElseSucceed(() => DEFAULT_BAD_REQUEST_MESSAGE),
  )

const fromStatus = (
  response: HttpClientResponse.HttpClientResponse,
): Effect.Effect<ApiError> =>
  Match.value(response.status).pipe(
    Match.when(401, () => Effect.succeed(ApiError.Unauthorized())),
    Match.when(404, () => Effect.succeed(ApiError.NotFound())),
    Match.when(409, () => Effect.succeed(ApiError.Conflict())),
    Match.when(
      status => status >= 500,
      () => Effect.succeed(ApiError.ServerError()),
    ),
    Match.orElse(() =>
      readErrorMessage(response).pipe(
        Effect.map(message => ApiError.BadRequest({ message })),
      ),
    ),
  )

const hasResponse = (
  error: unknown,
): error is { readonly response: HttpClientResponse.HttpClientResponse } =>
  typeof error === 'object' &&
  error !== null &&
  'response' in error &&
  typeof error.response === 'object' &&
  error.response !== null &&
  'status' in error.response

/** Maps any failure from a generated API call into an ApiError. */
export const toApiError = (error: unknown): Effect.Effect<ApiError> => {
  if (HttpClientError.isHttpClientError(error)) {
    return Option.match(Option.fromNullishOr(error.response), {
      onNone: () =>
        Effect.succeed(
          error.reason._tag === 'TransportError'
            ? ApiError.NetworkError()
            : ApiError.InvalidResponse(),
        ),
      onSome: response =>
        error.reason._tag === 'StatusCodeError'
          ? fromStatus(response)
          : Effect.succeed(ApiError.InvalidResponse()),
    })
  }
  if (hasResponse(error)) {
    return fromStatus(error.response)
  }
  return Effect.succeed(ApiError.InvalidResponse())
}

// CLIENT

export type ApiClient = Readonly<{
  anonymous: TulsiApi
  authorized: (token: Redacted.Redacted<string>) => TulsiApi
}>

export const makeApiClient = (
  httpClient: HttpClient.HttpClient,
  baseUrl: string,
): ApiClient => {
  const base = httpClient.pipe(
    HttpClient.mapRequest(HttpClientRequest.prependUrl(baseUrl)),
    HttpClient.mapRequest(HttpClientRequest.acceptJson),
  )
  return {
    anonymous: make(base),
    authorized: token =>
      make(
        base.pipe(HttpClient.mapRequest(HttpClientRequest.bearerToken(token))),
      ),
  }
}

export class Api extends Context.Service<Api, ApiClient>()('Api') {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const httpClient = yield* HttpClient.HttpClient
      return makeApiClient(httpClient, API_URL)
    }),
  ).pipe(Layer.provide(Http.layer))
}
