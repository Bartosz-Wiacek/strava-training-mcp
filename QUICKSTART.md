# Strava Training MCP Quickstart

Short setup and usage guide for this repo.

## What This Repo Is

This is a private MCP server for Strava-based training analysis and coaching workflows.

It is used to:
- read Strava activity data,
- build athlete baseline profiles,
- save training plans in `profiles/`,
- help match workouts on supported platforms such as Rouvy.

## Requirements

- Node.js `20+`
- `pnpm`
- a Strava app with:
  - `STRAVA_CLIENT_ID`
  - `STRAVA_CLIENT_SECRET`
  - `STRAVA_REFRESH_TOKEN`

## Install

```bash
pnpm install
cp .env.example .env
```

Fill `.env` with your real Strava credentials.

## Run

Development:

```bash
pnpm dev
```

Build:

```bash
pnpm build
```

Run built server:

```bash
pnpm start
```

## MCP Client Setup

Point your MCP client to the built server:

```json
{
  "command": "node",
  "args": ["/absolute/path/to/strava-training-mcp/dist/index.js"]
}
```

Or use `pnpm dev` during development.

## Normal Usage Flow

1. Start with a baseline interview.
2. Save the athlete profile in `profiles/`.
3. Use that baseline for workout finding or plan building.
4. Update the profile when fitness, equipment, or constraints change.

## Important Notes

- `.env` is local only and should never be committed.
- If Strava rotates the refresh token, update `.env` manually.
- Files in `profiles/` are working training artifacts and can be reused in later sessions.
