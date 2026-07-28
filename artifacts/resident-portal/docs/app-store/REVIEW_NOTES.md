# App Review notes — version 1.0.0

Echo is a private resident portal for condominiums administered by Echo Administración.

## Reviewer access

The app requires an active resident account. Before submission, enter a dedicated review account
in App Store Connect's **App Review Information** fields.

Do not commit the credentials to Git.

- Username/access key: **ADD DIRECTLY IN APP STORE CONNECT**
- Password: **ADD DIRECTLY IN APP STORE CONNECT**

Keep the review account active, with sample payment history and at least one maintenance request,
for the entire review period.

## Navigation

1. Sign in with the review access key and password.
2. Inicio shows the resident profile, outstanding balance, recent payments, and latest maintenance
   request.
3. Pagos shows the resident's payment history.
4. Solicitudes shows maintenance requests and allows a new request to be submitted.

## Business model

- The app does not sell digital content or subscriptions.
- The current release does not collect payment in the app.
- Payment entries represent condominium fees and real-world property services.
- Accounts are provisioned by the condominium administrator; the app does not support account
  creation.

## Privacy and permissions

- The app does not request camera, photo-library, microphone, tracking, or location permission.
- Privacy policy: https://www.echoadministration.com/privacidad
- Support: echoadministrationmx@gmail.com

## Backend

The Supabase backend and review account must remain available throughout App Review.
