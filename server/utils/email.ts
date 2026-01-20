/**
 * Email Service Utility
 *
 * Provides email notification functionality using Office 365 SMTP via Nodemailer.
 * Includes error handling, logging, and development mode fallback.
 *
 * @see https://nodemailer.com/
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// ========================================
// TYPES
// ========================================

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ========================================
// CONFIGURATION
// ========================================

/**
 * Create Office 365 SMTP transporter
 * Returns null if credentials are not configured
 */
function createTransporter(): Transporter | null {
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpHost = process.env.SMTP_HOST || "smtp.office365.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);

  if (!smtpUser || !smtpPassword) {
    console.warn(
      "[Email Service] SMTP_USER or SMTP_PASSWORD not configured - emails will be logged only"
    );
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false, // Use STARTTLS
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    tls: {
      ciphers: "SSLv3",
      rejectUnauthorized: false,
    },
  });
}

/**
 * Get the FROM email address from environment
 * Defaults to SMTP_USER if not configured
 */
function getFromEmail(): string {
  return process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@example.com";
}

// ========================================
// MAIN EMAIL FUNCTION
// ========================================

/**
 * Send an email using Office 365 SMTP
 *
 * @param options - Email options (to, subject, html, text, replyTo)
 * @returns Promise<EmailResult> with success status and optional messageId/error
 *
 * @example
 * ```ts
 * const result = await sendEmail({
 *   to: "recipient@example.com",
 *   subject: "PRF Approved",
 *   html: "<p>Your PRF has been approved.</p>",
 * });
 *
 * if (result.success) {
 *   console.log("Email sent:", result.messageId);
 * } else {
 *   console.error("Email failed:", result.error);
 * }
 * ```
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const { to, subject, html, text, replyTo } = options;

  // Normalize recipients to array
  const recipients = Array.isArray(to) ? to : [to];

  // Log email attempt
  console.log(`[Email Service] Attempting to send email to ${recipients.join(", ")}`);
  console.log(`[Email Service] Subject: ${subject}`);

  // Development mode fallback - log email instead of sending
  const transporter = createTransporter();
  if (!transporter) {
    console.log("[Email Service] Development mode - email logged but not sent:");
    console.log("[Email Service] ----------------------------------------");
    console.log(`[Email Service] To: ${recipients.join(", ")}`);
    console.log(`[Email Service] Subject: ${subject}`);
    console.log(`[Email Service] Body (HTML): ${html.substring(0, 200)}...`);
    console.log("[Email Service] ----------------------------------------");

    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    };
  }

  try {
    const fromEmail = getFromEmail();
    const result = await transporter.sendMail({
      from: fromEmail,
      to: recipients.join(", "),
      subject,
      html,
      text: text || stripHtml(html),
      replyTo,
    });

    console.log(`[Email Service] Email sent successfully: ${result.messageId}`);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`[Email Service] Failed to send email: ${error.message}`);

    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}

// ========================================
// SPECIALIZED EMAIL FUNCTIONS
// ========================================

/**
 * Send PRF approval notification to procurement specialists
 *
 * @param params - Notification parameters
 * @returns Promise<EmailResult>
 */
export async function sendPRFApprovalNotification(params: {
  recipientEmails: string[];
  prfNumber: string;
  requesterName: string;
  locationName: string;
  totalValue: string;
  prfUrl: string;
}): Promise<EmailResult> {
  const { recipientEmails, prfNumber, requesterName, locationName, totalValue, prfUrl } = params;

  if (recipientEmails.length === 0) {
    console.warn("[Email Service] No recipient emails provided for PRF approval notification");
    return { success: true, messageId: "no-recipients" };
  }

  const subject = `PRF ${prfNumber} Approved - Ready for PO Creation`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">PRF Approved</h2>
      <p>A Purchase Requisition Form has been approved and is ready for PO creation.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>PRF Number:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${prfNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Requested By:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${requesterName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Location:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${locationName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Total Value:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${totalValue}</td>
        </tr>
      </table>

      <p>
        <a href="${prfUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px;">
          View PRF & Create PO
        </a>
      </p>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated notification from the Stock Management System.
      </p>
    </div>
  `;

  return sendEmail({
    to: recipientEmails,
    subject,
    html,
  });
}

/**
 * Send PO notification to supplier
 *
 * @param params - Notification parameters
 * @returns Promise<EmailResult>
 */
export async function sendPOToSupplier(params: {
  supplierEmails: string[];
  poNumber: string;
  supplierName: string;
  totalAmount: string;
  deliveryTerms: string | null;
  paymentTerms: string | null;
  poUrl: string;
  companyName?: string;
}): Promise<EmailResult> {
  const {
    supplierEmails,
    poNumber,
    supplierName,
    totalAmount,
    deliveryTerms,
    paymentTerms,
    poUrl,
    companyName = "Stock Management System",
  } = params;

  if (supplierEmails.length === 0) {
    console.warn("[Email Service] No supplier emails provided for PO notification");
    return { success: true, messageId: "no-recipients" };
  }

  const subject = `Purchase Order ${poNumber} from ${companyName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">New Purchase Order</h2>
      <p>Dear ${supplierName},</p>
      <p>Please find attached our Purchase Order with the following details:</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>PO Number:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${poNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Total Amount (incl. VAT):</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${totalAmount}</td>
        </tr>
        ${
          deliveryTerms
            ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Delivery Terms:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${deliveryTerms}</td>
        </tr>
        `
            : ""
        }
        ${
          paymentTerms
            ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Payment Terms:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${paymentTerms}</td>
        </tr>
        `
            : ""
        }
      </table>

      <p>
        <a href="${poUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">
          View Purchase Order
        </a>
      </p>

      <p>Please confirm receipt of this order and expected delivery date.</p>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Best regards,<br>
        ${companyName}
      </p>
    </div>
  `;

  return sendEmail({
    to: supplierEmails,
    subject,
    html,
  });
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Strip HTML tags from a string
 * Used to generate plain text version of emails
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
