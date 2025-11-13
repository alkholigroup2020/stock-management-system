import prisma from "../../utils/prisma";

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
    // Find the current OPEN period
    const currentPeriod = await prisma.period.findFirst({
      where: {
        status: "OPEN",
      },
      orderBy: {
        start_date: "desc",
      },
    });

    return {
      period: currentPeriod,
    };
  } catch (error) {
    console.error("Error fetching current period:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch current period",
      },
    });
  }
});
