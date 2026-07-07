# Bug-Fix Prompts — Stock Management System

_Companion to `BUG_HUNT_REPORT.md`. Each phase below is a **self-contained prompt**: copy everything inside one fenced block and paste it into any AI coding agent. Every block already contains the project context, safety rules, coding standards, the findings to fix, and a verification protocol — nothing needs to be prepended._

**This intro is usage guidance only — do not paste it.**

**Recommended order:** Phase 1 → 10. Phases are independent, but Phase 4 (DB constraint) should run only after Phases 1–3 are applied. Line numbers cited come from the audit and may have shifted — always confirm by reading the surrounding code.

---

## Phase 1 — Issues: prevent negative stock
_Severity: Critical · Files: `server/api/locations/[id]/issues/index.post.ts`_

````
# Task: Fix negative-stock bugs in stock Issue posting

## Context
This is a LIVE PRODUCTION Nuxt 4 stock-management app. Stack: Nuxt 4 SPA (ssr:false), Nitro/H3 server routes under `server/api/`, Prisma ORM + PostgreSQL (Supabase transaction pooler, default READ COMMITTED isolation), Zod validation, TypeScript. Money = SAR (2 decimals); quantity up to 4 decimals. Core rule: **stock on_hand must never go negative.** Issues deduct stock at the item's current WAC (WAC is NOT recalculated on issues).

## Rules you must follow
- Keep changes backwards-compatible: do not change the API request/response shape or error-code semantics unless required by the fix.
- No destructive DB operations. This phase requires NO schema change.
- Do NOT run `git commit` or `git push` — the user handles git.
- Formatting (Prettier / VS Code format-on-save): double quotes, semicolons, 2-space indent, 100-col width, always parenthesize arrow params, ES5 trailing commas. No `any` types — use proper types/guards. Handle Prisma `Decimal` carefully (convert once, near the boundary). Match existing code patterns; keep edits minimal.

## The bugs (in `server/api/locations/[id]/issues/index.post.ts`)
Stock sufficiency is validated against a snapshot read with `Promise.all` OUTSIDE the write `$transaction` (~lines 123-158), the per-item pre-check loop is not cumulative (~lines 216-227), and inside the transaction the update is an unconditional `on_hand: { decrement }` (~lines 301-311). There is no DB constraint preventing negative stock. Two ways this produces negative stock:
1. **Single request:** `on_hand = 10`; a payload with two lines for the SAME `item_id`, qty 8 each, passes the pre-check (each 8 ≤ 10) then decrements twice → `-6`. Zod does not dedupe lines.
2. **Concurrency:** two issues for the same item each read 10, each request 8, both pass the outside-tx check, both decrement → `-6`.

## Required fixes
1. **Reject duplicate item lines.** In the request body Zod schema (`issueLineSchema` / `bodySchema`, ~lines 36-47), add a refinement so the same `item_id` cannot appear in more than one line; on violation throw the existing `VALIDATION_ERROR` shape listing the duplicated item(s). (Alternatively aggregate quantities per item before processing — but rejecting is simpler and preserves clear per-line semantics.)
2. **Enforce sufficiency atomically inside the transaction.** Replace the unconditional in-transaction decrement with a conditional atomic update that cannot go negative:
   ```ts
   const dec = await tx.locationStock.updateMany({
     where: { location_id: locationId, item_id: lineItem.item_id, on_hand: { gte: lineItem.quantity } },
     data: { on_hand: { decrement: lineItem.quantity } },
   });
   if (dec.count === 0) {
     // roll back with the INSUFFICIENT_STOCK error (fetch item/available for the message)
     throw createError({ statusCode: 400, statusMessage: "Bad Request",
       data: { code: "INSUFFICIENT_STOCK", message: "Insufficient stock for one or more items", details: [...] } });
   }
   ```
   Keep the existing pre-check for a fast, friendly error, but treat the in-transaction guarded update as the source of truth.
3. **Capture cost inside the transaction.** Read the current `wac` for `wac_at_issue` / `line_value` from the stock row inside the transaction (e.g., `tx.locationStock.findUnique`) rather than the outside snapshot, so the captured cost reflects deliveries committed just before.

## Verify before you stop (do all)
1. Re-read every change and confirm it implements the above.
2. Run `pnpm typecheck` (must be ZERO errors), then `pnpm lint` and `pnpm format`.
3. Confirm scenario 1 (duplicate lines) is now rejected, and scenario 2 (concurrency) leaves `on_hand` never below 0 — the second concurrent issue must fail with INSUFFICIENT_STOCK. If a dev database is available, write a throwaway script that fires N concurrent issue POSTs for the same item with `Promise.all` and asserts final `on_hand >= 0`, run it, then delete the script.
4. Confirm the success response shape is unchanged for the normal path.
5. Only stop when all tasks are done and all checks pass. If blocked, stop and report exactly what and why.
````

---

## Phase 2 — Deliveries: fix WAC corruption + over-delivery flag trust
_Severity: Critical/High · Files: `server/api/locations/[id]/deliveries/index.post.ts`, `server/api/deliveries/[id].patch.ts`_

````
# Task: Fix WAC (weighted-average-cost) corruption and an over-delivery approval bypass in Delivery posting

## Context
LIVE PRODUCTION Nuxt 4 app. Stack: Nuxt 4 SPA, Nitro/H3 server routes, Prisma + PostgreSQL (Supabase pooler, default READ COMMITTED), Zod, TypeScript. Money = SAR (2 dp); quantity up to 4 dp. WAC rule on deliveries: `newWAC = (curQty*curWAC + recvQty*price) / (curQty + recvQty)`; stored to 4 dp. A corrupted WAC is unrecoverable (averaging can't be reversed), so correctness here is critical.

## Rules you must follow
- Backwards-compatible only: do not change request/response shapes or error semantics beyond what the fix needs.
- No schema change required in this phase. No destructive DB operations.
- Do NOT run `git commit` or `git push` — the user handles git.
- Prettier: double quotes, semicolons, 2-space indent, 100 cols, parenthesized arrow params, ES5 trailing commas. No `any`. Handle Prisma `Decimal` carefully. Keep edits minimal and match existing patterns.

## The bugs
Both `deliveries/index.post.ts` (create/post) and `deliveries/[id].patch.ts` (edit → post) read current stock (`on_hand`, `wac`) into a `stockMap` in a SEPARATE read-only `$transaction` OUTSIDE the write transaction (create ~429-453; patch ~454-466), compute `newWAC` from that stale snapshot (~554-561 / ~511-516), and then write `wac` as an ABSOLUTE value inside the write transaction (`update: { on_hand: { increment }, wac: wacResult.newWAC }`, ~607-624 / ~587-604). `stockMap` is never updated between line iterations.
- **Concurrency:** two deliveries for the same item both read the same base and the later commit overwrites the WAC computed by the earlier — `on_hand` ends correct but `wac` (and inventory value) is permanently wrong.
- **Single request:** two lines for the same item both compute WAC from the original base → wrong WAC without any concurrency.

Separately (High, same create file): the over-delivery approval gate trusts a client-supplied per-line boolean `over_delivery_approved` (~384, 392-419). An Operator can post a crafted request with `over_delivery_approved: true` and bypass the required Supervisor/Admin approval, mutating stock beyond the PO.

## Required fixes
1. **Reject duplicate item lines** in the body Zod schema of BOTH files (`deliveryLineSchema` / `bodySchema`): the same `item_id` may not appear twice; on violation return the existing `VALIDATION_ERROR` shape.
2. **Compute and write WAC from a value read inside the write transaction.** Move the current-stock (`on_hand`,`wac`) read INSIDE the write `$transaction` (keep the period-price map used for variance as-is). Make the read-compute-write serialization-safe using ONE of:
   - **(Recommended) Serializable + bounded retry:** run the write `$transaction` with `{ isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait, timeout }`, read each item's current stock inside the callback immediately before computing WAC, and wrap the whole `$transaction` call in a small retry loop (e.g. up to 3 attempts) that retries on Prisma write-conflict/serialization errors (`error.code === "P2034"`). Example retry helper:
     ```ts
     async function runWithRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
       for (let i = 0; i < attempts; i++) {
         try { return await fn(); }
         catch (e) {
           if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2034" && i < attempts - 1) continue;
           throw e;
         }
       }
       throw new Error("unreachable");
     }
     ```
   - **(Alternative) Locked read:** inside the transaction, `SELECT on_hand, wac ... FOR UPDATE` via `tx.$queryRaw` for the row, compute WAC, then update. If you choose this, FIRST confirm the exact table and column identifiers from `prisma/schema.prisma` (check for any `@@map`/`@map`) so the raw SQL matches.
   Keep `on_hand` as an atomic `{ increment }`. The key invariant: the `wac` written must be derived from a stock value read inside the same transaction that writes it.
3. **Stop trusting the client over-delivery flag.** When building the over-delivery lines, only honor `lineData.over_delivery_approved` if the posting user is SUPERVISOR or ADMIN; for any other role force it to `false`:
   ```ts
   approved: user.role === "SUPERVISOR" || user.role === "ADMIN" ? (lineData.over_delivery_approved ?? false) : false
   ```
   Verify the edit/post path (`deliveries/[id].patch.ts`) does not honor the flag from a non-supervisor either; apply the same treatment if it does.

## Verify before you stop (do all)
1. Re-read each change; confirm both files are fixed and duplicate lines are rejected.
2. Run `pnpm typecheck` (ZERO errors), then `pnpm lint` and `pnpm format`.
3. Walk the WAC math: e.g. item `on_hand=100, wac=10`; two concurrent deliveries (50@12 and 50@20) must end at `on_hand=200` and the mathematically correct blended `wac=13.0000` regardless of commit order. If a dev DB is available, script two concurrent posts with `Promise.all` and assert the stored WAC equals the correct blend; delete the script after.
4. Confirm an Operator posting `over_delivery_approved: true` still gets `OVER_DELIVERY_NOT_APPROVED`.
5. Confirm normal single-line posts still succeed with unchanged response shape.
6. Only stop when all tasks are done and all checks pass; otherwise report exactly what/why.
````

---

## Phase 3 — Transfers: atomic move, correct WAC basis, period gate, self-approval
_Severity: Critical/High · Files: `server/api/transfers/index.post.ts`, `server/api/transfers/[id]/approve.patch.ts`_

````
# Task: Fix stock/value integrity and workflow gaps in inter-location Transfers

## Context
LIVE PRODUCTION Nuxt 4 app. Stack: Nuxt 4 SPA, Nitro/H3, Prisma + PostgreSQL (Supabase pooler, default READ COMMITTED), Zod, TypeScript. Money = SAR (2 dp); quantity up to 4 dp. Rules: stock on_hand must never go negative; transfers move stock at the SOURCE location's CURRENT WAC and are atomic (all-or-nothing); all stock-mutating transactions require an OPEN accounting period.

## Rules you must follow
- Backwards-compatible only; don't change request/response shapes beyond the fix.
- No schema change required in this phase. No destructive DB operations.
- Do NOT run `git commit` or `git push` — the user handles git.
- Prettier: double quotes, semicolons, 2-space indent, 100 cols, parenthesized arrow params, ES5 trailing commas. No `any`. Handle Prisma `Decimal` carefully. Minimal, pattern-matching edits.

## The bugs (mainly `server/api/transfers/[id]/approve.patch.ts`, plus create)
1. **Absolute-set source deduction (Critical).** Approval reads `sourceStock` unlocked then writes an ABSOLUTE `on_hand: newSourceQuantity` (`current - qty`) rather than an atomic decrement (~153-185); the sufficiency check is outside the transaction (~133-140). A concurrent issue/transfer is silently overwritten (lost update) or drives stock negative.
2. **Stale WAC basis (High).** Value moves using `wac_at_transfer` captured at CREATION (`transfers/index.post.ts` ~267-279; used at approve ~150/202/225). If source WAC changed before approval, inventory value is created or destroyed. Rule says use CURRENT source WAC.
3. **No period gating (High).** Neither create nor approve checks any `Period`/`PeriodLocation` status, so stock can move during PENDING_CLOSE/CLOSED periods or into locations already marked READY.
4. **Self-approval (High).** Approve only checks role ∈ {SUPERVISOR, ADMIN}; the requester can approve their own transfer.

## Required fixes
1. **Reject duplicate item lines** in the transfer create body schema.
2. **Atomic guarded source deduction** inside the transaction:
   ```ts
   const dec = await tx.locationStock.updateMany({
     where: { location_id: transfer.from_location_id, item_id: itemId, on_hand: { gte: quantity } },
     data: { on_hand: { decrement: quantity } },
   });
   if (dec.count === 0) throw createError({ statusCode: 400, statusMessage: "Bad Request",
     data: { code: "INSUFFICIENT_STOCK", message: `Insufficient stock for ${line.item.name} at source` } });
   ```
   Keep `validateAndThrowIfInsufficientStock` only as a fast pre-check.
3. **Value at current source WAC (approval time).** Before decrementing, read the current source `wac` inside the transaction and use THAT as the receipt price for the destination WAC recalculation and for line valuation. Persist the approval-time values: update the transfer line's `wac_at_transfer` and `line_value`, and the transfer `total_value`, so records are internally consistent. Make the destination update serialization-safe too (recompute destination WAC from a value read inside the transaction). Prefer running the whole approve `$transaction` at `Serializable` isolation with a bounded retry on Prisma `P2034` (see pattern below).
   ```ts
   async function runWithRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
     for (let i = 0; i < attempts; i++) {
       try { return await fn(); }
       catch (e) { if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2034" && i < attempts - 1) continue; throw e; }
     }
     throw new Error("unreachable");
   }
   ```
4. **Period gating** at BOTH create and approve: fetch the current OPEN period (`prisma.period.findFirst({ where: { status: "OPEN" } })`); if none → 400 `NO_OPEN_PERIOD`. Then require the `PeriodLocation` rows for BOTH `from` and `to` locations in that period to have `status === "OPEN"` (not READY/CLOSED); otherwise 409 `LOCATION_PERIOD_LOCKED` with a clear message. Do this before moving stock.
5. **Block self-approval:** after loading the transfer, if `transfer.requested_by === user.id` → 403 `SELF_APPROVAL_FORBIDDEN`.

## Verify before you stop (do all)
1. Re-read each change; confirm create and approve are both fixed.
2. Run `pnpm typecheck` (ZERO errors), then `pnpm lint` and `pnpm format`.
3. Value-conservation check: source WAC=10 at creation, then raised to 18 by a delivery; on approval the destination must receive at 18 and total inventory value across both locations must be conserved. Confirm a concurrent issue on the source cannot be lost and source never goes negative (script it against a dev DB if available, then delete the script).
4. Confirm a transfer cannot be created/approved when no period is OPEN or when a from/to location is READY/CLOSED; confirm the requester cannot approve their own transfer.
5. Confirm the normal happy-path response shape is unchanged.
6. Only stop when all tasks pass; otherwise report exactly what/why.
````

---

## Phase 4 — Database backstop: negative-stock CHECK constraint
_Severity: Low (root-cause backstop) · Files: `prisma/schema.prisma` + a new migration_

````
# Task: Add a database CHECK constraint preventing negative stock

## Context
LIVE PRODUCTION Nuxt 4 app using Prisma + PostgreSQL (Supabase). The `LocationStock.on_hand` column (`Decimal`) has no `CHECK (on_hand >= 0)`, so application bugs can persist negative stock. This phase adds the DB-level backstop. RUN THIS ONLY AFTER the Issues/Deliveries/Transfers atomicity fixes (Phases 1–3) are in place, because the constraint will reject any write that would violate it.

## Rules you must follow
- PRODUCTION DATABASE. Never use `db:push`. Create a PROPER Prisma migration. The migration must be additive and must NOT fail against existing data or destroy anything.
- Do NOT deploy to production yourself. Generate/apply the migration on a DEV database only; instruct the user to deploy to prod with `pnpm db:migrate:deploy` after a backup.
- Do NOT run `git commit` or `git push` — the user handles git.
- Prettier / formatting standards apply to any TS you touch.

## Steps
1. **Confirm identifiers.** Read `prisma/schema.prisma` and the initial migration under `prisma/migrations/` to get the EXACT table and column names for `LocationStock.on_hand` (respect any `@@map`/`@map`; note Prisma-generated quoting).
2. **Pre-check existing data for violations.** Query the dev/target DB for `on_hand < 0` (e.g. via `prisma.$queryRaw`). If ANY negative rows exist, DO NOT silently clamp them — stop and report the offending rows to the user for a data-correction decision. The constraint cannot be added until they are resolved.
3. **Create the migration.** Prisma schema cannot express a CHECK constraint directly, so add it via migration SQL. Generate a migration (e.g. `pnpm db:migrate dev --name add_on_hand_nonneg_check`) and ensure its SQL contains, with the correct quoted identifiers:
   ```sql
   ALTER TABLE "LocationStock" ADD CONSTRAINT "locationstock_on_hand_nonneg" CHECK ("on_hand" >= 0);
   ```
   (Adjust the table/column quoting to match your schema exactly.)
4. **Do not touch unrelated schema.** Keep the diff to just this constraint.

## Verify before you stop (do all)
1. Run `pnpm typecheck` (ZERO errors) and confirm `prisma generate` still succeeds.
2. Apply the migration on a DEV database and confirm it succeeds (no existing-data failure).
3. Prove the backstop: attempt a direct raw update that would set `on_hand` negative and confirm the DB rejects it.
4. Confirm normal issue/transfer flows still succeed.
5. Leave a clear note for the user: "Deploy to production with `pnpm db:migrate:deploy` after backup; a negative-row pre-check passed on dev." Only stop when the dev migration is clean; otherwise report what blocked it.
````

---

## Phase 5 — Period-close integrity
_Severity: Critical/High · Files: `server/api/approvals/[id]/approve.patch.ts`, `server/api/locations/[id]/deliveries/index.post.ts`, `server/api/locations/[id]/issues/index.post.ts`, `server/api/reconciliations/index.post.ts`, `server/api/reconciliations/consolidated.get.ts`, `server/api/reports/reconciliation.get.ts`, `server/api/dashboard/consolidated.get.ts`, `server/api/locations/[id]/dashboard.get.ts`_

````
# Task: Fix period-close integrity — draft receipts, READY-location locking, and the close-snapshot race

## Context
LIVE PRODUCTION Nuxt 4 app. Stack: Nuxt 4 SPA, Nitro/H3, Prisma + PostgreSQL (Supabase pooler, READ COMMITTED), Zod, TypeScript. Money = SAR (2 dp). Period model: `Period.status` (DRAFT/OPEN/PENDING_CLOSE/CLOSED) and per-location `PeriodLocation.status` (OPEN/READY/CLOSED). A location is marked READY once its reconciliation snapshot is taken; period close snapshots each location's closing stock/value. Reconciliation consumption = opening + receipts + transfersIn − transfersOut − closing (+ adjustments). Only POSTED deliveries affect stock; DRAFT deliveries do not.

## Rules you must follow
- Backwards-compatible; don't change response shapes beyond the fix. No schema change required.
- No destructive DB operations. Do NOT run `git commit`/`git push` — the user handles git.
- Prettier: double quotes, semicolons, 2-space indent, 100 cols, parenthesized arrow params, ES5 trailing commas. No `any`. Handle Prisma `Decimal` carefully. Minimal edits.

## The bugs
1. **DRAFT deliveries counted as receipts (High).** All receipts aggregations filter only by `location_id + period_id` with NO `status: "POSTED"`, so unposted drafts (which carry `line_value`/`total_amount` but never touch stock) inflate receipts and consumption. Locations: `reconciliations/index.post.ts` ~154-169; `reconciliations/consolidated.get.ts` ~182-189; `reports/reconciliation.get.ts` ~233-240; `dashboard/consolidated.get.ts` ~121-149; `locations/[id]/dashboard.get.ts` ~138-146.
2. **READY locations are not locked (High).** `deliveries/index.post.ts` (~203-206) and `issues/index.post.ts` (~140-193) only check the global `Period.status === "OPEN"`, never the per-location `PeriodLocation.status`, so operators can still post into a location already marked READY, invalidating its reconciliation. (POB already gates on `PeriodLocation.status === "OPEN"` — mirror that.)
3. **Close snapshot read outside its transaction (Critical, TOCTOU).** In `approvals/[id]/approve.patch.ts`, `handlePeriodCloseApproval` reads all `LocationStock` and builds the closing snapshots (~262-376) BEFORE the write `$transaction` (~379-444), with no locks or re-read, so stock changing during the commit is captured stale.

## Required fixes
1. **Add `status: "POSTED"`** to every delivery/receipts query listed above. Read each query and add the filter; do not change other filters.
2. **Lock READY/CLOSED locations for posting.** In deliveries (when `isPosting`) and issues, after confirming the OPEN period, load the `PeriodLocation` for that `{ period_id, location_id }` and require `status === "OPEN"`; otherwise 409 `LOCATION_PERIOD_LOCKED` with a clear message. IMPORTANT: these two files are also modified by Phases 1/2 for stock atomicity — ONLY add the PeriodLocation check here; do not disturb existing stock logic.
3. **Make the close snapshot consistent.** In `handlePeriodCloseApproval`, move the `LocationStock` reads and closing computation INSIDE the write `$transaction` (and/or run the transaction at `Serializable`), and re-verify inside the transaction that the period is still `PENDING_CLOSE` and all locations are still `READY`. This, together with fix #2 and Phase 3's transfer period-gate, closes the race.

## Verify before you stop (do all)
1. Re-read each change across all files.
2. Run `pnpm typecheck` (ZERO errors), then `pnpm lint` and `pnpm format`.
3. Confirm: a saved DRAFT delivery no longer changes reconciliation receipts/consumption or dashboard totals; posting a delivery/issue into a READY location is rejected; the close snapshot reflects committed stock at close time.
4. Confirm existing close/reconciliation/dashboard responses keep their shape for the normal path.
5. Only stop when all tasks pass; otherwise report exactly what/why.
````

---

## Phase 6 — Access control & session revocation
_Severity: High/Medium · Files: `server/api/ncrs/index.get.ts`, `server/api/approvals/[id].get.ts`, `server/middleware/auth.ts`, `server/api/users/[id]/index.patch.ts`_

````
# Task: Fix access-control gaps and make sessions revocable

## Context
LIVE PRODUCTION Nuxt 4 app. Auth: nuxt-auth-utils sealed-cookie sessions (7-day maxAge), no server-side session store; `server/middleware/auth.ts` attaches `session.user` to `event.context.user`. Roles: OPERATOR (assigned locations only), SUPERVISOR & ADMIN (all locations), PROCUREMENT_SPECIALIST (restricted). Operators' accessible locations come from `UserLocation` rows.

## Rules you must follow
- Backwards-compatible; keep response/error shapes stable. No schema change required.
- No destructive DB operations. Do NOT run `git commit`/`git push` — the user handles git.
- Prettier: double quotes, semicolons, 2-space indent, 100 cols, parenthesized arrow params, ES5 trailing commas. No `any` — type user/session objects. Minimal, pattern-matching edits.

## The bugs
1. **NCR list IDOR (High)** — `server/api/ncrs/index.get.ts` correctly scopes non-admin/supervisor results to the user's locations (~71-90) but then unconditionally OVERWRITES that with the raw query param: `if (locationId) { where.location_id = locationId; }` (~92-94). An operator can read any location's NCRs via `?locationId=<other>`.
2. **Approval detail has no object-level authz (Medium)** — `server/api/approvals/[id].get.ts` (~16-52+) only checks authentication, then returns linked TRANSFER/PO/PRF financials for any approval id.
3. **Sessions cannot be revoked (High)** — `server/middleware/auth.ts` (~52-68) trusts the cookie and never reloads the user, so deactivating, deleting, or changing a user's role has no effect for up to 7 days.
4. **Last-admin lockout (Medium)** — `server/api/users/[id]/index.patch.ts` (~154-183) writes `role`/`is_active` with none of the self/last-admin guards that `index.delete.ts` (~64-112) has.

## Required fixes
1. **NCR scope:** for non-admin/supervisor users, when `locationId` is provided, verify it is a member of the user's accessible set (the `locationIds` computed at ~78); if not, return an empty result (or 403) — never replace the scoped filter. Only narrow within the allowed set. Leave admin/supervisor behavior unchanged.
2. **Approval authz:** add an authorization check to `approvals/[id].get.ts` — allow ADMIN/SUPERVISOR unconditionally; for other roles allow only if the user is the requester or has access (via `UserLocation`) to the linked entity's location; otherwise 403. Choose the least-privilege option consistent with the rest of the app.
3. **Session revocation:** in `auth.ts`, after resolving `session.user`, load the user from the DB by id and: reject with 401 if not found or `is_active === false`; then refresh `role`, `default_location_id`, and the `locations` array (from `UserLocation`) on `event.context.user` from the DB record instead of trusting the cookie. Keep the existing public-route allowlist behavior. To limit per-request DB cost you MAY add a short in-memory TTL cache (e.g. 30s) keyed by user id — but correctness (deactivation/role change takes effect promptly) is the priority; document the TTL tradeoff in a comment.
4. **User PATCH guards:** in `users/[id]/index.patch.ts`, before applying changes, mirror the DELETE route's safeguards — block a user from demoting or deactivating THEMSELVES (compare target id to `event.context.user.id`), and block any change that would drop the count of active ADMINs below 1 (when the target is the last active admin and the change removes ADMIN role or sets `is_active:false`). Return clear codes, e.g. `CANNOT_DEACTIVATE_SELF` / `CANNOT_DEMOTE_LAST_ADMIN`.

## Verify before you stop (do all)
1. Re-read each change across all four files.
2. Run `pnpm typecheck` (ZERO errors), then `pnpm lint` and `pnpm format`.
3. Confirm: an operator cannot read another location's NCRs via `?locationId=`; a non-privileged user cannot read arbitrary approvals; a user set `is_active:false` is rejected on their NEXT request (test by toggling a test user and re-hitting a protected route); an admin cannot demote/deactivate the last admin or themselves.
4. Confirm legitimate operators still see their own locations' NCRs and normal auth still works.
5. Only stop when all tasks pass; otherwise report exactly what/why.
````

---

## Phase 7 — Workflow & price-lock integrity
_Severity: High/Medium · Files: `server/api/items/[itemId]/price.patch.ts`, `server/api/pos/[id].patch.ts`, `server/api/periods/[periodId]/open.post.ts`, `server/api/pos/index.post.ts` (+ schema), `server/api/locations/[id]/deliveries/index.post.ts`, `server/api/deliveries/[id].patch.ts`, `server/api/prfs/[id]/approve.patch.ts`, `server/api/prfs/[id]/reject.patch.ts`_

````
# Task: Fix workflow-integrity bugs — price-lock bypass, PO edit data loss, multi-open-period, duplicate PO, unpriced-item variance, and PRF self-approval

## Context
LIVE PRODUCTION Nuxt 4 app. Stack: Nitro/H3, Prisma + PostgreSQL (Supabase), Zod, TypeScript. Money = SAR (2 dp). Business rules: item prices lock when a period is opened (bulk price endpoints only allow edits while `Period.status === "DRAFT"`); only one period should be active at a time; a PRF maps to one PO; PRF/PO require Supervisor approval; deliveries auto-generate a price-variance NCR when the invoice price differs from the locked period price.

## Rules you must follow
- Backwards-compatible; don't change response shapes beyond the fix. One task (duplicate-PO) needs a SMALL additive schema change + migration — create a PROPER Prisma migration, never `db:push`; do not deploy to prod yourself.
- No destructive DB operations. Do NOT run `git commit`/`git push` — the user handles git.
- Prettier: double quotes, semicolons, 2-space indent, 100 cols, parenthesized arrow params, ES5 trailing commas. No `any`. Handle Prisma `Decimal` carefully. Minimal, pattern-matching edits.

## The bugs & required fixes
1. **Price-lock bypass (High)** — `items/[itemId]/price.patch.ts` (~125-134) only rejects `CLOSED`. The bulk price endpoints require `DRAFT` (`prices/index.post.ts` ~89). FIX: require the period be `DRAFT` to edit a single price; if `OPEN`/`PENDING_CLOSE`/`CLOSED` → 400 `PERIOD_PRICES_LOCKED`.
2. **PO edit wipes delivered_qty (High)** — `pos/[id].patch.ts` (~221-301) `deleteMany`+recreates PO lines, resetting `delivered_qty` to 0 and null-ing `DeliveryLine.po_line_id`, guarded only by `status !== "CLOSED"`. FIX: block line edits when any existing PO line has `delivered_qty > 0` (or the PO has any posted deliveries) → 400 `PO_HAS_DELIVERIES`. When line edits ARE allowed (nothing delivered yet), validate each new `quantity >= 0`. (Preferred if feasible: diff lines and preserve `delivered_qty`/links instead of delete-recreate.)
3. **Multiple active periods (Medium)** — `periods/[periodId]/open.post.ts` (~106-124) only blocks another `OPEN` period, ignoring `PENDING_CLOSE`. FIX: reject if any OTHER period is `OPEN` OR `PENDING_CLOSE` (`status: { in: ["OPEN", "PENDING_CLOSE"] }`), and wrap the status-check + status-flip in a single `$transaction` to reduce the check-then-act race.
4. **Two POs from one PRF (Medium)** — `pos/index.post.ts` (~238-248) checks existence outside the create; `PO.prf_id` is not unique. FIX: add `@unique` to `PO.prf_id` in `prisma/schema.prisma` (nullable-unique is fine in Postgres) via a new migration, and handle the resulting `P2002` as 409 `PRF_ALREADY_HAS_PO`. Keep the pre-check for a friendly message.
5. **Variance skipped for unpriced items + falsy-zero mask (Medium/Low)** — in `deliveries/index.post.ts` (and the `[id].patch.ts` post path), variance/NCR only run when a period price exists (`periodPrice !== undefined`, ~563-577/628), and `period_price: periodPrice || lineData.unit_price` (~588) masks a legitimate locked price of `0`. FIX: decide and implement a policy for missing period price when POSTING — recommended: reject with 400 `MISSING_PERIOD_PRICE` (require a locked price to post), OR create an NCR flagging "no locked price". Apply to both create and edit-post paths. Also replace `||` with `??` so a real `0` locked price is not overwritten.
6. **PRF self-approval + status (High/Medium)** — `prfs/[id]/approve.patch.ts` and `reject.patch.ts` only check role. FIX: block self-approval (`existingPRF.requested_by === user.id` → 403 `SELF_APPROVAL_FORBIDDEN`), and verify the current status permits the transition (approve/reject only from the `PENDING` state).

## Verify before you stop (do all)
1. Re-read each change; for the schema change confirm the migration is additive and applies cleanly on a dev DB.
2. Run `pnpm typecheck` (ZERO errors), then `pnpm lint`, `pnpm format`, and `prisma generate`.
3. Confirm: a single price cannot be edited once the period is OPEN; a PO with deliveries can't have its lines wiped; opening a period is blocked while another is OPEN or PENDING_CLOSE; a second PO can't be created for a PRF that already has one; posting an unpriced item follows the chosen policy and a `0` locked price is preserved; a requester cannot approve/reject their own PRF and transitions are only from PENDING.
4. Confirm normal happy-path flows keep their response shapes.
5. Leave a note that the new migration must be deployed to prod with `pnpm db:migrate:deploy`. Only stop when all tasks pass; otherwise report exactly what/why.
````

---

## Phase 8 — Document & NCR number generation (race-safe)
_Severity: Medium · Files: `server/api/locations/[id]/deliveries/index.post.ts`, `server/api/locations/[id]/issues/index.post.ts`, `server/api/transfers/index.post.ts`, `server/utils/priceVariance.ts`, `server/utils/documentNumbering.ts`, `server/api/prfs/index.post.ts`, `server/api/pos/index.post.ts` (audit all generators)_

````
# Task: Make document-number and NCR-number generation race-safe and overflow-safe

## Context
LIVE PRODUCTION Nuxt 4 app. Stack: Nitro/H3, Prisma + PostgreSQL (Supabase pooler, READ COMMITTED), TypeScript. Document numbers (delivery `DLV-…`, issue `ISS-YYYY-NNN`, transfer, `NCR-YYYY-NNN`, `PRF-…`, `PO-…`) are unique in the schema and today are generated by reading the current max with `findFirst({ orderBy: { <no>: "desc" } })` and incrementing — with no locking.

## Rules you must follow
- Numbers MUST keep their existing human-readable formats/prefixes.
- Any new counter table is an additive schema change → create a PROPER Prisma migration (never `db:push`); do not deploy to prod yourself.
- No destructive DB operations. Do NOT run `git commit`/`git push` — the user handles git.
- Prettier: double quotes, semicolons, 2-space indent, 100 cols, parenthesized arrow params, ES5 trailing commas. No `any`. Minimal, pattern-matching edits.

## The bugs
1. **Race → duplicate numbers.** Concurrent creates read the same max and compute the same next value; the loser hits the unique constraint (`P2002`) as a raw 500 — and for deliveries this rolls back the entire post (stock/WAC/PO all lost). Generators: `generateDeliveryNumber` (~73-103), `generateIssueNumber` (~53-84), `generateTransferNumber` (~54-85), inline NCR numbering in `deliveries/index.post.ts` (~629-642) and `generateNCRNumber` in `priceVariance.ts` (~169-200), plus PRF/PO generators.
2. **Lexicographic overflow.** `orderBy: <no> "desc"` is a STRING sort with 2-3 digit zero-pad, so `"…-100"` sorts below `"…-99"`; after ~99–999 docs the max is misread → numbers restart and collide permanently.

## Required fixes
Pick ONE consistent strategy and apply it to ALL generators:
- **(Recommended) Atomic counter table.** Add a small `DocumentCounter` model keyed by scope (e.g. `key` = the prefix such as `DLV-KITCHEN-27-Jan-2026` or `NCR-2026`) with a `value` int. Allocate the next number by an atomic upsert/increment INSIDE the same transaction as the record insert (`update … { value: { increment: 1 } }`, creating the row on first use), then format with the existing prefix/padding. This removes the read-max race entirely.
- **(Alternative) Retry on conflict.** Keep read-max-then-create but catch `P2002` and retry with the next number (bounded attempts). Simpler, but still contends under load — acceptable for lower-volume generators.

In BOTH strategies, also fix the overflow: compute the max/next NUMERICALLY (parse the numeric suffix) rather than by string sort, and pad to a width that won't be exceeded (or don't rely on padding for ordering). Ensure the NCR generator inside the delivery transaction uses the same race-safe mechanism so a variance NCR can no longer roll back a valid delivery.

## Verify before you stop (do all)
1. Re-read every generator; confirm all use the chosen strategy and produce the SAME format strings as before.
2. If you added a counter table, confirm the migration is additive and applies cleanly on a dev DB; run `prisma generate`.
3. Run `pnpm typecheck` (ZERO errors), then `pnpm lint` and `pnpm format`.
4. Concurrency check: if a dev DB is available, fire N concurrent creates (deliveries and NCRs) with `Promise.all` and assert there are no duplicate numbers and no 500s; simulate crossing the 99/999 boundary and confirm the next number is correct. Delete the script after.
5. Note that any new migration must be deployed to prod with `pnpm db:migrate:deploy`. Only stop when all pass; otherwise report exactly what/why.
````

---

## Phase 9 — Backend hardening & data consistency
_Severity: Medium/Low · Files: `server/utils/email.ts`, `server/utils/item-import-validator.ts`, `server/api/items/import.post.ts`, `server/api/transfers/[id]/approve.patch.ts` (+ schema), `server/api/reconciliations/*`, `server/utils/priceVariance.ts`, `server/api/auth/login.post.ts`, `server/api/users/check-availability.post.ts`, `server/api/health.get.ts`, `server/api/dev/reset-all-data.post.ts`, several 500 handlers_

````
# Task: Backend hardening and data-consistency cleanups

## Context
LIVE PRODUCTION Nuxt 4 app. Stack: Nitro/H3, Prisma + PostgreSQL (Supabase), Zod, Nodemailer (Office 365), TypeScript. Money = SAR (2 dp). These are independent lower-severity fixes; do each as a discrete change.

## Rules you must follow
- Backwards-compatible; keep response shapes stable. One task (transfer `period_id`) is an additive schema change → create a PROPER Prisma migration (never `db:push`); do not deploy to prod yourself.
- No destructive DB operations. Do NOT run `git commit`/`git push` — the user handles git.
- Prettier: double quotes, semicolons, 2-space indent, 100 cols, parenthesized arrow params, ES5 trailing commas. No `any`. Handle Prisma `Decimal` carefully. Minimal edits.

## The fixes (each independent)
1. **SMTP TLS (Medium)** — `server/utils/email.ts` (~88-91) sets `rejectUnauthorized: false` and `ciphers: "SSLv3"`. Remove both overrides so Nodemailer validates the O365 certificate with modern defaults (keep `secure:false`/STARTTLS on port 587). Confirm mail still sends in dev config.
2. **Item import case-duplicates (Medium)** — `item-import-validator.ts` (~19) only `.trim()`s `code` while manual create (`items/index.post.ts` ~26) uppercases, and `import.post.ts` (~135-176) does a case-sensitive existing-code lookup. FIX: uppercase `code` in the import schema (mirror manual create) AND make the existing-code lookup normalized/case-insensitive so `SUGAR`/`sugar` are treated as the same item.
3. **Transfer period attribution (Medium)** — transfers have no `period_id`; reconciliation/report attribution uses the UTC-truncated `transfer_date` range and disagrees across surfaces. FIX: add a nullable `period_id` to the `Transfer` model (additive migration), set it at approval to the current OPEN period (from Phase 3's period fetch — if Phase 3 isn't applied, fetch the OPEN period here), backfill existing transfers by matching `transfer_date` into period ranges in the migration, and switch the transfer attribution in `reconciliations/index.post.ts`, `reconciliations/consolidated.get.ts`, and `reports/reconciliation.get.ts` to use `period_id` where present (fall back to the date range for legacy rows without one).
4. **Signed NCR variance (Low)** — price-variance NCR `value` is stored as `abs(...)` (`priceVariance.ts` ~274; `deliveries/index.post.ts` ~654), losing the increase-vs-decrease direction; reconciliation then credits favorable variances. FIX: persist a signed variance (or a direction flag) on the NCR and have the credit/loss logic respect the sign; consider not auto-crediting favorable (price-decrease) variances. (If this needs a schema field, make it additive with a migration.)
5. **Login brute-force + timing (Low)** — `auth/login.post.ts` (~51-74) has no rate limiting and returns before `bcrypt.compare` when no user matches (timing oracle). FIX: add basic rate limiting/backoff per IP+username, and always run a bcrypt compare against a dummy hash when the user is not found to equalize timing.
6. **check-availability enumeration (Low)** — `users/check-availability.post.ts` (~22-36) requires only authentication. FIX: restrict to ADMIN (consistent with the rest of `/api/users`).
7. **Health endpoint leak (Low)** — `health.get.ts` (~12-41) returns the raw DB `error.message` unauthenticated. FIX: log server-side, return a generic failure message/status only.
8. **Dev-reset role gate (Low)** — `dev/reset-all-data.post.ts` is prod-blocked by `import.meta.dev`, but has no role check in dev and returns a hardcoded admin password. FIX: add an explicit `user.role === "ADMIN"` check as defense-in-depth (keep the `import.meta.dev` guard).
9. **500 error leakage (Low)** — several handlers return `error.message` in `data.details` (e.g. `deliveries/[id].patch.ts`, `transfers/index.post.ts`, `transfers/[id]/approve.patch.ts`, `ncrs/index.post.ts`). FIX: log details server-side; return a generic message without the raw error in the client payload (keep specific handled `createError`s intact).

## Verify before you stop (do all)
1. Re-read each change; for the schema change confirm the migration is additive, backfills correctly, and applies cleanly on a dev DB (`prisma generate` passes).
2. Run `pnpm typecheck` (ZERO errors), then `pnpm lint` and `pnpm format`.
3. Spot-confirm: email still sends with cert validation on; importing `sugar` when `SUGAR` exists does NOT create a duplicate; transfers attribute to the correct period; check-availability is admin-only; health returns no raw DB error; dev-reset requires admin.
4. Note that the new migration must be deployed to prod with `pnpm db:migrate:deploy`. Only stop when all tasks pass; otherwise report exactly what/why.
````

---

## Phase 10 — Frontend & config hardening
_Severity: Medium/Low · Files: `app/pages/deliveries/create.vue`, `app/pages/issues/create.vue`, `app/pages/transfers/create.vue`, `app/pages/deliveries/[id]/edit.vue`, `app/pages/transfers/[id].vue`, `app/pages/reconciliations/index.vue`, `app/pages/users/index.vue`, `app/stores/period.ts`, `app/composables/useCurrentPeriod.ts`, `nuxt.config.ts`, `vercel.json`_

````
# Task: Fix frontend correctness/UX bugs and tighten client/deploy config

## Context
LIVE PRODUCTION Nuxt 4 SPA (ssr:false) + Vue 3 + TypeScript + Nuxt UI + Tailwind CSS v4 + Pinia. Money = SAR (2 dp); dates display DD/MM/YYYY; timezone Asia/Riyadh (UTC+3); `dayjs` is already a dependency. The app is offline-aware via `useOfflineGuard`/`useOnlineStatus` (`guardAction`, `:disabled="!isOnline"`).

## Rules you must follow
- Backwards-compatible; keep behavior stable except for the fixes.
- All buttons must carry the `cursor-pointer` class (project convention).
- Do NOT indent `<script>`/`<style>` blocks in `.vue` files. Prettier: double quotes, semicolons, 2-space indent, 100 cols, parenthesized arrow params, ES5 trailing commas. No `any`. Match existing component patterns.
- Do NOT run `git commit`/`git push` — the user handles git. No schema/DB changes.

## The fixes (each independent)
1. **UTC off-by-one default date (Medium)** — `deliveries/create.vue` (~747), `issues/create.vue` (~335), `transfers/create.vue` (~34) default the transaction date with `new Date().toISOString().split("T")[0]` (UTC), which yields YESTERDAY between 00:00–02:59 Asia/Riyadh and can push a transaction into the previous period. FIX: use local date, e.g. `dayjs().format("YYYY-MM-DD")`.
2. **Transfer zero-stock not flagged (Low)** — `transfers/create.vue` (~86): when a selected item has no source stock record, the else-branch sets `has_insufficient_stock = false`, so the form validates a transfer of an item with 0 available. FIX: mirror the Issues page — set `line.has_insufficient_stock = quantity > 0;` in that branch.
3. **Delivery edit stale over-delivery state (Low)** — `deliveries/[id]/edit.vue` (~654, used in `isFormValid` ~585): `hasUnapprovedOverDelivery` is read once on load and never recomputed on quantity change, so the Post button stays enabled past the PO. FIX: recompute over-delivery per line on quantity change (as the create page does) and gate `isFormValid` on the live value.
4. **Silent period-price load failure (Low)** — `deliveries/create.vue` (~984-986) and `deliveries/[id]/edit.vue` (~731-733): `fetchPeriodPrices()` swallows errors with only `console.error`, so the price-variance warning silently disappears while the server still creates NCRs. FIX: surface a non-blocking warning toast/banner when period-price loading fails.
5. **Mutations missing the offline guard (Low)** — `transfers/[id].vue` (`handleApprove`/`handleReject`), `reconciliations/index.vue` (`saveAdjustments`), `users/index.vue` (`deleteUser`/`confirmToggleStatus`) don't use the offline guard or disable while offline. FIX: route these through `useOfflineGuard().guardAction` and add `:disabled="!isOnline"` (plus `cursor-pointer`) to their trigger buttons, matching the rest of the app.
6. **Stale/divergent period cache (Low)** — `app/stores/period.ts` caches the current period for 10 min while `app/composables/useCurrentPeriod.ts` uses a separate 10s cache, so components can disagree and a closed period can look OPEN for minutes. FIX: unify on one source of truth (or invalidate the store cache when the period changes / on close actions); at minimum shorten the store TTL and invalidate it after period-close/open actions.
7. **Unused Supabase key in client bundle (Low, verify)** — `nuxt.config.ts` (~28-33) ships `supabaseUrl`/`supabaseAnonKey` in `runtimeConfig.public` though the app never instantiates a Supabase client (all DB access is server-side Prisma). FIX: remove both from public runtime config (confirm no `createClient`/`.from(` usage first). Separately flag to the user that Supabase Row-Level Security should be confirmed on the project.
8. **Missing CSP/HSTS headers (Low)** — `vercel.json` (~7-33) sets some headers but no `Content-Security-Policy` or `Strict-Transport-Security`. FIX: add a reasonable CSP for this self-hosted SPA and an HSTS header. Test the CSP doesn't break the app (Nuxt UI, inline styles) before finalizing.

## Verify before you stop (do all)
1. Re-read each change.
2. Run `pnpm typecheck` (ZERO errors), then `pnpm lint` and `pnpm format`.
3. Run the app at http://localhost:3000 (the only dev server) and, using the Playwright MCP, confirm: default dates match local Riyadh date; a zero-stock transfer line is flagged; editing a delivery draft above PO qty disables Post; a simulated period-price fetch failure shows a warning; the offline-guarded buttons disable when offline; and (if you added CSP) no console CSP violations break core pages.
4. Confirm removed Supabase config doesn't break startup.
5. Only stop when all tasks pass and the app runs clean; otherwise report exactly what/why.
````

---

_End of prompts. Findings map to `BUG_HUNT_REPORT.md`: Phase 1 = C1; Phase 2 = C2, H8; Phase 3 = C3, C4, H1, H9(transfer); Phase 4 = L1; Phase 5 = C5, H2, H3; Phase 6 = H5, M6, H7, M1; Phase 7 = H4, H6, M2, M5, M4, L3, H9(PRF); Phase 8 = M3; Phase 9 = M9, M7, M10, M11, L2, L4, L5, L6, L7, L9; Phase 10 = M8, L12, L13, L14, L15, L11, L8, L10._
