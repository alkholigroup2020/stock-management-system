/**
 * Test endpoint for auth middleware
 * GET /api/test/protected
 *
 * This route is protected by auth middleware
 * Should return 401 if not authenticated
 */

export default defineEventHandler(async (event) => {
  // User is available from context (set by auth middleware)
  const user = event.context.user;

  return {
    success: true,
    message: "You are authenticated!",
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
});
