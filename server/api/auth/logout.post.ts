/**
 * Logout API Route
 * POST /api/auth/logout
 *
 * Clears the user session and logs out the user
 */

export default defineEventHandler(async (event) => {
  try {
    // Clear user session using nuxt-auth-utils
    await clearUserSession(event);

    // Return success response
    return {
      success: true,
      message: "Logout successful",
    };
  } catch (error) {
    // Handle unexpected errors
    console.error("Logout error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "LOGOUT_ERROR",
        message: "An error occurred during logout",
      },
    });
  }
});
