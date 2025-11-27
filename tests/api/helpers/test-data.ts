/**
 * Test Data Helpers
 *
 * Provides access to test data IDs and constants for API tests
 * These values should match the seed data in prisma/seed.ts
 */

export const testUsers = {
  admin: {
    username: "admin",
    password: "Admin@123",
  },
  supervisor: {
    username: "admin", // Use admin for now as seed doesn't create supervisor
    password: "Admin@123",
  },
  operator: {
    username: "admin", // Use admin for now as seed doesn't create operator
    password: "Admin@123",
  },
};

/**
 * Get location IDs from the database
 * Note: These will be fetched dynamically during tests
 */
export async function getTestLocationIds(): Promise<{
  kitchen: string;
  store: string;
  warehouse: string;
}> {
  const response = await fetch("http://localhost:3001/api/locations");
  const data = await response.json();

  const kitchen = data.locations?.find((l: { code: string }) => l.code === "MAIN-KIT");
  const store = data.locations?.find((l: { code: string }) => l.code === "CENTRAL-01");
  const warehouse = data.locations?.find((l: { code: string }) => l.code === "WH-01");

  return {
    kitchen: kitchen?.id || "",
    store: store?.id || "",
    warehouse: warehouse?.id || "",
  };
}

/**
 * Get item IDs from the database
 */
export async function getTestItemIds(): Promise<{
  chicken: string;
  rice: string;
  oil: string;
}> {
  const response = await fetch("http://localhost:3001/api/items");
  const data = await response.json();

  const chicken = data.items?.find((i: { code: string }) => i.code === "MEAT-001");
  const rice = data.items?.find((i: { code: string }) => i.code === "DRY-001");
  const oil = data.items?.find((i: { code: string }) => i.code === "DRY-004");

  return {
    chicken: chicken?.id || "",
    rice: rice?.id || "",
    oil: oil?.id || "",
  };
}

/**
 * Get supplier IDs from the database
 */
export async function getTestSupplierIds(): Promise<{
  supplierA: string;
  supplierB: string;
}> {
  const response = await fetch("http://localhost:3001/api/suppliers");
  const data = await response.json();

  const supplierA = data.suppliers?.[0];
  const supplierB = data.suppliers?.[1];

  return {
    supplierA: supplierA?.id || "",
    supplierB: supplierB?.id || "",
  };
}

/**
 * Get current period ID
 */
export async function getCurrentPeriodId(): Promise<string> {
  const response = await fetch("http://localhost:3001/api/periods/current");
  const data = await response.json();

  return data.period?.id || "";
}
