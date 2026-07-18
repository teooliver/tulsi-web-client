# AGENTS.md

Guidance for AI agents working in `tulsi-web`, the React front-end for the Tulsi
project-management API.

## Stack

- **TanStack Start** (SSR) + **TanStack Router** (file-based routing)
- **TanStack Query** for server state, **TanStack Form** + **Zod** for forms
- **Tailwind CSS v4** for styling
- **orval** to generate a typed `fetch` client from the backend's OpenAPI spec
- **Vite**, **Vitest**, ESLint (`@tanstack/eslint-config`) + Prettier
- Node ESM (`"type": "module"`), React 19, TypeScript in `strict` mode

## Commands

```bash
npm run dev        # dev server on :3000 (regenerates routeTree.gen.ts)
npm run build      # production build
npm run test       # vitest
npm run lint       # eslint
npm run format     # prettier --write + eslint --fix
npm run check      # prettier --check
npm run generate   # regenerate the API client from the backend OpenAPI spec
```

Before finishing a change, run `npx tsc --noEmit` and `npm run lint`. Note:
`src/router.tsx` has pre-existing unused-import errors — ignore those, don't
"fix" unrelated files.

## Project layout

```
generated/api-types.ts   # GENERATED orval client — do not edit by hand
src/
  routes/                # file-based routes; routeTree.gen.ts is generated
    __root.tsx           # shell: <html>/<body>, providers, devtools
    index.tsx            # protected home page
    login.tsx, register.tsx
  auth/
    auth-context.tsx     # AuthProvider + useAuth()
    token-storage.ts     # localStorage helpers (single source of truth)
    use-auth-redirect.ts # useRequireAuth / useRedirectIfAuthenticated
  lib/
    custom-fetch.ts      # orval mutator: token injection + 401 handling
  components/storybook/   # shared UI primitives (Button, Input, ...)
  integrations/tanstack-query/
```

Path aliases: `#/*` and `@/*` both map to `src/*`. The generated client lives
outside `src/`, so import it with a relative path
(`../../generated/api-types`).

## API client (orval) — the important rules

- **Never hand-edit `generated/api-types.ts`.** Change `orval.config.ts` and run
  `npm run generate` (requires the backend running at `http://localhost:8080`).
- Every generated call routes through **`src/lib/custom-fetch.ts`** (configured
  as orval's `mutator`). This is the one place that:
  - attaches `Authorization: Bearer <token>` from `token-storage`
  - on a `401` for a request that **carried a token**, clears the session and
    redirects to `/login` (a failed login/register sends no token, so the form
    handles its own 401/409)
- Generated functions return a status-tagged result `{ data, status, headers }`
  and **do not throw** on non-2xx. Branch on `res.status`.

## Calling the API

Wrap calls in TanStack Query, not imperative calls in components:

- Mutations (e.g. login/register): `useMutation`. Put status handling in
  `mutationFn` and `throw new Error(message)` for non-success so the message
  surfaces via `mutation.error`; use `mutation.isPending` / `mutation.isError`
  for UI.
- Queries (e.g. `me`): `useQuery` with a stable `queryKey`; gate with
  `enabled: isAuthenticated` to avoid guaranteed 401s.

## Auth

- Token + user are persisted in `localStorage` via `token-storage.ts`. Both
  `AuthProvider` and `custom-fetch.ts` read through it — keep it the single
  source of truth; don't touch `localStorage` directly elsewhere.
- `AuthProvider` hydrates from storage in a `useEffect` (browser-only, avoids
  SSR mismatch) and exposes `isLoading` until that settles.
- `logout()` clears the session **and** calls `queryClient.clear()` to drop
  per-user cache.
- Route guards are client-side hooks (`useRequireAuth`,
  `useRedirectIfAuthenticated`) — appropriate because the token lives in
  `localStorage` and isn't available during SSR. Protected pages return `null`
  while `isLoading || !isAuthenticated` to avoid a content flash.

## Forms

`@tanstack/react-form` with a Zod schema in `validators: { onSubmit: schema }`.
`onSubmit` only fires after validation passes — call `mutation.mutate(value)`
there. Field errors come from `field.state.meta.errors[0]?.message`.

## Conventions

- New routes: add a file under `src/routes/`, then run `npm run dev` (or build)
  to regenerate `routeTree.gen.ts` — it's generated, don't edit it manually.
- Reuse `src/components/storybook` primitives; match their Tailwind class style
  (light/dark variants) and keep new props optional/backward-compatible.
- In dev, browser API calls are same-origin and forwarded to the backend by the
  Vite proxy in `vite.config.ts`. When the backend gains a new top-level route,
  add it to `apiRoots` there (override target with `API_PROXY_TARGET`).
- Don't introduce `useMemo`/`useCallback` unless there's a real re-render
  problem to solve. Keep `try/catch` scoped to the throwing call (e.g. JSON
  parsing), not around `setState`.
```
