/**
 * Database Type Definitions
 *
 * These types mirror Prisma-generated types but are safe to use in client-side code.
 * They avoid importing @prisma/client which bundles Node.js-specific code.
 *
 * IMPORTANT: Keep these in sync with prisma/schema.prisma
 */

// ========================================
// ENUMS
// ========================================

export type UserRole = "OPERATOR" | "SUPERVISOR" | "ADMIN";

export type LocationType = "KITCHEN" | "STORE" | "CENTRAL" | "WAREHOUSE";

export type Unit = "KG" | "EA" | "LTR" | "BOX" | "CASE" | "PACK";

export type PeriodStatus = "DRAFT" | "OPEN" | "PENDING_CLOSE" | "APPROVED" | "CLOSED";

export type PeriodLocationStatus = "OPEN" | "READY" | "CLOSED";

export type PRFStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

export type POStatus = "OPEN" | "CLOSED";

export type DeliveryStatus = "DRAFT" | "POSTED";

export type CostCentre = "FOOD" | "CLEAN" | "OTHER";

export type TransferStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "COMPLETED";

export type NCRType = "MANUAL" | "PRICE_VARIANCE";

export type NCRStatus = "OPEN" | "SENT" | "CREDITED" | "REJECTED" | "RESOLVED";

export type ApprovalEntityType = "PRF" | "PO" | "PERIOD_CLOSE" | "TRANSFER";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

// ========================================
// DECIMAL TYPE
// ========================================

/**
 * Prisma Decimal values are serialized as strings when sent over JSON.
 * Use this type for any decimal/currency fields in API responses.
 */
export type DecimalValue = string | number;

// ========================================
// CORE MODELS
// ========================================

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  password_hash: string;
  default_location_id: string | null;
  is_active: boolean;
  created_at: Date | string;
  last_login: Date | string | null;
}

export interface Location {
  id: string;
  code: string;
  name: string;
  type: LocationType;
  address: string | null;
  timezone: string;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface UserLocation {
  user_id: string;
  location_id: string;
  assigned_at: Date | string;
  assigned_by: string | null;
}

export interface Item {
  id: string;
  code: string;
  name: string;
  unit: Unit;
  category: string | null;
  sub_category: string | null;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contact: string | null;
  is_active: boolean;
  created_at: Date | string;
}

// ========================================
// PERIOD & STOCK MODELS
// ========================================

export interface Period {
  id: string;
  name: string;
  start_date: Date | string;
  end_date: Date | string;
  status: PeriodStatus;
  approval_id: string | null;
  created_at: Date | string;
  closed_at: Date | string | null;
}

export interface PeriodLocation {
  period_id: string;
  location_id: string;
  status: PeriodLocationStatus;
  opening_value: DecimalValue | null;
  closing_value: DecimalValue | null;
  snapshot_id: string | null;
  snapshot_data: unknown | null;
  ready_at: Date | string | null;
  closed_at: Date | string | null;
}

export interface ItemPrice {
  id: string;
  item_id: string;
  period_id: string;
  price: DecimalValue;
  currency: string;
  set_by: string | null;
  set_at: Date | string;
}

export interface LocationStock {
  location_id: string;
  item_id: string;
  on_hand: DecimalValue;
  wac: DecimalValue;
  min_stock: DecimalValue | null;
  max_stock: DecimalValue | null;
  last_counted: Date | string | null;
  updated_at: Date | string;
}

// ========================================
// TRANSACTION MODELS
// ========================================

export interface PRF {
  id: string;
  prf_no: string;
  period_id: string;
  location_id: string;
  status: PRFStatus;
  requested_by: string;
  approved_by: string | null;
  request_date: Date | string;
  approval_date: Date | string | null;
  notes: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface PO {
  id: string;
  po_no: string;
  prf_id: string | null;
  supplier_id: string;
  status: POStatus;
  total_amount: DecimalValue;
  notes: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Delivery {
  id: string;
  delivery_no: string;
  period_id: string;
  location_id: string;
  supplier_id: string;
  po_id: string | null;
  invoice_no: string | null;
  delivery_note: string | null;
  delivery_date: Date | string;
  total_amount: DecimalValue;
  has_variance: boolean;
  status: DeliveryStatus;
  created_by: string;
  posted_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface DeliveryLine {
  id: string;
  delivery_id: string;
  item_id: string;
  quantity: DecimalValue;
  unit_price: DecimalValue;
  period_price: DecimalValue;
  price_variance: DecimalValue;
  line_value: DecimalValue;
  ncr_id: string | null;
}

export interface Issue {
  id: string;
  issue_no: string;
  period_id: string;
  location_id: string;
  issue_date: Date | string;
  cost_centre: CostCentre;
  total_value: DecimalValue;
  notes: string | null;
  posted_by: string;
  posted_at: Date | string;
}

export interface IssueLine {
  id: string;
  issue_id: string;
  item_id: string;
  quantity: DecimalValue;
  wac_at_issue: DecimalValue;
  line_value: DecimalValue;
}

// ========================================
// TRANSFER MODELS
// ========================================

export interface Transfer {
  id: string;
  transfer_no: string;
  from_location_id: string;
  to_location_id: string;
  status: TransferStatus;
  requested_by: string;
  approved_by: string | null;
  request_date: Date | string;
  approval_date: Date | string | null;
  transfer_date: Date | string | null;
  total_value: DecimalValue;
  notes: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface TransferLine {
  id: string;
  transfer_id: string;
  item_id: string;
  quantity: DecimalValue;
  wac_at_transfer: DecimalValue;
  line_value: DecimalValue;
}

// ========================================
// CONTROL MODELS
// ========================================

export interface NCR {
  id: string;
  ncr_no: string;
  location_id: string;
  type: NCRType;
  auto_generated: boolean;
  delivery_id: string | null;
  delivery_line_id: string | null;
  reason: string;
  quantity: DecimalValue | null;
  value: DecimalValue;
  status: NCRStatus;
  created_by: string;
  created_at: Date | string;
  resolved_at: Date | string | null;
  resolution_notes: string | null;
}

export interface POB {
  id: string;
  period_id: string;
  location_id: string;
  date: Date | string;
  crew_count: number;
  extra_count: number;
  entered_by: string;
  entered_at: Date | string;
  updated_at: Date | string;
}

export interface Reconciliation {
  id: string;
  period_id: string;
  location_id: string;
  opening_stock: DecimalValue;
  receipts: DecimalValue;
  transfers_in: DecimalValue;
  transfers_out: DecimalValue;
  issues: DecimalValue;
  closing_stock: DecimalValue;
  adjustments: DecimalValue;
  back_charges: DecimalValue;
  credits: DecimalValue;
  condemnations: DecimalValue;
  last_updated: Date | string;
}

export interface Approval {
  id: string;
  entity_type: ApprovalEntityType;
  entity_id: string;
  status: ApprovalStatus;
  requested_by: string;
  reviewed_by: string | null;
  requested_at: Date | string;
  reviewed_at: Date | string | null;
  comments: string | null;
}
