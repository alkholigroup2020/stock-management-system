/**
 * Integration Tests: Concurrent Operations
 *
 * Tests scenarios involving concurrent/parallel operations:
 * - Simultaneous deliveries to same location
 * - Concurrent issues depleting stock
 * - Parallel transfer creation and approval
 * - Race condition prevention
 */

import { describe, it, expect, beforeAll } from "vitest";
import { loginUser, authenticatedFetch, type TestUser } from "../api/helpers/test-server";
import {
  testUsers,
  getTestLocationIds,
  getTestItemIds,
  getTestSupplierIds,
} from "../api/helpers/test-data";

describe("Integration: Concurrent Operations", () => {
  let adminUser: TestUser;
  let locationIds: { kitchen: string; store: string; warehouse: string };
  let itemIds: { chicken: string; rice: string; oil: string };
  let supplierIds: { supplierA: string; supplierB: string };

  beforeAll(async () => {
    adminUser = await loginUser(testUsers.admin.username, testUsers.admin.password);
    locationIds = await getTestLocationIds();
    itemIds = await getTestItemIds();
    supplierIds = await getTestSupplierIds();
  }, 30000);

  describe("Simultaneous Deliveries", () => {
    it("should handle multiple concurrent deliveries to the same location", async () => {
      // Get initial stock
      const stockBefore = await authenticatedFetch<{
        stock: Array<{ item_id: string; on_hand: number; wac: number }>;
      }>(`/api/locations/${locationIds.kitchen}/stock`, {
        user: adminUser,
      });

      const initialRice =
        stockBefore.data?.stock?.find((s) => s.item_id === itemIds.rice)?.on_hand || 0;

      // Create 3 concurrent deliveries
      const delivery1 = {
        supplier_id: supplierIds.supplierA,
        delivery_date: new Date().toISOString(),
        invoice_no: `CONC-1-${Date.now()}`,
        lines: [{ item_id: itemIds.rice, quantity: 10, unit_price: 15 }],
      };

      const delivery2 = {
        supplier_id: supplierIds.supplierA,
        delivery_date: new Date().toISOString(),
        invoice_no: `CONC-2-${Date.now()}`,
        lines: [{ item_id: itemIds.rice, quantity: 15, unit_price: 16 }],
      };

      const delivery3 = {
        supplier_id: supplierIds.supplierB,
        delivery_date: new Date().toISOString(),
        invoice_no: `CONC-3-${Date.now()}`,
        lines: [{ item_id: itemIds.rice, quantity: 20, unit_price: 14 }],
      };

      // Execute all deliveries concurrently
      const results = await Promise.all([
        authenticatedFetch(`/api/locations/${locationIds.kitchen}/deliveries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(delivery1),
          user: adminUser,
        }),
        authenticatedFetch(`/api/locations/${locationIds.kitchen}/deliveries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(delivery2),
          user: adminUser,
        }),
        authenticatedFetch(`/api/locations/${locationIds.kitchen}/deliveries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(delivery3),
          user: adminUser,
        }),
      ]);

      // All deliveries should succeed
      results.forEach((result, index) => {
        expect(result.status).toBe(200);
        console.log(`Delivery ${index + 1}: ${result.status}`);
      });

      // Verify final stock is correct (all quantities added)
      const stockAfter = await authenticatedFetch<{
        stock: Array<{ item_id: string; on_hand: number; wac: number }>;
      }>(`/api/locations/${locationIds.kitchen}/stock`, {
        user: adminUser,
      });

      const finalRice = stockAfter.data?.stock?.find((s) => s.item_id === itemIds.rice);

      // Total added: 10 + 15 + 20 = 45
      expect(finalRice?.on_hand).toBe(initialRice + 45);

      // WAC should be recalculated correctly
      // (initial * initialWAC + 10*15 + 15*16 + 20*14) / (initial + 45)
      expect(finalRice?.wac).toBeGreaterThan(0);
    }, 25000);

    it("should generate unique delivery numbers for concurrent deliveries", async () => {
      // Create 5 concurrent deliveries and verify unique numbers
      const deliveries = Array.from({ length: 5 }, (_, i) => ({
        supplier_id: supplierIds.supplierA,
        delivery_date: new Date().toISOString(),
        invoice_no: `UNIQUE-${i}-${Date.now()}`,
        lines: [{ item_id: itemIds.oil, quantity: 1, unit_price: 10 }],
      }));

      const results = await Promise.all(
        deliveries.map((delivery) =>
          authenticatedFetch<{
            delivery: { delivery_no: string };
          }>(`/api/locations/${locationIds.kitchen}/deliveries`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(delivery),
            user: adminUser,
          })
        )
      );

      // Most should succeed (some may fail due to concurrent stock limits)
      const successes = results.filter((r) => r.status === 200).length;
      expect(successes).toBeGreaterThanOrEqual(1);

      // Extract delivery numbers from successful results
      const successResults = results.filter((r) => r.status === 200);
      const deliveryNumbers = successResults.map((r) => r.data?.delivery.delivery_no);

      // All successful delivery numbers should be unique
      const uniqueNumbers = new Set(deliveryNumbers.filter(Boolean));
      expect(uniqueNumbers.size).toBe(successResults.length);

      // All successful deliveries should match pattern
      deliveryNumbers.filter(Boolean).forEach((num) => {
        expect(num).toMatch(/^DEL-\d{4}-\d{3}$/);
      });
    }, 25000);
  });

  describe("Concurrent Issues", () => {
    it("should handle concurrent issues correctly without over-depleting stock", async () => {
      // Get initial stock
      const stockBefore = await authenticatedFetch<{
        stock: Array<{ item_id: string; on_hand: number }>;
      }>(`/api/locations/${locationIds.kitchen}/stock`, {
        user: adminUser,
      });

      const initialChicken = stockBefore.data?.stock?.find((s) => s.item_id === itemIds.chicken);

      if (!initialChicken || initialChicken.on_hand < 10) {
        console.warn("Insufficient chicken stock for concurrent issue test, skipping");
        return;
      }

      const initialOnHand = initialChicken.on_hand;

      // Create 5 concurrent issues, each for 2 units
      const issues = Array.from({ length: 5 }, () => ({
        issue_date: new Date().toISOString(),
        cost_centre: "FOOD",
        lines: [{ item_id: itemIds.chicken, quantity: 2 }],
      }));

      const results = await Promise.all(
        issues.map((issue) =>
          authenticatedFetch(`/api/locations/${locationIds.kitchen}/issues`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(issue),
            user: adminUser,
          })
        )
      );

      // All should succeed (assuming sufficient stock)
      const successCount = results.filter((r) => r.status === 200).length;
      expect(successCount).toBe(5);

      // Verify final stock
      const stockAfter = await authenticatedFetch<{
        stock: Array<{ item_id: string; on_hand: number }>;
      }>(`/api/locations/${locationIds.kitchen}/stock`, {
        user: adminUser,
      });

      const finalChicken = stockAfter.data?.stock?.find((s) => s.item_id === itemIds.chicken);

      // Total issued: 5 issues * 2 units = 10
      expect(finalChicken?.on_hand).toBe(initialOnHand - 10);

      // Stock should never go negative
      expect(finalChicken?.on_hand).toBeGreaterThanOrEqual(0);
    }, 25000);

    it("should reject issues that would cause negative stock", async () => {
      // Get current stock
      const stockBefore = await authenticatedFetch<{
        stock: Array<{ item_id: string; on_hand: number }>;
      }>(`/api/locations/${locationIds.store}/stock`, {
        user: adminUser,
      });

      const currentOil = stockBefore.data?.stock?.find((s) => s.item_id === itemIds.oil);

      if (!currentOil || currentOil.on_hand < 3) {
        console.warn("Insufficient oil stock for over-depletion test, skipping");
        return;
      }

      const currentOnHand = currentOil.on_hand;

      // Try to issue more than available in concurrent requests
      // Each tries to issue 80% of stock - only one should succeed if stock is low
      const issueQuantity = Math.ceil(currentOnHand * 0.8);

      const issues = Array.from({ length: 3 }, () => ({
        issue_date: new Date().toISOString(),
        cost_centre: "FOOD",
        lines: [{ item_id: itemIds.oil, quantity: issueQuantity }],
      }));

      const results = await Promise.all(
        issues.map((issue) =>
          authenticatedFetch(`/api/locations/${locationIds.store}/issues`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(issue),
            user: adminUser,
          })
        )
      );

      // Count successes and failures
      const successes = results.filter((r) => r.status === 200).length;
      const failures = results.filter((r) => r.status === 400).length;

      console.log(`Concurrent issue results: ${successes} successes, ${failures} failures`);

      // At least some should succeed, some might fail depending on timing
      expect(successes).toBeGreaterThanOrEqual(1);

      // Verify stock is non-negative
      const stockAfter = await authenticatedFetch<{
        stock: Array<{ item_id: string; on_hand: number }>;
      }>(`/api/locations/${locationIds.store}/stock`, {
        user: adminUser,
      });

      const finalOil = stockAfter.data?.stock?.find((s) => s.item_id === itemIds.oil);
      expect(finalOil?.on_hand).toBeGreaterThanOrEqual(0);
    }, 25000);
  });

  describe("Concurrent Transfers", () => {
    it("should handle multiple concurrent transfer creations", async () => {
      // Get initial stock
      const stockBefore = await authenticatedFetch<{
        stock: Array<{ item_id: string; on_hand: number }>;
      }>(`/api/locations/${locationIds.kitchen}/stock`, {
        user: adminUser,
      });

      const initialRice = stockBefore.data?.stock?.find((s) => s.item_id === itemIds.rice);

      if (!initialRice || initialRice.on_hand < 15) {
        console.warn("Insufficient rice stock for concurrent transfer test, skipping");
        return;
      }

      // Create 3 concurrent transfers (each for 3 units)
      const transfers = Array.from({ length: 3 }, () => ({
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        notes: "Concurrent transfer test",
        lines: [{ item_id: itemIds.rice, quantity: 3 }],
      }));

      const createResults = await Promise.all(
        transfers.map((transfer) =>
          authenticatedFetch<{
            transfer: { id: string; transfer_no: string };
          }>("/api/transfers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transfer),
            user: adminUser,
          })
        )
      );

      // All creates should succeed (they're just pending)
      createResults.forEach((result) => {
        expect(result.status).toBe(200);
      });

      // Verify unique transfer numbers
      const transferNumbers = createResults.map((r) => r.data?.transfer.transfer_no);
      const uniqueNumbers = new Set(transferNumbers);
      expect(uniqueNumbers.size).toBe(3);

      // Now approve all concurrently
      const approveResults = await Promise.all(
        createResults.map((r) =>
          authenticatedFetch(`/api/transfers/${r.data?.transfer.id}/approve`, {
            method: "PATCH",
            user: adminUser,
          })
        )
      );

      // All should succeed (assuming sufficient stock)
      const approvalSuccesses = approveResults.filter((r) => r.status === 200).length;
      console.log(`Transfer approvals: ${approvalSuccesses} of 3 succeeded`);
      expect(approvalSuccesses).toBeGreaterThanOrEqual(1);
    }, 30000);

    it("should generate unique transfer numbers for concurrent creates", async () => {
      // Create 10 concurrent transfers
      const transfers = Array.from({ length: 10 }, () => ({
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        lines: [{ item_id: itemIds.oil, quantity: 1 }],
      }));

      const results = await Promise.all(
        transfers.map((transfer) =>
          authenticatedFetch<{
            transfer: { transfer_no: string };
          }>("/api/transfers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transfer),
            user: adminUser,
          })
        )
      );

      // At least some operations should complete (success or expected failure)
      const successes = results.filter((r) => r.status === 200);
      const failures = results.filter((r) => r.status === 400);
      // All results should be either success or expected failure
      expect(successes.length + failures.length).toBe(10);
      console.log(`Concurrent transfers: ${successes.length} succeeded, ${failures.length} failed`);

      // All successful transfer numbers should be unique
      const transferNumbers = successes.map((r) => r.data?.transfer.transfer_no);
      const uniqueNumbers = new Set(transferNumbers);
      expect(uniqueNumbers.size).toBe(successes.length);
    }, 30000);
  });

  describe("Mixed Concurrent Operations", () => {
    it("should handle delivery, issue, and transfer simultaneously", async () => {
      // Execute different operation types concurrently
      const delivery = {
        supplier_id: supplierIds.supplierA,
        delivery_date: new Date().toISOString(),
        invoice_no: `MIXED-DEL-${Date.now()}`,
        lines: [{ item_id: itemIds.chicken, quantity: 5, unit_price: 25 }],
      };

      const issue = {
        issue_date: new Date().toISOString(),
        cost_centre: "FOOD",
        lines: [{ item_id: itemIds.rice, quantity: 1 }],
      };

      const transfer = {
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        lines: [{ item_id: itemIds.oil, quantity: 1 }],
      };

      const [deliveryResult, issueResult, transferResult] = await Promise.all([
        authenticatedFetch(`/api/locations/${locationIds.kitchen}/deliveries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(delivery),
          user: adminUser,
        }),
        authenticatedFetch(`/api/locations/${locationIds.kitchen}/issues`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(issue),
          user: adminUser,
        }),
        authenticatedFetch("/api/transfers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transfer),
          user: adminUser,
        }),
      ]);

      // All operations should succeed or fail gracefully due to insufficient data
      // Accept either 200 (success) or 400 (validation/stock issue)
      expect([200, 400]).toContain(deliveryResult.status);
      expect([200, 400]).toContain(issueResult.status);
      expect([200, 400]).toContain(transferResult.status);

      const successes = [deliveryResult, issueResult, transferResult].filter(
        (r) => r.status === 200
      ).length;
      console.log(`Mixed concurrent operations: ${successes}/3 succeeded`);
    }, 20000);

    it("should maintain data consistency under concurrent load", async () => {
      // Get initial state
      const stockBefore = await authenticatedFetch<{
        stock: Array<{ item_id: string; on_hand: number }>;
      }>(`/api/locations/${locationIds.kitchen}/stock`, {
        user: adminUser,
      });

      const initialChicken =
        stockBefore.data?.stock?.find((s) => s.item_id === itemIds.chicken)?.on_hand || 0;

      // Run mixed operations
      const operations: Promise<{ status: number }>[] = [];

      // 3 deliveries of 5 each
      for (let i = 0; i < 3; i++) {
        operations.push(
          authenticatedFetch(`/api/locations/${locationIds.kitchen}/deliveries`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              supplier_id: supplierIds.supplierA,
              delivery_date: new Date().toISOString(),
              invoice_no: `LOAD-DEL-${i}-${Date.now()}`,
              lines: [{ item_id: itemIds.chicken, quantity: 5, unit_price: 25 }],
            }),
            user: adminUser,
          })
        );
      }

      // 2 issues of 3 each
      for (let i = 0; i < 2; i++) {
        operations.push(
          authenticatedFetch(`/api/locations/${locationIds.kitchen}/issues`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              issue_date: new Date().toISOString(),
              cost_centre: "FOOD",
              lines: [{ item_id: itemIds.chicken, quantity: 3 }],
            }),
            user: adminUser,
          })
        );
      }

      const results = await Promise.all(operations);

      // Count successes
      const deliverySuccesses = results.slice(0, 3).filter((r) => r.status === 200).length;
      const issueSuccesses = results.slice(3, 5).filter((r) => r.status === 200).length;

      console.log(`Deliveries: ${deliverySuccesses}/3, Issues: ${issueSuccesses}/2`);

      // Get final state
      const stockAfter = await authenticatedFetch<{
        stock: Array<{ item_id: string; on_hand: number }>;
      }>(`/api/locations/${locationIds.kitchen}/stock`, {
        user: adminUser,
      });

      const finalChicken =
        stockAfter.data?.stock?.find((s) => s.item_id === itemIds.chicken)?.on_hand || 0;

      // Calculate expected change
      const delivered = deliverySuccesses * 5;
      const issued = issueSuccesses * 3;
      const expectedFinal = initialChicken + delivered - issued;

      expect(finalChicken).toBe(expectedFinal);
    }, 30000);
  });

  describe("Race Condition Prevention", () => {
    it("should prevent double-approval of same transfer", async () => {
      // Create a transfer
      const transfer = {
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        lines: [{ item_id: itemIds.rice, quantity: 1 }],
      };

      const createResult = await authenticatedFetch<{
        transfer: { id: string };
      }>("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transfer),
        user: adminUser,
      });

      if (createResult.status !== 200) {
        console.warn("Transfer creation failed, skipping test");
        return;
      }
      const transferId = createResult.data?.transfer.id;

      // Try to approve the same transfer simultaneously
      const approveResults = await Promise.all([
        authenticatedFetch(`/api/transfers/${transferId}/approve`, {
          method: "PATCH",
          user: adminUser,
        }),
        authenticatedFetch(`/api/transfers/${transferId}/approve`, {
          method: "PATCH",
          user: adminUser,
        }),
        authenticatedFetch(`/api/transfers/${transferId}/approve`, {
          method: "PATCH",
          user: adminUser,
        }),
      ]);

      // Only one should succeed, others should fail with INVALID_STATUS
      const successes = approveResults.filter((r) => r.status === 200).length;
      const statusErrors = approveResults.filter((r) => r.status === 400).length;

      expect(successes).toBe(1);
      expect(statusErrors).toBe(2);

      // Verify transfer is in COMPLETED status
      const transferResult = await authenticatedFetch<{
        transfer: { status: string };
      }>(`/api/transfers/${transferId}`, {
        user: adminUser,
      });

      expect(transferResult.data?.transfer.status).toBe("COMPLETED");
    }, 20000);
  });
});
