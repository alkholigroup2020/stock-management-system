/**
 * Shared utilities for document number generation
 * Format: {Prefix}-{LocationName}-{DD}-{Mon}-{YYYY}-{NN}
 * Example: PRF-KITCHEN-27-Jan-2026-01
 */

import prisma from "./prisma";

/**
 * Sanitize location name for use in document numbers
 * - Converts to uppercase
 * - Replaces spaces with hyphens
 * - Removes special characters except hyphens
 * - Limits to 20 characters
 */
export function sanitizeLocationName(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-]/g, "")
    .substring(0, 20);
}

/**
 * Format date as DD-Mon-YYYY (e.g., 27-Jan-2026)
 */
export function formatDateForDocumentNumber(date: Date = new Date()): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const day = date.getDate().toString().padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

/**
 * Fetch and sanitize location name by ID
 */
export async function getLocationNameForDocument(locationId: string): Promise<string> {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: { name: true },
  });

  if (!location) {
    throw createError({
      statusCode: 404,
      statusMessage: "Location not found",
    });
  }

  return sanitizeLocationName(location.name);
}
