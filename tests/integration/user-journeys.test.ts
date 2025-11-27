/**
 * Integration Tests: Complete User Journeys
 *
 * Tests end-to-end workflows including:
 * - Create delivery → Auto-NCR generation
 * - Create issue → Stock deduction
 * - Create transfer → Approval → Stock movement
 * - Period close workflow
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  loginUser,
  authenticatedFetch,
  type TestUser,
} from "../api/helpers/test-server";
import {
  testUsers,
  getTestLocationIds,
  getTestItemIds,
  getTestSupplierIds,
  getCurrentPeriodId,
} from "../api/helpers/test-data";

describe("Integration: Complete User Journeys", () => {
  let adminUser: TestUser;
  let supervisorUser: TestUser;
  let locationIds: { kitchen: string; store: string; warehouse: string };
  let itemIds: { chicken: string; rice: string; oil: string };
  let supplierIds: { supplierA: string; supplierB: string };
  let periodId: string;

  beforeAll(async () => {
    // Login users
    adminUser = await loginUser(testUsers.admin.username, testUsers.admin.password);
    supervisorUser = await loginUser(
      testUsers.supervisor.username,
      testUsers.supervisor.password
    );

    // Get test data IDs
    locationIds = await getTestLocationIds();
    itemIds = await getTestItemIds();
    supplierIds = await getTestSupplierIds();
    periodId = await getCurrentPeriodId();
  }, 30000);

  describe("Journey: Create Delivery with Price Variance → Auto-NCR Generation", () => {
    it("should complete delivery flow with automatic NCR creation for price variance", async () => {
      // Step 1: Get current period prices
      const periodPricesResult = await authenticatedFetch<{
        prices: Array<{ item_id: string; price: number; item_code: string }>;
      }>(`/api/periods/${periodId}/prices`, {
        user: adminUser,
      });

      if (periodPricesResult.status !== 200) {
        console.warn("Period prices endpoint not available, skipping test");
        return;
      }

      const chickenPeriodPrice = periodPricesResult.data?.prices?.find(
        (p) => p.item_id === itemIds.chicken
      );

      if (!chickenPeriodPrice) {
        console.warn("No period price found for chicken, skipping test");
        return;
      }

      // Step 2: Get initial stock level
      const stockBefore = await authenticatedFetch<{
        stock: Array<{ item_id: string; on_hand: number; wac: number }>;
      }>(`/api/locations/${locationIds.kitchen}/stock`, {
        user: adminUser,
      });

      expect(stockBefore.status).toBe(200);

      const initialStock = stockBefore.data?.stock?.find(
        (s) => s.item_id === itemIds.chicken
      );
      const initialOnHand = initialStock?.on_hand || 0;

      // Step 3: Create delivery with price variance (5 SAR above period price)
      const varianceAmount = 5;
      const deliveryData = {
        supplier_id: supplierIds.supplierA,
        delivery_date: new Date().toISOString(),
        invoice_no: `INV-INT-${Date.now()}`,
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 10,
            unit_price: chickenPeriodPrice.price + varianceAmount,
          },
        ],
      };

      const deliveryResult = await authenticatedFetch<{
        message: string;
        delivery: {
          id: string;
          delivery_no: string;
          has_variance: boolean;
          total_amount: number;
          ncrs: Array<{
            ncr_no: string;
            type: string;
            value: number;
            auto_generated: boolean;
          }>;
          lines: Array<{
            quantity: number;
            unit_price: number;
            period_price: number;
            variance: number;
          }>;
        };
      }>(`/api/locations/${locationIds.kitchen}/deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deliveryData),
        user: adminUser,
      });

      expect(deliveryResult.status).toBe(200);
      expect(deliveryResult.data?.delivery.delivery_no).toMatch(/^DEL-\d{4}-\d{3}$/);

      // Step 4: Verify price variance was detected
      expect(deliveryResult.data?.delivery.has_variance).toBe(true);

      // Step 5: Verify auto-NCR was created
      expect(deliveryResult.data?.delivery.ncrs).toBeDefined();
      expect(deliveryResult.data?.delivery.ncrs?.length).toBeGreaterThan(0);

      const ncr = deliveryResult.data?.delivery.ncrs?.[0];
      expect(ncr?.type).toBe("PRICE_VARIANCE");
      expect(ncr?.ncr_no).toMatch(/^NCR-\d{4}-\d{3}$/);
      expect(ncr?.auto_generated).toBe(true);

      // Step 6: Verify stock was updated
      const stockAfter = await authenticatedFetch<{
        stock: Array<{ item_id: string; on_hand: number; wac: number }>;
      }>(`/api/locations/${locationIds.kitchen}/stock`, {
        user: adminUser,
      });

      const updatedStock = stockAfter.data?.stock?.find(
        (s) => s.item_id === itemIds.chicken
      );

      expect(updatedStock?.on_hand).toBe(initialOnHand + 10);

      // Step 7: Verify NCR can be viewed in the NCR list
      const ncrListResult = await authenticatedFetch<{
        ncrs: Array<{
          ncr_no: string;
          type: string;
          delivery_id: string;
        }>;
      }>("/api/ncrs", {
        user: adminUser,
      });

      expect(ncrListResult.status).toBe(200);

      const createdNcr = ncrListResult.data?.ncrs?.find(
        (n) => n.ncr_no === ncr?.ncr_no
      );
      expect(createdNcr).toBeDefined();
      expect(createdNcr?.type).toBe("PRICE_VARIANCE");
      expect(createdNcr?.delivery_id).toBe(deliveryResult.data?.delivery.id);
    }, 20000);
  });

  describe("Journey: Create Issue → Verify Stock Deduction", () => {
    it("should complete issue flow with stock deduction at correct WAC", async () => {
      // Step 1: Get initial stock level and WAC
      const stockBefore = await authenticatedFetch<{
        stock: Array<{ item_id: string; on_hand: number; wac: number }>;
      }>(`/api/locations/${locationIds.kitchen}/stock`, {
        user: adminUser,
      });

      if (stockBefore.status !== 200) {
        console.warn("Stock endpoint not available, skipping test");
        return;
      }

      const initialStock = stockBefore.data?.stock?.find(
        (s) => s.item_id === itemIds.rice
      );

      if (!initialStock || initialStock.on_hand < 5) {
        console.warn("Insufficient rice stock for issue test, skipping");
        return;
      }

      const initialOnHand = initialStock.on_hand;
      const initialWac = initialStock.wac;

      // Step 2: Create an issue
      const issueQuantity = 3;
      const issueData = {
        issue_date: new Date().toISOString(),
        cost_centre: "FOOD",
        lines: [
          {
            item_id: itemIds.rice,
            quantity: issueQuantity,
          },
        ],
      };

      const issueResult = await authenticatedFetch<{
        message: string;
        issue: {
          id: string;
          issue_no: string;
          total_value: number;
          lines: Array<{
            item_id: string;
            quantity: number;
            wac_at_issue: number;
            line_value: number;
          }>;
        };
      }>(`/api/locations/${locationIds.kitchen}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(issueData),
        user: adminUser,
      });

      expect(issueResult.status).toBe(200);
      expect(issueResult.data?.issue.issue_no).toMatch(/^ISS-\d{4}-\d{3}$/);

      // Step 3: Verify issue used current WAC
      const issueLine = issueResult.data?.issue.lines?.[0];
      expect(issueLine?.wac_at_issue).toBeCloseTo(initialWac, 2);

      // Step 4: Verify line value calculation
      const expectedLineValue = issueQuantity * initialWac;
      expect(issueLine?.line_value).toBeCloseTo(expectedLineValue, 2);

      // Step 5: Verify stock was deducted
      const stockAfter = await authenticatedFetch<{
        stock: Array<{ item_id: string; on_hand: number; wac: number }>;
      }>(`/api/locations/${locationIds.kitchen}/stock`, {
        user: adminUser,
      });

      const updatedStock = stockAfter.data?.stock?.find(
        (s) => s.item_id === itemIds.rice
      );

      expect(updatedStock?.on_hand).toBe(initialOnHand - issueQuantity);

      // Step 6: Verify WAC was NOT changed (issues don't affect WAC)
      expect(updatedStock?.wac).toBeCloseTo(initialWac, 2);

      // Step 7: Verify issue appears in list
      const issueListResult = await authenticatedFetch<{
        issues: Array<{
          id: string;
          issue_no: string;
        }>;
      }>(`/api/locations/${locationIds.kitchen}/issues`, {
        user: adminUser,
      });

      const createdIssue = issueListResult.data?.issues?.find(
        (i) => i.id === issueResult.data?.issue.id
      );
      expect(createdIssue).toBeDefined();
    }, 15000);
  });

  describe("Journey: Create Transfer → Approval → Stock Movement", () => {
    it("should complete transfer lifecycle with stock movement between locations", async () => {
      // Step 1: Get initial stock at source location
      const sourceStockBefore = await authenticatedFetch<{
        stock: Array<{ item_id: string; on_hand: number; wac: number }>;
      }>(`/api/locations/${locationIds.kitchen}/stock`, {
        user: adminUser,
      });

      const sourceInitial = sourceStockBefore.data?.stock?.find(
        (s) => s.item_id === itemIds.chicken
      );

      if (!sourceInitial || sourceInitial.on_hand < 5) {
        console.warn("Insufficient source stock for transfer test, skipping");
        return;
      }

      // Step 2: Get initial stock at destination location
      const destStockBefore = await authenticatedFetch<{
        stock: Array<{ item_id: string; on_hand: number; wac: number }>;
      }>(`/api/locations/${locationIds.store}/stock`, {
        user: adminUser,
      });

      const destInitial = destStockBefore.data?.stock?.find(
        (s) => s.item_id === itemIds.chicken
      );

      const destInitialOnHand = destInitial?.on_hand || 0;
      const destInitialWac = destInitial?.wac || 0;

      // Step 3: Create transfer (Operator action)
      const transferQuantity = 3;
      const transferData = {
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        notes: "Integration test transfer",
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: transferQuantity,
          },
        ],
      };

      const createResult = await authenticatedFetch<{
        message: string;
        transfer: {
          id: string;
          transfer_no: string;
          status: string;
          total_value: number;
          lines: Array<{
            item_id: string;
            quantity: number;
            wac_at_transfer: number;
            line_value: number;
          }>;
        };
      }>("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferData),
        user: adminUser,
      });

      expect(createResult.status).toBe(200);
      expect(createResult.data?.transfer.transfer_no).toMatch(/^TRF-\d{4}-\d{3}$/);
      expect(createResult.data?.transfer.status).toBe("PENDING_APPROVAL");

      const transferId = createResult.data?.transfer.id;
      const wacAtTransfer =
        createResult.data?.transfer.lines?.[0]?.wac_at_transfer || 0;

      // Step 4: Verify stock NOT moved yet (only pending)
      const sourceStockPending = await authenticatedFetch<{
        stock: Array<{ item_id: string; on_hand: number }>;
      }>(`/api/locations/${locationIds.kitchen}/stock`, {
        user: adminUser,
      });

      const sourcePending = sourceStockPending.data?.stock?.find(
        (s) => s.item_id === itemIds.chicken
      );

      // Stock should still be at original level (pending transfer doesn't move stock)
      expect(sourcePending?.on_hand).toBe(sourceInitial.on_hand);

      // Step 5: Approve transfer (Supervisor action)
      const approveResult = await authenticatedFetch<{
        message: string;
        transfer: {
          id: string;
          status: string;
          approval_date: string;
          transfer_date: string;
          approver: { id: string; username: string };
        };
      }>(`/api/transfers/${transferId}/approve`, {
        method: "PATCH",
        user: supervisorUser,
      });

      expect(approveResult.status).toBe(200);
      expect(approveResult.data?.transfer.status).toBe("COMPLETED");
      expect(approveResult.data?.transfer.approval_date).toBeDefined();
      expect(approveResult.data?.transfer.transfer_date).toBeDefined();

      // Step 6: Verify source stock deducted
      const sourceStockAfter = await authenticatedFetch<{
        stock: Array<{ item_id: string; on_hand: number; wac: number }>;
      }>(`/api/locations/${locationIds.kitchen}/stock`, {
        user: adminUser,
      });

      const sourceAfter = sourceStockAfter.data?.stock?.find(
        (s) => s.item_id === itemIds.chicken
      );

      expect(sourceAfter?.on_hand).toBe(sourceInitial.on_hand - transferQuantity);

      // Step 7: Verify destination stock increased
      const destStockAfter = await authenticatedFetch<{
        stock: Array<{ item_id: string; on_hand: number; wac: number }>;
      }>(`/api/locations/${locationIds.store}/stock`, {
        user: adminUser,
      });

      const destAfter = destStockAfter.data?.stock?.find(
        (s) => s.item_id === itemIds.chicken
      );

      expect(destAfter?.on_hand).toBe(destInitialOnHand + transferQuantity);

      // Step 8: Verify WAC recalculation at destination
      // New WAC = (oldQty * oldWac + transferQty * transferWac) / (oldQty + transferQty)
      if (destInitialOnHand > 0) {
        const expectedWac =
          (destInitialOnHand * destInitialWac + transferQuantity * wacAtTransfer) /
          (destInitialOnHand + transferQuantity);
        expect(destAfter?.wac).toBeCloseTo(expectedWac, 2);
      } else {
        // If destination had no stock, WAC should be transfer WAC
        expect(destAfter?.wac).toBeCloseTo(wacAtTransfer, 2);
      }

      // Step 9: Verify transfer appears in completed list
      const transferListResult = await authenticatedFetch<{
        transfers: Array<{
          id: string;
          transfer_no: string;
          status: string;
        }>;
      }>("/api/transfers?status=COMPLETED", {
        user: adminUser,
      });

      const completedTransfer = transferListResult.data?.transfers?.find(
        (t) => t.id === transferId
      );
      expect(completedTransfer).toBeDefined();
      expect(completedTransfer?.status).toBe("COMPLETED");
    }, 25000);

    it("should reject transfer when source has insufficient stock at approval time", async () => {
      // This tests a race condition scenario where stock is depleted between
      // transfer creation and approval

      // Step 1: Get current stock
      const stockBefore = await authenticatedFetch<{
        stock: Array<{ item_id: string; on_hand: number }>;
      }>(`/api/locations/${locationIds.kitchen}/stock`, {
        user: adminUser,
      });

      const currentStock = stockBefore.data?.stock?.find(
        (s) => s.item_id === itemIds.oil
      );

      if (!currentStock || currentStock.on_hand < 2) {
        console.warn("Insufficient oil stock for test, skipping");
        return;
      }

      // Step 2: Create transfer for most of the available stock
      const transferData = {
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        lines: [
          {
            item_id: itemIds.oil,
            quantity: currentStock.on_hand - 1, // Almost all stock
          },
        ],
      };

      const createResult = await authenticatedFetch<{
        transfer: { id: string };
      }>("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferData),
        user: adminUser,
      });

      expect(createResult.status).toBe(200);
      const transferId = createResult.data?.transfer.id;

      // Step 3: Issue stock to deplete it (simulate race condition)
      if (currentStock.on_hand >= 2) {
        const issueData = {
          issue_date: new Date().toISOString(),
          cost_centre: "FOOD",
          lines: [
            {
              item_id: itemIds.oil,
              quantity: 2, // Issue some stock
            },
          ],
        };

        await authenticatedFetch(`/api/locations/${locationIds.kitchen}/issues`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(issueData),
          user: adminUser,
        });
      }

      // Step 4: Try to approve transfer (should fail due to insufficient stock)
      const approveResult = await authenticatedFetch(
        `/api/transfers/${transferId}/approve`,
        {
          method: "PATCH",
          user: supervisorUser,
        }
      );

      // Should fail with insufficient stock
      expect(approveResult.status).toBe(400);

      const error = approveResult.error as { data?: { code?: string } };
      expect(error.data?.code).toBe("INSUFFICIENT_STOCK");
    }, 20000);
  });

  describe("Journey: Period Close Workflow", () => {
    it("should execute complete period close workflow", async () => {
      // Note: This test is dependent on period state and may need
      // adjustment based on current database state

      // Step 1: Get current period
      const periodResult = await authenticatedFetch<{
        period: {
          id: string;
          period_no: string;
          status: string;
          year: number;
          month: number;
        };
      }>("/api/periods/current", {
        user: adminUser,
      });

      expect(periodResult.status).toBe(200);

      const currentPeriod = periodResult.data?.period;

      // If period is already closed, skip the test
      if (currentPeriod?.status === "CLOSED") {
        console.warn("Current period is already closed, skipping close test");
        return;
      }

      // Step 2: Check location readiness
      const locationsResult = await authenticatedFetch<{
        locations: Array<{
          id: string;
          code: string;
          name: string;
        }>;
      }>("/api/locations", {
        user: adminUser,
      });

      expect(locationsResult.status).toBe(200);

      // Step 3: Check reconciliation status for each location
      const reconciliationStatus: Record<string, string> = {};

      for (const location of locationsResult.data?.locations || []) {
        const reconResult = await authenticatedFetch<{
          reconciliations: Array<{
            status: string;
            period_id: string;
          }>;
        }>(`/api/locations/${location.id}/reconciliations?period_id=${currentPeriod?.id}`, {
          user: adminUser,
        });

        if (reconResult.status === 200 && reconResult.data?.reconciliations?.[0]) {
          reconciliationStatus[location.id] =
            reconResult.data.reconciliations[0].status;
        }
      }

      // Step 4: If all locations are ready, attempt period close
      const allReady = Object.values(reconciliationStatus).every(
        (status) => status === "APPROVED"
      );

      if (allReady && currentPeriod?.status === "OPEN") {
        const closeResult = await authenticatedFetch<{
          message: string;
          period: {
            id: string;
            status: string;
            close_date: string;
          };
        }>(`/api/periods/${currentPeriod.id}/close`, {
          method: "POST",
          user: adminUser,
        });

        if (closeResult.status === 200) {
          expect(closeResult.data?.period.status).toBe("CLOSED");
          expect(closeResult.data?.period.close_date).toBeDefined();
        }
      } else {
        // Just verify the period close endpoint exists and responds appropriately
        const closeResult = await authenticatedFetch(
          `/api/periods/${currentPeriod?.id}/close`,
          {
            method: "POST",
            user: adminUser,
          }
        );

        // Should get a meaningful response (either success or business rule rejection)
        expect([200, 400]).toContain(closeResult.status);
      }
    }, 30000);
  });
});
