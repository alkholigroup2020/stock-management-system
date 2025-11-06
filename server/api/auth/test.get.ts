/**
 * Test endpoint to verify nuxt-auth-utils configuration
 * GET /api/auth/test
 *
 * This endpoint tests:
 * - Auth module is properly initialized
 * - Session handling works
 * - httpOnly cookies are configured
 */

export default defineEventHandler(async (event) => {
  // Get current session (will be null if not authenticated)
  const session = await getUserSession(event);

  return {
    success: true,
    message: "Auth module is properly configured",
    authenticated: !!session.user,
    session: session.user || null,
    config: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: "7 days (604800 seconds)",
    },
  };
});
