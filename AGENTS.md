# AGENTS.md

Guidance for AI agents working in `tulsi-web`, the Foldkit (Elm Architecture on
Effect) web client for the Tulsi task-management API.

Read [`FOLDKIT.md`](./FOLDKIT.md) before writing any code. It covers the
architecture, APIs and conventions. Foldkit owns that file and replaces it whole
on upgrade. This file is ours: project-specific notes go here, never there.

`FOLDKIT.md` reads the line below to decide whether it has already offered to
vendor the Foldkit source. Leave it in place.

subtree_prompted: true

## Stack

- **Foldkit** + **Effect 4.1** (SPA mode), built with **Vite** and
  `@foldkit/vite-plugin` (required: it stamps route view identity).
- **oxlint** (with the Foldkit plugin and a type-aware Effect config) and
  **oxfmt** for formatting.
- **vitest** with Foldkit's `story` and `scene` test styles.
- **CSS Modules** + design tokens. **No Tailwind**, no CSS-in-JS.
- **pnpm** (pinned in `packageManager`), Node 24 (`.nvmrc`).

## Commands

```bash
pnpm dev               # regenerate CSS Module types, start Vite
pnpm build             # production build to dist/
pnpm test              # vitest run (test:watch for watch mode)
pnpm lint              # oxlint + Effect type-aware lint
pnpm format            # oxfmt --write (format:check to verify)
pnpm typecheck         # tsc --noEmit
pnpm css-types         # regenerate *.module.css.d.ts (css-types:watch)
pnpm check             # format:check, css-types:check, lint, typecheck, test
```

Run `pnpm check` before finishing a change.

## Styling

- Design tokens (colours, spacing, radii, fonts, type scale) are CSS custom
  properties in `src/styles/tokens.css`. Light/dark follows
  `prefers-color-scheme`. Use tokens, not raw values, in component CSS.
- `src/styles/global.css` holds the reset and base element styles only. It is
  linked from `index.html`.
- Each view gets a CSS Module next to it (`main.ts` and `main.module.css`) and
  applies classes with `h.Class(styles.name)`.
- Every `*.module.css` has a generated, committed `*.module.css.d.ts` (from
  `typed-css-modules`) so a mistyped class name is a type error. After adding,
  renaming or removing a class, run `pnpm css-types`. `pnpm check` fails if they
  are stale. Never hand-edit them.

## Testing

Follow `FOLDKIT.md`: `story.test.ts` drives `update`, `scene.test.ts` drives the
rendered `view`, colocated with the code they test. Tests run in vitest with
`happy-dom`. The setup is `src/vitest-setup.ts`.

## Conventions

- Use the domain vocabulary in `../../tulsi-home/GLOSSARY.md` (the Tulsi Home
  Repo, checked out beside this repo's parent folder; if you cloned this repo
  alone, read it at https://github.com/teooliver/tulsi-home/blob/main/GLOSSARY.md).
  Name things with its canonical terms in code, docs and responses, and avoid
  the synonyms it lists. Foldkit terms (Model, Message, Command, Submodel) are
  implementation vocabulary, not domain terms.
- Keep `src/entry.ts` as the only place that boots the runtime.
- Use `@foldkit/ui` headless components (e.g. `Button`) for accessible
  interaction patterns, styled with our CSS Modules.
