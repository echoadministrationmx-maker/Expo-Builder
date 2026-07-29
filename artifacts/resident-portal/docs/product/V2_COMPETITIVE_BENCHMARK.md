# Echo V2 Competitive Benchmark

Updated: 2026-07-28

## Executive conclusion

Echo V1 is already a credible resident companion: residents can view their balance and payment history, pay through Mercado Pago or by bank transfer, create and revisit tickets, update contact details, sign out, read community rules, and reach emergency contacts. The important V2 gap is not another collection of isolated screens. The market leaders connect resident self-service, accounting, communications, access control, board governance, and field operations in one auditable system.

Echo should position V2 as the **operating system plus operating team for residential communities**. The defensible advantage is that Echo can combine software with real local labor. Every request, preventive task, incident, payment exception, and access event should have a responsible person, an SLA, a time-stamped history, evidence, cost, and a visible outcome.

This benchmark is based on publicly documented product capabilities. Vendor claims and adoption figures have not been independently audited.

## Mexico and Latin America benchmark

| Capability                           | Echo V1 today                                                     | ComunidadFeliz                                          | Neivor                                                   | Kolonus                                                  | V2 implication                                                                                                                   |
| ------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Resident balance and payment history | Yes                                                               | Yes                                                     | Yes                                                      | Yes                                                      | Keep, then add clearer statements, receipts, payment allocation, and multiple units.                                             |
| Online payments                      | Mercado Pago sandbox is working; bank transfer instructions exist | Cards, OXXO, SPEI/STP, recurring charges                | Cards/SPEI, automated reconciliation, financial services | Kolonus Pay                                              | Complete production activation, web parity, refunds/disputes, autopay, and fiscal receipts.                                      |
| Automatic reconciliation             | Mercado Pago webhook foundation exists                            | Yes                                                     | Core strength                                            | Marketed as part of payment flow                         | Make reconciliation observable and exception-driven instead of manual.                                                           |
| Delinquency automation               | Basic ledger visibility                                           | Automated reminders and debt reporting                  | Automated collections, penalties, reporting              | Access/payment-status products target delinquency        | Add segmented campaigns, promises to pay, payment plans, and escalation evidence.                                                |
| Notices and resident communication   | Limited resident resources; no unified notification center        | Push, wall, messages, targeted notices                  | Push and resident communications                         | Internal communication and notices                       | Add a shared inbox with push, email, WhatsApp, audience targeting, scheduled notices, and delivery/read status.                  |
| Surveys, voting, and assemblies      | Web has partial surveys; mobile parity is incomplete              | Voting by resident/unit, proration, eligibility, export | Voting and communications                                | Community collaboration                                  | Add auditable voting rules, quorum, weighted votes, exports, and mobile/web parity.                                              |
| Amenities                            | Rules are visible; no booking engine                              | Reservations with configurable rules and charges        | Reservations, capacity, rules, audit exports             | Amenity reservations                                     | Add real-time availability, deposits/fees, capacity, approvals, waitlists, and rule enforcement.                                 |
| Visitor/access control               | No                                                                | QR, vehicle/pedestrian access, hardware options         | QR, vehicle/visitor log, intercom, integrations          | Resident/guard apps, QR kiosk, intercom, access hardware | Build resident invitations plus a guard mode with offline fallback and auditable entry/exit.                                     |
| Packages and concierge               | No                                                                | Visitor/provider/package records                        | Packages, concierge, minor maintenance                   | Guard workflows                                          | Add photo evidence, recipient notification, custody chain, and pickup confirmation.                                              |
| Tickets and maintenance              | Persistent tickets work                                           | Incidents/maintenance                                   | Minor maintenance and service requests                   | Operational collaboration                                | Turn tickets into work orders with assignment, SLA, comments, photos, labor/material cost, and resident acceptance.              |
| Documents                            | Rules are currently embedded in the app                           | Searchable digital library                              | Documents/communications within the platform             | Community information                                    | Add a versioned library for rules, minutes, budgets, statements, contracts, acknowledgments, and permissions.                    |
| Financial transparency               | Balance/payment history                                           | Detailed financial visibility and reports               | A core market promise                                    | Reports and financial control                            | Add board-ready budget-vs-actual, reserve, expense evidence, monthly close, and drill-down views.                                |
| Guard/field workflow                 | No dedicated experience                                           | Access modules                                          | Security and concierge workflows                         | Dedicated guard application                              | Echo should add both guard and maintenance field modes, optimized for low-connectivity work.                                     |
| Multi-community operations           | Not yet productized                                               | Yes                                                     | Yes                                                      | Designed for portfolios                                  | Add tenant isolation, portfolio dashboards, templates, and per-community configuration.                                          |
| AI/automation                        | No productized AI                                                 | Administrative assistant integrations are marketed      | Neivor Intelligence                                      | Limited public AI positioning                            | Use approval-gated AI for routing, summaries, draft notices, anomaly detection, and resident answers grounded in community data. |

### What each named competitor does especially well

**ComunidadFeliz** presents a broad, mature condominium suite: collections, accounting, CFDI 4.0, resident payments, automated charges, amenity reservations, online voting, QR access, package handling, incidents, financial transparency, and automated reports. Its public Mexico pages emphasize an integrated resident app and administrative back office rather than a standalone resident portal. Sources: [product overview](https://www.comunidadfeliz.com/), [Mexico feature set](https://www.comunidadfeliz.mx/funcionalidades), [access control](https://www.comunidadfeliz.mx/control-de-acceso), and [voting rules](https://www.comunidadfeliz.mx/modulos/votaciones).

**Neivor** is strongest where property operations meet financial technology. Its public materials emphasize payment automation, bank reconciliation, real-time reports, reservations, communications, packages/concierge, QR access, vehicle access, virtual intercom, security integrations, and PCI DSS Level 1 controls. It also markets Neivor Intelligence and support for Mexican financial/fiscal workflows. Sources: [Mexico platform](https://www.neivor.com/mx/), [condominium administration](https://www.neivor.com/administradores-web/), and [visitor/access control](https://landing.neivor.com/control-de-acceso-visitantes).

**Kolonus** is differentiated by purpose-built experiences for administrators, residents, and guards. Its public offering highlights real-time guard logs, QR visitor/provider access through a kiosk, integrated telephone/intercom, payment services, and access products intended to reduce delinquency. Source: [Kolonus residential platform](https://landingpage.kolonus.com/es/).

**Kommu** is worth watching as a lower-cost Mexican entrant. It publicly offers more than 25 modules, including QR access, amenity reservations, statements and payment reminders, packages with photographic evidence, tickets with attachments, surveys, assemblies, alarms, video surveillance, and guard rounds. Source: [Kommu product and pricing](https://kommu.mx/).

## United States benchmark

### Leading software platforms

| Company      | Market strength                                                   | Capabilities to learn from                                                                                                                                                                  |
| ------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vantaca      | Workflow-centric community association operating system           | One connected case history, accounting/AR/AP, integrated payments, resident/board portal, business intelligence, vendor workflows, action ownership, AI agents, and partner integrations.   |
| CINC Systems | Banking/accounting depth and scale                                | Bank network, automated receivables/payables, reconciliation, board tools, white-label homeowner app, e-voting, APIs, AI assistance, and security certifications.                           |
| AppFolio     | Modern end-to-end association and field workflows                 | Online payments, accounting, maintenance, vendor portal, architectural reviews, mobile/offline violations and inspections, board approvals, calendars, documents, messaging, and reporting. |
| Enumerate    | Connected accounting, payments, controls, and resident engagement | AR/AP, approval separation, audit trails, board-ready reporting, resident portal, documents, communication, operations, and embedded AI assistance.                                         |
| FRONTSTEPS   | Unified resident engagement and gated-community security          | Accounting, payments, resident/manager apps, visitor access, security, document organization, and AI-assisted reporting.                                                                    |
| BuildingLink | High-rise resident and front-desk operations                      | Service requests, amenities, front desk instructions, packages, building library, resident ID, vendors/offers, contacts, and community bulletin board.                                      |
| TownSq       | Community engagement and field compliance                         | Assignments, digital voting, documents, forums, announcements, events, packages, reservations, directories, and online/offline violation inspections.                                       |

Official sources: [Vantaca platform](https://www.vantaca.com/product), [CINC solutions](https://cincsystems.com/solutions/), [AppFolio community associations](https://www.appfolio.com/markets/hoa), [Enumerate payments](https://goenumerate.com/solutions/payments), [FRONTSTEPS ecosystem](https://frontsteps.com/), [BuildingLink resident app](https://help-resident.buildinglink.com/en/support/solutions/articles/42000106541), and [TownSq app](https://www.townsq.io/download-the-app).

### Service-plus-software competitors

Echo's business model is more directly comparable to management companies that combine technology with people:

- **FirstService Residential** combines local management teams and on-site services with a resident/board/manager portal. Its public platform includes balances, recurring payments, violations, maintenance, amenities, architectural requests, packages, documents, budgets, financial statements, visitors, concierge/security, vendor payments, emergency messages, and operational reporting. Source: [FirstService Residential Connect](https://www.fsresidential.com/connect/).
- **Associa** pairs managed community services with TownSq, manager dashboards, accounting/budgeting/reporting tools, accounts payable, vendor verification, and document storage. Source: [Associa technology solutions](https://www.associaonline.com/technology-solutions).

The lesson is important: service companies win when the resident-facing app is visibly connected to the people doing the work. Echo should make that connection more explicit and measurable than these incumbents.

## Echo V2 product thesis

**Echo V2 is the auditable operating system for Mexican residential communities, delivered with a local operating team.**

The product should have four coordinated experiences backed by one tenant-aware data model:

1. **Resident mobile and web:** payments, statements, requests, communications, documents, reservations, access, voting, profile, and emergency tools.
2. **Administrator and board web:** accounting, collections, approvals, vendors, budgets, documents, communications, governance, service performance, and portfolio reporting.
3. **Guard/front-desk mode:** visitors, QR validation, packages, incidents, emergency actions, access history, and shift handoff.
4. **Maintenance/field mode:** assigned work, checklists, inspections, time, materials, before/after evidence, escalation, and completion confirmation.

## Prioritized V2 roadmap

### Foundation — must exist before broad rollout

- One secure authentication and authorization model for mobile and web; eliminate password replay and legacy resident RPC patterns.
- True multi-tenant data isolation with explicit roles for resident, owner, tenant, board, administrator, accountant, guard, technician, and vendor.
- One shared content service for emergency contacts, rules, documents, notices, benefits, and community configuration.
- Audit log, structured operational events, health monitoring, backup/restore drills, and support tooling.
- Multiple communities, multiple units per person, delegated household access, and clean onboarding/offboarding.
- Data import/export so a community can leave without losing its records.

### Resident parity and trust

- Unified notifications with push, email, and optional WhatsApp; targeting, scheduling, delivery/read status, and preferences.
- Versioned document library with categories, search, permissions, acknowledgment, and expiration.
- Mobile/web parity for events, surveys, voting, warnings, and profile management.
- Payment receipts, ledger allocation detail, recurring payment options, and clear pending/rejected/refunded states.
- Ticket photos, comments, status timeline, ETA/SLA, satisfaction rating, and accessible support.

### Echo's differentiator: proof of work

- Convert approved tickets and preventive maintenance into assigned work orders.
- Technician/guard mobile mode with offline queueing.
- Before/after photos, checklists, timestamps, location when appropriate, labor time, materials, vendor invoices, and supervisor approval.
- Resident confirmation and reopen flow.
- Board dashboard for SLA attainment, repeat failures, cost by asset/category, preventive completion, and resident satisfaction.
- Asset registry and preventive schedules for pumps, gates, pools, lighting, fire equipment, landscaping, and other community infrastructure.

### Community operations

- Amenity availability, configurable rules, capacity, charges/deposits, approval, waitlist, cancellation, and check-in.
- Visitor/provider invitations, expiring or recurring QR codes, vehicle data, guard validation, entry/exit evidence, and audit history.
- Package custody chain with photos and pickup confirmation.
- Incident/violation workflows with evidence, policy references, notices, appeals, and resolution.
- Vendor onboarding, insurance/document expiration, bids, work orders, invoices, and performance history.

### Finance, governance, and growth

- Automatic payment reconciliation with an exception queue.
- Collections campaigns, reminders, promises to pay, payment plans, fees/waivers, and legally useful evidence.
- Mexican fiscal support, including community-configurable CFDI/SAT workflows where applicable.
- Budget-vs-actual, reserves, cash flow, expense evidence, month-end close, and board-ready packs.
- Board approvals, assembly agendas/minutes, quorum, weighted votes, committee roles, and decision history.
- Portfolio dashboards and reusable community templates.
- Approval-gated AI for resident Q&A, request routing, community briefs, anomaly detection, draft notices, and maintenance forecasting. AI must cite the underlying community record and never approve payments, access, penalties, or legal actions on its own.

## What not to build first

- A generic social feed without moderation, audience controls, or a clear operational purpose.
- Hardware-specific access integrations before the QR/guard workflow and audit model are reliable.
- Autonomous AI actions in financial, access, safety, disciplinary, or legal workflows.
- A marketplace of unverified local discounts. Benefits must have an owner, validity dates, terms, and a verification workflow.
- Feature parity that duplicates data separately in mobile and web.

## V2 success measures

- At least 80% of active households complete a useful self-service action monthly.
- At least 70% of maintenance requests receive an owner and ETA within the configured SLA.
- At least 90% of completed field work includes required evidence and resident or supervisor confirmation.
- At least 85% of digital payments reconcile automatically; remaining exceptions are visible and owned.
- At least 90% of urgent notices have delivery status, with read status where the channel supports it.
- Resident support contacts per occupied unit decrease while satisfaction and response-time metrics improve.
- Monthly board reporting can be generated from the system without reconstructing records in spreadsheets.
- No cross-community data exposure in automated authorization tests.

## Release boundary

This V2 roadmap must not delay V1 App Store submission. V1 should ship after its production payment configuration, signed iOS build, TestFlight acceptance test, review account, privacy/support metadata, and release checklist are complete. V2 work should begin behind feature flags and use the same shared backend contracts so mobile, web, Replit, and App Store builds remain testable throughout development.
