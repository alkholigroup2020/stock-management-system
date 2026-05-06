# Manual vs. Implementation — Pre-Launch Fix Prompts

This document collects ready-to-use AI prompts for closing the gaps identified in the
Help Center vs. implementation audit. Each prompt is **self-contained**: paste it into
a fresh Claude Code session and it will have everything it needs to make the fix.

> **Source-of-truth rule (applies to every prompt below):**
> When the in-app manual disagrees with the actual code, **the implementation wins**.
> Update the manual to reflect what the code does — never change the code to match the
> manual unless the prompt explicitly says so.

> **Project conventions every fix must follow:**
> - Prettier: double quotes, semicolons, 2-space indent, 100-char lines, ES5 trailing commas
> - No `any` types, no introducing dead code, no unrequested refactors
> - After edits, run `pnpm typecheck` and `pnpm format` — both must pass
> - Help Center components live in `app/components/help/` and are auto-loaded by
>   `app/components/layout/HelpDrawer.vue`. If you add or rename a section, also update
>   the search index inside `HelpDrawer.vue` (the `searchableContent` computed).

---

## Action 1 — Fix high-severity factual errors

These four bugs will cause real user errors on day one. Fix them in a single pass.

### Prompt

```
You are fixing four factual errors in the in-app Help Center. The code is the source
of truth — update the manual to match the implementation, not the other way around.

Project conventions:
- Prettier: double quotes, semicolons, 2-space indent, 100-char lines, ES5 trailing commas
- Vue components: do not indent <script> or <style> blocks
- After all edits, run `pnpm typecheck` and `pnpm format` and report the output

==================================================================
FIX 1 — Cost Centres (OperatorGuide → "Issues" → "Cost Centres")
==================================================================
File: app/components/help/OperatorGuide.vue
Current text (around the "Cost Centres" subsection inside the Issues accordion):
  "Cost Centres represent departments or purposes that consume stock. Common examples
   include Kitchen, Restaurant, Staff Meals, Functions, or Maintenance. Selecting the
   correct Cost Centre ensures accurate expense tracking and reporting."

Reality (authoritative): the CostCentre enum has exactly three values.
  - prisma/schema.prisma:665   →  enum CostCentre { FOOD CLEAN OTHER }
  - app/pages/issues/create.vue:598-602 → labels are "Food", "Cleaning", "Other"
  - app/pages/reports/issues.vue uses the same three.

Replace the paragraph so it lists the three real cost centres and their labels. Do
NOT invent additional examples. Suggested wording (you may polish, but keep the facts):
  "Cost Centres classify what the issued stock is used for. The system supports
   three cost centres:
     • FOOD — items consumed for food preparation and service
     • CLEAN — cleaning supplies and chemicals
     • OTHER — anything that does not fit the above
   Selecting the correct Cost Centre ensures accurate expense tracking and reporting."

Then update the search index in app/components/layout/HelpDrawer.vue:
search the `op-issues` entry's `content` string and replace the cost-centre examples
with FOOD/CLEAN/OTHER so search results stay accurate.

==================================================================
FIX 2 — Operator NCR permission contradiction
==================================================================
The manual contradicts itself: OperatorPermissions.vue says NCR create/update is
ALLOWED for Operators, but OperatorGuide.vue says Operators CANNOT create NCRs.

Reality (authoritative):
  - server/api/ncrs/index.post.ts (lines ~16, 81-102) — explicitly comments
    "All users can create NCRs for their locations" and only blocks Operators if
    they lack location access.
  - app/pages/ncrs/create.vue exists and is reachable by Operators with location
    access.

Therefore the OperatorPermissions matrix is correct and the OperatorGuide prose is
wrong. Update OperatorGuide.vue:

File: app/components/help/OperatorGuide.vue
- Change the section introduction paragraph for the "NCR (Non-Conformance Reports)"
  accordion. Currently it says: "As an Operator, you can view NCRs but cannot create
  them - report quality issues to your Supervisor who can create manual NCRs."
  Replace with: "As an Operator, you can view NCRs for your assigned locations and
  create manual NCRs when you discover quality issues, damages, short shipments, or
  other supplier-related problems. Most NCRs you'll see are auto-generated from
  delivery price variances; you can also raise one yourself when needed."

- Remove the "Types of NCRs → Manual" line that says "Created by Supervisors" —
  reword it to "Created manually by an Operator, Supervisor, or Admin for quality
  issues, damaged goods, short shipments, or expired products."

- Replace the bottom info callout that says: "As an Operator, you can view NCRs but
  cannot create manual NCRs. Contact your Supervisor to report quality issues - they
  will create the NCR." with a callout describing how to create a manual NCR:
  "To create a manual NCR, click NCR in the left menu, then New NCR. Pick the
  affected location, optionally link a delivery, describe the issue in the Reason
  field, and enter the value impact. The NCR is logged immediately and notifications
  are sent automatically."

Also update the matching `op-ncr` entry in app/components/layout/HelpDrawer.vue
search index: drop the "manual NCRs created by supervisors" wording and reflect that
operators can create them too.

==================================================================
FIX 3 — Items Import column list (Min Stock / Active do not exist)
==================================================================
Both OperatorGuide.vue ("Items Import" accordion) and AdminGuide.vue ("Item
Management" accordion) tell users to include Min Stock and Active columns. The
import API and template do NOT support these fields.

Reality (authoritative):
  - server/api/items/index.post.ts:21-31 — accepts only code, name, unit, category,
    sub_category. is_active is hard-coded to true.
  - server/api/items/import.post.ts:166-178 — bulk insert writes only those fields.
  - server/api/items/import-template.get.ts:42-47 — template columns are exactly
    ["Code", "Name", "Unit", "Category", "Subcategory"].
  - app/pages/items/create.vue has no Min Stock or Active inputs.
  - The Item Prisma model has no `min_stock` field at all (min_stock lives on
    LocationStock and is not exposed in any UI).

Updates to make:

a) app/components/help/OperatorGuide.vue, "Preparing Your Import File" list:
   - Replace the six bullets with exactly five, matching the template:
       Code, Name, Unit, Category, Subcategory
     Use the same descriptions but rename "Item Code" → "Code" and "Sub-Category" →
     "Subcategory" so they match the template header text exactly.
   - Remove the "Min Stock" bullet entirely.
   - Remove the "Active" bullet entirely.

b) Same file, "Common Issues & Tips":
   - Delete the "Numbers: Min Stock must be a positive number…" tip.
   - Delete the "Active Status: Must be exactly Yes or No…" tip.

c) app/components/help/AdminGuide.vue, "Item Properties" list:
   - Remove the "Minimum Stock: Threshold for low stock alerts (optional)" bullet.

d) Same file, "Creating a New Item" steps:
   - Remove step "Optionally set Minimum Stock Level for alerts".
   - Add a step between Category and Create: "Optionally enter a Sub-Category."

e) Update the search index in app/components/layout/HelpDrawer.vue:
   - In the `op-items-import` entry, change the column list in `content` to
     "Code, Name, Unit, Category, Subcategory" and remove mentions of Min Stock and
     Active.
   - In the `adm-items` entry, drop the "Set minimum stock level" sentence.

Do NOT add a min_stock field to the API or schema — keep the implementation
unchanged. The fix is documentation-only.

==================================================================
FIX 4 — Supplier "Payment Terms" does not exist on suppliers
==================================================================
File: app/components/help/AdminGuide.vue, "Supplier Management" accordion.

Reality (authoritative):
  - prisma/schema.prisma:112-129 (Supplier model) — fields are:
      code, name, contact, emails (String[]), phone, mobile, vat_reg_no, address,
      is_active. There is NO payment_terms field.
  - app/pages/suppliers/create.vue has fields: Code, Name, Contact Person, Emails
    (multi-value), Phone, Mobile, VAT Registration No., Address.
  - payment_terms only exists on the PO model (entered per-PO, not per-supplier).

Updates to make:

a) "Supplier Properties" list — replace it with the actual fields:
     • Code — short unique identifier (e.g., "SUP-001")
     • Name — full supplier/company name
     • Contact Person — primary contact for orders and issues
     • Emails — one or more addresses; receive PO and NCR notifications
     • Phone / Mobile — contact numbers
     • VAT Registration No. — supplier's VAT registration (used on POs)
     • Address — full mailing address

b) "Creating a New Supplier" steps — replace the Payment Terms step with the actual
   form flow: enter Code, Name, Contact Person, add one or more Emails, Phone,
   Mobile, VAT Registration No., Address. Note that Payment Terms are entered on
   each Purchase Order, not on the supplier record.

c) Search index in app/components/layout/HelpDrawer.vue, `adm-suppliers` entry:
   replace the content string so it lists the actual fields and drops "payment
   terms".

==================================================================
After all four fixes
==================================================================
Run, in order:
  pnpm format
  pnpm typecheck

Report any errors. Do not commit anything — leave the changes staged for review.
```

---

## Action 2 — Align workflow diagrams with the real enums

The manual's status diagrams omit states that the code actually uses, so users see
badges that are not explained anywhere.

### Prompt

```
You are updating three workflow descriptions in the Help Center so they match the
Prisma enums users actually see in the UI. The code is the source of truth.

Project conventions:
- Prettier: double quotes, semicolons, 2-space indent, 100-char lines
- Do not indent <script> / <style> blocks in Vue files
- After edits, run `pnpm typecheck` and `pnpm format`

==================================================================
FIX A — Transfer workflow ends at COMPLETED, not APPROVED
==================================================================
Reality:
  - prisma/schema.prisma:671-677 → enum TransferStatus has DRAFT,
    PENDING_APPROVAL, APPROVED, REJECTED, COMPLETED
  - server/api/transfers/[id]/approve.patch.ts header (lines 1-23) and
    implementation set status directly to COMPLETED on approval. APPROVED is
    defined but the approval flow skips it.
  - The UI lists/badges show "Completed" for approved transfers.

Update the workflow diagrams in:

1) app/components/help/OperatorGuide.vue → "Transfer Requests" accordion →
   "Transfer Workflow" section. Replace the badge sequence:
     [You Create] → [Pending Approval] → [Approved] or [Rejected]
   with:
     [DRAFT] → [PENDING_APPROVAL] → [COMPLETED] or [REJECTED]
   Update the explanatory paragraph to: "Stock only moves when a Supervisor
   approves the transfer. Approval immediately moves stock and marks the transfer
   COMPLETED. Rejection prevents any stock movement and records the reason."

2) app/components/help/SupervisorGuide.vue → "Transfer Management" accordion →
   "Transfer Lifecycle" section. Replace the badges:
     [DRAFT] → [PENDING_APPROVAL] → [APPROVED] or [REJECTED]
   with:
     [DRAFT] → [PENDING_APPROVAL] → [COMPLETED] or [REJECTED]
   In the bullet list below the diagram, replace the APPROVED bullet with:
     "COMPLETED: Approval succeeded — stock has moved between locations atomically."
   Keep the DRAFT, PENDING_APPROVAL, and REJECTED bullets, but drop the standalone
   APPROVED entry.

3) Search index app/components/layout/HelpDrawer.vue:
   - `op-transfers` content string: end with "approved or rejected — approved
     transfers complete immediately and stock moves atomically".
   - `sup-transfers` content string: replace "Draft, Pending Approval, Approved or
     Rejected, Completed" with "DRAFT, PENDING_APPROVAL, COMPLETED, REJECTED".

==================================================================
FIX B — Period lifecycle includes APPROVED
==================================================================
Reality:
  - prisma/schema.prisma:621-627 → enum PeriodStatus { DRAFT OPEN PENDING_CLOSE
    APPROVED CLOSED }
  - server/api/periods/[periodId]/close.post.ts moves a period from OPEN to
    PENDING_CLOSE while waiting on Admin approval; APPROVED is the state between
    that approval and the final close.

Update the AdminGuide → "Period Management" accordion → "Period Lifecycle" list.
The current four-status list is missing APPROVED. Insert a new bullet between
PENDING_CLOSE and CLOSED:
  [APPROVED] — Close request approved by Admin; final close is being executed.
              No new transactions can be posted.

Also update the GettingStarted "Understanding Periods" list. Today it shows OPEN /
PENDING_CLOSE / CLOSED only. Add a note under PENDING_CLOSE: "After approval, the
period briefly enters APPROVED state while the close is finalised."

Update the search index entry `gs-periods` in HelpDrawer.vue to mention all five
statuses.

==================================================================
FIX C — PRF status includes CLOSED
==================================================================
Reality:
  - prisma/schema.prisma:647-653 → enum PRFStatus { DRAFT PENDING APPROVED REJECTED
    CLOSED }
  - server/api/locations/[id]/deliveries/index.post.ts:786-792 and
    server/api/pos/[id]/close.patch.ts:266-273 — when the linked PO closes (manual
    or auto-close), the PRF is set to CLOSED.

Update the following:

1) app/components/help/OperatorGuide.vue → "PRF (Purchase Requisitions)" accordion
   → "PRF Status Flow". Add a fifth badge after APPROVED/REJECTED:
     [CLOSED]
   Add a bullet to the status list: "CLOSED: The Purchase Order created from this
   PRF was closed (fully delivered, auto-closed, or closed early by a Supervisor).
   No further action is required on the PRF."

2) app/components/help/SupervisorGuide.vue → "PRF Approval" accordion → "PRF Status
   Workflow". Same change: add CLOSED badge and a matching bullet.

3) app/components/help/ProcurementSpecialistGuide.vue → "Orders Overview" → "PRF
   Statuses" list. Add: "CLOSED: PO derived from this PRF has been closed. The PRF
   is finalised and visible for reference but no new POs can be created from it."

4) Search index in HelpDrawer.vue: update `op-prf` and `sup-prf-approval` content
   to mention CLOSED as a possible PRF status.

==================================================================
After all three fixes
==================================================================
Run:
  pnpm format
  pnpm typecheck

Report any failures. Do not stage or commit.
```

---

## Action 3 — Document that NCR resend is Admin-only

> **Decision:** Keep the implementation as is (Admin-only). The manual must be
> corrected. No code changes.

### Prompt

```
You are correcting two pages of the Help Center to make clear that resending a failed
NCR notification is an Admin-only operation. Do NOT change any server code or
permissions — the implementation in
server/api/ncrs/[id]/resend-notification.post.ts:57-65 (which restricts the endpoint
to ADMIN) is the source of truth.

Project conventions:
- Prettier: double quotes, semicolons, 2-space indent, 100-char lines
- Do not indent <script> / <style> blocks
- After edits, run `pnpm typecheck` and `pnpm format`

Updates:

1) app/components/help/SupervisorGuide.vue, NCR Management accordion, "Viewing
   Notification History" subsection.
   Current sentence: "If a notification fails, you can click the resend button to
   retry (5-minute cooldown between attempts)."
   Replace with: "If a notification fails, an Admin can resend it from the NCR
   detail page (5-minute cooldown per recipient group between attempts).
   Supervisors do not have permission to resend — escalate failed notifications to
   an Admin."

2) app/components/help/AdminGuide.vue, "Notification Settings" accordion, "Resending
   Notifications" subsection. Add a sentence at the start clarifying scope:
   "Resending a failed notification is an Admin-only action."
   Keep the rest of the paragraph (5-minute cooldown wording) intact.

3) app/components/help/OperatorGuide.vue, NCR accordion, "Notification History"
   subsection.
   Current sentence: "If a notification fails, you can click the resend button to
   retry (5-minute cooldown between attempts)." (or similar wording)
   Replace with a sentence saying Operators cannot resend; if a notification needs
   to be resent, ask an Admin.

4) Search index app/components/layout/HelpDrawer.vue:
   - `adm-notifications` content: ensure the sentence about resend says "Admins can
     resend failed notifications".
   - Remove any wording in `sup-manual-ncr` that implies Supervisors can resend.

After edits run:
  pnpm format
  pnpm typecheck

Report results. Do not commit.
```

---

## Action 4 — Cosmetic corrections

These are small but visible. One prompt covers them all.

### Prompt

```
You are making three small wording corrections in the Help Center so it matches
exactly what users see in the UI.

Project conventions:
- Prettier: double quotes, semicolons, 2-space indent, 100-char lines
- Do not indent <script> / <style> blocks
- After edits, run `pnpm typecheck` and `pnpm format`

==================================================================
FIX 4.1 — PRF numbering example uses uppercase location
==================================================================
Reality: server/utils/documentNumbering.ts:16-22 uppercases the location name for
all document numbers. Real PRFs look like: PRF-KITCHEN-27-Jan-2026-01.

Files to update:
  - app/components/help/OperatorGuide.vue → "PRF Numbering" subsection.
    Change the example "PRF-Kitchen-15-Jan-2026-01" to "PRF-KITCHEN-15-Jan-2026-01".
  - app/components/help/ProcurementSpecialistGuide.vue → "PRF Information" list.
    The format string "PRF-{Location}-{DD}-{Mon}-{YYYY}-{NN}" is fine, but if any
    inline example uses mixed case, change it to all caps.
  - Same change anywhere else the manual shows a PRF or PO number example
    (search for "PRF-Kitchen", "PRF-Central", etc., across app/components/help/).

==================================================================
FIX 4.2 — Delivery "PENDING_APPROVAL" wording
==================================================================
Reality: prisma/schema.prisma DeliveryStatus enum is only DRAFT and POSTED. Over-
delivery hold is implemented as a separate boolean `pending_approval` on the
Delivery row. The UI shows a "Pending Approval" badge but it is not a status enum
value.

Update the following passages so users (and devs reading the docs) are not led to
believe PENDING_APPROVAL is a status:

  - app/components/help/OperatorGuide.vue → "Over-Delivery Detection" list.
    Change "Delivery status changes to PENDING_APPROVAL" to
    "The delivery is held with a Pending Approval flag and cannot be posted until a
    Supervisor approves it."

  - app/components/help/SupervisorGuide.vue → "Over-Delivery Approval" → "What
    Triggers Over-Delivery Approval" list. Change the second bullet to
    "The delivery is flagged Pending Approval (it stays in DRAFT status under the
    hood) and cannot be posted."

  - Search index app/components/layout/HelpDrawer.vue: any `content` string that
    uses the phrase "PENDING_APPROVAL status" in the deliveries context — soften
    to "pending approval" (lowercase, no enum styling).

==================================================================
FIX 4.3 — POB: "Personnel On Board", not "Persons On Board"
==================================================================
Reality: app/pages/pob.vue:266 and app/components/pob/POBPrintReport.vue:38 both
use the expansion "Personnel On Board". Use that everywhere.

Files to update:
  - app/components/help/GettingStarted.vue → "POB & Mandays Calculation" list item
    description (and anywhere else the abbreviation is expanded).
  - app/components/help/OperatorGuide.vue → "POB Entry" accordion intro paragraph.
  - app/components/help/OperatorPermissions.vue → "Enter daily POB (Persons on
    Board) counts" line.
  - Search index in app/components/layout/HelpDrawer.vue if any `content` string
    uses "Persons on Board".

In every case replace "Persons on Board" / "Persons On Board" with
"Personnel On Board".

==================================================================
After all three fixes
==================================================================
Run:
  pnpm format
  pnpm typecheck

Report any failures. Do not commit.
```

---

## Action 5 — Document undocumented features

One prompt per feature. Each prompt is independent — pick the ones that matter for
launch first (PRF Submit, PRF Clone, Period prices copy / roll-forward, PO email
resend) and leave the rest for follow-up if you are short on time.

> **Common header for every Action 5 prompt** (already embedded in each one):
> Source-of-truth = the implementation. Use the current Help Center sectioning
> conventions — `<section id="...-section-{slug}">` accordion blocks. Update the
> matching `searchableContent` entry (or add a new one) in
> `app/components/layout/HelpDrawer.vue` so the new content is searchable. Run
> `pnpm format` and `pnpm typecheck` after editing.

---

### 5.1 — PRF "Submit" is a separate explicit step

```
Add documentation to the OperatorGuide explaining that creating a PRF leaves it in
DRAFT status and that submission for approval is a separate explicit action.

Source-of-truth files:
  - server/api/prfs/[id]/submit.patch.ts (the explicit submit endpoint)
  - app/pages/orders/prfs/[id].vue (UI: "Submit for Approval" button)
  - prisma/schema.prisma:647-653 (PRFStatus enum)

Edit app/components/help/OperatorGuide.vue, the "PRF (Purchase Requisitions)"
accordion. Insert a new subsection between "Creating a New PRF" and "Line Item
Types" titled "Submitting a PRF for Approval". Cover:
  • A newly created PRF stays in DRAFT — Supervisors do not see it yet.
  • From the PRF detail page (or list actions), click "Submit for Approval" to move
    the PRF to PENDING. This is the only way to send it for review.
  • Once submitted, you can no longer edit the PRF unless it is rejected and you
    clone it.
  • DRAFT PRFs can still be edited or deleted until you submit them.

Update HelpDrawer.vue search index `op-prf` content to mention that Submit is a
separate action.

Run pnpm format and pnpm typecheck. Do not commit.
```

---

### 5.2 — PRF Clone is available for any PRF the user can see

```
Update the OperatorGuide PRF section to clarify that Clone is not limited to
rejected PRFs.

Source-of-truth: server/api/prfs/[id]/clone.post.ts allows cloning any PRF the user
has access to (no status restriction). The current manual implies only rejected
PRFs can be cloned.

Edit app/components/help/OperatorGuide.vue → "PRF (Purchase Requisitions)" →
"Cloning Rejected PRFs" subsection:
  • Rename the subsection heading to "Cloning a PRF".
  • Replace the body with: "You can clone any PRF you can view to create a new
    DRAFT with the same line items. This is most useful when (a) a PRF was rejected
    and you need to resubmit it after addressing the rejection reason, or (b) you
    regularly raise the same standing order. The cloned PRF starts in DRAFT and
    must be submitted for approval like any new PRF."

Update HelpDrawer.vue search index `op-prf` content: change "Clone rejected PRFs"
to "Clone any PRF (commonly used after rejection or for repeat orders)".

Run pnpm format and pnpm typecheck. Do not commit.
```

---

### 5.3 — Copy Period Prices from a previous period

```
Document the "Copy prices from previous period" feature in the Admin Period
Management section.

Source-of-truth:
  - server/api/periods/[periodId]/prices-copy.post.ts (copies item prices from
    another period into a DRAFT period)
  - app/pages/periods/* (UI exposes a "Copy from previous period" button on the
    Manage Prices screen — confirm the exact button label by reading the page
    before writing)

Edit app/components/help/AdminGuide.vue → "Period Management" accordion. Inside
"Setting Period Prices", replace the parenthetical "(or import from previous
period)" with a clearly documented step. Add a new subsection right after "Setting
Period Prices" titled "Copying Prices from a Previous Period":
  • When to use: starting a new period where most prices haven't changed.
  • Where: on the Manage Prices screen of a DRAFT period, click the "Copy from
    previous period" button (use the exact label from the page) and pick the
    source period.
  • Behaviour: every item that had a price in the source period gets the same price
    in the new period. Existing prices in the target period are overwritten — there
    is no merge.
  • Restriction: only works while the target period is in DRAFT status. Once the
    period is OPEN, prices are locked.

Add a new search index entry `adm-period-prices-copy` in HelpDrawer.vue (under the
Admin role gate) so this is discoverable.

Run pnpm format and pnpm typecheck. Do not commit.
```

---

### 5.4 — Period Roll-Forward

```
Document the period roll-forward operation.

Source-of-truth: server/api/periods/[periodId]/roll-forward.post.ts. Read the file
before writing — confirm exactly what it does (e.g., creates the next period,
copies prices, sets opening balances) and which user roles can call it.

Edit app/components/help/AdminGuide.vue → "Period Close" accordion. Add a new
subsection at the end titled "Rolling Forward to the Next Period". Cover:
  • Prerequisites (current period must be CLOSED, etc. — verify in the code).
  • What roll-forward does at the data level (next period creation, opening
    balances from closing snapshots, prices copied if applicable).
  • How to trigger it from the UI (find the button on the relevant page; if no UI
    surface exists yet, say so explicitly and explain that it currently runs via
    API — do not invent a button that does not exist).
  • Caveats and idempotency.

Add a search index entry `adm-period-roll-forward` in HelpDrawer.vue.

Run pnpm format and pnpm typecheck. Do not commit.
```

---

### 5.5 — Resend PO email to supplier

```
Document the "Resend PO email" feature.

Source-of-truth:
  - server/api/pos/[id]/resend-email.post.ts (resends the PO PDF/notification to
    the supplier — read the file to confirm permissions and any cooldown)
  - app/pages/orders/pos/[id].vue (UI: "Resend Email" button — read the page to
    get the exact button label and where it appears)

Edit app/components/help/ProcurementSpecialistGuide.vue → add a new accordion
section after "Editing Purchase Orders" titled "Resending PO Email to Supplier".
Cover:
  • When to use: supplier didn't receive the original email, or contact details
    were updated and they need a fresh copy.
  • Where: PO detail page → "Resend Email" button (use the exact label from the
    UI).
  • What gets sent: the same PO email that goes out at creation, to the supplier's
    `emails` list.
  • Permissions: confirm by reading resend-email.post.ts and document accurately
    (Procurement Specialist? Supervisor? Admin?). Do not guess.

If the same feature is also accessible from the Supervisor view, add a parallel
subsection in app/components/help/SupervisorGuide.vue → "PO Management".

Add a `proc-po-resend` (and `sup-po-resend` if applicable) entry to the search
index in HelpDrawer.vue.

Run pnpm format and pnpm typecheck. Do not commit.
```

---

### 5.6 — Reports filters and CSV export

```
Expand the Supervisor "Reports & Analysis" section to cover the actual filters and
export options each report supports.

Source-of-truth: read each of the following pages and list the filters and export
buttons they actually expose. Do NOT describe filters that are not in the UI.
  - app/pages/reports/stock-now.vue
  - app/pages/reports/deliveries.vue
  - app/pages/reports/issues.vue
  - app/pages/reports/reconciliation.vue
  - app/pages/reports/index.vue (the landing/index)

Edit app/components/help/SupervisorGuide.vue → "Reports & Analysis" accordion.
Replace the "Available Reports" list with a per-report breakdown that documents,
for each report:
  • Purpose
  • Available filters (date range, location, item, category, cost centre, status,
    etc. — only what actually exists in the page)
  • Export options (CSV/Excel) and how to trigger them
  • Any role-based limitation observed in the page guard

Update the search index `sup-reports` content in HelpDrawer.vue to summarise the
new breakdown.

Run pnpm format and pnpm typecheck. Do not commit.
```

---

### 5.7 — Dashboard widgets and consolidated dashboard

```
Document what the Dashboard actually shows and the role-based variant.

Source-of-truth:
  - app/pages/index.vue (per-location dashboard)
  - server/api/dashboard/consolidated.get.ts and the page that consumes it
    (search app/pages for "consolidated" if there's a dashboard route)
  - app/components/dashboard/* (widget components — read each to see what data is
    shown)

Add a new accordion section at the top of every role guide
(OperatorGuide / SupervisorGuide / AdminGuide / ProcurementSpecialistGuide) titled
"Dashboard". For each role, document only the widgets that role actually sees
(check role guards in the components).

If a consolidated dashboard exists for Supervisors/Admins, document its purpose and
where to find it.

Add corresponding entries to the search index in HelpDrawer.vue:
  - `op-dashboard`, `sup-dashboard`, `adm-dashboard`, `proc-dashboard` as
    appropriate (only for roles that see the widget). Do not add for roles that
    don't have access.

Run pnpm format and pnpm typecheck. Do not commit.
```

---

### 5.8 — PO Closure email recipient

```
Document the email behaviour when a PO is closed (manual or auto-close).

Source-of-truth:
  - server/api/pos/[id]/close.patch.ts:282-309 (manual close → emails the original
    PRF requester; nobody else)
  - server/api/locations/[id]/deliveries/index.post.ts:794-830 (auto-close on
    final delivery → same email path, sender labelled "System (Auto-Close)")

Edit app/components/help/SupervisorGuide.vue → "PO Management" accordion → "Manual
PO Closure" subsection. Add a final paragraph:
  "Email behaviour: closing a PO sends a notification only to the original PRF
   requester (the operator who raised the PRF). Procurement Specialists and other
   Supervisors are not emailed. The same email is sent automatically when the
   final delivery brings the PO to 100% fulfilled — in that case the sender is
   labelled 'System (Auto-Close)'."

Add the same paragraph to app/components/help/AdminGuide.vue if Admins also handle
closures (verify by reading the close.patch.ts permission check).

No new search index entry needed — just update the existing `sup-po-management`
content to mention "PRF requester is emailed on close".

Run pnpm format and pnpm typecheck. Do not commit.
```

---

## Order of operations

1. Run **Action 1** (high-severity factual errors) first — these block trustworthy
   onboarding.
2. Run **Action 2** (workflow diagrams) — fixes the most common badge-vs-doc
   confusion.
3. Run **Action 3** (resend Admin-only) — small wording change, no risk.
4. Run **Action 4** (cosmetic) — quick wins.
5. Run **Action 5** sub-prompts in this priority order: 5.1 → 5.2 → 5.3 → 5.5 →
   5.4 → 5.8 → 5.6 → 5.7.

After every action, do a manual smoke test of the Help Center in the browser
(`/` → click the Help icon) and confirm the search index returns the updated
copy. Do not commit until you've reviewed each diff.
