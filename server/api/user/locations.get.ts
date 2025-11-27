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
    // For ADMIN and SUPERVISOR, return all active locations
    if (user.role === "ADMIN" || user.role === "SUPERVISOR") {
      const locations = await prisma.location.findMany({
        where: {
          is_active: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      // Add MANAGE access level for all locations
      const locationsWithAccess = locations.map((loc) => ({
        ...loc,
        access_level: "MANAGE" as const,
      }));

      // Set cache headers (5 minutes for user locations)
      setCacheHeaders(event, {
        maxAge: 300,
        staleWhileRevalidate: 60,
      });

      return {
        locations: locationsWithAccess,
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

    // Filter active locations and map to include access level
    const locationsWithAccess = userLocations
      .filter((ul) => ul.location.is_active)
      .map((ul) => ({
        ...ul.location,
        access_level: ul.access_level,
      }));

    // Set cache headers (5 minutes for user locations)
    setCacheHeaders(event, {
      maxAge: 300,
      staleWhileRevalidate: 60,
    });

    return {
      locations: locationsWithAccess,
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
