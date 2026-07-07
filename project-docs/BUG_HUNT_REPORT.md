# Bug Hunt Report — Stock Management System

**Date:** 2026-07-07
**Scope:** Full application — server API, business-logic utilities, middleware, Prisma schema, frontend pages/composables/stores.
**Method:** Manual review of core transaction paths + 5 independent focused audits (auth/RBAC, stock/WAC, periods/reconciliation, procurement/imports, frontend), with the highest-impact findings independently re-verified against source.

> Confidence note: The critical stock/WAC concurrency findings were confirmed by two independent reviewers **and** re-read by hand. Every "verified ✓" item below was checked directly against the cited lines.

---

## Executive summary

The application is well-structured and most role/permission checks and validations are correct. The serious problems cluster in **three areas**:

1. **Stock & WAC integrity under concurrency (and even single requests).** Every stock read-modify-write reads current stock/WAC *outside* the write transaction, runs at PostgreSQL default READ COMMITTED with no row locks, writes WAC (and transfer stock) as absolute values, and there is **no DB `CHECK (on_hand >= 0)`**. Result: negative stock, lost WAC updates, and permanently corrupted inventory valuation are all reachable — some without any concurrency at all (duplicate line items).
2. **Period-close integrity.** Transfers bypass period gating entirely, "READY" locations aren't actually locked, DRAFT deliveries inflate reconciliation receipts, and the close snapshot is read outside its transaction. Together these let the signed-off closing figures diverge from actual stock.
3. **A handful of concrete access-control / workflow gaps** — NCR cross-location IDOR, self-approval of PRFs/transfers, last-admin lockout, and a single-item price edit that bypasses the period price lock.

**Counts:** 5 Critical · 9 High · 11 Medium · ~13 Low/hardening.

The unifying remediation for area 1 is mechanical and high-value: **do every stock read-modify-write inside the transaction using atomic/conditional SQL** (`{ increment }` / `{ decrement }`, or `updateMany({ where: { on_hand: { gte: qty } } })`), compute WAC from a locked read, reject duplicate item lines, and add a DB `CHECK (on_hand >= 0)` backstop.

---

## CRITICAL

### C1 — Issues can drive stock negative (violates the #1 business rule) ✓ verified
- **Where:** `server/api/locations/[id]/issues/index.post.ts:123-158` (read outside tx), `:216-227` (non-cumulative pre-check), `:301-311` (in-tx decrement, no re-check)
- **Why:** Stock sufficiency is validated against a snapshot read *before* the `$transaction`; the transaction then does `on_hand: { decrement }` with no re-validation and no DB constraint. Two triggers:
  - **Single request:** the pre-check loop validates each line against the *un-decremented* snapshot, so it isn't cumulative per item. `on_hand = 10`, payload with two lines of qty 8 for the same item → both pass (8 ≤ 10) → `10 − 8 − 8 = −6`. Zod does not dedupe lines.
  - **Concurrency:** two issues each read 10, each request 8, both pass → `−6`.
- **Fix:** Aggregate qty per item before validating; enforce atomically inside the tx with `updateMany({ where: { location_id_item_id: …, on_hand: { gte: qty } }, data: { on_hand: { decrement: qty } } })` and throw `INSUFFICIENT_STOCK` when `count === 0`. Add DB `CHECK (on_hand >= 0)`.

### C2 — Delivery WAC corruption via stale snapshot / duplicate lines ✓ verified
- **Where:** `server/api/locations/[id]/deliveries/index.post.ts:429-453` (snapshot read in a *separate* read-only `$transaction`), `:554-561` (WAC computed from snapshot), `:607-624` (absolute `wac:` write at 616). Same defect in `server/api/deliveries/[id].patch.ts` post-path (`:454-466`, `:511-516`, `:587-604`).
- **Why:** `on_hand` uses atomic `{ increment }` (correct) but `wac` is an **absolute SET** computed from `stockMap`, read in a prior separate transaction and **never updated between line iterations**.
  - **Single request:** one delivery with two lines for the same item (line1 = 100 @ 10, line2 = 100 @ 30 from 0 stock) → correct WAC = 20, actual stored WAC = 30 → inventory value overstated by SAR 2,000.
  - **Concurrency:** Item X `on_hand=100, wac=10`; Delivery A (50 @ 12) and B (50 @ 20) both read (100,10). `on_hand` ends 200 (correct) but `wac` is set to whichever commits last → valuation permanently wrong. WAC averaging cannot be reversed, so the error is unrecoverable.
- **Fix:** Compute WAC inside the write transaction after a locked read (`SELECT … FOR UPDATE` / serializable), fold WAC into one atomic statement, and reject duplicate item lines in the schema.

### C3 — Transfer approval writes absolute stock from an unlocked read → lost updates, negative & phantom stock ✓ verified
- **Where:** `server/api/transfers/[id]/approve.patch.ts:133-140` (validate outside tx), `:153-185` (source: read then absolute `on_hand: newSourceQuantity`), `:188-217` (destination absolute set).
- **Why:** Source deduction is an **absolute write** (`on_hand = current − qty`), not `{ decrement }`, from an unlocked read, with no in-tx re-check. This is strictly worse than C1 because even a concurrent *atomic* decrement from an Issue gets clobbered.
  - Source `on_hand = 10`; Transfer (qty 8) and Issue (qty 5) run concurrently. Transfer reads 10 → computes 2. Issue commits `decrement 5` → 5. Transfer writes absolute `2`, **erasing the issue's deduction**: 13 units physically left, system shows 2. Reverse ordering → negative stock. A transfer with two lines for the same item triggers it single-request.
- **Fix:** Source `updateMany({ where: { …, on_hand: { gte: qty } }, data: { on_hand: { decrement: qty } } })`, assert `count === 1`; destination `{ increment }` with WAC from a locked read; move sufficiency check inside the tx.

### C4 — Transfer moves value at a stale WAC captured at creation (value not conserved) ✓ verified
- **Where:** `server/api/transfers/index.post.ts:267-279` (captures `wac_at_transfer` at *creation*); `server/api/transfers/[id]/approve.patch.ts:148-228` (moves value using that stale snapshot).
- **Why:** The rule is "transfers move stock at **current** source WAC," but `wac_at_transfer` is frozen at creation. If source WAC changes before approval, source loses `qty × on_hand`-worth of physical stock while destination is credited at the old WAC → inventory value is created/destroyed.
  - Transfer of 50 created at source WAC 10. A delivery then raises source WAC to 18. On approval, source loses 50 units (now worth 18 = SAR 900) but destination receives 50 × 10 = SAR 500 → **SAR 400 of value vanishes** from consolidated stock.
- **Fix:** Recompute source WAC at approval time (inside the tx, locked read), not at creation.

### C5 — Period-close snapshot read outside its transaction + transfers can mutate stock during PENDING_CLOSE ✓ verified (transfers gap)
- **Where:** `server/api/approvals/[id]/approve.patch.ts:262-376` (reads stock/reconciliations & builds snapshots) vs `:379-444` (write tx). Compounded by transfers having **no period guard** (`transfers/[id]/approve.patch.ts` — no Period/PeriodLocation check anywhere).
- **Why:** The close reads all `LocationStock` and computes closing snapshots *before* opening the transaction, with no row locks or re-read. Because transfers ignore period status, a transfer approved during PENDING_CLOSE mutates the same (non-period-scoped) stock rows after the snapshot is captured → the permanent `closing_value` / `snapshot_data` disagree with the stock the next period inherits via the running balance.
- **Fix:** Read stock and write snapshots inside one transaction with row locks; block transfers when the period isn't OPEN (see H1).

---

## HIGH

### H1 — Transfers bypass all period gating ✓ verified
- **Where:** `server/api/transfers/index.post.ts` (create) and `server/api/transfers/[id]/approve.patch.ts` (approve) — neither queries `Period`/`PeriodLocation`; `Transfer` has no `period_id` (`prisma/schema.prisma`).
- **Why:** Deliveries/issues require an OPEN period; transfers don't. Stock can be moved when the period is PENDING_CLOSE or CLOSED, or when no period is open — violating "never modify closed periods" and desyncing the close snapshot. It's also the enabler for C5.
- **Fix:** Require an OPEN period (and target `PeriodLocation.status === "OPEN"`) at both transfer creation and approval.

### H2 — "READY" locations aren't locked — deliveries/issues still post into them ✓ verified
- **Where:** `server/api/locations/[id]/deliveries/index.post.ts:203-206` & `server/api/locations/[id]/issues/index.post.ts:140-193` check only global `Period.status === "OPEN"`, never `PeriodLocation.status`. (POB *does* gate on `PeriodLocation.status === "OPEN"` at `pob.post.ts:160-169` — inconsistent.)
- **Why:** After a supervisor reconciles a location and marks it READY (`period-locations/ready.patch.ts`), an operator can still post a delivery/issue there while the period is OPEN. Stock changes but READY isn't reset and the reconciliation isn't recomputed → the close uses live stock that no longer matches the reconciliation the location was signed off on.
- **Fix:** Reject stock-mutating posts when the location's `PeriodLocation.status !== "OPEN"` (i.e., READY/CLOSED), or auto-revert READY on any stock change.

### H3 — DRAFT deliveries are counted as receipts in reconciliation, reports & dashboards ✓ verified
- **Where:** `server/api/reconciliations/index.post.ts:154-169`; `reconciliations/consolidated.get.ts:182-189`; `reports/reconciliation.get.ts:233-240`; `dashboard/consolidated.get.ts:121-149`; `locations/[id]/dashboard.get.ts:138-146`.
- **Why:** Every receipts aggregation filters on `location_id + period_id` with **no `status: "POSTED"`**. A DRAFT delivery still gets `delivery_lines.line_value` and `total_amount` populated but never touches stock. So `receipts` (and thus `consumption = opening + receipts + transfersIn − transfersOut − closing`) is overstated by the full value of every unposted draft — corrupting close figures and manday-cost KPIs. (Transfers correctly filter `status: "COMPLETED"`; deliveries don't.)
- **Fix:** Add `status: "POSTED"` to all delivery receipts queries.

### H4 — Single-item price PATCH bypasses the period price lock while OPEN ✓ verified
- **Where:** `server/api/items/[itemId]/price.patch.ts:125-134` — only rejects `period.status === "CLOSED"`.
- **Why:** The bulk price endpoints require `status === "DRAFT"` (`prices/index.post.ts:89`, `prices-copy.post.ts:74`) — prices are meant to lock on open. This single-item path lets an Admin rewrite a locked `ItemPrice` mid-OPEN-period, which changes the `period_price` used for variance detection on subsequent deliveries → a genuine supplier over/under-charge can be masked by editing the expected price to match the invoice, and no NCR is raised.
- **Fix:** Require `status === "DRAFT"` (match the bulk endpoints).

### H5 — NCR list IDOR: operator can read any location's NCRs via `locationId` param ✓ verified
- **Where:** `server/api/ncrs/index.get.ts:71-90` (correctly scopes to the operator's locations) then `:92-94` unconditionally overwrites it: `if (locationId) { where.location_id = locationId; }`.
- **Why:** No check that the requested `locationId` is in the operator's accessible set (unlike `reports/stock-now.get.ts` / `reports/deliveries.get.ts`, which validate first). `GET /api/ncrs?locationId=<other-location>` returns that location's NCRs — price variances, expected vs actual unit prices, delivery numbers, supplier data, financial values.
- **Fix:** When `locationId` is supplied for a non-admin/supervisor, intersect it with the accessible set (or 403 if not a member) instead of replacing the filter.

### H6 — Editing an OPEN PO with partial deliveries wipes `delivered_qty` and orphans delivery links ✓ (reported, schema-confirmed)
- **Where:** `server/api/pos/[id].patch.ts:221-301` (deletes all PO lines and recreates); guarded only by `status !== "CLOSED"`.
- **Why:** A partially-delivered PO stays OPEN and fully editable. `deleteMany` + recreate sets new lines' `delivered_qty` to 0 (schema default), and `DeliveryLine.po_line` (optional, default `SetNull`) nulls out — so past deliveries are unlinked and the received-quantity record is erased. New `quantity` can even be set below what was already delivered; over-delivery gating resets.
  - PO for 100 KG, 60 delivered → edit lines → `delivered_qty` resets to 0, prior delivery unlinked, remaining shows 100 again; PO can be re-quantified to 10 KG despite 60 received.
- **Fix:** Block line edits when any line has `delivered_qty > 0` (or the PO has posted deliveries); otherwise diff and preserve `delivered_qty`, and validate `quantity >= delivered_qty`.

### H7 — Deactivated / deleted / demoted users keep working for up to 7 days ✓ (reported, config-confirmed)
- **Where:** `server/middleware/auth.ts:52-68` copies the sealed-cookie session verbatim into `event.context.user` and never reloads the user; `login.post.ts` filters `is_active` only at login; 7-day `maxAge` in `nuxt.config.ts`.
- **Why:** Sessions are stateless sealed cookies with no server-side store. Setting `is_active: false`, deleting, or changing a user's role has **no effect** on their existing session — they keep their old role/access until the cookie expires. `logout` and `change-password` also can't revoke a captured cookie.
- **Fix:** In `auth.ts`, reload the user (or a short-TTL cache) and reject `!is_active`, refreshing `role`/`locations` from the DB; or add a session/token-version field bumped on deactivate/role-change/password-change.

### H8 — Over-delivery approval trusts a client-supplied flag ✓ verified
- **Where:** `server/api/locations/[id]/deliveries/index.post.ts:384,392-395` honors `lineData.over_delivery_approved` from the request body; only lines where `approved === false` block a non-supervisor poster.
- **Why:** An Operator posting a crafted request with `over_delivery_approved: true` passes the gate and posts an over-delivery beyond the PO (mutating stock/WAC) without the required Supervisor/Admin approval. The UI is the only thing normally preventing it.
- **Fix:** Ignore the client flag for non-supervisor/admin posters; derive approval authority from `user.role` server-side.

### H9 — PRF (and Transfer) self-approval — no separation of duties ✓ (reported)
- **Where:** `server/api/prfs/[id]/approve.patch.ts:57-110` and `reject.patch.ts` (role check only, no requester≠approver check); same in `server/api/transfers/[id]/approve.patch.ts:54-64`.
- **Why:** A Supervisor/Admin can create a PRF/transfer, submit it, and approve their own — defeating the "requires Supervisor approval" control.
- **Fix:** Reject when `existingPRF.requested_by === user.id` / `transfer.requested_by === user.id` (e.g., 403 `SELF_APPROVAL_FORBIDDEN`).

---

## MEDIUM

| # | Finding | Location | Impact / fix |
|---|---------|----------|--------------|
| M1 | **Last-admin lockout via user PATCH** — PATCH has none of the self/last-admin guards DELETE has ✓ verified | `users/[id]/index.patch.ts:154-183` vs `index.delete.ts:64-112` | Sole admin can demote/deactivate self or last admin → no admins, no in-app recovery. Mirror the DELETE guards. |
| M2 | **Two non-terminal periods possible** — open-check ignores `PENDING_CLOSE` and isn't transactional ✓ verified | `periods/[periodId]/open.post.ts:106-124` | OPEN + PENDING_CLOSE (or TOCTOU double-open) → ambiguous "current period" for pricing/variance. Reject if any period is OPEN *or* PENDING_CLOSE; do check+flip in one tx / partial unique index. |
| M3 | **Doc/NCR number generation races** — findFirst-max+increment, no lock; lexicographic sort breaks past 99/999 ✓ (reported) | `deliveries…:73-103`, `issues…:53-84`, `transfers…:54-85`, `priceVariance.ts:169-200`, inline NCR `deliveries…:629-642` | Concurrent posts collide on `@unique` doc numbers → 500 that **rolls back a valid delivery** (stock/WAC/PO lost). After 100 docs/location/day the sequence permanently 500s. Use a DB sequence/counter in-tx; pad width. |
| M4 | **Price variance silently skipped when item has no locked `ItemPrice`** ✓ (reported) | `deliveries…:563-577,628` | An unpriced item delivered at any price raises no NCR and records `period_price = unit_price` (fabricated "no variance"). Require a locked price to post, or flag missing-price deliveries. |
| M5 | **Two POs can be created from one PRF** — read-then-create check, no unique constraint ✓ (schema-confirmed) | `pos/index.post.ts:238-248`; `PO.prf_id` not unique | Concurrent PO creates both pass → PRF gets 2 POs; closing one closes the shared PRF, orphaning the other. Add `@unique` on `PO.prf_id`, handle P2002. |
| M6 | **`approvals/[id].get.ts` missing object-level authz** — auth-only ✓ verified | `approvals/[id].get.ts:16-52+` | Any operator can GET any approval UUID and read transfer/PO/PRF financials for all locations. Add role/location scoping. |
| M7 | **Item import creates case-variant duplicate codes** — import doesn't uppercase; existing-code lookup is case-sensitive ✓ (reported) | `item-import-validator.ts:19` vs `items/index.post.ts:26`; `items/import.post.ts:135-176` | DB has `SUGAR`, file has `sugar` → dedupe misses, both coexist (`code` unique but case-sensitive). Uppercase on import + case-insensitive lookup. |
| M8 | **Default transaction date computed in UTC** → off-by-one near midnight (Asia/Riyadh) ✓ (reported) | `deliveries/create.vue:747`, `issues/create.vue:335`, `transfers/create.vue:34` | 00:00–02:59 local yields yesterday; on the 1st can land in the previous period. Use `dayjs().format("YYYY-MM-DD")`. |
| M9 | **SMTP disables TLS cert validation + forces SSLv3** ✓ verified | `server/utils/email.ts:88-91` | `rejectUnauthorized: false` → MITM on the O365 path can capture mailbox credentials + email contents. Remove both; validate certs. |
| M10 | **Transfer period attribution by `transfer_date` (UTC `@db.Date`), inconsistent with `request_date` counting** ✓ (reported) | `transfers/[id]/approve.patch.ts:238`; consumed in reconciliation/reports; contrast `periods/current.get.ts:99-130` | Near month-end the same transfer lands in different periods across surfaces. Attribute via an explicit `period_id` captured at approval. |
| M11 | **Reconciliation opening-stock source inconsistent across paths** (some filter `status:"CLOSED"`, save path doesn't) ✓ (reported) | `reconciliations/index.post.ts:127-151` vs `consolidated.get.ts:102-106` vs `periods/index.post.ts:126-142` | Saved reconciliation opening can diverge from consolidated/roll-forward. Standardize on previous **CLOSED** period. |

---

## LOW / hardening

- **L1 — No DB `CHECK (on_hand >= 0)`** (`prisma/schema.prisma` LocationStock; migration confirms none). The root-cause backstop for C1–C3; add it. ✓ verified via migration
- **L2 — Price-variance NCR `value` stored as `abs(...)`** with no sign; reconciliation credits favorable (price-decrease) variances too → double-counts the gain. `priceVariance.ts:274`, `deliveries…:654`. Persist signed variance / don't auto-NCR favorable variances. ✓ (reported)
- **L3 — `periodPrice || unit_price`** masks a legitimate locked price of 0 (falsy) → NCR says "Expected 0.00" but line stores `period_price = actual`, `variance = 0` (contradictory records). `deliveries…:588,652`. Use `?? ` / explicit undefined check.
- **L4 — No rate limiting / brute-force protection** on `/api/auth/*`; login also leaks user existence via timing (returns before bcrypt when no user). `login.post.ts:51-74`. Add rate limiting + dummy-hash compare.
- **L5 — `check-availability` enumeration** — any authenticated user can probe usernames/emails. `users/check-availability.post.ts:22-36`. Restrict to ADMIN.
- **L6 — `/api/health` leaks raw DB error** (host/port/driver) unauthenticated. `health.get.ts:12-41`. Return a generic message.
- **L7 — `dev/reset-all-data` has no role check** (prod-blocked by `import.meta.dev`, so not prod-exploitable) and returns a hardcoded admin password. Add an ADMIN check as defense-in-depth. `reset-all-data.post.ts:16-120`.
- **L8 — Supabase anon key + URL shipped to client bundle** though `createClient` is never used. `nuxt.config.ts:28-33`. Remove from `public` config; audit Supabase RLS/grants (if RLS is off, the key + PostgREST bypasses the entire auth layer). *(needs runtime/RLS verification)*
- **L9 — Internal error messages leaked** in several 500 responses (`error.message` in `data.details`) — e.g. `deliveries/[id].patch.ts:1134`, `transfers/index.post.ts:390`. Log server-side, return generic.
- **L10 — Missing CSP & HSTS headers** (`vercel.json` sets some, no CSP/HSTS; not applied for node-server build).
- **L11 — Client period state stale up to 10 min across two divergent caches** (`stores/period.ts` 10-min vs `useCurrentPeriod.ts` 10-sec) — combined with H1, a stale-client transfer approval can hit a closed period. Unify the cache / invalidate on close.
- **L12 — Transfer form doesn't flag zero-stock items** (else-branch sets `has_insufficient_stock=false`) → invalid transfer created, fails only at approval. `transfers/create.vue:86` (Issues page does it right at `issues/create.vue:395`).
- **L13 — Delivery edit page uses stale over-delivery state** (loaded once, not recomputed on qty change). `deliveries/[id]/edit.vue:654,585`. Recompute live like the create page.
- **L14 — `fetchPeriodPrices()` swallows errors** → variance warning silently disappears while the server still creates NCRs (screen diverges from reality). `deliveries/create.vue:984`, `edit.vue:731`. Surface a warning.
- **L15 — Several mutations skip the offline guard** (transfer approve/reject, reconciliation save, user delete/toggle). `transfers/[id].vue`, `reconciliations/index.vue`, `users/index.vue`. Route through `guardAction`, disable when offline.
- **L16 — No per-item stock-movement / WAC ledger.** Header records capture who/when, but there's no immutable trail of `on_hand`/`wac` changes, so a corrupted WAC (C2/C3) can't be reconstructed. Consider a `StockMovement` ledger.

---

## Design gap worth noting

**No supported way to correct or void a POSTED delivery.** Posted deliveries can't be edited (`deliveries/[id].patch.ts:154`) or deleted (`[id].delete.ts:86`) — a deliberate choice that sidesteps lossy WAC reversal. But combined with the concurrency corruption (C2/C3), it means bad stock/WAC data is **unrecoverable through the API**. Consider a compensating "reversal/adjustment" transaction type.

---

## Verified-safe (hypotheses checked and refuted — no action needed)

- **Open self-registration / role escalation** — refuted. `/api/auth/register` is in the public allowlist but the handler itself hard-requires `role === "ADMIN"` and validates the assigned role via a Zod enum. Not exploitable.
- **`dev/reset-all-data` reachable in production** — refuted. Guarded by `if (!import.meta.dev) throw 403`; compiled to a 403 in any Vercel/production build. (See L7 for the dev-only role gap.)
- **IDOR on top-level detail routes** — largely refuted. `login.post.ts` populates `locations`; `location-access.ts` fails closed; `deliveries/[id]`, `issues/[id]`, `transfers/[id]`, `ncrs/[id]` each do their own location check. (The exception is the **NCR list** — see H5 — and `approvals/[id]` — see M6.)
- **Password handling** — sound: bcrypt cost 10, `change-password` verifies the current password, no passwords logged, cookie flags via nuxt-auth-utils defaults (httpOnly, secure in prod, sameSite=lax).
- **Posted-delivery reversal bugs** — refuted; posted deliveries are immutable (see Design gap).
- **Import DoS / partial import** — refuted. `MAX_FILE_SIZE` 10 MB and `MAX_ROWS` 1000 enforced; import runs in a single all-or-nothing transaction.
- **POB overwriting stock/WAC** — refuted. "POB" here is *Personnel-On-Board* (crew counts), not physical opening balance; it never touches `LocationStock`, enforces role + period-OPEN + non-negative + `@@unique([period_id, location_id, date])`.
- **Period close atomicity & reopen** — the actual close (`approvals/[id]/approve.patch.ts:379-444`) is ADMIN-only, re-verifies all-READY, and writes all snapshots + status flips in one transaction; no path reopens a CLOSED period. (The snapshot *read* being outside the tx is C5.)
- **Roll-forward double-run, divide-by-zero in variance, NCR double-credit, mass assignment, SQL injection, XSS via `v-html`, delete-with-dependencies** — all checked and found safe.

---

## Recommended remediation order

1. **Stock/WAC integrity (C1–C4, L1):** move all stock read-modify-writes inside the transaction with atomic/conditional SQL and locked-read WAC; reject duplicate item lines; add `CHECK (on_hand >= 0)`. Highest impact, mostly mechanical.
2. **Period-close integrity (C5, H1–H3):** gate transfers on period status, lock READY locations, filter drafts out of receipts, read/write the close snapshot in one locked transaction.
3. **Access control (H5, H7, H8, H9, M1, M6):** fix NCR IDOR, session revocation, over-delivery flag trust, self-approval, last-admin lockout, approvals authz.
4. **Workflow/price integrity (H4, H6, M2–M5):** price-lock bypass, PO edit wiping delivered_qty, multi-period, doc-number races, unpriced-item variance, duplicate PRF→PO.
5. **Hardening (M7–M11, L2–L16):** as capacity allows.
