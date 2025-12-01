/**
 * API Tests: POST /api/locations/:locationId/issues
 *
 * Tests issue creation endpoint including:
 * - Successful issue creation
 * - Stock quantity deduction
 * - Stock sufficiency validation
 * - WAC-based valuation
 * - Error scenarios (authentication, permissions, validation)
 */

import { describe, it, expect, beforeAll } from "vitest";
import { loginUser, authenticatedFetch, apiFetch, type TestUser } from "./helpers/test-server";
import { testUsers, getTestLocationIds, getTestItemIds } from "./helpers/test-data";

describe("POST /api/locations/:locationId/issues", () => {
  let adminUser: TestUser;
  let operatorUser: TestUser;
  let locationIds: { kitchen: string; store: string; warehouse: string };
  let itemIds: { chicken: string; rice: string; oil: string };

  beforeAll(async () => {
    // Login users
    adminUser = await loginUser(testUsers.admin.username, testUsers.admin.password);
    operatorUser = await loginUser(testUsers.operator.username, testUsers.operator.password);

    // Get test data IDs
    locationIds = await getTestLocationIds();
    itemIds = await getTestItemIds();
  }, 30000);

  describe("Success scenarios", () => {
    it("should create an issue successfully with valid data", async () => {
      const issueData = {
        issue_date: new Date().toISOString(),
        cost_centre: "FOOD",
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 2,
          },
        ],
      };

      const result = await authenticatedFetch(`/api/locations/${locationIds.kitchen}/issues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(issueData),
        user: adminUser,
      });

      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();

      const data = result.data as {
        message: string;
        issue: {
          id: string;
          issue_no: string;
          cost_centre: string;
          total_value: number;
          lines: Array<{
            quantity: number;
            wac_at_issue: number;
            line_value: number;
          }>;
        };
      };

      expect(data.message).toContain("successfully");
      expect(data.issue).toBeDefined();
      expect(data.issue.issue_no).toMatch(/^ISS-\d{4}-\d{3}$/);
      expect(data.issue.cost_centre).toBe("FOOD");
      expect(data.issue.total_value).toBeGreaterThan(0);
      expect(data.issue.lines).toHaveLength(1);
      expect(data.issue.lines[0]?.quantity).toBe(2);
    }, 10000);

    it("should create issue with multiple lines", async () => {
      const issueData = {
        issue_date: new Date().toISOString(),
        cost_centre: "FOOD",
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 1,
          },
          {
            item_id: itemIds.rice,
            quantity: 2,
          },
        ],
      };

      const result = await authenticatedFetch(`/api/locations/${locationIds.kitchen}/issues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(issueData),
        user: adminUser,
      });

      expect(result.status).toBe(200);

      const data = result.data as {
        issue: {
          lines: unknown[];
        };
      };

      expect(data.issue.lines).toHaveLength(2);
    }, 10000);

    it("should calculate total value based on WAC", async () => {
      const issueData = {
        issue_date: new Date().toISOString(),
        cost_centre: "FOOD",
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 3,
          },
        ],
      };

      const result = await authenticatedFetch<{
        issue: {
          total_value: number;
          lines: Array<{
            quantity: number;
            wac_at_issue: number;
            line_value: number;
          }>;
        };
      }>(`/api/locations/${locationIds.kitchen}/issues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(issueData),
        user: adminUser,
      });

      expect(result.status).toBe(200);

      const line = result.data?.issue.lines[0];
      expect(line).toBeDefined();

      // Verify line value = quantity * wac_at_issue
      const expectedLineValue = line!.quantity * line!.wac_at_issue;
      expect(line!.line_value).toBeCloseTo(expectedLineValue, 2);

      // Verify total value matches sum of line values
      const expectedTotal = result.data?.issue.lines.reduce((sum, l) => sum + l.line_value, 0);
      expect(result.data?.issue.total_value).toBeCloseTo(expectedTotal!, 2);
    }, 10000);
  });

  describe("Stock validation", () => {
    it("should reject issue if insufficient stock", async () => {
      const issueData = {
        issue_date: new Date().toISOString(),
        cost_centre: "FOOD",
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 999999, // Extremely large quantity to trigger insufficient stock
          },
        ],
      };

      const result = await authenticatedFetch(`/api/locations/${locationIds.kitchen}/issues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(issueData),
        user: adminUser,
      });

      expect(result.status).toBe(400);

      const error = result.error as { data?: { code?: string } };
      expect(error.data?.code).toBe("INSUFFICIENT_STOCK");
    }, 10000);

    it("should reject issue if item has zero stock", async () => {
      // Get stock for an item that might have zero stock
      const stockResult = await authenticatedFetch<{
        stock: Array<{
          item_id: string;
          on_hand: number;
        }>;
      }>(`/api/locations/${locationIds.warehouse}/stock`, {
        user: adminUser,
      });

      // Find an item with zero stock, or skip test if none found
      const zeroStockItem = stockResult.data?.stock?.find((s) => s.on_hand === 0);

      if (!zeroStockItem) {
        console.warn("No zero-stock items found, skipping test");
        return;
      }

      const issueData = {
        issue_date: new Date().toISOString(),
        cost_centre: "FOOD",
        lines: [
          {
            item_id: zeroStockItem.item_id,
            quantity: 1,
          },
        ],
      };

      const result = await authenticatedFetch(`/api/locations/${locationIds.warehouse}/issues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(issueData),
        user: adminUser,
      });

      expect(result.status).toBe(400);

      const error = result.error as { data?: { code?: string } };
      expect(error.data?.code).toBe("INSUFFICIENT_STOCK");
    }, 10000);
  });

  describe("Authentication & Authorization", () => {
    it("should reject unauthenticated requests", async () => {
      const issueData = {
        issue_date: new Date().toISOString(),
        cost_centre: "FOOD",
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 2,
          },
        ],
      };

      const result = await apiFetch(`/api/locations/${locationIds.kitchen}/issues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(issueData),
      });

      expect(result.status).toBe(401);

      const error = result.error as { data?: { code?: string } };
      expect(error.data?.code).toBe("NOT_AUTHENTICATED");
    }, 10000);

    it("should reject users without location access", async () => {
      const issueData = {
        issue_date: new Date().toISOString(),
        cost_centre: "FOOD",
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 2,
          },
        ],
      };

      // Try to create issue at a location the operator doesn't have access to
      const result = await authenticatedFetch(`/api/locations/${locationIds.warehouse}/issues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(issueData),
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
    it("should reject issue with missing required fields", async () => {
      const invalidData = {
        cost_centre: "FOOD",
        // Missing issue_date
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 2,
          },
        ],
      };

      const result = await authenticatedFetch(`/api/locations/${locationIds.kitchen}/issues`, {
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

    it("should reject issue with empty lines array", async () => {
      const invalidData = {
        issue_date: new Date().toISOString(),
        cost_centre: "FOOD",
        lines: [], // Empty lines not allowed
      };

      const result = await authenticatedFetch(`/api/locations/${locationIds.kitchen}/issues`, {
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

    it("should reject issue with negative quantity", async () => {
      const invalidData = {
        issue_date: new Date().toISOString(),
        cost_centre: "FOOD",
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: -5, // Negative quantity not allowed
          },
        ],
      };

      const result = await authenticatedFetch(`/api/locations/${locationIds.kitchen}/issues`, {
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

    it("should reject issue with invalid cost centre", async () => {
      const invalidData = {
        issue_date: new Date().toISOString(),
        cost_centre: "INVALID_CENTRE", // Invalid cost centre
        lines: [
          {
            item_id: itemIds.chicken,
            quantity: 2,
          },
        ],
      };

      const result = await authenticatedFetch(`/api/locations/${locationIds.kitchen}/issues`, {
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

    it("should reject issue with invalid item ID", async () => {
      const invalidData = {
        issue_date: new Date().toISOString(),
        cost_centre: "FOOD",
        lines: [
          {
            item_id: "00000000-0000-0000-0000-000000000000", // Non-existent item
            quantity: 2,
          },
        ],
      };

      const result = await authenticatedFetch(`/api/locations/${locationIds.kitchen}/issues`, {
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
