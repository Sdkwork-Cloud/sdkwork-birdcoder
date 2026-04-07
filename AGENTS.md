# Repository Guidelines

## Project Structure & Module Organization
This app is a Vite + React + TypeScript workspace. The shell app lives in `src/`, with `src/main.tsx` as the entry point and `src/App.tsx` composing the main IDE experience. Reusable feature packages live under `packages/sdkwork-ide-*`; for example, `sdkwork-ide-ui` contains shared UI, `sdkwork-ide-commons` holds hooks/contexts/services, and packages such as `sdkwork-ide-code`, `sdkwork-ide-settings`, and `sdkwork-ide-terminal` provide feature pages. Shared styling starts in `src/index.css`, and localized strings live in `packages/sdkwork-ide-commons/src/i18n/locales/`.

## Build, Test, and Development Commands
Use the root workspace files in this directory.

- `npm install` installs root dependencies and linked workspace packages.
- `npm run dev` starts the Vite dev server on port `3000` and binds to `0.0.0.0`.
- `npm run build` creates the production bundle in `dist/`.
- `npm run preview` serves the built app locally for a quick smoke check.
- `npm run lint` runs `tsc --noEmit`; this is the main static verification step today.

## Coding Style & Naming Conventions
Follow the existing TypeScript/TSX style in the touched file: components, pages, and interfaces use `PascalCase`, hooks use `camelCase` with a `use` prefix, and package names follow the `sdkwork-ide-*` convention. Keep source files readable with the repository's current 2-space indentation and concise React function components. Prefer colocating exports in each package's `src/index.ts`, and keep Tailwind utility usage consistent with nearby code instead of introducing a parallel styling pattern.

## Testing Guidelines
There is no dedicated `npm test` script in this workspace yet, so contributors should treat `npm run lint` and `npm run build` as required pre-PR checks. For UI changes, also include a short manual verification note covering the affected page or workflow. If you add automated tests later, use `*.test.ts` or `*.test.tsx` naming and keep them near the feature they cover.

## Commit & Pull Request Guidelines
Recent history follows short Conventional Commit messages such as `feat: ...`, `fix: ...`, and `chore: ...`. Keep new commits imperative and scoped, for example `fix: preserve active workspace selection`. Pull requests should include a concise summary, affected packages, commands run locally, linked task or issue, and screenshots or GIFs for visible UI changes.

## Security & Configuration Tips
Use `.env.example` as the reference for local configuration. `GEMINI_API_KEY` and `APP_URL` are required for runtime integration; never commit real secrets or paste them into logs, screenshots, or test fixtures.
