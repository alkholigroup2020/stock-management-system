/**
 * GET /api/test/email-config
 *
 * Test endpoint to verify email configuration (ADMIN only)
 * Returns the current email configuration status without exposing credentials
 */

import type { UserRole } from "@prisma/client";

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

export default defineEventHandler(async (event) => {
  const user = event.context.user as AuthUser | undefined;

  // Only allow ADMIN users to access this endpoint
  if (!user || user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "ADMIN_ONLY",
        message: "Only admins can access email configuration test",
      },
    });
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpHost = process.env.SMTP_HOST || "smtp.office365.com";
  const smtpPort = process.env.SMTP_PORT || "587";
  const emailFrom = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@example.com";

  const isConfigured = !!(smtpUser && smtpPassword);

  return {
    status: isConfigured ? "configured" : "not_configured",
    config: {
      smtp_user: smtpUser
        ? `${smtpUser.substring(0, 3)}***@${smtpUser.split("@")[1] || ""}`
        : "NOT SET",
      smtp_password: smtpPassword ? "SET (hidden)" : "NOT SET",
      smtp_host: smtpHost,
      smtp_port: smtpPort,
      email_from: emailFrom,
    },
    warning: !isConfigured
      ? "SMTP credentials not configured. Emails will only be logged to console."
      : null,
    recommendation: !isConfigured
      ? "Set SMTP_USER and SMTP_PASSWORD environment variables in Vercel dashboard"
      : "Email service is properly configured",
  };
});
