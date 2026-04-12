# Eco Spark Frontend

Eco Spark is a role-based sustainability innovation platform built with Next.js 16, React 19, TypeScript, TanStack Query, TanStack Form, Zod, Axios, and Tailwind CSS 4.

It supports public discovery, authenticated workspaces, idea moderation, campaign and community flows, and paid idea access through a contract-first frontend architecture.

> Repository note: the package name is currently `eco_spark-backend`, but this repository contains the frontend application.

## Overview

Eco Spark is designed for organizations that need a structured path from idea submission to review, prioritization, and adoption.

The application supports four roles:

- `MEMBER`
- `SCIENTIST`
- `ADMIN`
- `SUPER_ADMIN`

The platform is split into:

- A public experience for browsing ideas, campaigns, scientists, and community content
- Auth flows for registration, email verification, login, password recovery, and reset
- Role-based dashboards for members, scientists, and admins
- An API integration layer that validates both request payloads and backend responses with Zod

## Core Capabilities

- Public homepage with editorial sections, live idea showcase, pricing, and conversion flows
- Public idea catalog with search, pagination, paid/free access behavior, and detail pages
- Public directories for campaigns, scientists, and community content
- Registration, email verification, login, forgot password, and reset password flows
- Cookie- and token-based session handling with automatic refresh on `401` responses
- Member dashboard for browsing ideas, purchases, reports, saved items, votes, comments, and profile management
- Scientist dashboard for idea creation, drafts, submissions, attachments, and idea management
- Admin dashboard for user management, moderation, featured/archive flows, taxonomy management, reports, and campaigns
- Commerce integration for checkout session creation, purchases, and transactions

## Tech Stack

| Area | Stack |
| --- | --- |
| Framework | Next.js `16.2.1` |
| UI | React `19.2.4`, Tailwind CSS `4`, local UI primitives, shadcn/Base UI conventions |
| Language | TypeScript with `strict` mode enabled |
| Data fetching | TanStack Query |
| Forms | TanStack Form + Zod |
| HTTP client | Axios |
| Validation/contracts | Zod |
| Icons | Lucide React |
| Linting | ESLint + `eslint-config-next` |

## Product Surface

### Public routes

- `/`
- `/idea`
- `/idea/[id]`
- `/campaigns`
- `/campaigns/my-votes`
- `/scientist`
- `/community`
- `/subscription-plan`
- `/payments/success`
- `/redirect-demo`

### Auth routes

- `/login`
- `/register`
- `/verify-email`
- `/forgot-password`
- `/reset-password`

### Protected routes

- Common protected routes:
  `/my-profile`, `/change-password`, `/my-vote`, `/my-comment`, `/saved-ideas`, `/my-purchases`, `/purches-idea`
- Member workspace:
  `/dashboard` and related subpages under `/dashboard/*`
- Scientist workspace:
  `/scientist/dashboard/*`
- Admin workspace:
  `/admin/dashboard/*`

## Architecture

### High-level flow

```text
Page / Component
  -> Feature hook
  -> Service module
  -> Shared httpClient
  -> Axios instance
  -> /api/v1 rewrite
  -> External backend API
```

### Directory structure

```text
src/
  app/
    (publicLayout)/          Public pages and auth routes
    (dashboardLayout)/       Role-based dashboards
  components/
    ui/                      Shared UI primitives
  config/                    Env and auth cookie config
  contracts/                 Zod request/response contracts
  features/                  Query/mutation hooks, form helpers, feature exports
  lib/                       Shared runtime utilities, auth, errors, axios, navigation
  providers/                 App-level providers
  services/                  API service modules by domain
  types/                     Shared TypeScript types
```

### Domain modules

The application is organized around feature/service domains, including:

- `auth`
- `idea`
- `campaign`
- `category`
- `tag`
- `specialty`
- `commerce`
- `community`
- `scientist`
- `interaction`
- `moderation`
- `user`
- `admin-analytics`
- `member-analytics`
- `scientist-analytics`

### Contract-first API layer

The frontend follows a consistent API pattern:

1. Validate outbound payloads with Zod
2. Call the backend through `src/lib/axios/httpClient.ts`
3. Validate inbound `data` payloads with Zod contracts from `src/contracts`
4. Expose typed query/mutation hooks from `src/features`

Representative files:

- [`src/contracts`](src/contracts)
- [`src/services`](src/services)
- [`src/features`](src/features)
- [`src/lib/api/parse.ts`](src/lib/api/parse.ts)
- [`src/lib/axios/httpClient.ts`](src/lib/axios/httpClient.ts)

## Authentication and Authorization

Eco Spark uses a mixed server/client session model:

- Login can persist auth cookies on the server through the login server action in `src/app/(publicLayout)/(authRouteGroup)/login/_actions.ts`
- Client-side auth state is also mirrored into `localStorage` and cookies via [`src/lib/auth/session.ts`](src/lib/auth/session.ts)
- The Axios client injects the access token automatically and attempts token refresh on `401`
- Protected routes are enforced in [`src/proxy.ts`](src/proxy.ts)
- Server layouts and pages can read auth state via [`src/lib/auth/session.server.ts`](src/lib/auth/session.server.ts)

### Role defaults

| Role | Default route |
| --- | --- |
| `MEMBER` | `/dashboard` |
| `SCIENTIST` | `/scientist/dashboard` |
| `ADMIN` | `/admin/dashboard` |
| `SUPER_ADMIN` | `/admin/dashboard` |

## Environment

The frontend currently uses one required runtime variable:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

Reference:

- [`.env.example`](.env.example)

Important notes:

- The value must include the `/api/v1` suffix
- `next.config.ts` rewrites `/api/v1/:path*` to this backend origin
- The Axios client uses `/api/v1` in the browser and the external URL on the server
- Even though `src/config/env.ts` defines a fallback, you should still set `NEXT_PUBLIC_API_BASE_URL` explicitly in local and deployed environments so rewrites work correctly

## Local Development

### Prerequisites

- Node.js `20.x`
- pnpm `10.x`

The repo includes [`.nvmrc`](.nvmrc) set to `20`.

### Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create a local environment file:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

3. Start the backend API separately and ensure it is reachable at the configured `NEXT_PUBLIC_API_BASE_URL`

4. Start the frontend:

```bash
pnpm dev
```

### Development URLs

- Frontend: typically `http://localhost:3000`
- Backend default target: `http://localhost:5000/api/v1`

If the backend is not running, API requests will fail and the frontend will surface network or connection errors.

## Available Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start Next.js in webpack dev mode |
| `pnpm dev:turbopack` | Start Next.js in turbopack dev mode |
| `pnpm dev:webpack` | Explicit webpack dev mode |
| `pnpm build` | Production build |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript without emitting output |
| `pnpm check` | Run typecheck and lint |
| `pnpm clean` | Remove `node_modules`, `.next`, `.dist`, and `pnpm-lock.yaml` |

Build cleanup is also handled by [`scripts/clean-dist.js`](scripts/clean-dist.js).

## Deployment

The project is suitable for Vercel or any Node-compatible hosting environment.

### Recommended deployment settings

- Node.js version: `20.x`
- Build command: `pnpm build`
- Start command: `pnpm start`

### Required deployment environment variable

```bash
NEXT_PUBLIC_API_BASE_URL=https://YOUR_BACKEND_HOST/api/v1
```

### Deployment considerations

- The backend must allow the frontend origin in CORS configuration
- Auth relies on cookies and credentialed requests, so cookie settings must match your deployment environment
- The frontend rewrites `/api/v1/*`, so the backend base URL must be reachable from the deployed Next.js server
- After updating `NEXT_PUBLIC_API_BASE_URL`, redeploy so the build picks up the new value

## Developer Conventions

- Use `@/*` import aliases from `tsconfig.json`
- Keep API payload and response shapes in `src/contracts`
- Keep remote calls in `src/services`
- Keep React Query and form logic in `src/features`
- Prefer shared utilities in `src/lib`
- Keep route protection logic centralized in `src/proxy.ts`

## Quality Notes

- TypeScript runs in `strict` mode
- ESLint is configured with Next.js core web vitals and TypeScript presets
- TanStack Query retry behavior is customized in [`src/lib/query-client.ts`](src/lib/query-client.ts)
- There is currently no automated test suite or `test` script configured in this repository

## Known Repository Notes

There are a few existing naming inconsistencies already present in the codebase. They are worth knowing before navigating or refactoring:

- Package name: `eco_spark-backend`
- Route name: `/purches-idea`
- Folder names such as `memberRouteGrrup` and `idea-attchment`

These look like legacy naming artifacts rather than intentional domain terms.

## Troubleshooting

### API requests fail with a network error

Check:

- The backend server is running
- `NEXT_PUBLIC_API_BASE_URL` is correct
- The backend accepts requests from the frontend origin

### Protected routes keep redirecting to login

Check:

- Access and refresh tokens are being set correctly
- Role cookies are present
- The token is not expired
- Local storage and cookies are not holding stale session values

### Auth works locally but fails in production

Check:

- Cookie security settings
- CORS configuration
- Backend domain and protocol
- Deployment environment variable values

## License

No license file is currently defined in this repository.
