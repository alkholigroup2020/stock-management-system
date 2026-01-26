/**
 * POST /api/test/send-test-email
 *
 * Send a test email to verify SMTP configuration (ADMIN only)
 */

import type { UserRole } from "@prisma/client";
import { sendEmail } from "../../utils/email";
import { z } from "zod";

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

const bodySchema = z.object({
  recipient_email: z.string().email("Invalid email address"),
});

export default defineEventHandler(async (event) => {
  const user = event.context.user as AuthUser | undefined;

  // Only allow ADMIN users to access this endpoint
  if (!user || user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "ADMIN_ONLY",
        message: "Only admins can send test emails",
      },
    });
  }

  try {
    const body = await readBody(event);
    const { recipient_email } = bodySchema.parse(body);

    const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const result = await sendEmail({
      to: recipient_email,
      subject: "Test Email - Stock Management System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Email Configuration Test</h2>
          <p>This is a test email from the Stock Management System.</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Environment:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${process.env.NODE_ENV || "production"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Sent At:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${new Date().toISOString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Base URL:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${baseUrl}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Sent By:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${user.username} (${user.email})</td>
            </tr>
          </table>

          <div style="background-color: #d1fae5; border: 1px solid #6ee7b7; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="color: #065f46; margin: 0;">
              ✅ If you receive this email, your SMTP configuration is working correctly!
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This is an automated test email from the Stock Management System.
          </p>
        </div>
      `,
    });

    if (result.success) {
      return {
        success: true,
        message: `Test email sent successfully to ${recipient_email}`,
        messageId: result.messageId,
        smtp_configured: true,
      };
    } else {
      return {
        success: false,
        message: "Email failed to send",
        error: result.error,
        smtp_configured: false,
        recommendation: "Check SMTP credentials in environment variables and verify server logs",
      };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid email address",
          details: error.issues,
        },
      });
    }

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error sending test email:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "EMAIL_TEST_FAILED",
        message: "Failed to send test email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
