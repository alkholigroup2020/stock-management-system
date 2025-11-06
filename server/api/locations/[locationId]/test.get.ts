/**
 * Test endpoint for location access middleware
 * GET /api/locations/[locationId]/test
 *
 * This route is protected by both auth and location-access middleware
 * Should return 401 if not authenticated
 * Should return 403 if user doesn't have access to location
 */

export default defineEventHandler(async (event) => {
  // User and locationId are available from context (set by middleware)
  const user = event.context.user;
  const locationId = event.context.locationId;

  return {
    success: true,
    message: "You have access to this location!",
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    locationId,
    accessGranted: true,
  };
});
