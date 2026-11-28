import { Effect, Redacted } from 'effect'
import {
  HttpClient,
  HttpClientError,
  type HttpClientRequest,
  HttpClientResponse,
} from 'effect/http'
import { describe, expect, test } from 'vitest'

import { ApiError, makeApiClient, toApiError } from './client'

const BASE_URL = 'http://api.test'

const respondWith = (status: number, body?: unknown) => {
  const requests: Array<HttpClientRequest.HttpClientRequest> = []
  const httpClient = HttpClient.make(request => {
    requests.push(request)
    return Effect.succeed(
      HttpClientResponse.fromWeb(
        request,
        new Response(body === undefined ? null : JSON.stringify(body), {
          status,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    )
  })
  return { api: makeApiClient(httpClient, BASE_URL), requests }
}

const user = {
  id: '6f1c3c1e-2f7a-4d55-9a53-0b4c8c3f2a10',
  name: 'Ada',
  email: 'ada@example.com',
  created_at: '2026-11-24T10:00:00Z',
  updated_at: '2026-11-24T10:00:00Z',
}

const signIn = { payload: { email: 'ada@example.com', password: 'secret' } }

const failureOf = <A, E>(effect: Effect.Effect<A, E>) =>
  Effect.runPromise(
    effect.pipe(
      Effect.flatMap(() => Effect.die('expected the request to fail')),
      Effect.catch(toApiError),
    ),
  )

describe('makeApiClient', () => {
  test('prefixes the base URL and decodes a successful response', async () => {
    const { api, requests } = respondWith(200, { token: 'jwt', user })

    const result = await Effect.runPromise(api.anonymous.login(signIn))

    expect(result.token).toBe('jwt')
    expect(result.user.email).toBe('ada@example.com')
    expect(requests[0]?.url).toBe(`${BASE_URL}/auth/login`)
    expect(requests[0]?.headers['authorization']).toBeUndefined()
  })

  test('authorized requests carry the bearer token', async () => {
    const { api, requests } = respondWith(200, [])

    await Effect.runPromise(
      api.authorized(Redacted.make('jwt')).listTasks(undefined),
    )

    expect(requests[0]?.headers['authorization']).toBe('Bearer jwt')
  })
})

describe('toApiError', () => {
  test('a declared 401 becomes Unauthorized', async () => {
    const { api } = respondWith(401, { error: 'Invalid credentials' })
    expect(await failureOf(api.anonymous.login(signIn))).toEqual(
      ApiError.Unauthorized(),
    )
  })

  test('an undeclared 401 also becomes Unauthorized', async () => {
    const { api } = respondWith(401, { error: 'Invalid or expired token' })
    expect(
      await failureOf(
        api.authorized(Redacted.make('old')).listTasks(undefined),
      ),
    ).toEqual(ApiError.Unauthorized())
  })

  test('409 becomes Conflict', async () => {
    const { api } = respondWith(409, { error: 'Email already registered' })
    expect(
      await failureOf(
        api.anonymous.register({
          payload: { name: 'Ada', email: 'ada@example.com', password: 'x' },
        }),
      ),
    ).toEqual(ApiError.Conflict())
  })

  test('404 becomes NotFound', async () => {
    const { api } = respondWith(404, { error: 'Task not found' })
    expect(
      await failureOf(
        api.authorized(Redacted.make('jwt')).getTask(user.id, undefined),
      ),
    ).toEqual(ApiError.NotFound())
  })

  test('other 4xx become BadRequest with the backend message', async () => {
    const { api } = respondWith(422, { error: 'Title is required' })
    expect(
      await failureOf(
        api.authorized(Redacted.make('jwt')).listTasks(undefined),
      ),
    ).toEqual(ApiError.BadRequest({ message: 'Title is required' }))
  })

  test('BadRequest falls back to a default message without an error body', async () => {
    const { api } = respondWith(400)
    expect(
      await failureOf(
        api.authorized(Redacted.make('jwt')).listTasks(undefined),
      ),
    ).toEqual(ApiError.BadRequest({ message: 'The request was not valid.' }))
  })

  test('5xx becomes ServerError', async () => {
    const { api } = respondWith(500)
    expect(await failureOf(api.anonymous.login(signIn))).toEqual(
      ApiError.ServerError(),
    )
  })

  test('a body that does not match the schema becomes InvalidResponse', async () => {
    const { api } = respondWith(200, { token: 42 })
    expect(await failureOf(api.anonymous.login(signIn))).toEqual(
      ApiError.InvalidResponse(),
    )
  })

  test('a failed connection becomes NetworkError', async () => {
    const httpClient = HttpClient.make(request =>
      Effect.fail(
        new HttpClientError.HttpClientError({
          reason: new HttpClientError.TransportError({ request }),
        }),
      ),
    )
    const api = makeApiClient(httpClient, BASE_URL)
    expect(await failureOf(api.anonymous.login(signIn))).toEqual(
      ApiError.NetworkError(),
    )
  })
})
