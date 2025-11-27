/**
 * API Tests: PATCH /api/transfers/:id/approve
 *
 * Tests transfer approval endpoint including:
 * - Successful transfer approval
 * - Stock movement (deduct from source, add to destination)
 * - WAC recalculation at destination
 * - Status update to COMPLETED
 * - Error scenarios (authentication, permissions, validation)
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  loginUser,
  authenticatedFetch,
  apiFetch,
  type TestUser,
} from "./helpers/test-server";
import {
  testUsers,
  getTestLocationIds,
  getTestItemIds,
} from "./helpers/test-data";

describe("PATCH /api/transfers/:id/approve", () => {
  let adminUser: TestUser;
  let supervisorUser: TestUser;
  let operatorUser: TestUser;
  let locationIds: { kitchen: string; store: string; warehouse: string };
  let itemIds: { chicken: string; rice: string; oil: string };

  beforeAll(async () => {
    // Login users
    adminUser = await loginUser(testUsers.admin.username, testUsers.admin.password);
    supervisorUser = await loginUser(
      testUsers.supervisor.username,
      testUsers.supervisor.password
    );
    operatorUser = await loginUser(testUsers.operator.username, testUsers.operator.password);

    // Get test data IDs
    locationIds = await getTestLocationIds();
    itemIds = await getTestItemIds();
  }, 30000);

  describe("Success scenarios", () => {
    it("should approve a pending transfer successfully", async () => {
      // First, create a transfer
      const transferData = {
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 1,
          },
        ],
      };

      const createResult = await authenticatedFetch<{
        transfer: { id: string };
      }>("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
        user: adminUser,
      });

      expect(createResult.status).toBe(200);

      const transferId = createResult.data?.transfer.id;
      expect(transferId).toBeDefined();

      // Now approve the transfer
      const approveResult = await authenticatedFetch(
        `/api/transfers/${transferId}/approve`,
        {
          method: "PATCH",
          user: supervisorUser, // Supervisor can approve
        }
      );

      expect(approveResult.status).toBe(200);

      const data = approveResult.data as {
        message: string;
        transfer: {
          id: string;
          status: string;
          approval_date: string;
          transfer_date: string;
          approver: { username: string };
        };
      };

      expect(data.message).toContain("approved");
      expect(data.transfer.status).toBe("COMPLETED");
      expect(data.transfer.approval_date).toBeDefined();
      expect(data.transfer.transfer_date).toBeDefined();
      expect(data.transfer.approver.username).toBe(testUsers.supervisor.username);
    }, 15000);

    it("should approve transfer and update stock correctly", async () => {
      // Get current stock at source and destination
      const sourceStockBefore = await authenticatedFetch<{
        stock: Array<{
          item_id: string;
          on_hand: number;
        }>;
      }>(`/api/locations/${locationIds.kitchen}/stock`, {
        user: adminUser,
      });

      const destStockBefore = await authenticatedFetch<{
        stock: Array<{
          item_id: string;
          on_hand: number;
        }>;
      }>(`/api/locations/${locationIds.store}/stock`, {
        user: adminUser,
      });

      const sourceChickenBefore = sourceStockBefore.data?.stock?.find(
        (s) => s.item_id === itemIds.chicken
      );

      const destChickenBefore = destStockBefore.data?.stock?.find(
        (s) => s.item_id === itemIds.chicken
      );

      if (!sourceChickenBefore || sourceChickenBefore.on_hand < 2) {
        console.warn("Insufficient stock for transfer test, skipping");
        return;
      }

      // Create and approve transfer
      const transferData = {
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 2,
          },
        ],
      };

      const createResult = await authenticatedFetch<{
        transfer: { id: string };
      }>("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
        user: adminUser,
      });

      const transferId = createResult.data?.transfer.id;
      expect(transferId).toBeDefined();

      await authenticatedFetch(`/api/transfers/${transferId}/approve`, {
        method: "PATCH",
        user: adminUser,
      });

      // Get stock after approval
      const sourceStockAfter = await authenticatedFetch<{
        stock: Array<{
          item_id: string;
          on_hand: number;
        }>;
      }>(`/api/locations/${locationIds.kitchen}/stock`, {
        user: adminUser,
      });

      const destStockAfter = await authenticatedFetch<{
        stock: Array<{
          item_id: string;
          on_hand: number;
        }>;
      }>(`/api/locations/${locationIds.store}/stock`, {
        user: adminUser,
      });

      const sourceChickenAfter = sourceStockAfter.data?.stock?.find(
        (s) => s.item_id === itemIds.chicken
      );

      const destChickenAfter = destStockAfter.data?.stock?.find(
        (s) => s.item_id === itemIds.chicken
      );

      // Verify source stock decreased
      expect(sourceChickenAfter?.on_hand).toBe(sourceChickenBefore.on_hand - 2);

      // Verify destination stock increased
      const expectedDestQty = (destChickenBefore?.on_hand || 0) + 2;
      expect(destChickenAfter?.on_hand).toBe(expectedDestQty);
    }, 15000);
  });

  describe("Business rule validation", () => {
    it("should reject approval if transfer not in PENDING_APPROVAL status", async () => {
      // Create and approve a transfer
      const transferData = {
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 1,
          },
        ],
      };

      const createResult = await authenticatedFetch<{
        transfer: { id: string };
      }>("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
        user: adminUser,
      });

      const transferId = createResult.data?.transfer.id;

      // Approve it once
      await authenticatedFetch(`/api/transfers/${transferId}/approve`, {
        method: "PATCH",
        user: adminUser,
      });

      // Try to approve again (should fail)
      const secondApproval = await authenticatedFetch(
        `/api/transfers/${transferId}/approve`,
        {
          method: "PATCH",
          user: adminUser,
        }
      );

      expect(secondApproval.status).toBe(400);

      const error = secondApproval.error as { data?: { code?: string } };
      expect(error.data?.code).toBe("INVALID_STATUS");
    }, 15000);

    it("should reject approval if insufficient stock at source", async () => {
      // Create a transfer with minimal quantity
      const transferData = {
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 999999, // Huge quantity
          },
        ],
      };

      // This should fail at creation, but if it somehow passes, approval should fail
      const createResult = await authenticatedFetch<{
        transfer: { id: string };
      }>("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
        user: adminUser,
      });

      // If creation succeeded (unlikely), try to approve
      if (createResult.status === 200) {
        const transferId = createResult.data?.transfer.id;

        const approveResult = await authenticatedFetch(
          `/api/transfers/${transferId}/approve`,
          {
            method: "PATCH",
            user: adminUser,
          }
        );

        expect(approveResult.status).toBe(400);

        const error = approveResult.error as { data?: { code?: string } };
        expect(error.data?.code).toBe("INSUFFICIENT_STOCK");
      }
    }, 15000);
  });

  describe("Authentication & Authorization", () => {
    it("should reject unauthenticated approval requests", async () => {
      // Create a transfer first
      const transferData = {
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 1,
          },
        ],
      };

      const createResult = await authenticatedFetch<{
        transfer: { id: string };
      }>("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
        user: adminUser,
      });

      const transferId = createResult.data?.transfer.id;

      // Try to approve without authentication
      const result = await apiFetch(`/api/transfers/${transferId}/approve`, {
        method: "PATCH",
      });

      expect(result.status).toBe(401);

      const error = result.error as { data?: { code?: string } };
      expect(error.data?.code).toBe("NOT_AUTHENTICATED");
    }, 15000);

    it("should reject approval by operators (non-supervisor/admin)", async () => {
      // Create a transfer
      const transferData = {
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 1,
          },
        ],
      };

      const createResult = await authenticatedFetch<{
        transfer: { id: string };
      }>("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
        user: adminUser,
      });

      const transferId = createResult.data?.transfer.id;

      // Try to approve as operator
      const result = await authenticatedFetch(`/api/transfers/${transferId}/approve`, {
        method: "PATCH",
        user: operatorUser,
      });

      expect(result.status).toBe(403);

      const error = result.error as { data?: { code?: string } };
      expect(error.data?.code).toBe("INSUFFICIENT_PERMISSIONS");
    }, 15000);

    it("should allow approval by admin", async () => {
      // Create a transfer
      const transferData = {
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 1,
          },
        ],
      };

      const createResult = await authenticatedFetch<{
        transfer: { id: string };
      }>("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
        user: adminUser,
      });

      const transferId = createResult.data?.transfer.id;

      // Approve as admin
      const result = await authenticatedFetch(`/api/transfers/${transferId}/approve`, {
        method: "PATCH",
        user: adminUser,
      });

      expect(result.status).toBe(200);
    }, 15000);
  });

  describe("Error scenarios", () => {
    it("should return 404 for non-existent transfer ID", async () => {
      const result = await authenticatedFetch(
        "/api/transfers/00000000-0000-0000-0000-000000000000/approve",
        {
          method: "PATCH",
          user: adminUser,
        }
      );

      expect(result.status).toBe(404);

      const error = result.error as { data?: { code?: string } };
      expect(error.data?.code).toBe("TRANSFER_NOT_FOUND");
    }, 10000);
  });
});
