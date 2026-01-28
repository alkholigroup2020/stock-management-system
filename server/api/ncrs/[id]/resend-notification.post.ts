/**
 * POST /api/ncrs/:id/resend-notification
 *
 * Resend NCR notification to a specific recipient group
 *
 * Request body:
 * - recipient_type: "FINANCE" | "PROCUREMENT" | "SUPPLIER"
 *
 * Features:
 * - 5-minute rate limit per recipient group
 * - Creates new notification log entry
 * - Admin only
 */

import { z } from "zod";
import prisma from "../../../utils/prisma";
import {
  sendEmail,
  buildNCRInternalEmailHtml,
  buildNCRSupplierEmailHtml,
  logNCRNotification,
  type NCRNotificationParams,
} from "../../../utils/email";
import type { UserRole } from "@prisma/client";

// Request schema
const resendSchema = z.object({
  recipient_type: z.enum(["FINANCE", "PROCUREMENT", "SUPPLIER"]),
});

// Rate limit: 5 minutes in milliseconds
const RATE_LIMIT_MS = 5 * 60 * 1000;

// User session type
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

export default defineEventHandler(async (event) => {
  const user = event.context.user as AuthUser | undefined;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      data: {
        code: "NOT_AUTHENTICATED",
        message: "You must be logged in to access this resource",
      },
    });
  }

  // Only admins can resend notifications
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "ADMIN_REQUIRED",
        message: "Only administrators can resend notifications",
      },
    });
  }

  const ncrId = getRouterParam(event, "id");
  if (!ncrId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        code: "MISSING_ID",
        message: "NCR ID is required",
      },
    });
  }

  // Parse and validate request body
  const body = await readBody(event);
  const parseResult = resendSchema.safeParse(body);

  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: parseResult.error.issues,
      },
    });
  }

  const { recipient_type } = parseResult.data;

  try {
    // Check rate limit - find last notification log for this NCR and recipient type
    const lastLog = await prisma.nCRNotificationLog.findFirst({
      where: {
        ncr_id: ncrId,
        recipient_type,
      },
      orderBy: {
        sent_at: "desc",
      },
    });

    if (lastLog) {
      const timeSinceLastSend = Date.now() - new Date(lastLog.sent_at).getTime();
      if (timeSinceLastSend < RATE_LIMIT_MS) {
        const remainingSeconds = Math.ceil((RATE_LIMIT_MS - timeSinceLastSend) / 1000);
        throw createError({
          statusCode: 429,
          statusMessage: "Too Many Requests",
          data: {
            code: "RATE_LIMITED",
            message: `Please wait ${Math.ceil(remainingSeconds / 60)} minutes before resending`,
            remaining_seconds: remainingSeconds,
          },
        });
      }
    }

    // Fetch NCR with all related data
    const ncr = await prisma.nCR.findUnique({
      where: { id: ncrId },
      include: {
        location: { select: { name: true } },
        delivery: { include: { supplier: true } },
        delivery_line: { include: { item: true } },
      },
    });

    if (!ncr) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "NCR_NOT_FOUND",
          message: "NCR not found",
        },
      });
    }

    // Get recipients based on type
    let recipients: string[] = [];
    let subject: string;
    let html: string;

    // Fetch notification settings for internal teams
    const settings = await prisma.notificationSetting.findMany({
      where: { key: { in: ["NCR_FINANCE_TEAM_EMAILS", "NCR_PROCUREMENT_TEAM_EMAILS"] } },
    });

    const financeSetting = settings.find((s) => s.key === "NCR_FINANCE_TEAM_EMAILS");
    const procurementSetting = settings.find((s) => s.key === "NCR_PROCUREMENT_TEAM_EMAILS");

    // Build site URL
    const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const ncrUrl = `${siteUrl}/ncrs/${ncr.id}`;

    // Calculate variance details for price variance NCRs
    let varianceAmount: string | undefined;
    let variancePercent: string | undefined;
    const isPriceVariance = ncr.type === "PRICE_VARIANCE";

    if (isPriceVariance && ncr.delivery_line) {
      const actualPrice = parseFloat(ncr.delivery_line.unit_price.toString());
      const expectedPrice = parseFloat(ncr.delivery_line.period_price.toString());
      const variance = actualPrice - expectedPrice;
      const percentValue =
        expectedPrice > 0 ? (variance / expectedPrice) * 100 : actualPrice > 0 ? 100 : 0;
      const percentChange = percentValue.toFixed(1);
      const sign = variance >= 0 ? "+" : "";

      varianceAmount = `SAR ${Math.abs(variance).toFixed(2)}`;
      variancePercent = `${sign}${percentChange}%`;
    }

    // Build notification params
    const params: NCRNotificationParams = {
      ncrId: ncr.id,
      ncrNo: ncr.ncr_no,
      ncrType: ncr.type,
      autoGenerated: ncr.auto_generated,
      locationName: ncr.location.name,
      reason: ncr.reason,
      value: `SAR ${parseFloat(ncr.value.toString()).toFixed(2)}`,
      createdAt: ncr.created_at.toISOString(),
      itemName: ncr.delivery_line?.item?.name,
      itemCode: ncr.delivery_line?.item?.code,
      quantity: ncr.quantity ? parseFloat(ncr.quantity.toString()) : undefined,
      expectedPrice: ncr.delivery_line
        ? `SAR ${parseFloat(ncr.delivery_line.period_price.toString()).toFixed(2)}`
        : undefined,
      actualPrice: ncr.delivery_line
        ? `SAR ${parseFloat(ncr.delivery_line.unit_price.toString()).toFixed(2)}`
        : undefined,
      varianceAmount,
      variancePercent,
      deliveryNo: ncr.delivery?.delivery_no,
      supplierName: ncr.delivery?.supplier?.name,
      financeTeamEmails: financeSetting?.emails || [],
      procurementTeamEmails: procurementSetting?.emails || [],
      supplierEmails: ncr.delivery?.supplier?.emails || [],
      ncrUrl,
    };

    const typeDisplay = isPriceVariance ? "Price Variance" : "Manual NCR";
    const companyName = process.env.COMPANY_NAME || "Stock Management System";

    // Determine recipients and build email content based on type
    switch (recipient_type) {
      case "FINANCE":
        recipients = financeSetting?.emails || [];
        subject = `NCR Created: ${ncr.ncr_no} - ${typeDisplay}`;
        html = buildNCRInternalEmailHtml(params);
        break;
      case "PROCUREMENT":
        recipients = procurementSetting?.emails || [];
        subject = `NCR Created: ${ncr.ncr_no} - ${typeDisplay}`;
        html = buildNCRInternalEmailHtml(params);
        break;
      case "SUPPLIER":
        recipients = ncr.delivery?.supplier?.emails || [];
        subject = `Non-Conformance Report: ${ncr.ncr_no} - ${companyName}`;
        html = buildNCRSupplierEmailHtml(params, companyName);
        break;
    }

    // Check if there are recipients
    if (recipients.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "NO_RECIPIENTS",
          message: `No ${recipient_type.toLowerCase()} email addresses configured`,
        },
      });
    }

    // Send email
    const emailResult = await sendEmail({
      to: recipients,
      subject,
      html,
    });

    // Log the notification attempt
    await logNCRNotification(ncrId, recipient_type, recipients, emailResult, prisma);

    if (!emailResult.success) {
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
        data: {
          code: "EMAIL_SEND_FAILED",
          message: emailResult.error || "Failed to send notification",
        },
      });
    }

    console.log(
      `[NCR Notification] Resent to ${recipient_type} for ${ncr.ncr_no} by ${user.username}`
    );

    return {
      message: "Notification sent successfully",
      recipient_type,
      recipients,
    };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error resending notification:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to resend notification",
      },
    });
  }
});
