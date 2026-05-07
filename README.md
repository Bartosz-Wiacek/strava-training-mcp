# Strava Training MCP

Private MCP server for Strava training analysis, built with Node.js, TypeScript, `pnpm`, `@modelcontextprotocol/sdk`, `zod`, and `dotenv`.

## Requirements

- Node.js 20+
- `pnpm`
- A Strava API application with:
  - `STRAVA_CLIENT_ID`
  - `STRAVA_CLIENT_SECRET`
  - `STRAVA_REFRESH_TOKEN`

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

3. Fill in the values in `.env`.

4. Start the MCP server in development mode:

   ```bash
   pnpm dev
   ```

## Scripts

- `pnpm dev` runs the server directly from TypeScript over stdio.
- `pnpm build` compiles the server to `dist/`.
- `pnpm start` runs the compiled server from `dist/index.js`.
- `pnpm typecheck` runs TypeScript without emitting files.

## Environment Variables

- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_REFRESH_TOKEN`

## Strava Token Refresh Behavior

This server refreshes access tokens with `POST https://www.strava.com/oauth/token` using `grant_type=refresh_token`.

Strava may return a newer `refresh_token` in a successful response. The server will use that newer token in memory for the current process, but it does not write secrets back to disk.

Warning: if Strava returns a new refresh token, update your local `.env` file manually. Once Strava rotates the token, the older refresh token can stop working.

## MCP Client Integration

This server uses the `stdio` transport. Point your MCP client at either:

- `pnpm start` after building, or
- `node dist/index.js`

Example command-only integration:

```json
{
  "command": "node",
  "args": ["/absolute/path/to/strava-training-mcp/dist/index.js"]
}
```

## Notes

- Secrets belong only in local environment files or secure secret stores.
- `.env` is ignored by git and should never be committed.
