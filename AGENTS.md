# Repository Guidelines

## Project Structure & Module Organization

- `src/` contains the MCP server code:
  - `index.ts` boots the stdio server and validates environment variables.
  - `strava.ts` handles Strava auth, token refresh, and API requests.
  - `tools.ts` registers MCP tools and shapes training-analysis outputs.
- `profiles/` stores generated athlete artifacts such as baseline profiles and training plans.
- `.claude/commands/` holds local prompt/agent workflows for intake, workout finding, and plan building.
- `dist/` is the compiled output from TypeScript builds; do not edit it manually.

## Build, Test, and Development Commands

- `pnpm install` installs dependencies.
- `pnpm dev` runs the MCP server directly from TypeScript over stdio.
- `pnpm build` compiles `src/` into `dist/`.
- `pnpm start` runs the built server from `dist/index.js`.
- `pnpm typecheck` runs TypeScript validation without emitting files.

Use `pnpm typecheck` after code changes and `pnpm build` before wiring the server into an MCP client.

## Coding Style & Naming Conventions

- Language: TypeScript with ES modules.
- Indentation: 2 spaces; keep existing quote and trailing-comma style consistent with the file.
- Prefer small, focused helpers over large inline logic blocks.
- Use descriptive camelCase for variables/functions and PascalCase for classes/types.
- Keep MCP tool names action-oriented and snake_case, e.g. `get_recent_activities`.
- Validate external inputs with `zod` and keep error messages explicit.

## Testing Guidelines

- This repo currently has no dedicated unit-test framework.
- Minimum validation for changes:
  - `pnpm typecheck`
  - `pnpm build`
  - manual smoke test of the relevant MCP flow
- If you add tests later, place them near the source module or under a dedicated `test/` directory and use clear names such as `strava.test.ts`.

## Commit & Pull Request Guidelines

- Current history is minimal, so use short, imperative commit messages such as `add workout finder response rules` or `fix Strava token error handling`.
- Keep commits scoped to one concern.
- PRs should include:
  - a short summary of the change,
  - impacted files or workflows,
  - manual verification performed,
  - sample output or screenshots only when UI/client behavior changed.

## Security & Configuration Tips

- Never commit `.env` or real Strava credentials.
- If Strava rotates the refresh token, update `.env` manually.
- Treat files in `profiles/` as user-specific training data and review them before sharing.
