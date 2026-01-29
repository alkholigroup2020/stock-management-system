# Tasks: NCR Email Notification System

**Input**: Design documents from `/specs/003-ncr-email-notification/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions (Nuxt 4 Monolithic)

- **Frontend**: `app/` (pages, components, composables)
- **Backend**: `server/` (api, utils, middleware)
- **Database**: `prisma/schema.prisma`
- **Shared**: `shared/types/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema and shared types setup

- [x] T001 Add NotificationSetting and NCRNotificationLog models to `prisma/schema.prisma`
- [x] T002 Add NotificationRecipientType and NotificationStatus enums to `prisma/schema.prisma`
- [x] T003 Add notification_settings relation to User model in `prisma/schema.prisma`
- [x] T004 Add notification_logs relation to NCR model in `prisma/schema.prisma`
- [x] T005 Run database migration: `pnpm db:migrate dev --name add-ncr-notifications`
- [x] T006 [P] Add NotificationSetting interface to `shared/types/database.ts`
- [x] T007 [P] Add NCRNotificationLog interface to `shared/types/database.ts`
- [x] T008 [P] Add NotificationRecipientType and NotificationStatus types to `shared/types/database.ts`
- [x] T009 [P] Add NotificationSettingsData interface to `shared/types/database.ts`

**Checkpoint**: Database schema and TypeScript types ready for implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core notification service infrastructure that all user stories depend on

**⚠️ CRITICAL**: User story work cannot begin until this phase is complete

- [x] T010 Create NCRNotificationParams interface in `server/utils/email.ts`
- [x] T011 Create NCRNotificationResult interface in `server/utils/email.ts`
- [x] T012 Implement `buildNCRInternalEmailHtml()` function for Finance/Procurement emails in `server/utils/email.ts`
- [x] T013 Implement `buildNCRSupplierEmailHtml()` function for Supplier emails in `server/utils/email.ts`
- [x] T014 Implement `sendNCRCreatedNotification()` main function in `server/utils/email.ts`
- [x] T015 Implement `resolveNCRNotificationRecipients()` helper to fetch recipients from DB in `server/utils/email.ts`
- [x] T016 Implement notification logging (create NCRNotificationLog entries) in `server/utils/email.ts`
- [x] T017 Add `triggerNCRNotification()` wrapper function for async fire-and-forget pattern in `server/utils/email.ts`

**Checkpoint**: Core notification service ready - user story implementation can begin

---

## Phase 3: User Story 1 - Configure Notification Recipients (Priority: P1) 🎯 MVP

**Goal**: Administrators can configure Finance Team and Procurement Team email addresses that receive NCR notifications

**Independent Test**: Navigate to Settings → Notifications as Admin, add/remove emails, verify they persist on reload

### Implementation for User Story 1

- [x] T018 [P] [US1] Create GET endpoint in `server/api/settings/notifications/index.get.ts`
- [x] T019 [P] [US1] Create PUT endpoint in `server/api/settings/notifications/index.put.ts`
- [x] T020 [US1] Create `useNotificationSettings` composable in `app/composables/useNotificationSettings.ts`
- [x] T021 [US1] Create email list editor component in `app/components/settings/NotificationEmailList.vue` (auto-imports as `<SettingsNotificationEmailList />`)
- [x] T022 [US1] Create notifications settings page in `app/pages/settings/notifications.vue`
- [x] T023 [US1] Add "Notifications" link to admin settings navigation (sidebar/menu)
- [x] T024 [US1] Add permission check in `app/composables/usePermissions.ts` for notification settings access

**Checkpoint**: Admin can configure notification recipients - User Story 1 complete and independently testable

---

## Phase 4: User Story 2 - Automatic NCR Creation Notification (Priority: P1)

**Goal**: When a PRICE_VARIANCE NCR is auto-generated during delivery posting, email notifications are sent to Finance, Procurement, and Supplier

**Independent Test**: Post a delivery with a price different from period price, verify emails are sent to all configured recipients

### Implementation for User Story 2

- [x] T025 [US2] Add notification trigger to `server/utils/priceVariance.ts` after NCR creation in `detectAndCreateNCR()` or equivalent function
- [x] T026 [US2] Ensure price variance data (item, expected price, actual price, variance) is passed to notification function
- [x] T027 [US2] Handle supplier email resolution from delivery→supplier relationship in notification trigger

**Checkpoint**: Price variance NCRs trigger notifications - User Story 2 complete and independently testable

---

## Phase 5: User Story 3 - Manual NCR Creation Notification (Priority: P2)

**Goal**: When a user manually creates an NCR, email notifications are sent to Finance, Procurement, and Supplier (if linked)

**Independent Test**: Create a manual NCR via the UI, verify emails are sent to configured recipients

### Implementation for User Story 3

- [x] T028 [US3] Add notification trigger to `server/api/ncrs/index.post.ts` after NCR creation
- [x] T029 [US3] Handle optional delivery/supplier linking in notification data collection
- [x] T030 [US3] Ensure manual NCR type displays correctly in email templates

**Checkpoint**: Manual NCRs trigger notifications - User Story 3 complete and independently testable

---

## Phase 6: User Story 4 - NCR Email Content (Priority: P2)

**Goal**: NCR notification emails contain comprehensive details (NCR number, type, location, item, prices, variance, delivery, supplier, link)

**Independent Test**: Trigger an NCR notification, review email content for completeness and formatting

### Implementation for User Story 4

- [x] T031 [US4] Enhance internal email template with delivery reference section in `server/utils/email.ts`
- [x] T032 [US4] Enhance internal email template with price variance details table in `server/utils/email.ts`
- [x] T033 [US4] Add "View NCR" button with correct URL in internal email template in `server/utils/email.ts`
- [x] T034 [US4] Enhance supplier email with next steps section in `server/utils/email.ts`
- [x] T035 [US4] Add company branding configuration support to email templates in `server/utils/email.ts`

**Checkpoint**: Email content is comprehensive and actionable - User Story 4 complete

---

## Phase 7: User Story 5 - View and Manage Notification History (Priority: P3)

**Goal**: Administrators can view notification history for each NCR to verify delivery and troubleshoot issues

**Independent Test**: View an NCR detail page as Admin, verify notification history section shows sent/failed statuses

### Implementation for User Story 5

- [x] T036 [US5] Add `notification_logs` include to NCR detail API in `server/api/ncrs/[id].get.ts`
- [x] T037 [US5] Create notification history component in `app/components/ncr/NotificationHistory.vue` (auto-imports as `<NcrNotificationHistory />`)
- [x] T038 [US5] Add notification history section to NCR detail page in `app/pages/ncrs/[id].vue`
- [x] T039 [US5] Implement manual resend functionality in `server/api/ncrs/[id]/resend-notification.post.ts` (per-recipient-group, 5-minute rate limit, creates new log entry)
- [x] T040 [US5] Add resend button to notification history UI for failed notifications (disabled during rate-limit period, shows countdown)

**Checkpoint**: Notification history visible and resend available - User Story 5 complete

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation

- [x] T041 Run `pnpm typecheck` to verify zero TypeScript errors
- [x] T042 Run `pnpm format` to ensure Prettier compliance
- [x] T043 Test notifications with SMTP not configured (verify graceful degradation)
- [x] T044 Test with empty recipient lists (verify logging and skip behavior)
- [x] T045 Verify dark mode styling on notification settings page
- [x] T046 Verify offline-aware behavior (disable save button when offline)
- [x] T046b Verify keyboard navigation works on notification settings page (tab order, enter to add, escape to cancel)
- [x] T046c Verify WCAG AA contrast ratios on notification history badges (SENT/FAILED status indicators)
- [x] T047 Manual end-to-end test: Configure recipients → Create manual NCR → Verify emails sent
- [x] T048 Manual end-to-end test: Configure recipients → Post delivery with price variance → Verify emails sent

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational (Phase 2) completion
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - No dependencies on other stories (parallel with US1)
- **User Story 3 (P2)**: Can start after Foundational - No dependencies on other stories (parallel with US1/US2)
- **User Story 4 (P2)**: Can start after Foundational - Enhances templates from Phase 2
- **User Story 5 (P3)**: Can start after Foundational - Depends on notification logs being created (US2/US3)

### Within Each User Story

- API endpoints before composables
- Composables before components
- Components before pages
- Core implementation before UI integration

### Parallel Opportunities

**Phase 1 (Setup)**:

- T006, T007, T008, T009 can run in parallel (different type definitions)

**Phase 3 (User Story 1)**:

- T018, T019 can run in parallel (GET and PUT endpoints)

**Across User Stories**:

- US1 and US2 can run in parallel after Foundational phase
- US3 and US4 can run in parallel after US1/US2

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all type definition tasks together:
Task: "Add NotificationSetting interface to shared/types/database.ts"
Task: "Add NCRNotificationLog interface to shared/types/database.ts"
Task: "Add NotificationRecipientType and NotificationStatus types to shared/types/database.ts"
Task: "Add NotificationSettingsData interface to shared/types/database.ts"
```

## Parallel Example: User Story 1 API Endpoints

```bash
# Launch both API endpoints together:
Task: "Create GET endpoint in server/api/settings/notifications/index.get.ts"
Task: "Create PUT endpoint in server/api/settings/notifications/index.put.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Complete Phase 1: Setup (schema and types)
2. Complete Phase 2: Foundational (core notification service)
3. Complete Phase 3: User Story 1 (admin can configure recipients)
4. Complete Phase 4: User Story 2 (price variance NCRs send notifications)
5. **STOP and VALIDATE**: Test full flow - configure recipients, create delivery with price variance, verify emails
6. Deploy MVP

### Incremental Delivery

1. Setup + Foundational → Core infrastructure ready
2. Add User Story 1 → Admin can configure recipients → Demo
3. Add User Story 2 → Price variance NCRs notify → Deploy MVP!
4. Add User Story 3 → Manual NCRs notify → Deploy
5. Add User Story 4 → Enhanced email content → Deploy
6. Add User Story 5 → Notification history visible → Deploy
7. Polish → Final validation and cleanup

### Task Priority Order (Single Developer)

Execute in this order for optimal value delivery:

1. T001-T009 (Setup)
2. T010-T017 (Foundational)
3. T018-T024 (User Story 1 - Configure Recipients)
4. T025-T027 (User Story 2 - Auto NCR Notifications)
5. T028-T030 (User Story 3 - Manual NCR Notifications)
6. T031-T035 (User Story 4 - Email Content)
7. T036-T040 (User Story 5 - Notification History)
8. T041-T048 (Polish)

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label maps task to specific user story for traceability
- User Stories 1 and 2 are both P1 priority - complete both for meaningful MVP
- All notification sending is async (non-blocking)
- Verify `pnpm typecheck` passes after each phase
- Test in both light and dark mode
- Verify offline-aware behavior on settings page
