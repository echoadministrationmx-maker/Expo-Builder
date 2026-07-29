# App Privacy answers

These answers describe the current mobile release. Reconfirm them whenever analytics, crash
reporting, photos, location, advertising, or payment collection is added.

## Tracking

- Data used to track users: **No**
- Data shared with data brokers or advertising networks: **No**

## Data linked to the resident

| App Store data type                   | Purpose           | Notes                                                             |
| ------------------------------------- | ----------------- | ----------------------------------------------------------------- |
| Contact Info — Name                   | App Functionality | Resident profile display                                          |
| Contact Info — Email Address          | App Functionality | Supabase Auth account                                             |
| Contact Info — Phone Number           | App Functionality | Resident phone and WhatsApp contact details                       |
| Identifiers — User ID                 | App Functionality | Account and tenant authorization                                  |
| Financial Info — Other Financial Info | App Functionality | Condominium balance and payment history; no card number is stored |
| User Content — Customer Support       | App Functionality | Maintenance category and description                              |
| User Content — Other User Content     | App Functionality | Responses to active community surveys                             |

## Not collected by this release

- Precise or coarse location
- Photos or videos
- Contacts
- Browsing or search history
- Advertising data
- Health, fitness, or sensitive information
- Card or bank-account credentials

## Third-party processing

Supabase provides authentication and database infrastructure. Apple requires the privacy answers
to include third-party SDK behavior, so verify Supabase's current data practices again immediately
before submission.

Mercado Pago Checkout Pro processes payment credentials on Mercado Pago's hosted checkout. Echo
receives the transaction amount, status, payment identifier, and payment method needed to reconcile
the resident's condominium balance, but does not receive or store card or bank-account credentials.
The payment-related records are covered by **Financial Info — Other Financial Info** above.

The public privacy policy is:
https://www.echoadministration.com/privacidad
