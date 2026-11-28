# Generate the API client with @effect/openapi-generator from a committed spec

The backend (Rust, utoipa) already publishes an OpenAPI spec, so we generate the
client rather than hand-writing a Schema and request per endpoint. We use
Effect's own `@effect/openapi-generator` (`httpclient` format) because it emits
Effect Schemas plus functions built on Effect's `HttpClient`, which plugs straight
into Foldkit Commands, `Http.layer` and Resources. We generate from a committed
copy of the spec (`api/openapi.json`) so generation is reproducible offline,
contract changes show up as diffs in review, and `pnpm check` can verify the
generated file without the backend running.

## Considered Options

- **Orval, `client: 'effect'`**: generates Effect Schemas only, no request
  functions, so every call would still be hand-written.
- **Orval fetch client with schema validation**: Promise-based functions outside
  Effect's `HttpClient`; every call would need `Effect.tryPromise` wrapping and
  would lose `Http.layer`, retry combinators and request spans.
- **Hand-written requests**: full control, but duplicates a contract the backend
  already maintains (46 operations) and drifts.

## Consequences

- utoipa never emits `additionalProperties`, which makes the generator add a
  `[key: string]: Json` index signature to every type. `scripts/api.mjs` closes
  object schemas before generating; Effect's `Schema.Struct` ignores unknown keys
  when decoding, so this is safe at runtime.
- The generator's peer range pins Effect: `effect` and the `@effect/*` packages
  must stay on the same 4.1.x patch as `@effect/openapi-generator`.
- Only `/auth` endpoints declare a 401 in the spec, so `toApiError` maps
  failures by HTTP status, not by the declared error variants.
