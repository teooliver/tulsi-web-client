import { Schema, pipe } from 'effect'
import { Route } from 'foldkit'
import { defineRouteUnion, literal } from 'foldkit/route'

export const AppRoute = defineRouteUnion({
  Home: {},
  SignIn: {},
  Register: {},
  NotFound: { path: Schema.String },
})
export type AppRoute = typeof AppRoute.Type

export const SignedOutRoute = AppRoute.subset([
  'SignIn',
  'Register',
  'NotFound',
])
export type SignedOutRoute = typeof SignedOutRoute.Type

export const SignedInRoute = AppRoute.subset(['Home', 'NotFound'])
export type SignedInRoute = typeof SignedInRoute.Type

export const homeRouter = pipe(Route.root, Route.mapTo(AppRoute.Home))
export const signInRouter = pipe(
  literal('sign-in'),
  Route.mapTo(AppRoute.SignIn),
)
export const registerRouter = pipe(
  literal('register'),
  Route.mapTo(AppRoute.Register),
)

const routeParser = Route.oneOf(signInRouter, registerRouter, homeRouter)

export const urlToAppRoute = Route.parseUrlWithFallback(
  routeParser,
  AppRoute.NotFound,
)
