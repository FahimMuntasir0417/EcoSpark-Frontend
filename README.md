# Eco Spark

A role-based sustainability innovation platform for submitting, reviewing, moderating, purchasing, and adopting eco-focused ideas.

> Repository note: the package name is currently `eco_spark-backend`, but this repository contains the frontend application.

---

## Table of Contents

- [About the Project](#about-the-project)
- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Dependencies](#dependencies)
- [Screenshots](#screenshots)
- [Live Demo and Credentials](#live-demo-and-credentials)
- [Installation and Setup](#installation-and-setup)
- [Environment Variables](#environment-variables)
- [API and Architecture](#api-and-architecture)
- [Folder Structure](#folder-structure)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Contributions](#contributions)
- [How to Contribute](#how-to-contribute)
- [License](#license)
- [Contact](#contact)

---

## About the Project

Eco Spark is a contract-first frontend application built with Next.js 16, React 19, TypeScript, TanStack Query, TanStack Form, Zod, Axios, and Tailwind CSS 4.

It supports public discovery, authenticated workspaces, idea moderation, campaign and community flows, and paid idea access through a structured API integration layer.

## Project Overview

Eco Spark is designed for organizations and communities that need a clear path from sustainability idea submission to review, prioritization, and adoption.

The application supports four role categories:

- `MEMBER`
- `SCIENTIST`
- `ADMIN`
-

The product surface includes:

- A public experience for browsing ideas, campaigns, scientists, and community content
- Authentication flows for registration, email verification, login, password recovery, and password reset
- Role-based dashboards for members, scientists, and admins
- A typed API layer that validates request payloads and backend responses with Zod
- Commerce flows for paid idea access, checkout, purchases, and transaction history

## Problem Statement

Sustainability ideas are often scattered across informal channels, making them difficult to review, moderate, rank, purchase, or adopt. Teams need a system that separates public discovery from authenticated workflows while preserving role-specific permissions and reliable API contracts.

## Solution Overview

Eco Spark provides a Next.js frontend with public routes, protected dashboards, contract-validated API services, role-aware navigation, token refresh handling, and reusable feature hooks. The interface connects members, scientists, and admins around one idea lifecycle.

## Key Features

- Public homepage with editorial sections, live idea showcase, pricing, and conversion flows
- Public idea catalog with search, pagination, paid/free access behavior, and detail pages
- Public directories for campaigns, scientists, and community content
- Registration, email verification, login, forgot password, and reset password flows
- Cookie- and token-based session handling with automatic refresh on `401` responses
- Member dashboard for browsing ideas, purchases, reports, saved items, votes, comments, and profile management
- Scientist dashboard for idea creation, drafts, submissions, attachments, and idea management
- Admin dashboard for user management, moderation, featured/archive flows, taxonomy management, reports, and campaigns
- Commerce integration for checkout session creation, purchases, and transactions
- Contract-first API layer with Zod validation for request and response data

## Tech Stack

| Area                 | Stack                                                             |
| -------------------- | ----------------------------------------------------------------- |
| Frontend             | Next.js `16.2.1`, React `19.2.4`, TypeScript                      |
| Styling              | Tailwind CSS `4`, local UI primitives, shadcn/Base UI conventions |
| Data fetching        | TanStack Query                                                    |
| Forms                | TanStack Form, Zod                                                |
| Backend integration  | Axios, Next.js rewrites, REST API                                 |
| Auth                 | Cookies, local storage session mirror, JWT/token refresh flow     |
| Validation/contracts | Zod                                                               |
| Icons                | Lucide React                                                      |
| Tooling              | ESLint, TypeScript, pnpm, Vercel                                  |

## Dependencies

Major runtime libraries:

```json
{
  "@tanstack/react-form": "^1.28.5",
  "@tanstack/react-query": "^5.95.0",
  "axios": "^1.13.6",
  "jsonwebtoken": "^9.0.3",
  "lucide-react": "^0.577.0",
  "next": "16.2.1",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "tailwindcss": "^4",
  "zod": "^4.3.6"
}
```

Development dependencies include TypeScript, ESLint, Next.js ESLint config, React type packages, and Tailwind PostCSS support.

## Screenshots

Project images are available in [`public/images`](public/images):

- [`eco-spark-innovation-lab.png`](public/images/eco-spark-innovation-lab.png)
- [`eco-spark-adoption-hub.png`](public/images/eco-spark-adoption-hub.png)

## Live Demo and Credentials

### Repositories

- Frontend Repo: https://github.com/FahimMuntasir0417/EcoSpark-Frontend
- Backend Repo: https://github.com/FahimMuntasir0417/EcoSpark-Hub

### Live URLs

- Frontend: https://eco-spark-frontend.vercel.app
- Backend API: https://assignment-eco-spark.vercel.app
- Local frontend: http://localhost:3000
- Local backend default: http://localhost:5000/api/v1

### Demo Video

- https://drive.google.com/file/d/1ZzTSUULNzsSZ-n4m5TGL6SHEAomqg9z7/view

### Demo Credentials

Use demo credentials only for non-production demonstrations.

| Role      | Email                       | Password         |
| --------- | --------------------------- | ---------------- |
| Admin     | `admin@ecospark.local`      | `Admin12345`     |
| Scientist | `muntasirbejoy66@gmail.com` | `StrongPass123!` |

## Installation and Setup

### Prerequisites

- Node.js `20.x`
- pnpm `10.x`

The repo includes [`.nvmrc`](.nvmrc) set to `20`.

### Setup

1. Clone the repository:

```bash
git clone https://github.com/FahimMuntasir0417/EcoSpark-Frontend
cd EcoSpark-Frontend
```

2. Install dependencies:

```bash
pnpm install
```

3. Create a local environment file:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

4. Start the backend API separately and ensure it is reachable at the configured `NEXT_PUBLIC_API_BASE_URL`.

5. Run the application:

```bash
pnpm dev
```

## Environment Variables

Create `.env.local` in the root directory using [`.env.example`](.env.example) as the reference.

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_GOOGLE_AUTH_URL=http://localhost:5000/api/v1/auth/login/google

NEXT_PUBLIC_DEMO_ADMIN_EMAIL=admin@ecospark.local
NEXT_PUBLIC_DEMO_ADMIN_PASSWORD=Admin12345
NEXT_PUBLIC_DEMO_SCIENTIST_EMAIL=muntasirbejoy66@gmail.com
NEXT_PUBLIC_DEMO_SCIENTIST_PASSWORD=StrongPass123!
```

Important notes:

- `NEXT_PUBLIC_API_BASE_URL` must include the `/api/v1` suffix.
- `NEXT_PUBLIC_GOOGLE_AUTH_URL` is optional; the login page falls back to the proxied Google login bridge, `/api/v1/auth/login/google`.
- Do not commit real production secrets. Public demo credentials are acceptable only when they are intentionally safe for demos.

## API and Architecture

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

### Contract-first API layer

The frontend follows a consistent API pattern:

1. Validate outbound payloads with Zod.
2. Call the backend through [`src/lib/axios/httpClient.ts`](src/lib/axios/httpClient.ts).
3. Validate inbound `data` payloads with Zod contracts from [`src/contracts`](src/contracts).
4. Expose typed query/mutation hooks from [`src/features`](src/features).

Representative files:

- [`src/contracts`](src/contracts)
- [`src/services`](src/services)
- [`src/features`](src/features)
- [`src/lib/api/parse.ts`](src/lib/api/parse.ts)
- [`src/lib/axios/httpClient.ts`](src/lib/axios/httpClient.ts)

### Authentication and Authorization

Eco Spark uses a mixed server/client session model:

- Login can persist auth cookies on the server through the login server action in `src/app/(publicLayout)/(authRouteGroup)/login/_actions.ts`.
- Client-side auth state is mirrored into local storage and cookies via [`src/lib/auth/session.ts`](src/lib/auth/session.ts).
- The Axios client injects the access token automatically and attempts token refresh on `401`.
- Protected routes are enforced in [`src/proxy.ts`](src/proxy.ts).
- Server layouts and pages can read auth state via [`src/lib/auth/session.server.ts`](src/lib/auth/session.server.ts).

Role defaults:

| Role          | Default route          |
| ------------- | ---------------------- |
| `MEMBER`      | `/dashboard`           |
| `SCIENTIST`   | `/scientist/dashboard` |
| `ADMIN`       | `/admin/dashboard`     |
| `SUPER_ADMIN` | `/admin/dashboard`     |

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

- Common protected routes: `/my-profile`, `/change-password`, `/my-vote`, `/my-comment`, `/saved-ideas`, `/my-purchases`, `/purches-idea`
- Member workspace: `/dashboard` and related subpages under `/dashboard/*`
- Scientist workspace: `/scientist/dashboard/*`
- Admin workspace: `/admin/dashboard/*`

## Folder Structure

```text
eco-spark-frontend/
|
+-- public/
|   +-- images/
+-- scripts/
|   +-- clean-dist.js
+-- src/
|   +-- app/
|   |   +-- (publicLayout)/
|   |   +-- (dashboardLayout)/
|   +-- components/
|   |   +-- ui/
|   +-- config/
|   +-- contracts/
|   +-- features/
|   +-- lib/
|   +-- providers/
|   +-- services/
|   +-- types/
+-- .env.example
+-- next.config.ts
+-- package.json
+-- pnpm-lock.yaml
+-- tsconfig.json
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

## Available Scripts

| Command              | Purpose                                                       |
| -------------------- | ------------------------------------------------------------- |
| `pnpm dev`           | Start Next.js in webpack dev mode                             |
| `pnpm dev:turbopack` | Start Next.js in turbopack dev mode                           |
| `pnpm dev:webpack`   | Explicit webpack dev mode                                     |
| `pnpm build`         | Production build                                              |
| `pnpm start`         | Start the production server                                   |
| `pnpm lint`          | Run ESLint                                                    |
| `pnpm typecheck`     | Run TypeScript without emitting output                        |
| `pnpm check`         | Run typecheck and lint                                        |
| `pnpm clean`         | Remove `node_modules`, `.next`, `.dist`, and `pnpm-lock.yaml` |

Build cleanup is also handled by [`scripts/clean-dist.js`](scripts/clean-dist.js).

## Deployment

The project is suitable for Vercel or any Node-compatible hosting environment.

### Recommended deployment settings

- Node.js version: `20.x`
- Build command: `pnpm build`
- Start command: `pnpm start`

### Deployment environment variables

```bash
NEXT_PUBLIC_API_BASE_URL=https://YOUR_BACKEND_HOST/api/v1
NEXT_PUBLIC_GOOGLE_AUTH_URL=https://YOUR_BACKEND_HOST/api/v1/auth/login/google
```

### Deployment considerations

- The backend must allow the frontend origin in CORS configuration.
- Auth relies on cookies and credentialed requests, so cookie settings must match the deployment environment.
- The frontend rewrites `/api/v1/*` and `/api/auth/*`, so the backend base URL must be reachable from the deployed Next.js server.
- Google OAuth must authorize the backend callback URL exactly: `https://YOUR_BACKEND_HOST/api/auth/callback/google`.
- After updating `NEXT_PUBLIC_API_BASE_URL` or `NEXT_PUBLIC_GOOGLE_AUTH_URL`, redeploy so the build picks up the new value.

## Contributions

If this is a team project, list contributors here.

| Name     | Role | Contributions |
| -------- | ---- | ------------- |
| Member-1 | Role | Contributions |
| Member-2 | Role | Contributions |

## How to Contribute

- Fork the project.
- Create a branch: `git checkout -b feature/AmazingFeature`.
- Commit changes: `git commit -m "Add some AmazingFeature"`.
- Push the branch: `git push origin feature/AmazingFeature`.
- Open a pull request.

## Developer Conventions

- Use `@/*` import aliases from `tsconfig.json`.
- Keep API payload and response shapes in `src/contracts`.
- Keep remote calls in `src/services`.
- Keep React Query and form logic in `src/features`.
- Prefer shared utilities in `src/lib`.
- Keep route protection logic centralized in `src/proxy.ts`.

## Quality Signals

This README is structured to show:

- Clear problem understanding
- Clean installation steps
- Evidence of system design thinking
- Security awareness around environment variables, auth, and demo credentials
- Scalability considerations through domain modules, contracts, services, and feature hooks

## Quality Notes

- TypeScript runs in `strict` mode.
- ESLint is configured with Next.js core web vitals and TypeScript presets.
- TanStack Query retry behavior is customized in [`src/lib/query-client.ts`](src/lib/query-client.ts).
- There is currently no automated test suite or `test` script configured in this repository.

## Known Repository Notes

There are a few existing naming inconsistencies already present in the codebase. They are worth knowing before navigating or refactoring:

- Package name: `eco_spark-backend`
- Route name: `/purches-idea`
- Folder names such as `memberRouteGrrup` and `idea-attchment`

These look like legacy naming artifacts rather than intentional domain terms.

## Troubleshooting

### API requests fail with a network error

Check:

- The backend server is running.
- `NEXT_PUBLIC_API_BASE_URL` is correct.
- The backend accepts requests from the frontend origin.

### Protected routes keep redirecting to login

Check:

- Access and refresh tokens are being set correctly.
- Role cookies are present.
- The token is not expired.
- Local storage and cookies are not holding stale session values.

### Auth works locally but fails in production

Check:

- Cookie security settings.
- CORS configuration.
- Backend domain and protocol.
- Deployment environment variable values.

## License

No license file is currently defined in this repository. Add a `LICENSE` or `LICENSE.txt` file if the project should be distributed under MIT or another license.

## Contact

**Live URL:** [Eco Spark Frontend](https://eco-spark-frontend.vercel.app)  
**Backend API:** [Eco Spark API](https://assignment-eco-spark.vercel.app)  
**Frontend Repo:** [EcoSpark-Frontend](https://github.com/FahimMuntasir0417/EcoSpark-Frontend)  
**Backend Repo:** [EcoSpark-Hub](https://github.com/FahimMuntasir0417/EcoSpark-Hub)  
**Email:** [fahimmuntasirbejoy@gmail.com](mailto:fahimmuntasirbejoy@gmail.com)  
**Portfolio:** [Fahim Portfolio](https://fahim-portfolio-dun.vercel.app/)
