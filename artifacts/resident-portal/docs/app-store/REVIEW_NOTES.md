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
3. Pagos shows payment history and the condominium's verified BBVA transfer instructions. The
   resident may either open Mercado Pago Checkout Pro to pay the outstanding condominium fees or
   open their mail app to send a bank-transfer receipt to the condominium. Card and bank
   credentials are entered only on Mercado Pago's hosted checkout and are not collected or stored
   by Echo.
4. Solicitudes shows maintenance requests, community rules, emergency contacts, and allows a new
   request to be submitted.
5. Cuenta lets the resident confirm or update contact information and sign out.

## Business model

- The app does not sell digital content or subscriptions.
- Payment entries represent condominium fees and real-world property services.
- Mercado Pago Checkout Pro processes those real-world payments outside Apple's in-app purchase
  system.
- Accounts are provisioned by the condominium administrator; the app does not support account
  creation.
- Because residents cannot create accounts in the app, the account-creation deletion requirement
  does not apply to this release. Residents can exercise their legal privacy rights using the
  contact channel in the privacy policy.

## Privacy and permissions

- The app does not request camera, photo-library, microphone, tracking, contacts, or location
  permission.
- Privacy policy: https://www.echoadministration.com/privacidad
- Support: echoadministrationmx@gmail.com

## Backend

The Supabase backend, Mercado Pago production integration, and review account must remain available
throughout App Review.
