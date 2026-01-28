<script setup lang="ts">
import type { Ref } from "vue";

const expandedSections = ref<string[]>([]);

const toggleSection = (section: string) => {
  if (expandedSections.value.includes(section)) {
    expandedSections.value = [];
  } else {
    expandedSections.value = [section];
  }
};

const isExpanded = (section: string) => expandedSections.value.includes(section);

const targetSubSection = inject<Ref<string | null>>("devTargetSection", ref(null));

watch(
  targetSubSection,
  (newSection) => {
    if (newSection) {
      if (!expandedSections.value.includes(newSection)) {
        expandedSections.value.push(newSection);
      }
      nextTick(() => {
        const element = document.getElementById(`dev-section-${newSection}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (targetSubSection.value) {
          targetSubSection.value = null;
        }
      });
    }
  },
  { immediate: true }
);

// Code examples
const codeExamples = {
  prfModel: `// PRF Model - Prisma Schema
// File: prisma/schema.prisma

model PRF {
  id                      String       @id @default(uuid()) @db.Uuid
  prf_no                  String       @unique @db.VarChar(50)
  period_id               String       @db.Uuid
  location_id             String       @db.Uuid
  project_name            String?      @db.VarChar(200)
  prf_type                PRFType      @default(NORMAL)
  category                PRFCategory  @default(FOOD)
  expected_delivery_date  DateTime?    @db.Date
  status                  PRFStatus    @default(DRAFT)
  requested_by            String       @db.Uuid
  approved_by             String?      @db.Uuid
  request_date            DateTime     @db.Date
  approval_date           DateTime?    @db.Date
  rejection_reason        String?
  total_value             Decimal      @default(0) @db.Decimal(15, 2)
  contact_person_name     String?      @db.VarChar(100)
  contact_person_phone    String?      @db.VarChar(50)
  receiver_name           String?      @db.VarChar(100)
  receiver_phone          String?      @db.VarChar(50)
  notes                   String?
  created_at              DateTime     @default(now()) @db.Timestamptz(6)
  updated_at              DateTime     @updatedAt @db.Timestamptz(6)
  lines                   PRFLine[]
  purchase_orders         PO[]

  @@index([status])
  @@index([prf_type])
  @@index([category])
  @@map("prfs")
}

// PRF Enums
enum PRFType {
  URGENT   // High priority, expedited processing
  DPA      // Direct Purchase Approval
  NORMAL   // Standard processing
}

enum PRFCategory {
  FOOD
  CLEANING
  OTHER
}

enum PRFStatus {
  DRAFT
  PENDING
  APPROVED
  REJECTED
  CLOSED    // Auto-set when linked PO is closed
}`,

  prfLineModel: `// PRFLine Model - Individual Items in PRF
// File: prisma/schema.prisma

model PRFLine {
  id               String   @id @default(uuid()) @db.Uuid
  prf_id           String   @db.Uuid
  item_id          String?  @db.Uuid          // Optional - can be custom item
  item_description String   @db.VarChar(500)   // Custom description
  cost_code        String?  @db.VarChar(50)    // Cost Code / SPR
  stock_qty        Decimal? @db.Decimal(15, 4) // Current stock qty (reference)
  unit             Unit
  required_qty     Decimal  @db.Decimal(15, 4)
  estimated_price  Decimal  @db.Decimal(15, 4)
  line_value       Decimal  @db.Decimal(15, 2) // required_qty × estimated_price
  notes            String?
  prf              PRF      @relation(fields: [prf_id], references: [id], onDelete: Cascade)
  item             Item?    @relation(fields: [item_id], references: [id])

  @@index([prf_id])
  @@index([item_id])
  @@map("prf_lines")
}

// Key Fields:
// - item_id: Optional - can link to existing Item or use custom description
// - line_value: Calculated as required_qty × estimated_price
// - VAT is calculated client-side for display only (not stored)`,

  poModel: `// PO Model - Purchase Orders
// File: prisma/schema.prisma

model PO {
  id                    String     @id @default(uuid()) @db.Uuid
  po_no                 String     @unique @db.VarChar(50)
  prf_id                String?    @db.Uuid
  supplier_id           String     @db.Uuid
  quotation_ref         String?    @db.VarChar(100)
  ship_to_location_id   String?    @db.Uuid
  ship_to_contact       String?    @db.VarChar(100)
  ship_to_phone         String?    @db.VarChar(50)
  status                POStatus   @default(OPEN)
  total_before_discount Decimal    @default(0) @db.Decimal(15, 2)
  total_discount        Decimal    @default(0) @db.Decimal(15, 2)
  total_after_discount  Decimal    @default(0) @db.Decimal(15, 2)
  total_vat             Decimal    @default(0) @db.Decimal(15, 2)
  total_amount          Decimal    @default(0) @db.Decimal(15, 2)
  payment_terms         String?    @db.VarChar(200)
  delivery_terms        String?    @db.VarChar(200)
  duration_days         Int?
  terms_conditions      String?
  notes                 String?
  created_by            String     @db.Uuid
  created_at            DateTime   @default(now()) @db.Timestamptz(6)
  updated_at            DateTime   @updatedAt @db.Timestamptz(6)
  lines                 POLine[]
  deliveries            Delivery[]
  prf                   PRF?       @relation(fields: [prf_id], references: [id])
  supplier              Supplier   @relation(fields: [supplier_id], references: [id])

  @@index([prf_id])
  @@index([supplier_id])
  @@index([status])
  @@map("purchase_orders")
}

enum POStatus {
  OPEN    // Active, can receive deliveries
  CLOSED  // Completed or manually closed
}`,

  poLineModel: `// POLine Model - Individual Items in PO with Delivery Tracking
// File: prisma/schema.prisma

model POLine {
  id                 String         @id @default(uuid()) @db.Uuid
  po_id              String         @db.Uuid
  item_id            String?        @db.Uuid
  item_code          String?        @db.VarChar(50)
  item_description   String         @db.VarChar(500)
  quantity           Decimal        @db.Decimal(15, 4)
  delivered_qty      Decimal        @default(0) @db.Decimal(15, 4)  // Cumulative
  unit               Unit
  unit_price         Decimal        @db.Decimal(15, 4)
  discount_percent   Decimal        @default(0) @db.Decimal(5, 2)
  total_before_vat   Decimal        @db.Decimal(15, 2)
  vat_percent        Decimal        @default(15) @db.Decimal(5, 2)  // Saudi VAT
  vat_amount         Decimal        @db.Decimal(15, 2)
  total_after_vat    Decimal        @db.Decimal(15, 2)
  notes              String?
  po                 PO             @relation(fields: [po_id], references: [id], onDelete: Cascade)
  item               Item?          @relation(fields: [item_id], references: [id])
  delivery_lines     DeliveryLine[]

  @@index([po_id])
  @@index([item_id])
  @@map("po_lines")
}

// Key Fields:
// - delivered_qty: Cumulative delivered quantity (updated on each delivery)
// - remaining_qty: Computed as (quantity - delivered_qty) by API
// - VAT calculated at 15% for Saudi Arabia`,

  workflowDiagram: `// PRF → PO → Delivery Workflow
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                        PRF/PO WORKFLOW OVERVIEW                              │
// └─────────────────────────────────────────────────────────────────────────────┘
//
//   ┌─────────────────┐                    ┌─────────────────┐
//   │   1. CREATE     │                    │   2. APPROVE    │
//   │     PRF         │───────────────────►│     PRF         │
//   │  (Operator)     │    Submit for      │  (Supervisor)   │
//   └─────────────────┘    Approval        └─────────────────┘
//          │                                      │
//          │ DRAFT                                │ APPROVED
//          ▼                                      ▼
//   • Select location                       • Email sent to
//   • Add line items                          PROCUREMENT_SPECIALIST
//   • Set category/type                     • PRF becomes read-only
//   • Save as draft
//                                                 │
//                    ┌────────────────────────────┘
//                    │
//                    ▼
//   ┌─────────────────┐                    ┌─────────────────┐
//   │   3. CREATE     │                    │   4. RECEIVE    │
//   │     PO          │───────────────────►│    DELIVERY     │
//   │ (Procurement)   │    Select PO       │   (Operator)    │
//   └─────────────────┘                    └─────────────────┘
//          │                                      │
//          │ OPEN                                 │ PO line
//          ▼                                      ▼ delivered_qty
//   • Select supplier                       • Auto-populate from PO
//   • Set prices/VAT                        • Track remaining qty
//   • Editable by creator                   • Over-delivery approval
//                                           • Auto-close PO when
//                                             all items delivered`,

  prfStatusWorkflow: `// PRF Status Workflow
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                         PRF STATUS WORKFLOW                                  │
// └─────────────────────────────────────────────────────────────────────────────┘
//
//                              ┌─────────────┐
//                              │    DRAFT    │
//                              │   (Gray)    │
//                              └──────┬──────┘
//                                     │ Submit
//                                     │ (Requester only)
//                                     ▼
//                        ┌────────────────────────┐
//                        │       PENDING          │
//                        │   (Amber/Warning)      │
//                        └────────────┬───────────┘
//                                     │
//                    ┌────────────────┴────────────────┐
//                    │ Approve                         │ Reject
//                    │ (Supervisor/Admin)              │ (Supervisor/Admin)
//                    ▼                                 ▼
//            ┌───────────────┐               ┌───────────────┐
//            │   APPROVED    │               │   REJECTED    │
//            │   (Green)     │               │    (Red)      │
//            └───────┬───────┘               │ Requires      │
//                    │                       │ mandatory     │
//                    │ PO Closed             │ reason        │
//                    │ (auto/manual)         └───────────────┘
//                    ▼                              │
//            ┌───────────────┐                     │ Clone
//            │    CLOSED     │◄────────────────────┘ (Creates
//            │    (Blue)     │                        new DRAFT)
//            └───────────────┘
//
// Notes:
// - REJECTED PRFs cannot be resubmitted
// - Use Clone to create new DRAFT from rejected PRF
// - PRF auto-closes when linked PO closes`,

  prfApiEndpoints: `// PRF API Endpoints
// Base Path: /api/prfs

// List PRFs
// GET /api/prfs?status=PENDING&location_id=uuid
// Returns: { data: PRF[], pagination: {...} }

// Create PRF (DRAFT)
// POST /api/prfs
// Body: { location_id, period_id, lines: [...], category?, prf_type? }
// Roles: OPERATOR, SUPERVISOR, ADMIN

// Get PRF Details
// GET /api/prfs/:id
// Returns: PRF with lines, requester, approver, location, period, purchase_orders

// Update Draft PRF
// PATCH /api/prfs/:id
// Body: { lines?, notes?, contact_person_name?, ... }
// Roles: Requester only, PRF must be DRAFT

// Delete Draft PRF
// DELETE /api/prfs/:id
// Roles: Requester only, PRF must be DRAFT

// Submit for Approval
// PATCH /api/prfs/:id/submit
// Changes: DRAFT → PENDING
// Triggers: Email to SUPERVISOR/ADMIN users

// Approve PRF
// PATCH /api/prfs/:id/approve
// Changes: PENDING → APPROVED
// Triggers: Email to PROCUREMENT_SPECIALIST users
// Roles: SUPERVISOR, ADMIN

// Reject PRF
// PATCH /api/prfs/:id/reject
// Body: { rejection_reason: string } // Required!
// Changes: PENDING → REJECTED
// Triggers: Email to PRF requester
// Roles: SUPERVISOR, ADMIN

// Clone Rejected PRF
// POST /api/prfs/:id/clone
// Creates: New DRAFT PRF with copied content
// Roles: Original requester only`,

  prfRolePermissions: `// PRF Role Permissions Matrix
//
// ┌────────────────────────────────────────────────────────────────────────────┐
// │                          PRF ROLE PERMISSIONS                               │
// └────────────────────────────────────────────────────────────────────────────┘
//
// ┌──────────────────────────┬─────────┬────────────┬───────┬─────────────────┐
// │        ACTION            │ OPERATOR│ SUPERVISOR │ ADMIN │ PROCUREMENT_SPEC│
// ├──────────────────────────┼─────────┼────────────┼───────┼─────────────────┤
// │ Create PRF               │    ✓    │     ✓      │   ✓   │        ✗        │
// │ Edit own DRAFT PRF       │    ✓    │     ✓      │   ✓   │        ✗        │
// │ Delete own DRAFT PRF     │    ✓    │     ✓      │   ✓   │        ✗        │
// │ Submit PRF               │    ✓    │     ✓      │   ✓   │        ✗        │
// │ View all PRFs            │    ✓    │     ✓      │   ✓   │   ✓ (APPROVED)  │
// │ Approve PRF              │    ✗    │     ✓      │   ✓   │        ✗        │
// │ Reject PRF               │    ✗    │     ✓      │   ✓   │        ✗        │
// │ Clone rejected PRF       │ owner   │   owner    │ owner │        ✗        │
// └──────────────────────────┴─────────┴────────────┴───────┴─────────────────┘
//
// Notes:
// - PROCUREMENT_SPECIALIST can only VIEW APPROVED PRFs (for PO creation)
// - Clone is available to the original PRF requester only
// - Operators can only create PRFs for their assigned locations`,

  poStatusWorkflow: `// PO Status Workflow
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                          PO STATUS WORKFLOW                                  │
// └─────────────────────────────────────────────────────────────────────────────┘
//
//                              ┌─────────────┐
//                              │    OPEN     │
//                              │  (Active)   │
//                              └──────┬──────┘
//                                     │
//            ┌────────────────────────┼────────────────────────┐
//            │                        │                        │
//            │ Manual Close           │ Partial Delivery       │ Full Delivery
//            │ (Admin/Supervisor)     │ (Updates delivered_qty)│ (Auto-close)
//            ▼                        ▼                        ▼
//  ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
//  │ CLOSED (manual)   │    │   OPEN (partial)  │    │ CLOSED (auto)     │
//  │                   │    │ delivered_qty < qty│    │ delivered_qty ≥   │
//  │ • Closure reason  │    │ • remaining_qty    │    │    quantity       │
//  │   required if     │    │   shows progress   │    │ • PRF auto-closed │
//  │   unfulfilled     │    │ • Can receive more │    │ • No reason needed│
//  └───────────────────┘    └───────────────────┘    └───────────────────┘
//
// Delivery Tracking:
// ─────────────────────
// • PO line tracks: quantity (ordered), delivered_qty (received), remaining_qty
// • remaining_qty = quantity - delivered_qty (computed by API)
// • Delivery form pre-fills with remaining_qty, not full quantity
// • Over-delivery (qty > remaining) requires Supervisor/Admin approval`,

  poVatCalculation: `// PO VAT Calculations (15% Saudi Arabia)
// File: server/api/pos/index.post.ts

// Line-level calculations:
const calculatePOLineTotals = (line: POLineInput) => {
  // Amount before discount
  const grossAmount = line.quantity * line.unit_price;

  // Apply discount
  const discountAmount = grossAmount * (line.discount_percent / 100);
  const totalBeforeVat = grossAmount - discountAmount;

  // Calculate VAT (15%)
  const vatAmount = totalBeforeVat * (line.vat_percent / 100);
  const totalAfterVat = totalBeforeVat + vatAmount;

  return {
    total_before_vat: totalBeforeVat,
    vat_amount: vatAmount,
    total_after_vat: totalAfterVat,
  };
};

// PO-level totals:
const calculatePOTotals = (lines: POLine[]) => {
  const total_before_discount = lines.reduce(
    (sum, l) => sum + l.quantity * l.unit_price, 0
  );
  const total_discount = lines.reduce(
    (sum, l) => sum + (l.quantity * l.unit_price * l.discount_percent / 100), 0
  );
  const total_after_discount = total_before_discount - total_discount;
  const total_vat = lines.reduce((sum, l) => sum + l.vat_amount, 0);
  const total_amount = total_after_discount + total_vat;

  return { total_before_discount, total_discount, total_after_discount,
           total_vat, total_amount };
};`,

  poApiEndpoints: `// PO API Endpoints
// Base Path: /api/pos

// List POs
// GET /api/pos?status=OPEN&supplier_id=uuid
// Returns: { data: PO[], pagination: {...} }

// Create PO from Approved PRF
// POST /api/pos
// Body: { prf_id, supplier_id, lines: [...], quotation_ref?, ... }
// Roles: PROCUREMENT_SPECIALIST only

// Get PO Details (with delivery tracking)
// GET /api/pos/:id
// Returns: PO with lines (including delivered_qty, remaining_qty),
//          supplier, prf, deliveries

// Update Open PO
// PATCH /api/pos/:id
// Body: { lines?, quotation_ref?, notes?, ... }
// Roles: PROCUREMENT_SPECIALIST only (ADMIN/SUPERVISOR cannot edit)

// Close PO
// PATCH /api/pos/:id/close
// Body: { closure_reason?: string } // Required if unfulfilled items
// Returns: { fulfillment_summary, prf_closed, email_sent }
// Roles: ADMIN, SUPERVISOR (not PROCUREMENT_SPECIALIST)

// Get Open POs for Dropdown
// GET /api/pos/open
// Returns: Open POs with lines (delivered_qty, remaining_qty)
// Used by: Delivery creation page`,

  overDeliveryWorkflow: `// Over-Delivery Approval Workflow
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                     OVER-DELIVERY APPROVAL WORKFLOW                          │
// └─────────────────────────────────────────────────────────────────────────────┘
//
//   Over-delivery detected when: delivery_qty > remaining_qty on PO line
//
//                    ┌───────────────────────────────┐
//                    │  Operator creates delivery    │
//                    │  with quantity > remaining    │
//                    └───────────────┬───────────────┘
//                                    │
//                                    ▼
//                    ┌───────────────────────────────┐
//                    │   DRAFT (Pending Approval)    │
//                    │   • pending_approval = true   │
//                    │   • Post button disabled      │
//                    │   • Email sent to Supervisors │
//                    └───────────────┬───────────────┘
//                                    │
//           ┌────────────────────────┴────────────────────────┐
//           │ Approve                                          │ Reject
//           │ (Supervisor/Admin)                               │ (Supervisor/Admin)
//           ▼                                                  ▼
//  ┌────────────────────┐                          ┌────────────────────┐
//  │ DRAFT (Approved)   │                          │ REJECTED (Locked)  │
//  │ • over_delivery_   │                          │ • over_delivery_   │
//  │   approved = true  │                          │   rejected = true  │
//  │ • Can now post     │                          │ • ALL actions      │
//  │ • Email to creator │                          │   DISABLED         │
//  └────────────────────┘                          │ • Must create new  │
//           │                                      │   delivery         │
//           │ Post                                 └────────────────────┘
//           ▼
//  ┌────────────────────┐
//  │      POSTED        │
//  │ • Stock updated    │
//  │ • PO tracking      │
//  │   updated          │
//  └────────────────────┘
//
// Notes:
// - Supervisor/Admin creating delivery = implicit approval (no workflow)
// - Rejected deliveries are PERMANENTLY LOCKED
// - Rejection reason stored in delivery notes with error styling`,

  deliveryPoIntegration: `// Delivery-PO Integration
//
// 1. PO Selection is MANDATORY (not optional)
// ────────────────────────────────────────────
// • Delivery form requires selecting an existing PO
// • Dropdown shows only OPEN POs
// • Supplier is auto-populated from selected PO
//
// 2. Pre-fill with Remaining Quantities
// ─────────────────────────────────────
// • Delivery lines pre-fill with remaining_qty (not full quantity)
// • Shows "Delivered" and "Remaining" columns for reference
// • User can adjust quantities (including over-delivery)
//
// 3. PO Line Tracking Updates
// ───────────────────────────
// When delivery is POSTED:
// • Each delivery line increments POLine.delivered_qty
// • remaining_qty = quantity - delivered_qty (computed)
// • Over-delivery allowed but requires approval
//
// 4. Auto-Close Cascade
// ─────────────────────
// When all PO lines are fulfilled (delivered_qty >= quantity):
// • PO automatically closes → status = CLOSED
// • Linked PRF automatically closes → status = CLOSED
// • API returns po_auto_closed: true flag
// • Success message indicates auto-close occurred
//
// Code Example:
await prisma.$transaction(async (tx) => {
  // Update PO line tracking
  for (const line of delivery.lines) {
    await tx.pOLine.update({
      where: { id: line.po_line_id },
      data: { delivered_qty: { increment: line.quantity } },
    });
  }

  // Check for auto-close
  const allFulfilled = poLines.every(l => l.delivered_qty >= l.quantity);
  if (allFulfilled) {
    await tx.pO.update({ where: { id: po.id }, data: { status: "CLOSED" } });
    if (po.prf_id) {
      await tx.pRF.update({ where: { id: po.prf_id }, data: { status: "CLOSED" } });
    }
  }
});`,

  procurementSpecialistRole: `// PROCUREMENT_SPECIALIST Role
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                    PROCUREMENT_SPECIALIST PERMISSIONS                        │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// Navigation Access:
// ──────────────────
// ✓ Orders page (PRFs and POs)
// ✗ Dashboard
// ✗ Deliveries
// ✗ Master Data
// ✗ Issues
// ✗ Transfers
// ✗ Reconciliations
// ✗ Period Management
//
// PRF Permissions:
// ────────────────
// ✓ View APPROVED PRFs only
// ✗ Create PRFs
// ✗ Edit PRFs
// ✗ Approve/Reject PRFs
// ✗ Clone PRFs
//
// PO Permissions:
// ───────────────
// ✓ Create PO from approved PRF
// ✓ Edit own OPEN POs
// ✓ View all POs
// ✗ Close POs (Admin/Supervisor only)
// ✗ Create deliveries
//
// API Enforcement:
// ────────────────
// • Middleware checks role before allowing access
// • PRF list filtered to APPROVED only for this role
// • PO PATCH/close endpoints reject this role
// • Navigation component hides restricted menu items`,

  emailNotifications: `// Email Notifications
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                         EMAIL NOTIFICATION TRIGGERS                          │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// ┌────────────────────────┬─────────────────────────────┬─────────────────────┐
// │        EVENT           │          RECIPIENTS         │      CONTENT        │
// ├────────────────────────┼─────────────────────────────┼─────────────────────┤
// │ PRF Submitted          │ All SUPERVISOR/ADMIN users  │ PRF details,        │
// │                        │                             │ requester, items    │
// ├────────────────────────┼─────────────────────────────┼─────────────────────┤
// │ PRF Approved           │ All PROCUREMENT_SPECIALIST  │ PRF details,        │
// │                        │ users                       │ ready for PO        │
// ├────────────────────────┼─────────────────────────────┼─────────────────────┤
// │ PRF Rejected           │ PRF requester               │ Rejection reason,   │
// │                        │                             │ clone instructions  │
// ├────────────────────────┼─────────────────────────────┼─────────────────────┤
// │ Over-delivery Detected │ All SUPERVISOR/ADMIN users  │ Delivery details,   │
// │ (Operator save draft)  │                             │ over-delivery items │
// ├────────────────────────┼─────────────────────────────┼─────────────────────┤
// │ Over-delivery Approved │ Delivery creator            │ Approval confirmed, │
// │                        │                             │ can now post        │
// ├────────────────────────┼─────────────────────────────┼─────────────────────┤
// │ Over-delivery Rejected │ Delivery creator            │ Rejection reason,   │
// │                        │                             │ must create new     │
// ├────────────────────────┼─────────────────────────────┼─────────────────────┤
// │ PO Closed              │ Original PRF requester      │ PO details,         │
// │                        │                             │ fulfillment status  │
// └────────────────────────┴─────────────────────────────┴─────────────────────┘
//
// Implementation Notes:
// ─────────────────────
// • Emails sent asynchronously (non-blocking)
// • Email failures logged but don't block transactions
// • API returns email_sent: boolean in response`,

  emailService: `// Email Service Pattern
// File: server/utils/email.ts

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email asynchronously without blocking the main transaction
 */
export async function sendEmailAsync(options: EmailOptions): Promise<void> {
  try {
    // Email sending is non-blocking
    // Uses environment-configured SMTP service
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log(\`Email sent to \${options.to}\`);
  } catch (error) {
    // Log error but don't throw - email failure shouldn't block business logic
    console.error("Email send failed:", error);
  }
}

/**
 * Get all users with specified role
 */
export async function getUsersByRole(role: UserRole): Promise<User[]> {
  return prisma.user.findMany({
    where: { role, is_active: true },
    select: { id: true, email: true, full_name: true },
  });
}

// Usage Example:
const specialists = await getUsersByRole("PROCUREMENT_SPECIALIST");
if (specialists.length > 0) {
  await sendEmailAsync({
    to: specialists.map((u) => u.email),
    subject: \`PRF \${prf.prf_no} Approved - Ready for PO\`,
    html: buildPRFApprovedEmailHtml(prf),
  });
}`,

  documentNumbering: `// Document Numbering Format
//
// Format: {Prefix}-{LocationName}-{DD}-{Mon}-{YYYY}-{NN}
//
// Examples:
// ─────────
// PRF-KITCHEN-27-Jan-2026-01     (First PRF for Kitchen on Jan 27)
// PRF-KITCHEN-27-Jan-2026-02     (Second PRF for Kitchen same day)
// PO-KITCHEN-27-Jan-2026-01      (PO created from Kitchen PRF)
// DLV-STORE-27-Jan-2026-03       (Third delivery for Store on Jan 27)
//
// Rules:
// ──────
// • LocationName converted to UPPERCASE
// • Spaces in location names replaced with hyphens
// • Sequential numbers (01-99) restart daily per location
// • PO uses PRF's location (inherits context)
// • Existing documents keep old format (no migration)
//
// Generation Function:
async function generateDocumentNumber(
  prefix: "PRF" | "PO" | "DLV",
  locationName: string,
  tx: PrismaTransaction
): Promise<string> {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = today.toLocaleString("en", { month: "short" });
  const year = today.getFullYear();
  const location = locationName.toUpperCase().replace(/\\s+/g, "-");

  const prefix_pattern = \`\${prefix}-\${location}-\${day}-\${month}-\${year}-\`;

  // Find last number for this location+date
  const lastDoc = await tx.findFirst({
    where: { document_no: { startsWith: prefix_pattern } },
    orderBy: { document_no: "desc" },
  });

  const nextNum = lastDoc
    ? parseInt(lastDoc.document_no.slice(-2)) + 1
    : 1;

  return \`\${prefix_pattern}\${String(nextNum).padStart(2, "0")}\`;
}`,

  businessRules: `// PRF/PO Business Rules Summary
//
// 1. PRF Rules
// ────────────
// • PRF-to-PO is 1:1 relationship (each PRF → one PO)
// • Only DRAFT PRFs can be edited/deleted
// • Only requester can edit/delete their DRAFT PRFs
// • PENDING PRFs require Supervisor/Admin approval
// • Rejection reason is MANDATORY when rejecting
// • REJECTED PRFs cannot be resubmitted (use Clone)
// • PRF auto-closes when linked PO closes
//
// 2. PO Rules
// ───────────
// • PO must be created from APPROVED PRF
// • Only PROCUREMENT_SPECIALIST can create POs
// • Only PROCUREMENT_SPECIALIST can edit OPEN POs
// • Only ADMIN/SUPERVISOR can close POs
// • Closure reason required if unfulfilled items exist
// • PO auto-closes when all items fully delivered
//
// 3. Delivery-PO Rules
// ────────────────────
// • PO selection is MANDATORY for deliveries
// • Delivery pre-fills with remaining quantities
// • Over-delivery requires Supervisor/Admin approval
// • Rejected over-delivery locks delivery permanently
// • Posting updates PO line delivered_qty
//
// 4. Error Codes
// ──────────────
// PRF_NOT_DRAFT          - Cannot edit non-DRAFT PRF
// PRF_NOT_PENDING        - Cannot approve/reject non-PENDING PRF
// PRF_HAS_PO             - Cannot delete PRF with linked PO
// REJECTION_REASON_REQUIRED - Must provide reason when rejecting
// NOT_PRF_REQUESTER      - Only requester can perform action
// PRF_ALREADY_HAS_PO     - 1:1 constraint violation
// PO_NOT_OPEN            - Cannot modify CLOSED PO
// CLOSURE_REASON_REQUIRED - Required for unfulfilled closure
// OVER_DELIVERY_PENDING  - Awaiting approval
// OVER_DELIVERY_REJECTED - Delivery permanently locked`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">PRF/PO Workflow</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Purchase Requisition Forms, Purchase Orders, approval workflows, and delivery integration
      </p>
    </div>

    <!-- Overview & Data Model Section -->
    <section
      id="dev-section-prf-po-overview"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('prf-po-overview')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-check" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Overview & Data Model</span>
        </span>
        <UIcon
          :name="
            isExpanded('prf-po-overview') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('prf-po-overview')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The PRF/PO workflow enables structured procurement with approval gates. A Purchase
          Requisition Form (PRF) is created by operators, approved by supervisors, then converted to
          a Purchase Order (PO) by procurement specialists. Deliveries are linked to POs for
          complete traceability.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Workflow Diagram</h4>
          <DeveloperCodeBlock :code="codeExamples.workflowDiagram" language="plaintext" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">PRF Model</h4>
          <DeveloperCodeBlock
            :code="codeExamples.prfModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">PRFLine Model</h4>
          <DeveloperCodeBlock
            :code="codeExamples.prfLineModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">PO Model</h4>
          <DeveloperCodeBlock
            :code="codeExamples.poModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            POLine Model (with Delivery Tracking)
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.poLineModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Document Numbering</h4>
          <DeveloperCodeBlock
            :code="codeExamples.documentNumbering"
            language="typescript"
            filename="server/utils/documentNumber.ts"
          />
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>1:1 Relationship:</strong>
              Each PRF can only have one PO created from it. The PO inherits the PRF's location
              context for document numbering.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- PRF Status Workflow Section -->
    <section
      id="dev-section-prf-status-workflow"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('prf-status-workflow')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrows-pointing-out" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">PRF Status Workflow</span>
        </span>
        <UIcon
          :name="
            isExpanded('prf-status-workflow')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('prf-status-workflow')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          PRFs follow an approval workflow before they can be converted to Purchase Orders. The
          status determines what actions are available and who can perform them.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Status Workflow Diagram
          </h4>
          <DeveloperCodeBlock :code="codeExamples.prfStatusWorkflow" language="plaintext" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Status Badge Colors</h4>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="neutral" variant="soft">DRAFT</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Initial state. Can be edited or deleted by requester.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="warning" variant="soft">PENDING</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Submitted, awaiting Supervisor/Admin approval.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="success" variant="soft">APPROVED</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Ready for PO creation by procurement specialist.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="error" variant="soft">REJECTED</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Rejected with mandatory reason. Use Clone to create new draft.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="info" variant="soft">CLOSED</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Auto-closed when linked PO is closed.
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Rejection Handling:</strong>
              REJECTED PRFs cannot be resubmitted. The requester must use the "Clone" action to
              create a new DRAFT PRF with copied content, then modify and resubmit.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- PRF API Endpoints Section -->
    <section
      id="dev-section-prf-api-endpoints"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('prf-api-endpoints')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-code-bracket" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">PRF API Endpoints</span>
        </span>
        <UIcon
          :name="
            isExpanded('prf-api-endpoints') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('prf-api-endpoints')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          PRF API endpoints handle creation, approval workflow, and cloning operations.
        </p>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Endpoint Overview</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-[var(--ui-border)]">
                  <th class="px-2 py-2 text-left text-[var(--ui-text-muted)]">Method</th>
                  <th class="px-2 py-2 text-left text-[var(--ui-text-muted)]">Endpoint</th>
                  <th class="px-2 py-2 text-left text-[var(--ui-text-muted)]">Description</th>
                  <th class="px-2 py-2 text-left text-[var(--ui-text-muted)]">Roles</th>
                </tr>
              </thead>
              <tbody class="text-[var(--ui-text)]">
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2">
                    <UBadge color="info" variant="soft" size="xs">GET</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/prfs</td>
                  <td class="px-2 py-2">List PRFs</td>
                  <td class="px-2 py-2 text-xs">All (filtered for PROCUREMENT_SPECIALIST)</td>
                </tr>
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2">
                    <UBadge color="success" variant="soft" size="xs">POST</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/prfs</td>
                  <td class="px-2 py-2">Create PRF</td>
                  <td class="px-2 py-2 text-xs">OPERATOR, SUPERVISOR, ADMIN</td>
                </tr>
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2">
                    <UBadge color="warning" variant="soft" size="xs">PATCH</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/prfs/:id/submit</td>
                  <td class="px-2 py-2">Submit for approval</td>
                  <td class="px-2 py-2 text-xs">Requester only</td>
                </tr>
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2">
                    <UBadge color="warning" variant="soft" size="xs">PATCH</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/prfs/:id/approve</td>
                  <td class="px-2 py-2">Approve PRF</td>
                  <td class="px-2 py-2 text-xs">SUPERVISOR, ADMIN</td>
                </tr>
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2">
                    <UBadge color="warning" variant="soft" size="xs">PATCH</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/prfs/:id/reject</td>
                  <td class="px-2 py-2">Reject PRF</td>
                  <td class="px-2 py-2 text-xs">SUPERVISOR, ADMIN</td>
                </tr>
                <tr>
                  <td class="px-2 py-2">
                    <UBadge color="success" variant="soft" size="xs">POST</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/prfs/:id/clone</td>
                  <td class="px-2 py-2">Clone rejected PRF</td>
                  <td class="px-2 py-2 text-xs">Original requester</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">API Details</h4>
          <DeveloperCodeBlock
            :code="codeExamples.prfApiEndpoints"
            language="typescript"
            filename="server/api/prfs/"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Role Permissions</h4>
          <DeveloperCodeBlock :code="codeExamples.prfRolePermissions" language="plaintext" />
        </div>
      </div>
    </section>

    <!-- PO Status Workflow Section -->
    <section
      id="dev-section-po-status-workflow"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('po-status-workflow')"
      >
        <span class="flex items-center gap-3">
          <UIcon
            name="i-heroicons-clipboard-document-list"
            class="text-xl text-[var(--ui-primary)]"
          />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">PO Status Workflow</span>
        </span>
        <UIcon
          :name="
            isExpanded('po-status-workflow') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('po-status-workflow')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Purchase Orders have a simpler lifecycle with OPEN and CLOSED states. They track delivery
          fulfillment and can auto-close when all items are received.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Status Workflow Diagram
          </h4>
          <DeveloperCodeBlock :code="codeExamples.poStatusWorkflow" language="plaintext" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Delivery Tracking Fields</h4>
          <div class="grid gap-2 sm:grid-cols-3">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">quantity</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Original ordered quantity on PO line
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="success" variant="soft" size="xs">delivered_qty</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Cumulative quantity received across all deliveries
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="warning" variant="soft" size="xs">remaining_qty</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Computed: quantity - delivered_qty
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-[var(--ui-success)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-success)]">
            <UIcon name="i-heroicons-check-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Auto-Close:</strong>
              When all PO lines have delivered_qty &ge; quantity, the PO automatically closes and
              its linked PRF is also closed. API returns
              <code class="code-inline">po_auto_closed: true</code>
              .
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- PO API Endpoints Section -->
    <section
      id="dev-section-po-api-endpoints"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('po-api-endpoints')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-server" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">PO API Endpoints</span>
        </span>
        <UIcon
          :name="
            isExpanded('po-api-endpoints') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('po-api-endpoints')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          PO API endpoints handle creation, editing, and closure with VAT calculations.
        </p>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Endpoint Overview</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-[var(--ui-border)]">
                  <th class="px-2 py-2 text-left text-[var(--ui-text-muted)]">Method</th>
                  <th class="px-2 py-2 text-left text-[var(--ui-text-muted)]">Endpoint</th>
                  <th class="px-2 py-2 text-left text-[var(--ui-text-muted)]">Description</th>
                  <th class="px-2 py-2 text-left text-[var(--ui-text-muted)]">Roles</th>
                </tr>
              </thead>
              <tbody class="text-[var(--ui-text)]">
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2">
                    <UBadge color="info" variant="soft" size="xs">GET</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/pos</td>
                  <td class="px-2 py-2">List POs</td>
                  <td class="px-2 py-2 text-xs">All authenticated</td>
                </tr>
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2">
                    <UBadge color="success" variant="soft" size="xs">POST</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/pos</td>
                  <td class="px-2 py-2">Create PO from PRF</td>
                  <td class="px-2 py-2 text-xs">PROCUREMENT_SPECIALIST</td>
                </tr>
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2">
                    <UBadge color="warning" variant="soft" size="xs">PATCH</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/pos/:id</td>
                  <td class="px-2 py-2">Update open PO</td>
                  <td class="px-2 py-2 text-xs">PROCUREMENT_SPECIALIST</td>
                </tr>
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2">
                    <UBadge color="warning" variant="soft" size="xs">PATCH</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/pos/:id/close</td>
                  <td class="px-2 py-2">Close PO</td>
                  <td class="px-2 py-2 text-xs">ADMIN, SUPERVISOR</td>
                </tr>
                <tr>
                  <td class="px-2 py-2">
                    <UBadge color="info" variant="soft" size="xs">GET</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/pos/open</td>
                  <td class="px-2 py-2">Open POs dropdown</td>
                  <td class="px-2 py-2 text-xs">All authenticated</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">API Details</h4>
          <DeveloperCodeBlock
            :code="codeExamples.poApiEndpoints"
            language="typescript"
            filename="server/api/pos/"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">VAT Calculations</h4>
          <DeveloperCodeBlock
            :code="codeExamples.poVatCalculation"
            language="typescript"
            filename="server/api/pos/index.post.ts"
          />
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Role Restriction:</strong>
              PROCUREMENT_SPECIALIST can create and edit POs but
              <strong>cannot close them</strong>
              . Only ADMIN and SUPERVISOR can close POs.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Over-Delivery Workflow Section -->
    <section
      id="dev-section-over-delivery-workflow"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('over-delivery-workflow')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-shield-check" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Over-Delivery Approval Workflow
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('over-delivery-workflow')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('over-delivery-workflow')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          When a delivery quantity exceeds the PO's remaining quantity, supervisor/admin approval is
          required before posting. This ensures oversight of procurement variances.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Workflow Diagram</h4>
          <DeveloperCodeBlock :code="codeExamples.overDeliveryWorkflow" language="plaintext" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Delivery Status Badges</h4>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="neutral" variant="soft">Draft</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">Normal draft without over-delivery.</p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="warning" variant="soft">Pending Approval</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Over-delivery awaiting supervisor approval.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="warning" variant="soft">Approved</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Over-delivery approved, ready to post.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="error" variant="soft">Rejected</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Permanently locked. Must create new delivery.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="success" variant="soft">Posted</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">Delivery finalized, stock updated.</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-error)]">
            <UIcon name="i-heroicons-exclamation-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Rejection is Permanent:</strong>
              When over-delivery is rejected, the delivery is
              <strong>permanently locked</strong>
              . All actions (Edit, Delete, Post) are disabled. The user must create a new delivery
              with correct quantities.
            </span>
          </p>
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Implicit Approval:</strong>
              When a Supervisor or Admin creates a delivery with over-delivery, it's implicitly
              approved (no separate workflow needed).
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Delivery-PO Integration Section -->
    <section
      id="dev-section-delivery-po-integration"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('delivery-po-integration')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-truck" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Delivery-PO Integration
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('delivery-po-integration')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('delivery-po-integration')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Deliveries are now mandatory linked to Purchase Orders for complete procurement
          traceability. The system tracks fulfillment and auto-closes POs when complete.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Integration Details</h4>
          <DeveloperCodeBlock
            :code="codeExamples.deliveryPoIntegration"
            language="typescript"
            filename="server/api/deliveries/[id]/post.patch.ts"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Key Integration Points</h4>
          <div class="space-y-2">
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Mandatory PO Selection</strong>
                - Delivery form requires selecting an OPEN PO
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Pre-fill with Remaining</strong>
                - Lines show remaining_qty, not full quantity
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Auto-populate Supplier</strong>
                - Supplier field filled from selected PO
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Tracking Updates</strong>
                - Posting increments POLine.delivered_qty
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Auto-Close Cascade</strong>
                - Full delivery closes PO and linked PRF
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- PROCUREMENT_SPECIALIST Role Section -->
    <section
      id="dev-section-procurement-specialist-role"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('procurement-specialist-role')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-user-circle" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            PROCUREMENT_SPECIALIST Role
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('procurement-specialist-role')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('procurement-specialist-role')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The PROCUREMENT_SPECIALIST role has limited access focused on procurement operations. They
          can only access the Orders page to manage PRFs and POs.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Permissions Matrix</h4>
          <DeveloperCodeBlock :code="codeExamples.procurementSpecialistRole" language="plaintext" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Navigation Restrictions</h4>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-success)]/30 p-3">
              <p class="mb-2 text-sm font-medium text-[var(--ui-success)]">Accessible</p>
              <ul class="space-y-1 text-xs text-[var(--ui-text-muted)]">
                <li class="flex items-center gap-1">
                  <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
                  Orders (PRFs and POs)
                </li>
              </ul>
            </div>
            <div class="rounded-lg border border-[var(--ui-error)]/30 p-3">
              <p class="mb-2 text-sm font-medium text-[var(--ui-error)]">Restricted</p>
              <ul class="space-y-1 text-xs text-[var(--ui-text-muted)]">
                <li class="flex items-center gap-1">
                  <UIcon name="i-heroicons-x-mark" class="text-[var(--ui-error)]" />
                  Dashboard, Deliveries, Master Data
                </li>
                <li class="flex items-center gap-1">
                  <UIcon name="i-heroicons-x-mark" class="text-[var(--ui-error)]" />
                  Issues, Transfers, Reconciliations
                </li>
                <li class="flex items-center gap-1">
                  <UIcon name="i-heroicons-x-mark" class="text-[var(--ui-error)]" />
                  Period Management
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Email Notifications Section -->
    <section
      id="dev-section-email-notifications"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('email-notifications')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-envelope" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Email Notifications</span>
        </span>
        <UIcon
          :name="
            isExpanded('email-notifications')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('email-notifications')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Email notifications are sent at key workflow stages to keep stakeholders informed. Emails
          are sent asynchronously and never block transactions.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Notification Triggers</h4>
          <DeveloperCodeBlock :code="codeExamples.emailNotifications" language="plaintext" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Email Service Pattern</h4>
          <DeveloperCodeBlock
            :code="codeExamples.emailService"
            language="typescript"
            filename="server/utils/email.ts"
          />
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Non-Blocking:</strong>
              Email failures are logged but don't block the primary transaction. The API returns
              <code class="code-inline">email_sent: boolean</code>
              to indicate success/failure.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Business Rules Summary Section -->
    <section
      id="dev-section-prf-po-business-rules"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('prf-po-business-rules')"
      >
        <span class="flex items-center gap-3">
          <UIcon
            name="i-heroicons-clipboard-document-list"
            class="text-xl text-[var(--ui-primary)]"
          />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Business Rules Summary
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('prf-po-business-rules')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('prf-po-business-rules')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Summary of all business rules, validations, and error codes for the PRF/PO workflow.
        </p>

        <div>
          <DeveloperCodeBlock :code="codeExamples.businessRules" language="typescript" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Critical Rules</h4>
          <div class="space-y-2">
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>1:1 PRF-PO Relationship</strong>
                - Each PRF can only create one PO
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Mandatory Rejection Reason</strong>
                - Cannot reject PRF without explanation
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>REJECTED PRFs Use Clone</strong>
                - Cannot resubmit rejected PRFs
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>PO Closure Restrictions</strong>
                - Only Admin/Supervisor can close POs
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Mandatory PO for Deliveries</strong>
                - All deliveries must link to a PO
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Over-Delivery Approval</strong>
                - Supervisor/Admin approval required
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.code-inline {
  @apply rounded bg-[var(--ui-bg-muted)] px-1.5 py-0.5 font-mono text-xs;
}
</style>
