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
 * Send PRF submission notification to Supervisors and Admins
 *
 * @param params - Notification parameters
 * @returns Promise<EmailResult>
 */
export async function sendPRFSubmissionNotification(params: {
  recipientEmails: string[];
  prfNumber: string;
  requesterName: string;
  locationName: string;
  prfType: string;
  category: string;
  totalValue: string;
  prfUrl: string;
}): Promise<EmailResult> {
  const {
    recipientEmails,
    prfNumber,
    requesterName,
    locationName,
    prfType,
    category,
    totalValue,
    prfUrl,
  } = params;

  if (recipientEmails.length === 0) {
    console.warn("[Email Service] No recipient emails provided for PRF submission notification");
    return { success: true, messageId: "no-recipients" };
  }

  const subject = `PRF ${prfNumber} Submitted - Approval Required`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">PRF Approval Required</h2>
      <p>A Purchase Requisition Form has been submitted and requires your approval.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>PRF Number:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${prfNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Submitted By:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${requesterName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Location:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${locationName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Type:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${prfType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Category:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${category}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Total Value:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${totalValue}</td>
        </tr>
      </table>

      <p>
        <a href="${prfUrl}" style="display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 6px;">
          Review & Approve PRF
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
 * Send PRF approval notification to the requester (creator)
 *
 * @param params - Notification parameters
 * @returns Promise<EmailResult>
 */
export async function sendPRFApprovedToRequesterNotification(params: {
  recipientEmail: string;
  prfNumber: string;
  approverName: string;
  locationName: string;
  totalValue: string;
  prfUrl: string;
}): Promise<EmailResult> {
  const { recipientEmail, prfNumber, approverName, locationName, totalValue, prfUrl } = params;

  if (!recipientEmail) {
    console.warn(
      "[Email Service] No recipient email provided for PRF approved requester notification"
    );
    return { success: true, messageId: "no-recipients" };
  }

  const subject = `PRF ${prfNumber} Approved`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">PRF Approved</h2>
      <p>Your Purchase Requisition Form has been approved and is now being processed by the Procurement team.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>PRF Number:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${prfNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Approved By:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${approverName}</td>
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

      <div style="background-color: #d1fae5; border: 1px solid #6ee7b7; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <p style="color: #065f46; margin: 0;">
          ✅ A Purchase Order will be created by the Procurement team. You will be notified once the order is fulfilled.
        </p>
      </div>

      <p>
        <a href="${prfUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px;">
          View PRF
        </a>
      </p>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated notification from the Stock Management System.
      </p>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
  });
}

/**
 * Send PRF rejection notification to the requester
 *
 * @param params - Notification parameters
 * @returns Promise<EmailResult>
 */
export async function sendPRFRejectionNotification(params: {
  recipientEmail: string;
  prfNumber: string;
  rejectorName: string;
  locationName: string;
  rejectionReason: string;
  prfUrl: string;
}): Promise<EmailResult> {
  const { recipientEmail, prfNumber, rejectorName, locationName, rejectionReason, prfUrl } = params;

  if (!recipientEmail) {
    console.warn("[Email Service] No recipient email provided for PRF rejection notification");
    return { success: true, messageId: "no-recipients" };
  }

  const subject = `PRF ${prfNumber} Rejected`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">PRF Rejected</h2>
      <p>Your Purchase Requisition Form has been rejected. Please review the rejection reason below.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>PRF Number:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${prfNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Rejected By:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${rejectorName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Location:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${locationName}</td>
        </tr>
      </table>

      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <h4 style="color: #dc2626; margin: 0 0 8px 0;">Rejection Reason:</h4>
        <p style="color: #7f1d1d; margin: 0;">${rejectionReason}</p>
      </div>

      <p>You can clone this PRF to create a new request with the necessary changes.</p>

      <p>
        <a href="${prfUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">
          View PRF
        </a>
      </p>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated notification from the Stock Management System.
      </p>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
  });
}

/**
 * Send PO closed notification to the original PRF requester
 *
 * @param params - Notification parameters
 * @returns Promise<EmailResult>
 */
export async function sendPOClosedNotification(params: {
  recipientEmail: string;
  poNumber: string;
  prfNumber: string;
  closedByName: string;
  supplierName: string;
  totalAmount: string;
  poUrl: string;
  // Optional fulfillment details for early closure
  fulfillmentPercent?: number;
  closureReason?: string;
  lineItems?: Array<{
    item_description: string;
    unit: string;
    ordered_qty: string;
    delivered_qty: string;
    remaining_qty: string;
    is_fulfilled: boolean;
  }>;
}): Promise<EmailResult> {
  const {
    recipientEmail,
    poNumber,
    prfNumber,
    closedByName,
    supplierName,
    totalAmount,
    poUrl,
    fulfillmentPercent = 100,
    closureReason,
    lineItems,
  } = params;

  if (!recipientEmail) {
    console.warn("[Email Service] No recipient email provided for PO closed notification");
    return { success: true, messageId: "no-recipients" };
  }

  const isFullyFulfilled = fulfillmentPercent === 100;
  const subject = isFullyFulfilled
    ? `PO ${poNumber} Closed - Your Request is Fulfilled`
    : `PO ${poNumber} Closed Early - ${fulfillmentPercent}% Fulfilled`;

  // Build the header message
  const headerMessage = isFullyFulfilled
    ? "The Purchase Order for your requisition has been closed and your request is now fulfilled."
    : `The Purchase Order for your requisition has been closed with <strong>${fulfillmentPercent}%</strong> of items delivered.`;

  // Build early closure reason section if applicable
  const closureReasonSection = closureReason
    ? `
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0;">
        <strong style="color: #92400e;">Closure Reason:</strong>
        <p style="margin: 8px 0 0 0; color: #78350f;">${closureReason}</p>
      </div>
    `
    : "";

  // Build line items table with fulfillment status
  const lineItemsSection =
    lineItems && lineItems.length > 0
      ? `
      <h3 style="color: #374151; margin-top: 24px; margin-bottom: 12px;">Delivery Status by Item</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 14px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
            <th style="padding: 10px 8px; text-align: center; border-bottom: 2px solid #e5e7eb;">Unit</th>
            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Ordered</th>
            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Delivered</th>
            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Remaining</th>
            <th style="padding: 10px 8px; text-align: center; border-bottom: 2px solid #e5e7eb;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${lineItems
            .map(
              (line) => `
            <tr>
              <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${line.item_description}</td>
              <td style="padding: 10px 8px; text-align: center; border-bottom: 1px solid #e5e7eb;">${line.unit}</td>
              <td style="padding: 10px 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${line.ordered_qty}</td>
              <td style="padding: 10px 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${line.delivered_qty}</td>
              <td style="padding: 10px 8px; text-align: right; border-bottom: 1px solid #e5e7eb; ${Number(line.remaining_qty) > 0 ? "color: #dc2626; font-weight: 600;" : ""}">${line.remaining_qty}</td>
              <td style="padding: 10px 8px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                ${line.is_fulfilled ? '<span style="color: #16a34a;">✓ Complete</span>' : '<span style="color: #dc2626;">✗ Incomplete</span>'}
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `
      : "";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${isFullyFulfilled ? "#3b82f6" : "#f59e0b"};">Purchase Order Closed</h2>
      <p>${headerMessage}</p>

      ${closureReasonSection}

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>PO Number:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${poNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Original PRF:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${prfNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Supplier:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${supplierName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Total Amount:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${totalAmount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Fulfillment:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; ${isFullyFulfilled ? "color: #16a34a;" : "color: #f59e0b;"} font-weight: 600;">${fulfillmentPercent}%</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Closed By:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${closedByName}</td>
        </tr>
      </table>

      ${lineItemsSection}

      <p>
        <a href="${poUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">
          View Purchase Order
        </a>
      </p>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated notification from the Stock Management System.
      </p>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
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
 * Send over-delivery approval notification to Supervisors
 *
 * @param params - Notification parameters
 * @returns Promise<EmailResult>
 */
export async function sendOverDeliveryApprovalNotification(params: {
  recipientEmails: string[];
  deliveryNumber: string;
  creatorName: string;
  locationName: string;
  overDeliveryItems: Array<{
    itemName: string;
    requestedQty: number;
    remainingQty: number;
    excessQty: number;
  }>;
  deliveryUrl: string;
}): Promise<EmailResult> {
  const {
    recipientEmails,
    deliveryNumber,
    creatorName,
    locationName,
    overDeliveryItems,
    deliveryUrl,
  } = params;

  if (recipientEmails.length === 0) {
    console.warn(
      "[Email Service] No recipient emails provided for over-delivery approval notification"
    );
    return { success: true, messageId: "no-recipients" };
  }

  const subject = `Over-Delivery Approval Required: ${deliveryNumber} at ${locationName}`;

  const itemsHtml = overDeliveryItems
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.itemName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.remainingQty.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.requestedQty.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #dc2626; font-weight: bold;">+${item.excessQty.toFixed(2)}</td>
        </tr>
      `
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">Over-Delivery Approval Required</h2>
      <p>A delivery draft has been created that requires supervisor approval due to over-delivery.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Delivery Number:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${deliveryNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Created By:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${creatorName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Location:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${locationName}</td>
        </tr>
      </table>

      <h3 style="color: #374151; margin-top: 20px;">Over-Delivery Items</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0; border: 1px solid #e5e7eb;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">PO Remaining</th>
            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Requested</th>
            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Excess</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <p style="margin-top: 20px;">
        <a href="${deliveryUrl}" style="display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 6px;">
          Review & Approve Delivery
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
 * Send over-delivery approved notification to the delivery creator
 *
 * @param params - Notification parameters
 * @returns Promise<EmailResult>
 */
export async function sendOverDeliveryApprovedNotification(params: {
  recipientEmail: string;
  deliveryNumber: string;
  approverName: string;
  locationName: string;
  approvedItems: Array<{
    itemName: string;
    requestedQty: number;
    remainingQty: number;
  }>;
  deliveryUrl: string;
}): Promise<EmailResult> {
  const { recipientEmail, deliveryNumber, approverName, locationName, approvedItems, deliveryUrl } =
    params;

  if (!recipientEmail) {
    console.warn(
      "[Email Service] No recipient email provided for over-delivery approved notification"
    );
    return { success: true, messageId: "no-recipients" };
  }

  const subject = `Over-Delivery Approved: ${deliveryNumber} at ${locationName}`;

  const itemsHtml = approvedItems
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.itemName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.remainingQty.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.requestedQty.toFixed(2)}</td>
        </tr>
      `
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Over-Delivery Approved</h2>
      <p>Your delivery draft has been approved and is ready to be posted.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Delivery Number:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${deliveryNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Approved By:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${approverName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Location:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${locationName}</td>
        </tr>
      </table>

      <h3 style="color: #374151; margin-top: 20px;">Approved Over-Delivery Items</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0; border: 1px solid #e5e7eb;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">PO Remaining</th>
            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Approved Qty</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <p style="margin-top: 20px;">
        <a href="${deliveryUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px;">
          View & Post Delivery
        </a>
      </p>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated notification from the Stock Management System.
      </p>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
  });
}

/**
 * Send over-delivery rejected notification to the delivery creator
 *
 * @param params - Notification parameters
 * @returns Promise<EmailResult>
 */
export async function sendOverDeliveryRejectedNotification(params: {
  recipientEmail: string;
  deliveryNumber: string;
  rejectorName: string;
  locationName: string;
  rejectionReason: string;
  rejectedItems: Array<{
    itemName: string;
    requestedQty: number;
    remainingQty: number;
  }>;
  deliveryUrl: string;
}): Promise<EmailResult> {
  const {
    recipientEmail,
    deliveryNumber,
    rejectorName,
    locationName,
    rejectionReason,
    rejectedItems,
    deliveryUrl,
  } = params;

  if (!recipientEmail) {
    console.warn(
      "[Email Service] No recipient email provided for over-delivery rejected notification"
    );
    return { success: true, messageId: "no-recipients" };
  }

  const subject = `Over-Delivery Rejected: ${deliveryNumber} at ${locationName}`;

  const itemsHtml = rejectedItems
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.itemName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.remainingQty.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #dc2626;">${item.requestedQty.toFixed(2)}</td>
        </tr>
      `
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Over-Delivery Rejected</h2>
      <p>Your delivery draft has been rejected due to over-delivery issues. Please review and correct the quantities.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Delivery Number:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${deliveryNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Rejected By:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${rejectorName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Location:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${locationName}</td>
        </tr>
      </table>

      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <h4 style="color: #dc2626; margin: 0 0 8px 0;">Rejection Reason:</h4>
        <p style="color: #7f1d1d; margin: 0;">${rejectionReason}</p>
      </div>

      <h3 style="color: #374151; margin-top: 20px;">Items Requiring Correction</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0; border: 1px solid #e5e7eb;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">PO Remaining</th>
            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Requested</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <p style="margin-top: 20px;">
        <a href="${deliveryUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">
          Edit Delivery
        </a>
      </p>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated notification from the Stock Management System.
      </p>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
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

// ========================================
// NCR NOTIFICATION TYPES
// ========================================

export interface NCRNotificationParams {
  // NCR details
  ncrId: string;
  ncrNo: string;
  ncrType: "MANUAL" | "PRICE_VARIANCE";
  autoGenerated: boolean;

  // Location
  locationName: string;

  // Content
  reason: string;
  value: string; // Formatted with currency (e.g., "SAR 1,234.56")
  createdAt: string; // ISO date string

  // Item details (for PRICE_VARIANCE)
  itemName?: string;
  itemCode?: string;
  quantity?: number;
  expectedPrice?: string; // Formatted with currency
  actualPrice?: string; // Formatted with currency
  varianceAmount?: string; // Formatted with currency
  variancePercent?: string; // Formatted percentage (e.g., "+5.2%")

  // Delivery reference (if linked)
  deliveryNo?: string;
  supplierName?: string;

  // Recipients
  financeTeamEmails: string[];
  procurementTeamEmails: string[];
  supplierEmails: string[];

  // System URLs
  ncrUrl: string; // Link to view NCR in system
}

export interface NCRNotificationResult {
  success: boolean;
  results: {
    finance: EmailResult & { skipped?: boolean };
    procurement: EmailResult & { skipped?: boolean };
    supplier: EmailResult & { skipped?: boolean };
  };
  logIds: string[]; // IDs of notification log entries created
}

// ========================================
// NCR NOTIFICATION EMAIL TEMPLATES
// ========================================

/**
 * Build HTML email content for internal teams (Finance/Procurement)
 */
export function buildNCRInternalEmailHtml(params: NCRNotificationParams): string {
  const {
    ncrNo,
    ncrType,
    locationName,
    reason,
    value,
    createdAt,
    itemName,
    itemCode,
    quantity,
    expectedPrice,
    actualPrice,
    varianceAmount,
    variancePercent,
    deliveryNo,
    supplierName,
    ncrUrl,
  } = params;

  const isPriceVariance = ncrType === "PRICE_VARIANCE";
  const typeDisplay = isPriceVariance ? "Price Variance" : "Manual NCR";

  // Format date for display
  const formattedDate = new Date(createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Build price variance details section
  const priceVarianceSection =
    isPriceVariance && itemName
      ? `
    <h3 style="color: #374151; margin-top: 20px;">Price Variance Details</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 10px 0; border: 1px solid #e5e7eb;">
      <tr style="background-color: #fef2f2;">
        <td style="padding: 8px;"><strong>Item:</strong></td>
        <td style="padding: 8px;">${itemCode} - ${itemName}</td>
      </tr>
      <tr>
        <td style="padding: 8px;"><strong>Quantity:</strong></td>
        <td style="padding: 8px;">${quantity}</td>
      </tr>
      <tr>
        <td style="padding: 8px;"><strong>Expected Price:</strong></td>
        <td style="padding: 8px;">${expectedPrice}</td>
      </tr>
      <tr>
        <td style="padding: 8px;"><strong>Actual Price:</strong></td>
        <td style="padding: 8px;">${actualPrice}</td>
      </tr>
      <tr style="background-color: #fef2f2;">
        <td style="padding: 8px;"><strong>Variance:</strong></td>
        <td style="padding: 8px; color: #dc2626; font-weight: bold;">${varianceAmount} (${variancePercent})</td>
      </tr>
    </table>
  `
      : "";

  // Build delivery reference section
  const deliverySection =
    deliveryNo || supplierName
      ? `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Delivery:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${deliveryNo || "N/A"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Supplier:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${supplierName || "N/A"}</td>
      </tr>
    `
      : "";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">NCR Created</h2>
      <p>A new Non-Conformance Report has been created and requires attention.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>NCR Number:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${ncrNo}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Type:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${typeDisplay}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Location:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${locationName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Value:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${value}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Date:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Reason:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${reason}</td>
        </tr>
        ${deliverySection}
      </table>

      ${priceVarianceSection}

      <p style="margin-top: 20px;">
        <a href="${ncrUrl}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px;">
          View NCR Details
        </a>
      </p>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated notification from the Stock Management System.
      </p>
    </div>
  `;
}

/**
 * Build HTML email content for Supplier
 * Different from internal email - no system link, includes contact instructions
 */
export function buildNCRSupplierEmailHtml(
  params: NCRNotificationParams,
  companyName: string = "Stock Management System"
): string {
  const {
    ncrNo,
    ncrType,
    reason,
    value,
    createdAt,
    itemName,
    itemCode,
    quantity,
    expectedPrice,
    actualPrice,
    deliveryNo,
    supplierName,
  } = params;

  const isPriceVariance = ncrType === "PRICE_VARIANCE";

  // Format date for display
  const formattedDate = new Date(createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Build price variance details section for supplier
  const priceVarianceSection =
    isPriceVariance && itemName
      ? `
    <h3 style="color: #374151; margin-top: 20px;">Details</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
      <tr>
        <td style="padding: 8px 0;"><strong>Item:</strong></td>
        <td style="padding: 8px 0;">${itemCode} - ${itemName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0;"><strong>Quantity:</strong></td>
        <td style="padding: 8px 0;">${quantity}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0;"><strong>Expected Unit Price:</strong></td>
        <td style="padding: 8px 0;">${expectedPrice}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0;"><strong>Invoiced Unit Price:</strong></td>
        <td style="padding: 8px 0;">${actualPrice}</td>
      </tr>
    </table>
  `
      : "";

  const nextStepsSection = isPriceVariance
    ? `
    <h3 style="color: #374151; margin-top: 20px;">Next Steps</h3>
    <p>Please review this Non-Conformance Report and respond with one of the following:</p>
    <ol>
      <li><strong>Credit Note:</strong> Issue a credit note for the variance amount</li>
      <li><strong>Explanation:</strong> Provide documentation supporting the price difference</li>
    </ol>
  `
    : `
    <h3 style="color: #374151; margin-top: 20px;">Next Steps</h3>
    <p>Please review this Non-Conformance Report and contact us to discuss resolution.</p>
  `;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Non-Conformance Report</h2>
      <p>Dear ${supplierName || "Supplier"},</p>
      <p>We are writing to inform you that a Non-Conformance Report has been raised regarding a recent delivery.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>NCR Reference:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${ncrNo}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Date:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${formattedDate}</td>
        </tr>
        ${
          deliveryNo
            ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Delivery Reference:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${deliveryNo}</td>
        </tr>
        `
            : ""
        }
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Issue:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${reason}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Value:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${value}</td>
        </tr>
      </table>

      ${priceVarianceSection}

      ${nextStepsSection}

      <p>Please reply to this email with your response or contact our procurement team directly.</p>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Best regards,<br>
        ${companyName}
      </p>
    </div>
  `;
}

// ========================================
// NCR NOTIFICATION MAIN FUNCTION
// ========================================

/**
 * Send NCR creation notification to all configured recipient groups
 *
 * @param params - NCR notification parameters
 * @returns Promise with results for each recipient group
 */
export async function sendNCRCreatedNotification(
  params: NCRNotificationParams
): Promise<NCRNotificationResult> {
  const { ncrNo, ncrType, financeTeamEmails, procurementTeamEmails, supplierEmails, supplierName } =
    params;

  const isPriceVariance = ncrType === "PRICE_VARIANCE";
  const typeDisplay = isPriceVariance ? "Price Variance" : "Manual NCR";

  const results: NCRNotificationResult = {
    success: true,
    results: {
      finance: { success: false, skipped: true },
      procurement: { success: false, skipped: true },
      supplier: { success: false, skipped: true },
    },
    logIds: [],
  };

  // Build email content
  const internalSubject = `NCR Created: ${ncrNo} - ${typeDisplay}`;
  const internalHtml = buildNCRInternalEmailHtml(params);

  const companyName = process.env.COMPANY_NAME || "Stock Management System";
  const supplierSubject = `Non-Conformance Report: ${ncrNo} - ${companyName}`;
  const supplierHtml = buildNCRSupplierEmailHtml(params, companyName);

  // Send to Finance Team
  if (financeTeamEmails.length > 0) {
    console.log(`[NCR Email] Sending to Finance Team: ${financeTeamEmails.join(", ")}`);
    const financeResult = await sendEmail({
      to: financeTeamEmails,
      subject: internalSubject,
      html: internalHtml,
    });
    results.results.finance = { ...financeResult, skipped: false };
  } else {
    console.log("[NCR Email] No Finance Team emails configured - skipping");
  }

  // Send to Procurement Team
  if (procurementTeamEmails.length > 0) {
    console.log(`[NCR Email] Sending to Procurement Team: ${procurementTeamEmails.join(", ")}`);
    const procurementResult = await sendEmail({
      to: procurementTeamEmails,
      subject: internalSubject,
      html: internalHtml,
    });
    results.results.procurement = { ...procurementResult, skipped: false };
  } else {
    console.log("[NCR Email] No Procurement Team emails configured - skipping");
  }

  // Send to Supplier
  if (supplierEmails.length > 0) {
    console.log(`[NCR Email] Sending to Supplier (${supplierName}): ${supplierEmails.join(", ")}`);
    const supplierResult = await sendEmail({
      to: supplierEmails,
      subject: supplierSubject,
      html: supplierHtml,
    });
    results.results.supplier = { ...supplierResult, skipped: false };
  } else {
    console.log("[NCR Email] No Supplier emails available - skipping");
  }

  // Determine overall success - success if at least one email was sent or all were skipped
  const sentOrSkipped =
    (results.results.finance.success || results.results.finance.skipped === true) &&
    (results.results.procurement.success || results.results.procurement.skipped === true) &&
    (results.results.supplier.success || results.results.supplier.skipped === true);

  results.success = Boolean(sentOrSkipped);

  return results;
}

/**
 * Resolve NCR notification recipients from database
 *
 * @param ncrId - NCR ID to fetch recipients for
 * @param prisma - Prisma client instance
 * @returns Promise with recipient email arrays
 */
export async function resolveNCRNotificationRecipients(
  ncrId: string,
  prisma: {
    notificationSetting: {
      findMany: (args: {
        where: { key: { in: string[] } };
      }) => Promise<Array<{ key: string; emails: string[] }>>;
    };
    nCR: {
      findUnique: (args: {
        where: { id: string };
        include: { delivery: { include: { supplier: boolean } } };
      }) => Promise<{
        delivery?: {
          supplier?: {
            emails: string[];
          } | null;
        } | null;
      } | null>;
    };
  }
): Promise<{
  financeTeamEmails: string[];
  procurementTeamEmails: string[];
  supplierEmails: string[];
}> {
  // Fetch notification settings
  const settings = await prisma.notificationSetting.findMany({
    where: { key: { in: ["NCR_FINANCE_TEAM_EMAILS", "NCR_PROCUREMENT_TEAM_EMAILS"] } },
  });

  // Fetch NCR with delivery and supplier
  const ncr = await prisma.nCR.findUnique({
    where: { id: ncrId },
    include: { delivery: { include: { supplier: true } } },
  });

  const financeSetting = settings.find((s) => s.key === "NCR_FINANCE_TEAM_EMAILS");
  const procurementSetting = settings.find((s) => s.key === "NCR_PROCUREMENT_TEAM_EMAILS");

  return {
    financeTeamEmails: financeSetting?.emails || [],
    procurementTeamEmails: procurementSetting?.emails || [],
    supplierEmails: ncr?.delivery?.supplier?.emails || [],
  };
}

/**
 * Log notification attempt to database
 *
 * @param ncrId - NCR ID
 * @param recipientType - FINANCE, PROCUREMENT, or SUPPLIER
 * @param recipients - Email addresses sent to
 * @param result - Email send result
 * @param prisma - Prisma client instance
 * @returns Promise with created log ID
 */
export async function logNCRNotification(
  ncrId: string,
  recipientType: "FINANCE" | "PROCUREMENT" | "SUPPLIER",
  recipients: string[],
  result: EmailResult & { skipped?: boolean },
  prisma: {
    nCRNotificationLog: {
      create: (args: {
        data: {
          ncr_id: string;
          recipient_type: "FINANCE" | "PROCUREMENT" | "SUPPLIER";
          recipients: string[];
          status: "SENT" | "FAILED";
          error_message?: string | null;
        };
      }) => Promise<{ id: string }>;
    };
  }
): Promise<string | null> {
  // Don't log if skipped (no recipients)
  if (result.skipped) {
    return null;
  }

  const log = await prisma.nCRNotificationLog.create({
    data: {
      ncr_id: ncrId,
      recipient_type: recipientType,
      recipients,
      status: result.success ? "SENT" : "FAILED",
      error_message: result.error || null,
    },
  });

  return log.id;
}

/**
 * Fire-and-forget wrapper for NCR notification
 * Use this in API handlers to send notifications without blocking the response
 *
 * @param ncrId - NCR ID to send notification for
 * @param prisma - Prisma client instance
 */
export function triggerNCRNotification(
  ncrId: string,
  prisma: {
    nCR: {
      findUnique: (args: {
        where: { id: string };
        include: {
          location: { select: { name: boolean } };
          delivery: { include: { supplier: boolean } };
          delivery_line: { include: { item: boolean } };
        };
      }) => Promise<{
        id: string;
        ncr_no: string;
        type: "MANUAL" | "PRICE_VARIANCE";
        auto_generated: boolean;
        reason: string;
        value: { toString: () => string };
        quantity?: { toString: () => string } | null;
        created_at: Date;
        location: { name: string };
        delivery?: {
          delivery_no: string;
          supplier?: {
            name: string;
            emails: string[];
          } | null;
        } | null;
        delivery_line?: {
          unit_price: { toString: () => string };
          period_price: { toString: () => string };
          item?: {
            code: string;
            name: string;
          } | null;
        } | null;
      } | null>;
    };
    notificationSetting: {
      findMany: (args: {
        where: { key: { in: string[] } };
      }) => Promise<Array<{ key: string; emails: string[] }>>;
    };
    nCRNotificationLog: {
      create: (args: {
        data: {
          ncr_id: string;
          recipient_type: "FINANCE" | "PROCUREMENT" | "SUPPLIER";
          recipients: string[];
          status: "SENT" | "FAILED";
          error_message?: string | null;
        };
      }) => Promise<{ id: string }>;
    };
  }
): void {
  // Fire-and-forget - don't await
  void (async () => {
    try {
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
        console.error(`[NCR Notification] NCR not found: ${ncrId}`);
        return;
      }

      // Fetch notification settings
      const settings = await prisma.notificationSetting.findMany({
        where: { key: { in: ["NCR_FINANCE_TEAM_EMAILS", "NCR_PROCUREMENT_TEAM_EMAILS"] } },
      });

      const financeSetting = settings.find((s) => s.key === "NCR_FINANCE_TEAM_EMAILS");
      const procurementSetting = settings.find((s) => s.key === "NCR_PROCUREMENT_TEAM_EMAILS");

      const financeTeamEmails = financeSetting?.emails || [];
      const procurementTeamEmails = procurementSetting?.emails || [];
      const supplierEmails = ncr.delivery?.supplier?.emails || [];

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
        const percentChange = ((variance / expectedPrice) * 100).toFixed(1);
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
        financeTeamEmails,
        procurementTeamEmails,
        supplierEmails,
        ncrUrl,
      };

      // Send notifications
      const result = await sendNCRCreatedNotification(params);

      // Log notification attempts
      if (!result.results.finance.skipped) {
        await logNCRNotification(
          ncrId,
          "FINANCE",
          financeTeamEmails,
          result.results.finance,
          prisma
        );
      }

      if (!result.results.procurement.skipped) {
        await logNCRNotification(
          ncrId,
          "PROCUREMENT",
          procurementTeamEmails,
          result.results.procurement,
          prisma
        );
      }

      if (!result.results.supplier.skipped) {
        await logNCRNotification(
          ncrId,
          "SUPPLIER",
          supplierEmails,
          result.results.supplier,
          prisma
        );
      }

      console.log(
        `[NCR Notification] Completed for ${ncr.ncr_no}: Finance=${result.results.finance.success || result.results.finance.skipped ? "OK" : "FAIL"}, Procurement=${result.results.procurement.success || result.results.procurement.skipped ? "OK" : "FAIL"}, Supplier=${result.results.supplier.success || result.results.supplier.skipped ? "OK" : "FAIL"}`
      );
    } catch (error) {
      console.error(`[NCR Notification] Failed to send notification for NCR ${ncrId}:`, error);
    }
  })();
}
