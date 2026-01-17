/**
 * NCR Credit Utilities
 *
 * Provides query functions for calculating NCR financial impacts in reconciliations.
 * All queries filter by period and location to ensure accurate reconciliation calculations.
 */

import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * NCR Summary Item - Represents a single NCR in a summary
 */
export interface NCRSummaryItem {
  id: string;
  ncr_no: string;
  value: number;
  delivery_no?: string;
  item_name?: string;
  reason: string;
}

/**
 * NCR Summary Category - Aggregates NCRs by category
 */
export interface NCRSummaryCategory {
  total: number;
  count: number;
  ncrs: NCRSummaryItem[];
}

/**
 * Complete NCR Summary Response
 */
export interface NCRSummaryResponse {
  credited: NCRSummaryCategory;
  losses: NCRSummaryCategory;
  pending: NCRSummaryCategory;
  open: { count: number; ncrs: NCRSummaryItem[] };
}

/**
 * Get NCRs with CREDITED status OR RESOLVED with CREDIT impact for a period/location.
 * These NCRs reduce the reconciliation consumption (money recovered from suppliers).
 *
 * @param periodId - Period ID
 * @param locationId - Location ID
 * @returns Credited NCRs summary with total value, count, and detailed list
 */
export async function getCreditedNCRsForPeriod(
  periodId: string,
  locationId: string
): Promise<NCRSummaryCategory> {
  const periodStart = await getPeriodStartDate(periodId);
  const periodEnd = await getPeriodEndDate(periodId);

  const ncrs = await prisma.nCR.findMany({
    where: {
      location_id: locationId,
      AND: [
        // Financial impact filter
        {
          OR: [
            { status: "CREDITED" },
            {
              status: "RESOLVED",
              financial_impact: "CREDIT",
            },
          ],
        },
        // Period association filter
        {
          OR: [
            // NCRs linked to deliveries in this period
            {
              delivery: {
                period_id: periodId,
              },
            },
            // Manual NCRs without delivery link, use created_at fallback
            {
              delivery_id: null,
              created_at: {
                gte: periodStart,
                lte: periodEnd,
              },
            },
          ],
        },
      ],
    },
    include: {
      delivery: {
        select: {
          delivery_no: true,
          delivery_lines: {
            where: {
              ncr_id: { not: null },
            },
            select: {
              item: {
                select: {
                  name: true,
                },
              },
            },
            take: 1,
          },
        },
      },
    },
  });

  const items: NCRSummaryItem[] = ncrs.map((ncr) => ({
    id: ncr.id,
    ncr_no: ncr.ncr_no,
    value: Number(ncr.value),
    delivery_no: ncr.delivery?.delivery_no,
    item_name: ncr.delivery?.delivery_lines[0]?.item.name,
    reason: ncr.reason,
  }));

  const total = items.reduce((sum, item) => sum + item.value, 0);

  return {
    total,
    count: items.length,
    ncrs: items,
  };
}

/**
 * Get NCRs with REJECTED status OR RESOLVED with LOSS impact for a period/location.
 * These NCRs increase the reconciliation consumption (unrecovered costs absorbed by business).
 *
 * @param periodId - Period ID
 * @param locationId - Location ID
 * @returns Lost NCRs summary with total value, count, and detailed list
 */
export async function getLostNCRsForPeriod(
  periodId: string,
  locationId: string
): Promise<NCRSummaryCategory> {
  const periodStart = await getPeriodStartDate(periodId);
  const periodEnd = await getPeriodEndDate(periodId);

  const ncrs = await prisma.nCR.findMany({
    where: {
      location_id: locationId,
      AND: [
        // Financial impact filter
        {
          OR: [
            { status: "REJECTED" },
            {
              status: "RESOLVED",
              financial_impact: "LOSS",
            },
          ],
        },
        // Period association filter
        {
          OR: [
            // NCRs linked to deliveries in this period
            {
              delivery: {
                period_id: periodId,
              },
            },
            // Manual NCRs without delivery link, use created_at fallback
            {
              delivery_id: null,
              created_at: {
                gte: periodStart,
                lte: periodEnd,
              },
            },
          ],
        },
      ],
    },
    include: {
      delivery: {
        select: {
          delivery_no: true,
          delivery_lines: {
            where: {
              ncr_id: { not: null },
            },
            select: {
              item: {
                select: {
                  name: true,
                },
              },
            },
            take: 1,
          },
        },
      },
    },
  });

  const items: NCRSummaryItem[] = ncrs.map((ncr) => ({
    id: ncr.id,
    ncr_no: ncr.ncr_no,
    value: Number(ncr.value),
    delivery_no: ncr.delivery?.delivery_no,
    item_name: ncr.delivery?.delivery_lines[0]?.item.name,
    reason: ncr.reason,
  }));

  const total = items.reduce((sum, item) => sum + item.value, 0);

  return {
    total,
    count: items.length,
    ncrs: items,
  };
}

/**
 * Get NCRs with SENT status for a period/location.
 * These NCRs represent pending credits awaiting supplier response (informational only).
 *
 * @param periodId - Period ID
 * @param locationId - Location ID
 * @returns Pending NCRs summary with total value, count, and detailed list
 */
export async function getPendingNCRsForPeriod(
  periodId: string,
  locationId: string
): Promise<NCRSummaryCategory> {
  const periodStart = await getPeriodStartDate(periodId);
  const periodEnd = await getPeriodEndDate(periodId);

  const ncrs = await prisma.nCR.findMany({
    where: {
      location_id: locationId,
      status: "SENT",
      OR: [
        // NCRs linked to deliveries in this period
        {
          delivery: {
            period_id: periodId,
          },
        },
        // Manual NCRs without delivery link, use created_at fallback
        {
          delivery_id: null,
          created_at: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      ],
    },
    include: {
      delivery: {
        select: {
          delivery_no: true,
          delivery_lines: {
            where: {
              ncr_id: { not: null },
            },
            select: {
              item: {
                select: {
                  name: true,
                },
              },
            },
            take: 1,
          },
        },
      },
    },
  });

  const items: NCRSummaryItem[] = ncrs.map((ncr) => ({
    id: ncr.id,
    ncr_no: ncr.ncr_no,
    value: Number(ncr.value),
    delivery_no: ncr.delivery?.delivery_no,
    item_name: ncr.delivery?.delivery_lines[0]?.item.name,
    reason: ncr.reason,
  }));

  const total = items.reduce((sum, item) => sum + item.value, 0);

  return {
    total,
    count: items.length,
    ncrs: items,
  };
}

/**
 * Get NCRs with OPEN status for a period/location.
 * These NCRs are unresolved and require attention (shown as warnings during period close).
 *
 * @param periodId - Period ID
 * @param locationId - Location ID
 * @returns Open NCRs with count and detailed list
 */
export async function getOpenNCRsForPeriod(
  periodId: string,
  locationId: string
): Promise<{ count: number; ncrs: NCRSummaryItem[] }> {
  const periodStart = await getPeriodStartDate(periodId);
  const periodEnd = await getPeriodEndDate(periodId);

  const ncrs = await prisma.nCR.findMany({
    where: {
      location_id: locationId,
      status: "OPEN",
      OR: [
        // NCRs linked to deliveries in this period
        {
          delivery: {
            period_id: periodId,
          },
        },
        // Manual NCRs without delivery link, use created_at fallback
        {
          delivery_id: null,
          created_at: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      ],
    },
    include: {
      delivery: {
        select: {
          delivery_no: true,
          delivery_lines: {
            where: {
              ncr_id: { not: null },
            },
            select: {
              item: {
                select: {
                  name: true,
                },
              },
            },
            take: 1,
          },
        },
      },
    },
  });

  const items: NCRSummaryItem[] = ncrs.map((ncr) => ({
    id: ncr.id,
    ncr_no: ncr.ncr_no,
    value: Number(ncr.value),
    delivery_no: ncr.delivery?.delivery_no,
    item_name: ncr.delivery?.delivery_lines[0]?.item.name,
    reason: ncr.reason,
  }));

  return {
    count: items.length,
    ncrs: items,
  };
}

/**
 * Get complete NCR summary for a period/location.
 * Calls all four query functions in parallel for optimal performance.
 *
 * @param periodId - Period ID
 * @param locationId - Location ID
 * @returns Complete NCR summary with all categories
 */
export async function getAllNCRSummaryForPeriod(
  periodId: string,
  locationId: string
): Promise<NCRSummaryResponse> {
  const [credited, losses, pending, open] = await Promise.all([
    getCreditedNCRsForPeriod(periodId, locationId),
    getLostNCRsForPeriod(periodId, locationId),
    getPendingNCRsForPeriod(periodId, locationId),
    getOpenNCRsForPeriod(periodId, locationId),
  ]);

  return {
    credited,
    losses,
    pending,
    open,
  };
}

/**
 * Helper function to get period start date
 */
async function getPeriodStartDate(periodId: string): Promise<Date> {
  const period = await prisma.period.findUnique({
    where: { id: periodId },
    select: { start_date: true },
  });

  if (!period) {
    throw new Error(`Period not found: ${periodId}`);
  }

  return period.start_date;
}

/**
 * Helper function to get period end date
 */
async function getPeriodEndDate(periodId: string): Promise<Date> {
  const period = await prisma.period.findUnique({
    where: { id: periodId },
    select: { end_date: true },
  });

  if (!period) {
    throw new Error(`Period not found: ${periodId}`);
  }

  return period.end_date;
}
