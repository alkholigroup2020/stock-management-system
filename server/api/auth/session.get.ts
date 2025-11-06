/**
 * Session API Route
 * GET /api/auth/session
 *
 * Returns the current user session or null if not authenticated
 */

export default defineEventHandler(async (event) => {
  try {
    // Get current user session using nuxt-auth-utils
    const session = await getUserSession(event);

    // Return user data if authenticated, null otherwise
    return {
      success: true,
      authenticated: !!session.user,
      user: session.user || null,
      loggedInAt: session.loggedInAt || null,
    };
  } catch (error) {
    // Handle unexpected errors
    console.error("Session error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "SESSION_ERROR",
        message: "An error occurred while retrieving session",
      },
    });
  }
});
