# Echo Resident Portal

Expo/React Native companion to the existing Echo Administración web resident and admin portals:

- Website: https://www.echoadministration.com/
- Web source: https://github.com/echoadministrationmx-maker/echoadministration-web
- Privacy policy: https://www.echoadministration.com/privacidad

## Development

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm --filter @workspace/resident-portal start
```

Create `artifacts/resident-portal/.env.local` from `.env.example`. Never commit the populated file.

Replit continues to use the existing `dev` script. Local Mac/iPhone development uses `start` or
`start:tunnel`.

## Current mobile scope

- Supabase Auth resident login
- Resident profile and balance summary
- Payment history
- Maintenance request history and submission

The web portal contains additional modules that can be brought to mobile in later releases. The
mobile app intentionally does not copy the web portal's legacy password-in-memory RPC session;
native clients use Supabase Auth sessions and database Row Level Security.

## Verification

```sh
pnpm --filter @workspace/resident-portal test
pnpm run typecheck
pnpm dlx expo-doctor
```

Run Expo Doctor from `artifacts/resident-portal`.

See [`docs/app-store/RELEASE_CHECKLIST.md`](docs/app-store/RELEASE_CHECKLIST.md) for the iOS release
process.
