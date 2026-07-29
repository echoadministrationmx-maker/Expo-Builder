# Echo Community Operating System V2

## Project Description

Echo V2 evolves the existing resident mobile app and web portals into one multi-tenant operating system for residential communities in Mexico. It coordinates residents, owners, administrators, board members, guards, technicians, and vendors against the same auditable records. Echo's local management and labor teams are part of the product: software records not only what a resident requested, but who owned the work, what happened, what it cost, what evidence exists, and whether the outcome was accepted.

## Why This Milestone

Version 1 establishes the release foundation: resident identity, balances, payment history, Mercado Pago and bank-transfer options, persistent requests, contact updates, rules, emergency contacts, and an App Store-ready mobile experience. Market leaders already connect these basics to accounting, communications, amenity reservations, access control, board governance, and field operations. Echo has an opportunity to exceed software-only competitors by connecting its real operating team to transparent workflows, but adding those capabilities to Version 1 would delay launch and increase release risk. Version 2 creates the integrated product after Version 1 reaches production.

## User-Visible Outcome

Residents use one consistent mobile or web account to understand and pay their obligations, receive relevant notices, find authoritative documents, reserve amenities, invite visitors, participate in decisions, and follow service work from request through verified completion. Administrators and boards see the same history, financial context, approvals, and service performance. Guards and technicians receive focused mobile workflows that work in poor connectivity and capture a reliable handoff and proof of work.

## Completion Class

Integrated product milestone. It is complete when the resident, administrator/board, guard/front-desk, and maintenance/field experiences operate on the same tenant-aware production data model and the final integrated acceptance scenarios pass.

## Final Integrated Acceptance

A configured pilot community can onboard a household with multiple authorized members, publish a targeted notice and versioned document, collect and reconcile a maintenance payment, accept an amenity reservation, validate an expiring visitor QR code at the gate, convert a resident issue into an assigned work order, complete that work with required evidence in intermittent connectivity, obtain resident or supervisor confirmation, and include the financial and service outcome in a board-ready report. Every actor sees only authorized community and unit data, and the audit history explains each material change.

## Architectural Decisions

- Mobile resident, web resident, administrator/board, guard/front-desk, and maintenance/field experiences share one versioned backend contract and one source of truth.
- Community data is isolated by tenant and constrained by explicit roles; authorization is enforced server-side and tested for cross-community leakage.
- Legacy password-replay resident workflows are retired through a migration path to session-based authentication.
- Payments, return URLs, and client screens never determine ledger truth. Signed provider events and server-to-server verification feed an idempotent reconciliation workflow with a visible exception queue.
- Community resources such as contacts, rules, documents, notices, benefits, and amenity configuration are managed records rather than duplicated application constants.
- Operational work is case-based. Requests, approvals, assignments, messages, evidence, costs, and outcomes remain connected in one immutable history.
- Field clients are offline-tolerant and synchronize through idempotent commands with conflict detection.
- High-impact AI output is advisory and approval-gated. Financial, access, safety, disciplinary, and legal actions require an authorized human decision.
- Version 2 ships incrementally behind per-community feature flags without breaking Version 1 App Store or Replit testing.

## Error Handling Strategy

Every user-triggered mutation returns a stable result that distinguishes validation, authorization, conflict, provider, connectivity, and unexpected failures. Retriable operations are idempotent and expose a pending state instead of implying success. Payment and access exceptions enter owned queues with safe retry or reconciliation actions. Offline field actions remain visibly queued until confirmed by the server. Resident-facing language explains the next safe action without exposing secrets or internal identifiers. Structured logs, correlation identifiers, durable audit events, health checks, and failure alerts make production incidents diagnosable.

## Risks and Unknowns

- Mexican condominium governance, fiscal, privacy, and collections requirements may vary by entity and state and require qualified legal/accounting validation.
- Mercado Pago production approval, fees, refund behavior, installment configuration, and webhook reliability must be validated with the real merchant account.
- Access-control hardware varies substantially; a hardware-neutral QR and guard workflow must precede vendor-specific integrations.
- WhatsApp messaging requires approved templates, consent, provider selection, and ongoing cost management.
- Existing web authentication and legacy database functions require a staged migration that preserves resident access.
- Some current website benefits and community documents appear to be demonstration content and cannot be treated as production data without verification.
- Low-connectivity field behavior and device sharing at guard stations need pilot observation.
- The first pilot community, operational SLAs, document owners, and fiscal workflow boundaries require business confirmation.

## Existing Codebase / Prior Art

The current Expo resident application already provides authenticated resident data, balances, payment history, persistent requests, editable contact information, logout, community rules, emergency contacts, and a Mercado Pago Checkout Pro sandbox integration backed by Supabase functions and webhook handling. The current web application provides resident and administrator views with additional events, surveys, warnings, and community information, but contains legacy authentication patterns, placeholder documents, duplicated constants, and a nonfunctional payment presentation. Both products use the same Supabase project and can converge through additive, versioned backend contracts.

## Relevant Requirements

- Version 1 App Store work remains releasable throughout Version 2 development.
- Mobile, web, Replit, local Expo, preview/TestFlight, and production builds use explicit environment configuration and remain independently testable.
- Shared resources and business rules are authored once and rendered appropriately in each client.
- Resident and operational experiences are Spanish-first and support accessibility, clear error recovery, and future localization.
- Sensitive credentials remain server-side; client applications contain only publishable configuration.
- Payment, access, voting, disciplinary, and work-completion records are auditable and exportable.
- Benefits and local offers have verified owners, terms, validity dates, and moderation.

## Scope

In scope are secure multi-tenant identity and roles; multi-unit households; a shared resource and document service; notification preferences and targeted push, email, and optional WhatsApp delivery; resident mobile/web parity; richer requests and work orders; guard and field modes; amenity reservations; visitor and package workflows; payment reconciliation and collections; Mexican fiscal integration boundaries; board reporting and approvals; voting and assemblies; vendors and asset maintenance; portfolio operations; observability; import/export; and approval-gated AI assistance.

Out of scope are replacing emergency services, guaranteeing legal or accounting compliance without professional review, autonomous financial/access/disciplinary decisions, launching unverified marketplace offers, and committing to specific access hardware before the neutral workflow is proven.

## Technical Constraints

- Expo and React Native remain the mobile delivery foundation, with App Store and Android store builds produced through EAS.
- Supabase remains the initial backend and must enforce tenant isolation through database constraints, row-level security, narrow server functions, and automated authorization tests.
- Mercado Pago remains the initial online payment provider for Mexico; Apple in-app purchase is not used for real-world condominium fees.
- Existing production data and Version 1 contracts require additive migrations, backward compatibility, and rollback plans.
- Public/publishable client configuration must be separated from secrets and from sandbox/production provider credentials.
- Mobile field workflows must tolerate intermittent connectivity and duplicate delivery.

## Integration Points

- Supabase authentication, Postgres, row-level security, storage, realtime, and Edge Functions.
- Mercado Pago preferences, payments, refunds, installments, return links, and signed webhooks.
- Apple App Store, TestFlight, EAS Build/Submit, push notifications, and deep linking.
- Email delivery and an approved WhatsApp Business provider for transactional communication.
- Mexican banking, reconciliation, and optional CFDI/SAT services selected after compliance validation.
- Optional QR scanners, access controllers, cameras, intercoms, and vehicle systems through versioned adapter interfaces.
- Existing Echo resident web, administrator portal, public website, and Replit workflow.

## Testing Requirements

- Unit and contract tests cover roles, state transitions, idempotency, reconciliation, voting rules, reservations, work-order evidence, and shared resource rendering.
- Authorization tests attempt every sensitive operation across communities, units, and roles and prove denial by default.
- Payment tests cover approved, rejected, pending, refunded, duplicate, delayed, forged, and out-of-order provider events without corrupting the resident ledger.
- Offline tests cover queued field actions, app termination, duplicate synchronization, stale data, and conflicts.
- End-to-end pilot tests cover resident mobile/web, administrator/board, guard, and technician flows using production-like data.
- App Store preview builds pass physical-device accessibility, deep-link, session, payment-return, privacy, and review-account checks.
- Replit and local workflows are exercised from clean clones using documented setup and environment validation.
- Backup restoration, export, monitoring, and failure alerts are tested before pilot production.

## Acceptance Criteria

- A person may securely access all authorized units and communities without seeing any unauthorized record.
- Administrators publish contacts, rules, documents, notices, benefits, and amenity rules once; supported clients show the same current version.
- Notices support targeting, scheduling, user preferences, delivery state, and a durable history.
- Residents create a request with attachments and see its owner, status, conversation, SLA/ETA, evidence, and outcome on mobile and web.
- A technician completes required work offline or online with checklists, time, materials, and before/after evidence; synchronization is idempotent.
- An amenity cannot be double-booked, and its capacity, charges, deposits, approval, cancellation, and waitlist rules are enforced server-side.
- A resident creates an expiring or recurring visitor permission and a guard validates it without exposing unnecessary personal data.
- A package has a traceable custody history from receipt through resident pickup.
- Payment events reconcile automatically where possible; unresolved exceptions are owned, auditable, and cannot silently alter balances.
- Boards can review budget, actuals, reserves, collections, approvals, work performance, and supporting evidence in a board-ready report.
- Voting enforces configured unit eligibility, quorum, weighting, and result visibility and produces an exportable evidence record.
- Feature flags allow a pilot community to use Version 2 while Version 1 communities continue functioning.
- Automated security, contract, unit, integration, offline, and end-to-end acceptance suites pass for the pilot release.

## Open Questions

- Which community will be the Version 2 pilot, and which resident, board, guard, and technician representatives will validate it?
- Which operational SLAs and escalation rules should Echo contractually promise?
- Which Mexican fiscal and legal workflows are mandatory for the first commercial segment?
- Should WhatsApp be a primary transactional channel or an optional notification mirror?
- Which access hardware is already deployed in target communities?
- Which current web records are authoritative production data versus demonstration content?
- Which benefits and local partnerships are verified and owned by a person responsible for renewals?
- What information should residents, owners, tenants, board members, and vendors be allowed to see differently?
