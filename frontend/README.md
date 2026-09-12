# LeastPriv Console (Frontend)

React + TypeScript + Vite console for the LeastPriv agent. See the [repo root README](../README.md) for the full project, architecture, and setup for both frontend and backend.

## Setup

```bash
npm install
npm run dev
```

Requires the backend running at `http://localhost:8000` by default (see [`../backend/README.md`](../backend/README.md)). To point at a different backend, copy `.env.example` to `.env` and set `VITE_API_URL`.

## Structure

```
src/
  lib/api.ts          typed client for the backend API (fetch + SSE)
  lib/auth.tsx          auth context: signup/login/logout, session persistence
  lib/toast.tsx        toast notification context
  lib/diffLines.ts      before/after policy diff rendering
  components/           shared UI (logo, banners, approval modal)
  pages/                Landing, Auth, Dashboard, Environments, NewRun,
                         Console (the live agent view), Report, History, Settings
  styles/tokens.css      design tokens (light/dark)
  styles/ui.css          shared component styles
```

The Agent Console (`pages/Console.tsx`) is the core screen: it opens a Server-Sent Events connection to the backend for the live reasoning stream, and polls run status for service health, the policy diff, and the iteration timeline — nothing on that page is mock data. `/app/*` routes require a real signed-in session (see `lib/auth.tsx`).

## Deploying (Vercel)

On [vercel.com](https://vercel.com): **Add New** → **Project** → import the
`leastpriv` GitHub repo → set **Root Directory** to `frontend` (Vercel
auto-detects the Vite preset) → add an environment variable
`VITE_API_URL` = your deployed backend URL (see
[`../backend/README.md`](../backend/README.md#deploying-render)) → Deploy.
