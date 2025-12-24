/**
 * GET /api/user/locations
 *
 * Get locations accessible by the current user
 * - Admins and Supervisors: All active locations
 * - Operators: Only assigned locations
 */

import prisma from "../../utils/prisma";
import { setCacheHeaders } from "../../utils/performance";

export default defineEventHandler(async (event) => {
  // Get user from session (auth middleware attaches it to event.context)
  const user = event.context.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      data: {
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      },
    });
  }

  try {
    // For ADMIN and SUPERVISOR, return all active locations (implicit access)
    if (user.role === "ADMIN" || user.role === "SUPERVISOR") {
      const locations = await prisma.location.findMany({
        where: {
          is_active: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      // Set cache headers (20 seconds for user locations)
      setCacheHeaders(event, {
        maxAge: 20,
        staleWhileRevalidate: 10,
      });

      return {
        locations,
      };
    }

    // For OPERATOR, return only assigned locations
    const userLocations = await prisma.userLocation.findMany({
      where: {
        user_id: user.id,
      },
      include: {
        location: true,
      },
    });

    // Filter active locations
    const locations = userLocations
      .filter((ul) => ul.location.is_active)
      .map((ul) => ul.location);

    // Set cache headers (20 seconds for user locations)
    setCacheHeaders(event, {
      maxAge: 20,
      staleWhileRevalidate: 10,
    });

    return {
      locations,
    };
  } catch (error) {
    console.error("Error fetching user locations:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch user locations",
      },
    });
  }
});
