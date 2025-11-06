-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OPERATOR', 'SUPERVISOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('KITCHEN', 'STORE', 'CENTRAL', 'WAREHOUSE');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('VIEW', 'POST', 'MANAGE');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('KG', 'EA', 'LTR', 'BOX', 'CASE', 'PACK');

-- CreateEnum
CREATE TYPE "PeriodStatus" AS ENUM ('DRAFT', 'OPEN', 'PENDING_CLOSE', 'APPROVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PeriodLocationStatus" AS ENUM ('OPEN', 'READY', 'CLOSED');

-- CreateEnum
CREATE TYPE "PRFStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "CostCentre" AS ENUM ('FOOD', 'CLEAN', 'OTHER');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NCRType" AS ENUM ('MANUAL', 'PRICE_VARIANCE');

-- CreateEnum
CREATE TYPE "NCRStatus" AS ENUM ('OPEN', 'SENT', 'CREDITED', 'REJECTED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ApprovalEntityType" AS ENUM ('PRF', 'PO', 'PERIOD_CLOSE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "full_name" VARCHAR(100),
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "password_hash" VARCHAR(255) NOT NULL,
    "default_location_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "LocationType" NOT NULL,
    "address" TEXT,
    "manager_id" UUID,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Riyadh',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_locations" (
    "user_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "access_level" "AccessLevel" NOT NULL DEFAULT 'VIEW',
    "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID,

    CONSTRAINT "user_locations_pkey" PRIMARY KEY ("user_id","location_id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "unit" "Unit" NOT NULL,
    "category" VARCHAR(50),
    "sub_category" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "contact" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periods" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "PeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "approval_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ,

    CONSTRAINT "periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "period_locations" (
    "period_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "status" "PeriodLocationStatus" NOT NULL DEFAULT 'OPEN',
    "opening_value" DECIMAL(15,2),
    "closing_value" DECIMAL(15,2),
    "snapshot_id" UUID,
    "snapshot_data" JSONB,
    "ready_at" TIMESTAMPTZ,
    "closed_at" TIMESTAMPTZ,

    CONSTRAINT "period_locations_pkey" PRIMARY KEY ("period_id","location_id")
);

-- CreateTable
CREATE TABLE "item_prices" (
    "id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "price" DECIMAL(15,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'SAR',
    "set_by" UUID,
    "set_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_stock" (
    "location_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "on_hand" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "wac" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "min_stock" DECIMAL(15,4),
    "max_stock" DECIMAL(15,4),
    "last_counted" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "location_stock_pkey" PRIMARY KEY ("location_id","item_id")
);

-- CreateTable
CREATE TABLE "prfs" (
    "id" UUID NOT NULL,
    "prf_no" VARCHAR(50) NOT NULL,
    "period_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "status" "PRFStatus" NOT NULL DEFAULT 'DRAFT',
    "requested_by" UUID NOT NULL,
    "approved_by" UUID,
    "request_date" DATE NOT NULL,
    "approval_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "prfs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL,
    "po_no" VARCHAR(50) NOT NULL,
    "prf_id" UUID,
    "supplier_id" UUID NOT NULL,
    "status" "POStatus" NOT NULL DEFAULT 'OPEN',
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" UUID NOT NULL,
    "delivery_no" VARCHAR(50) NOT NULL,
    "period_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "po_id" UUID,
    "invoice_no" VARCHAR(100),
    "delivery_note" TEXT,
    "delivery_date" DATE NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "has_variance" BOOLEAN NOT NULL DEFAULT false,
    "posted_by" UUID NOT NULL,
    "posted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_lines" (
    "id" UUID NOT NULL,
    "delivery_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit_price" DECIMAL(15,4) NOT NULL,
    "period_price" DECIMAL(15,4) NOT NULL,
    "price_variance" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "line_value" DECIMAL(15,2) NOT NULL,
    "ncr_id" UUID,

    CONSTRAINT "delivery_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" UUID NOT NULL,
    "issue_no" VARCHAR(50) NOT NULL,
    "period_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "issue_date" DATE NOT NULL,
    "cost_centre" "CostCentre" NOT NULL DEFAULT 'FOOD',
    "total_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "posted_by" UUID NOT NULL,
    "posted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_lines" (
    "id" UUID NOT NULL,
    "issue_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "wac_at_issue" DECIMAL(15,4) NOT NULL,
    "line_value" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "issue_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" UUID NOT NULL,
    "transfer_no" VARCHAR(50) NOT NULL,
    "from_location_id" UUID NOT NULL,
    "to_location_id" UUID NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'DRAFT',
    "requested_by" UUID NOT NULL,
    "approved_by" UUID,
    "request_date" DATE NOT NULL,
    "approval_date" DATE,
    "transfer_date" DATE,
    "total_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_lines" (
    "id" UUID NOT NULL,
    "transfer_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "wac_at_transfer" DECIMAL(15,4) NOT NULL,
    "line_value" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "transfer_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ncrs" (
    "id" UUID NOT NULL,
    "ncr_no" VARCHAR(50) NOT NULL,
    "location_id" UUID NOT NULL,
    "type" "NCRType" NOT NULL DEFAULT 'MANUAL',
    "auto_generated" BOOLEAN NOT NULL DEFAULT false,
    "delivery_id" UUID,
    "delivery_line_id" UUID,
    "reason" TEXT NOT NULL,
    "quantity" DECIMAL(15,4),
    "value" DECIMAL(15,2) NOT NULL,
    "status" "NCRStatus" NOT NULL DEFAULT 'OPEN',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,
    "resolution_notes" TEXT,

    CONSTRAINT "ncrs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pob" (
    "id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "crew_count" INTEGER NOT NULL DEFAULT 0,
    "extra_count" INTEGER NOT NULL DEFAULT 0,
    "entered_by" UUID NOT NULL,
    "entered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliations" (
    "id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "opening_stock" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "receipts" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "transfers_in" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "transfers_out" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "issues" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "closing_stock" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "adjustments" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "back_charges" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credits" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "condemnations" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" UUID NOT NULL,
    "entity_type" "ApprovalEntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requested_by" UUID NOT NULL,
    "reviewed_by" UUID,
    "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ,
    "comments" TEXT,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "users_default_location_id_idx" ON "users"("default_location_id");

-- CreateIndex
CREATE UNIQUE INDEX "locations_code_key" ON "locations"("code");

-- CreateIndex
CREATE INDEX "locations_type_idx" ON "locations"("type");

-- CreateIndex
CREATE INDEX "locations_is_active_idx" ON "locations"("is_active");

-- CreateIndex
CREATE INDEX "locations_manager_id_idx" ON "locations"("manager_id");

-- CreateIndex
CREATE INDEX "user_locations_user_id_idx" ON "user_locations"("user_id");

-- CreateIndex
CREATE INDEX "user_locations_location_id_idx" ON "user_locations"("location_id");

-- CreateIndex
CREATE INDEX "user_locations_user_id_access_level_idx" ON "user_locations"("user_id", "access_level");

-- CreateIndex
CREATE UNIQUE INDEX "items_code_key" ON "items"("code");

-- CreateIndex
CREATE INDEX "items_category_idx" ON "items"("category");

-- CreateIndex
CREATE INDEX "items_is_active_idx" ON "items"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE INDEX "suppliers_is_active_idx" ON "suppliers"("is_active");

-- CreateIndex
CREATE INDEX "periods_status_idx" ON "periods"("status");

-- CreateIndex
CREATE INDEX "periods_start_date_end_date_idx" ON "periods"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "period_locations_period_id_idx" ON "period_locations"("period_id");

-- CreateIndex
CREATE INDEX "period_locations_location_id_idx" ON "period_locations"("location_id");

-- CreateIndex
CREATE INDEX "period_locations_status_idx" ON "period_locations"("status");

-- CreateIndex
CREATE INDEX "period_locations_period_id_status_idx" ON "period_locations"("period_id", "status");

-- CreateIndex
CREATE INDEX "item_prices_period_id_idx" ON "item_prices"("period_id");

-- CreateIndex
CREATE INDEX "item_prices_item_id_idx" ON "item_prices"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_prices_item_id_period_id_key" ON "item_prices"("item_id", "period_id");

-- CreateIndex
CREATE INDEX "location_stock_location_id_idx" ON "location_stock"("location_id");

-- CreateIndex
CREATE INDEX "location_stock_item_id_idx" ON "location_stock"("item_id");

-- CreateIndex
CREATE INDEX "location_stock_on_hand_idx" ON "location_stock"("on_hand");

-- CreateIndex
CREATE UNIQUE INDEX "prfs_prf_no_key" ON "prfs"("prf_no");

-- CreateIndex
CREATE INDEX "prfs_period_id_idx" ON "prfs"("period_id");

-- CreateIndex
CREATE INDEX "prfs_location_id_idx" ON "prfs"("location_id");

-- CreateIndex
CREATE INDEX "prfs_status_idx" ON "prfs"("status");

-- CreateIndex
CREATE INDEX "prfs_request_date_idx" ON "prfs"("request_date");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_po_no_key" ON "purchase_orders"("po_no");

-- CreateIndex
CREATE INDEX "purchase_orders_prf_id_idx" ON "purchase_orders"("prf_id");

-- CreateIndex
CREATE INDEX "purchase_orders_supplier_id_idx" ON "purchase_orders"("supplier_id");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_delivery_no_key" ON "deliveries"("delivery_no");

-- CreateIndex
CREATE INDEX "deliveries_period_id_idx" ON "deliveries"("period_id");

-- CreateIndex
CREATE INDEX "deliveries_location_id_idx" ON "deliveries"("location_id");

-- CreateIndex
CREATE INDEX "deliveries_supplier_id_idx" ON "deliveries"("supplier_id");

-- CreateIndex
CREATE INDEX "deliveries_po_id_idx" ON "deliveries"("po_id");

-- CreateIndex
CREATE INDEX "deliveries_delivery_date_idx" ON "deliveries"("delivery_date");

-- CreateIndex
CREATE INDEX "deliveries_has_variance_idx" ON "deliveries"("has_variance");

-- CreateIndex
CREATE INDEX "deliveries_period_id_location_id_idx" ON "deliveries"("period_id", "location_id");

-- CreateIndex
CREATE INDEX "deliveries_location_id_has_variance_idx" ON "deliveries"("location_id", "has_variance");

-- CreateIndex
CREATE INDEX "delivery_lines_delivery_id_idx" ON "delivery_lines"("delivery_id");

-- CreateIndex
CREATE INDEX "delivery_lines_item_id_idx" ON "delivery_lines"("item_id");

-- CreateIndex
CREATE INDEX "delivery_lines_ncr_id_idx" ON "delivery_lines"("ncr_id");

-- CreateIndex
CREATE UNIQUE INDEX "issues_issue_no_key" ON "issues"("issue_no");

-- CreateIndex
CREATE INDEX "issues_period_id_idx" ON "issues"("period_id");

-- CreateIndex
CREATE INDEX "issues_location_id_idx" ON "issues"("location_id");

-- CreateIndex
CREATE INDEX "issues_issue_date_idx" ON "issues"("issue_date");

-- CreateIndex
CREATE INDEX "issues_cost_centre_idx" ON "issues"("cost_centre");

-- CreateIndex
CREATE INDEX "issues_period_id_location_id_idx" ON "issues"("period_id", "location_id");

-- CreateIndex
CREATE INDEX "issues_location_id_cost_centre_idx" ON "issues"("location_id", "cost_centre");

-- CreateIndex
CREATE INDEX "issue_lines_issue_id_idx" ON "issue_lines"("issue_id");

-- CreateIndex
CREATE INDEX "issue_lines_item_id_idx" ON "issue_lines"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "transfers_transfer_no_key" ON "transfers"("transfer_no");

-- CreateIndex
CREATE INDEX "transfers_from_location_id_idx" ON "transfers"("from_location_id");

-- CreateIndex
CREATE INDEX "transfers_to_location_id_idx" ON "transfers"("to_location_id");

-- CreateIndex
CREATE INDEX "transfers_status_idx" ON "transfers"("status");

-- CreateIndex
CREATE INDEX "transfers_request_date_idx" ON "transfers"("request_date");

-- CreateIndex
CREATE INDEX "transfers_transfer_date_idx" ON "transfers"("transfer_date");

-- CreateIndex
CREATE INDEX "transfers_from_location_id_status_idx" ON "transfers"("from_location_id", "status");

-- CreateIndex
CREATE INDEX "transfers_to_location_id_status_idx" ON "transfers"("to_location_id", "status");

-- CreateIndex
CREATE INDEX "transfers_requested_by_idx" ON "transfers"("requested_by");

-- CreateIndex
CREATE INDEX "transfer_lines_transfer_id_idx" ON "transfer_lines"("transfer_id");

-- CreateIndex
CREATE INDEX "transfer_lines_item_id_idx" ON "transfer_lines"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "ncrs_ncr_no_key" ON "ncrs"("ncr_no");

-- CreateIndex
CREATE INDEX "ncrs_location_id_idx" ON "ncrs"("location_id");

-- CreateIndex
CREATE INDEX "ncrs_type_idx" ON "ncrs"("type");

-- CreateIndex
CREATE INDEX "ncrs_status_idx" ON "ncrs"("status");

-- CreateIndex
CREATE INDEX "ncrs_delivery_id_idx" ON "ncrs"("delivery_id");

-- CreateIndex
CREATE INDEX "ncrs_delivery_line_id_idx" ON "ncrs"("delivery_line_id");

-- CreateIndex
CREATE INDEX "ncrs_auto_generated_idx" ON "ncrs"("auto_generated");

-- CreateIndex
CREATE INDEX "ncrs_location_id_status_idx" ON "ncrs"("location_id", "status");

-- CreateIndex
CREATE INDEX "ncrs_location_id_type_idx" ON "ncrs"("location_id", "type");

-- CreateIndex
CREATE INDEX "ncrs_created_by_idx" ON "ncrs"("created_by");

-- CreateIndex
CREATE INDEX "pob_period_id_idx" ON "pob"("period_id");

-- CreateIndex
CREATE INDEX "pob_location_id_idx" ON "pob"("location_id");

-- CreateIndex
CREATE INDEX "pob_date_idx" ON "pob"("date");

-- CreateIndex
CREATE INDEX "pob_period_id_location_id_idx" ON "pob"("period_id", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "pob_period_id_location_id_date_key" ON "pob"("period_id", "location_id", "date");

-- CreateIndex
CREATE INDEX "reconciliations_period_id_idx" ON "reconciliations"("period_id");

-- CreateIndex
CREATE INDEX "reconciliations_location_id_idx" ON "reconciliations"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "reconciliations_period_id_location_id_key" ON "reconciliations"("period_id", "location_id");

-- CreateIndex
CREATE INDEX "approvals_entity_type_idx" ON "approvals"("entity_type");

-- CreateIndex
CREATE INDEX "approvals_entity_id_idx" ON "approvals"("entity_id");

-- CreateIndex
CREATE INDEX "approvals_status_idx" ON "approvals"("status");

-- CreateIndex
CREATE INDEX "approvals_requested_by_idx" ON "approvals"("requested_by");

-- CreateIndex
CREATE INDEX "approvals_reviewed_by_idx" ON "approvals"("reviewed_by");

-- CreateIndex
CREATE INDEX "approvals_entity_type_entity_id_idx" ON "approvals"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "approvals_entity_type_status_idx" ON "approvals"("entity_type", "status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_default_location_id_fkey" FOREIGN KEY ("default_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_locations" ADD CONSTRAINT "period_locations_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_locations" ADD CONSTRAINT "period_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_prices" ADD CONSTRAINT "item_prices_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_prices" ADD CONSTRAINT "item_prices_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_stock" ADD CONSTRAINT "location_stock_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_stock" ADD CONSTRAINT "location_stock_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prfs" ADD CONSTRAINT "prfs_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prfs" ADD CONSTRAINT "prfs_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prfs" ADD CONSTRAINT "prfs_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prfs" ADD CONSTRAINT "prfs_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_prf_id_fkey" FOREIGN KEY ("prf_id") REFERENCES "prfs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_lines" ADD CONSTRAINT "delivery_lines_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_lines" ADD CONSTRAINT "delivery_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_lines" ADD CONSTRAINT "issue_lines_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_lines" ADD CONSTRAINT "issue_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_lines" ADD CONSTRAINT "transfer_lines_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_lines" ADD CONSTRAINT "transfer_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_delivery_line_id_fkey" FOREIGN KEY ("delivery_line_id") REFERENCES "delivery_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pob" ADD CONSTRAINT "pob_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pob" ADD CONSTRAINT "pob_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pob" ADD CONSTRAINT "pob_entered_by_fkey" FOREIGN KEY ("entered_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
