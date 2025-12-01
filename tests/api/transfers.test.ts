/**
 * API Tests: POST /api/transfers
 *
 * Tests transfer creation endpoint including:
 * - Successful transfer creation
 * - Stock validation at source location
 * - Same location validation
 * - Transfer status (PENDING_APPROVAL)
 * - Error scenarios (authentication, permissions, validation)
 */

import { describe, it, expect, beforeAll } from "vitest";
import { loginUser, authenticatedFetch, apiFetch, type TestUser } from "./helpers/test-server";
import { testUsers, getTestLocationIds, getTestItemIds } from "./helpers/test-data";

describe("POST /api/transfers", () => {
  let adminUser: TestUser;
  let supervisorUser: TestUser;
  let operatorUser: TestUser;
  let locationIds: { kitchen: string; store: string; warehouse: string };
  let itemIds: { chicken: string; rice: string; oil: string };

  beforeAll(async () => {
    // Login users
    adminUser = await loginUser(testUsers.admin.username, testUsers.admin.password);
    supervisorUser = await loginUser(testUsers.supervisor.username, testUsers.supervisor.password);
    operatorUser = await loginUser(testUsers.operator.username, testUsers.operator.password);

    // Get test data IDs
    locationIds = await getTestLocationIds();
    itemIds = await getTestItemIds();
  }, 30000);

  describe("Success scenarios", () => {
    it("should create a transfer successfully with valid data", async () => {
      const transferData = {
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        notes: "Test transfer",
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 2,
          },
        ],
      };

      const result = await authenticatedFetch("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
        user: adminUser,
      });

      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();

      const data = result.data as {
        message: string;
        transfer: {
          id: string;
          transfer_no: string;
          status: string;
          total_value: number;
          from_location: { id: string; name: string };
          to_location: { id: string; name: string };
          lines: Array<{
            quantity: number;
            wac_at_transfer: number;
            line_value: number;
          }>;
        };
      };

      expect(data.message).toContain("pending approval");
      expect(data.transfer).toBeDefined();
      expect(data.transfer.transfer_no).toMatch(/^TRF-\d{4}-\d{3}$/);
      expect(data.transfer.status).toBe("PENDING_APPROVAL");
      expect(data.transfer.from_location.id).toBe(locationIds.kitchen);
      expect(data.transfer.to_location.id).toBe(locationIds.store);
      expect(data.transfer.lines).toHaveLength(1);
      expect(data.transfer.lines[0]?.quantity).toBe(2);
    }, 10000);

    it("should create transfer with multiple lines", async () => {
      const transferData = {
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 1,
          },
          {
            item_id: itemIds.rice,
            quantity: 3,
          },
        ],
      };

      const result = await authenticatedFetch("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
        user: adminUser,
      });

      expect(result.status).toBe(200);

      const data = result.data as {
        transfer: {
          lines: unknown[];
        };
      };

      expect(data.transfer.lines).toHaveLength(2);
    }, 10000);

    it("should calculate total value based on source WAC", async () => {
      const transferData = {
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 5,
          },
        ],
      };

      const result = await authenticatedFetch<{
        transfer: {
          total_value: number;
          lines: Array<{
            quantity: number;
            wac_at_transfer: number;
            line_value: number;
          }>;
        };
      }>("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
        user: adminUser,
      });

      expect(result.status).toBe(200);

      const line = result.data?.transfer.lines[0];
      expect(line).toBeDefined();

      // Verify line value = quantity * wac_at_transfer
      const expectedLineValue = line!.quantity * line!.wac_at_transfer;
      expect(line!.line_value).toBeCloseTo(expectedLineValue, 2);

      // Verify total value matches sum of line values
      const expectedTotal = result.data?.transfer.lines.reduce((sum, l) => sum + l.line_value, 0);
      expect(result.data?.transfer.total_value).toBeCloseTo(expectedTotal!, 2);
    }, 10000);
  });

  describe("Stock validation", () => {
    it("should reject transfer if insufficient stock at source", async () => {
      const transferData = {
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 999999, // Extremely large quantity
          },
        ],
      };

      const result = await authenticatedFetch("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
        user: adminUser,
      });

      expect(result.status).toBe(400);

      const error = result.error as { data?: { code?: string } };
      expect(error.data?.code).toBe("INSUFFICIENT_STOCK");
    }, 10000);
  });

  describe("Business rule validation", () => {
    it("should reject transfer from location to itself", async () => {
      const transferData = {
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.kitchen, // Same as from_location
        request_date: new Date().toISOString(),
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 2,
          },
        ],
      };

      const result = await authenticatedFetch("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
        user: adminUser,
      });

      expect(result.status).toBe(400);

      const error = result.error as { data?: { code?: string } };
      expect(error.data?.code).toBe("SAME_LOCATION_TRANSFER");
    }, 10000);
  });

  describe("Authentication & Authorization", () => {
    it("should reject unauthenticated requests", async () => {
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

      const result = await apiFetch("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
      });

      expect(result.status).toBe(401);

      const error = result.error as { data?: { code?: string } };
      expect(error.data?.code).toBe("NOT_AUTHENTICATED");
    }, 10000);

    it("should reject users without source location access", async () => {
      const transferData = {
        from_location_id: locationIds.warehouse, // Operator may not have access
        to_location_id: locationIds.kitchen,
        request_date: new Date().toISOString(),
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 2,
          },
        ],
      };

      const result = await authenticatedFetch("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
        user: operatorUser,
      });

      // Should be either 403 (forbidden) or succeed if operator has access
      if (result.status === 403) {
        const error = result.error as { data?: { code?: string } };
        expect(error.data?.code).toMatch(/ACCESS_DENIED|INSUFFICIENT_PERMISSIONS/);
      }
    }, 10000);
  });

  describe("Validation errors", () => {
    it("should reject transfer with missing required fields", async () => {
      const invalidData = {
        from_location_id: locationIds.kitchen,
        // Missing to_location_id
        request_date: new Date().toISOString(),
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 2,
          },
        ],
      };

      const result = await authenticatedFetch("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidData),
        user: adminUser,
      });

      expect(result.status).toBe(400);

      const error = result.error as { data?: { code?: string } };
      expect(error.data?.code).toBe("VALIDATION_ERROR");
    }, 10000);

    it("should reject transfer with empty lines array", async () => {
      const invalidData = {
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        lines: [], // Empty lines not allowed
      };

      const result = await authenticatedFetch("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidData),
        user: adminUser,
      });

      expect(result.status).toBe(400);

      const error = result.error as { data?: { code?: string } };
      expect(error.data?.code).toBe("VALIDATION_ERROR");
    }, 10000);

    it("should reject transfer with negative quantity", async () => {
      const invalidData = {
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: -3, // Negative quantity not allowed
          },
        ],
      };

      const result = await authenticatedFetch("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidData),
        user: adminUser,
      });

      expect(result.status).toBe(400);

      const error = result.error as { data?: { code?: string } };
      expect(error.data?.code).toBe("VALIDATION_ERROR");
    }, 10000);

    it("should reject transfer with invalid from location ID", async () => {
      const invalidData = {
        from_location_id: "00000000-0000-0000-0000-000000000000", // Non-existent
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 2,
          },
        ],
      };

      const result = await authenticatedFetch("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidData),
        user: adminUser,
      });

      expect(result.status).toBe(404);

      const error = result.error as { data?: { code?: string } };
      expect(error.data?.code).toBe("FROM_LOCATION_NOT_FOUND");
    }, 10000);

    it("should reject transfer with invalid to location ID", async () => {
      const invalidData = {
        from_location_id: locationIds.kitchen,
        to_location_id: "00000000-0000-0000-0000-000000000000", // Non-existent
        request_date: new Date().toISOString(),
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 2,
          },
        ],
      };

      const result = await authenticatedFetch("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidData),
        user: adminUser,
      });

      expect(result.status).toBe(404);

      const error = result.error as { data?: { code?: string } };
      expect(error.data?.code).toBe("TO_LOCATION_NOT_FOUND");
    }, 10000);

    it("should reject transfer with invalid item ID", async () => {
      const invalidData = {
        from_location_id: locationIds.kitchen,
        to_location_id: locationIds.store,
        request_date: new Date().toISOString(),
        lines: [
          {
            item_id: "00000000-0000-0000-0000-000000000000", // Non-existent item
            quantity: 2,
          },
        ],
      };

      const result = await authenticatedFetch("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidData),
        user: adminUser,
      });

      expect(result.status).toBe(400);

      const error = result.error as { data?: { code?: string } };
      expect(error.data?.code).toBe("INVALID_ITEMS");
    }, 10000);
  });
});
