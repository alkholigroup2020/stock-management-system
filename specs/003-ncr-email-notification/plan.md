# Implementation Plan: NCR Email Notification System

**Branch**: `003-ncr-email-notification` | **Date**: 2026-01-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-ncr-email-notification/spec.md`

## Summary

Implement an email notification system that automatically sends notifications to three recipient groups (Finance Team, Procurement Team, Supplier) whenever an NCR is created, either manually or auto-generated via price variance detection. The system requires a new admin interface for configuring Finance and Procurement team email addresses, and integration with the existing email service for notification delivery.

## Technical Context

**Language/Version**: TypeScript 5.x (Nuxt 4)
**Primary Dependencies**: Nuxt 4, Nuxt UI, Prisma ORM, Nodemailer, Zod
**Storage**: PostgreSQL 15+ via Supabase (Prisma ORM)
**Testing**: Manual testing with Playwright MCP
**Target Platform**: Web application (SPA mode, Vercel deployment)
**Project Type**: Web (monolithic Nuxt 4 with integrated backend)
**Performance Goals**: NCR creation < 3 seconds, notifications sent within 30 seconds
**Constraints**: Async notification sending (non-blocking), graceful SMTP failure handling
**Scale/Scope**: Same scale as existing system, ~10 NCRs/day expected

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                          | Status  | Notes                                                          |
| ---------------------------------- | ------- | -------------------------------------------------------------- |
| I. Data Integrity First            | ✅ Pass | NCR creation unchanged; notification is additive               |
| II. Type Safety Non-Negotiable     | ✅ Pass | All new entities will have TypeScript interfaces               |
| III. Location-Centric Architecture | ✅ Pass | NCR already has location context; notifications respect this   |
| IV. Approval Workflow Compliance   | ✅ Pass | No approval required for notifications (per PRD)               |
| V. Accessible by Design            | ✅ Pass | Admin UI will follow design system accessibility standards     |
| VI. Offline-Aware UI               | ✅ Pass | Settings page will disable save when offline                   |
| VII. Server-Side Security          | ✅ Pass | Admin-only API enforced server-side; email addresses validated |
| VIII. Consistent Code Standards    | ✅ Pass | Will follow Prettier rules, component naming conventions       |

**Gate Result**: ✅ All principles satisfied - proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/003-ncr-email-notification/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── notification-settings-api.md
│   └── ncr-notification-api.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
# Nuxt 4 Monolithic Structure

app/
├── components/
│   └── settings/
│       └── NotificationEmailList.vue    # Reusable email list editor component
├── pages/
│   └── settings/
│       └── notifications.vue            # Admin notification settings page
├── composables/
│   └── useNotificationSettings.ts       # API composable for settings CRUD

server/
├── api/
│   └── settings/
│       └── notifications/
│           ├── index.get.ts             # Get notification settings
│           └── index.put.ts             # Update notification settings
├── utils/
│   └── email.ts                         # Extend with NCR notification functions

prisma/
└── schema.prisma                        # Add NotificationSetting, NCRNotificationLog models

shared/types/
└── database.ts                          # Add TypeScript interfaces
```

**Structure Decision**: Following existing Nuxt 4 monolithic architecture with frontend in `/app/` and backend in `/server/`. Settings page pattern mirrors PRF/PO workflow pages.

## Complexity Tracking

> No violations - feature follows existing patterns without adding complexity.

| Aspect        | Decision                  | Rationale                                                  |
| ------------- | ------------------------- | ---------------------------------------------------------- |
| Storage       | Database table            | Runtime configuration (per spec); follows existing pattern |
| Email sending | Async fire-and-forget     | Non-blocking per FR-012; mirrors PRF/PO email pattern      |
| UI location   | `/settings/notifications` | Logical grouping for admin system settings                 |

---

## Constitution Check (Post-Design Re-evaluation)

_Re-evaluated after Phase 1 design completion._

| Principle                          | Status  | Verification                                                             |
| ---------------------------------- | ------- | ------------------------------------------------------------------------ |
| I. Data Integrity First            | ✅ Pass | NCR creation logic unchanged; notification is fire-and-forget additive   |
| II. Type Safety Non-Negotiable     | ✅ Pass | TypeScript interfaces defined in data-model.md; Zod schemas in contracts |
| III. Location-Centric Architecture | ✅ Pass | NCR retains location_id; notification includes locationName              |
| IV. Approval Workflow Compliance   | ✅ Pass | No approval workflow for notifications (explicitly not required)         |
| V. Accessible by Design            | ✅ Pass | UI design uses Nuxt UI components with built-in accessibility            |
| VI. Offline-Aware UI               | ✅ Pass | Contract specifies `useOnlineStatus()` integration                       |
| VII. Server-Side Security          | ✅ Pass | API contracts specify ADMIN role check server-side                       |
| VIII. Consistent Code Standards    | ✅ Pass | Following existing email.ts patterns; Prettier compliance required       |

**Post-Design Gate Result**: ✅ All principles satisfied - ready for task generation

---

## Generated Artifacts

| Artifact         | Path                                     | Status      |
| ---------------- | ---------------------------------------- | ----------- |
| Research         | `research.md`                            | ✅ Complete |
| Data Model       | `data-model.md`                          | ✅ Complete |
| API Contracts    | `contracts/notification-settings-api.md` | ✅ Complete |
| Service Contract | `contracts/ncr-notification-api.md`      | ✅ Complete |
| Quickstart       | `quickstart.md`                          | ✅ Complete |

---

## Next Steps

Run `/speckit.tasks` to generate the implementation task list.
