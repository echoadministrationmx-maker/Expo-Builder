# Echo Resident Portal

Expo resident portal plus the supporting API and shared workspace packages.

## Run & Operate

- `pnpm --filter @workspace/resident-portal run dev` — run Expo through the Replit proxy
- `pnpm --filter @workspace/resident-portal start` — run Expo locally over LAN for Expo Go
- `pnpm --filter @workspace/resident-portal run start:tunnel` — local Expo Go fallback when LAN discovery fails
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/resident-portal` — Expo resident app
- `artifacts/resident-portal/app` — Expo Router screens
- `artifacts/resident-portal/context/ResidentContext.tsx` — native authentication/session state
- `artifacts/resident-portal/lib/supabase.ts` — native Supabase client
- `artifacts/resident-portal/docs/app-store` — App Store metadata and release checklist
- `artifacts/api-server` — supporting workspace API
- Web resident/admin portal source: https://github.com/echoadministrationmx-maker/echoadministration-web

## Architecture decisions

- The native app replicates a focused subset of the web resident portal while sharing the same Echo brand and Supabase
  project.
- Native authentication uses Supabase Auth sessions and Row Level Security; do not copy the web portal's legacy
  password-in-memory RPC session.
- Only Supabase publishable client credentials use `EXPO_PUBLIC_*` variables. Secret/service-role keys must never be
  bundled.
- Replit keeps its proxy-specific `dev` script. Mac/iPhone development uses LAN or tunnel scripts.
- App Store binaries are produced and signed with EAS Build from the Expo app directory.

## Product

Private resident access, profile and balance summary, payment history, and maintenance request tracking/submission.
Additional web modules can be brought to native in later releases.

## User preferences

- Keep the Mac, Replit, second development computer, and GitHub synchronized through reviewed commits.
- Require explicit user approval before future Git pushes.
- Preserve Replit-specific behavior while making local and App Store workflows reproducible.

## Gotchas

- Keep the Replit-only `dev` script separate from local `start`; Replit depends on its proxy environment variables.
- Run EAS commands from `artifacts/resident-portal`, which is the Expo app root in this monorepo.
- Do not add placeholder `owner`, `extra.eas.projectId`, or `updates.url` values to `app.json`. Run `pnpm run eas:init` while logged into the intended Expo account so EAS writes the real project ID.
- `.env.local` stays untracked. Copy `.env.example` on each development computer and configure `EXPO_PUBLIC_SUPABASE_URL` plus `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Replit and EAS before production builds.
- Before switching computers: commit and push; on the other computer: pull before editing. Never commit `node_modules`, `.expo`, `.env.local`, or generated `ios`/`android` directories.

## Pointers

- `artifacts/resident-portal/README.md`
- `artifacts/resident-portal/docs/app-store/RELEASE_CHECKLIST.md`
- `artifacts/resident-portal/docs/security/SUPABASE_CHECKLIST.md`
