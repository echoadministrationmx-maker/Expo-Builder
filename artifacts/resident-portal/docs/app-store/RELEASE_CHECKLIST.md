# iOS release checklist

## 1. Code and data readiness

- [ ] All automated checks pass from a clean checkout.
- [ ] Test the exact Git commit on iPhone, Replit, and the second computer.
- [ ] Confirm payment totals and maintenance data belong only to the signed-in resident.
- [ ] Create a dedicated App Review resident account with representative data.
- [ ] Complete the Supabase server-side security checklist.

## 2. Accounts

- [ ] Active Expo account and project.
- [ ] Active Apple Developer Program membership.
- [ ] Agreements accepted in Apple Developer and App Store Connect.
- [ ] App Store Connect app record uses bundle ID `com.echoadmin.residentportal`.

## 3. EAS

Run from `artifacts/resident-portal`:

```sh
pnpm run eas:init
pnpm dlx eas-cli@21.3.0 env:set production \
  --name EXPO_PUBLIC_SUPABASE_URL \
  --value YOUR_VALUE \
  --visibility plaintext
pnpm dlx eas-cli@21.3.0 env:set production \
  --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
  --value YOUR_VALUE \
  --visibility sensitive
pnpm run build:ios
```

The publishable key is designed for client apps, but storing it as sensitive in EAS reduces
accidental display in logs and dashboards. Never add a Supabase secret/service-role key.

## 4. TestFlight

- [ ] Upload with `pnpm run submit:ios`.
- [ ] Confirm processing and export-compliance status.
- [ ] Install through TestFlight on a physical iPhone.
- [ ] Test sign-in, background/resume, sign-out, balance, payments, pull-to-refresh, request creation,
      offline/error states, privacy link, and support email.

## 5. App Store Connect

- [ ] Copy metadata from `METADATA_ES_MX.md`.
- [ ] Complete App Privacy using `APP_PRIVACY.md`.
- [ ] Upload final screenshots from the production/TestFlight build.
- [ ] Complete age rating, content rights, availability, and Digital Services Act fields.
- [ ] Add the build to version 1.0.
- [ ] Add the dedicated demo credentials and notes from `REVIEW_NOTES.md`.
- [ ] Choose manual release for the first version.
- [ ] Submit for review.

## User-only actions

Apple/Expo sign-in, two-factor authentication, program enrollment/payment, legal agreement
acceptance, creation of the dedicated review account, and final legal/privacy declarations must be
completed by the account holder.
