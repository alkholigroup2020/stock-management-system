# Repository Guidelines

## Project Overview

This repository contains a multi-location stock management system for tracking
inventory across Kitchen, Store, Central, and Warehouse locations. It replaces
spreadsheet workflows with real-time stock tracking, weighted average costing,
inter-location transfers, and coordinated period-end close.

## Project Structure & Module Organization

This is a single Nuxt 4 app (SPA mode) with frontend and backend in one repo.
Frontend code lives in `app/` (pages, components, composables, layouts, stores,
utils, plugins). Server routes and middleware are in `server/` (Nitro/H3). The
database schema, migrations, and seed live in `prisma/`. Shared types are in
`shared/`, docs in `project-docs/`, tests in `tests/`, and static assets in
`public/`. Build artifacts like `.nuxt/` and `.output/` are generated and should
not be edited directly.

## Build, Test, and Development Commands

- `pnpm dev`: Start the Nuxt dev server at `http://localhost:3000`.
- `pnpm build`: Generate Prisma client and build the production bundle.
- `pnpm preview`: Run the built app locally.
- `pnpm generate`: Create a static build (SPA output).
- `pnpm typecheck`: Run Nuxt TypeScript checks.
- `pnpm lint`: Lint the repo with ESLint.
- `pnpm format` / `pnpm format:check`: Format or verify formatting with Prettier.
- `pnpm test`: Run Vitest once; `pnpm test:watch` for watch mode.
- `pnpm test:unit`: Run only `tests/unit`.
- `pnpm test:ui`: Open the Vitest UI runner.
- `pnpm db:push` / `pnpm db:migrate`: Apply Prisma schema changes locally.
- `pnpm db:seed`: Seed the database with `prisma/seed.ts`.

## Coding Style & Naming Conventions

Use 2-space indentation and LF line endings per `.editorconfig`. Prettier is the
source of truth (`.prettierrc`): semicolons, double quotes, max width 100, ES5
trailing commas, and no `<script>`/`<style>` indentation in Vue files. Follow
Nuxt ESLint defaults (`eslint.config.mjs`). Components are auto-imported; naming
combines folder path + filename (example: `app/components/ui/form/Input.vue`
becomes `<UiFormInput />`). Tests are named `*.test.ts` under `tests/`.

## Testing Guidelines

Vitest runs unit and integration tests from `tests/**/*.test.ts`; coverage is
collected for `server/**/*.ts` (see `vitest.config.ts`). Playwright is
configured for browser-level checks in `playwright.config.ts` and can be run
with `npx playwright test`. Before finishing work, run `pnpm typecheck` and fix
any errors.

## Commit & Pull Request Guidelines

Recent history uses short, imperative, sentence-case messages like
`Add ...` or `Fix ...`. Keep commits focused and descriptive. For PRs, include a
clear summary, testing performed, and link related issues. Add screenshots or
clips for UI changes, and call out any Prisma migrations or schema changes.

## Documentation Notes

When editing developer guide snippets in `app/components/developer/*.vue`,
include the real file path in the code block `filename` prop (example:
`server/api/auth/login.post.ts`). Generic examples may omit it.

## Configuration & Secrets

Use `.env.example` as the template and keep real secrets in `.env`. Never commit
service keys or database credentials. Supabase credentials and `AUTH_SECRET` are
required for local development.
