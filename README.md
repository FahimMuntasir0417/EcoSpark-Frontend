# EcoSpark Frontend

A Next.js 16 frontend using:
- Axios for API requests
- TanStack Query for server-state
- TanStack Form + Zod for form validation
- Feature-based module structure

## Prerequisites

- Node.js 20+
- pnpm 10+

Optional:
- Bun (for `dev/build/start` scripts currently configured)

## Environment

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

Reference file: [`.env.example`](.env.example)

## Scripts

```bash
pnpm clean
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm check
```

## Local Startup

`pnpm dev` starts the Next.js frontend only.

This repo expects a separate backend API to be running at `http://localhost:5000` by default. If that service is not running, requests rewritten from `/api/v1/*` will fail with `ECONNREFUSED` in the Next dev server logs.

Use one of these setups:

```bash
# keep the default backend target
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1

# or point the frontend at a different API host
NEXT_PUBLIC_API_BASE_URL=http://YOUR_API_HOST:PORT/api/v1
```

For a full dependency reset, prefer:

```bash
pnpm clean
pnpm install
pnpm dev
```

If you want to remove `node_modules` manually in PowerShell, use:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force pnpm-lock.yaml
```

## Project Structure

```text
src/
  app/                 # Next.js routes
  components/          # shared UI components
  config/              # env/config parsing
  contracts/           # Zod API contracts (DTO + schemas)
  features/            # feature modules (hooks/forms)
  lib/
    api/               # response/payload parsers
    axios/             # axios instance + http client
  services/            # API services by domain
  types/               # shared TS types
```

## API Layer Standard

All services now follow a contract-first pattern:
1. Validate request payload with Zod
2. Call backend via shared `httpClient`
3. Validate response `data` with Zod
4. Return strongly typed `ApiResponse<T>`

Core helper: [`src/lib/api/parse.ts`](src/lib/api/parse.ts)

## Notes

- If local tooling fails with `node is not recognized`, install Node.js 20+ and reopen the terminal.
- The repo uses strict TypeScript settings.
