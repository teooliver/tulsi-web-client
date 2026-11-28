# tulsi-web

Web client for Tulsi, built with [Foldkit](https://foldkit.dev) and
[Effect](https://effect.website).

## Getting started

Requires Node 24 and pnpm (version pinned in `package.json`; `corepack enable`
picks it up).

```bash
pnpm install
pnpm dev
```

The app always runs on `http://localhost:5173` (`pnpm dev` and `pnpm preview`
both fail if the port is taken). That's the only origin the backend allows by
default.

See [`AGENTS.md`](./AGENTS.md) for the stack, commands and conventions.
