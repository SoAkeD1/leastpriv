# LeastPriv Console (Frontend)

React + TypeScript + Vite console for the LeastPriv agent. See the [repo root README](../README.md) for the full project, architecture, and setup for both frontend and backend.

## Setup

```bash
npm install
npm run dev
```

Requires the backend running at `http://localhost:8000` (see [`../backend/README.md`](../backend/README.md)) — the API base URL is set in `src/lib/api.ts`.

## Structure

```
src/
  lib/api.ts          typed client for the backend API (fetch + SSE)
  lib/toast.tsx        toast notification context
  lib/diffLines.ts      before/after policy diff rendering
  components/           shared UI (logo, banners, approval modal)
  pages/                Landing, Auth, Dashboard, Environments, NewRun,
                         Console (the live agent view), Report, History, Settings
  styles/tokens.css      design tokens (light/dark)
  styles/ui.css          shared component styles
```

The Agent Console (`pages/Console.tsx`) is the core screen: it opens a Server-Sent Events connection to the backend for the live reasoning stream, and polls run status for service health, the policy diff, and the iteration timeline — nothing on that page is mock data.
