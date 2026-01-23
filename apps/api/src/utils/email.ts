/**
 * Email Service Utility
 *
 * Provides email sending functionality using Resend as the email provider.
 * Includes pre-built functions for sending different types of transactional emails.
 *
 * Environment Variables:
 * - RESEND_API_KEY: Your Resend API key (required for sending emails)
 * - APP_URL: Base URL for the application (used for generating links in emails)
 * - EMAIL_FROM: Default sender email address (optional, defaults to onboarding@resend.dev)
 *
 * @see AXO-112: Create invitation email template and sending
 */

import { Resend } from "resend";
import { render } from "@react-email/render";
import {
  PortfolioInvitationEmail,
  type PortfolioInvitationEmailProps,
  WelcomeEmail,
  type WelcomeEmailProps,
} from "@axori/shared/src/email/templates";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default sender email address
 * In production, this should be a verified domain address
 */
const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM || "Axori <onboarding@resend.dev>";

/**
 * Base URL for the application
 * Used for generating links in emails
 */
const APP_URL = process.env.APP_URL || "http://localhost:3000";

/**
 * Resend client instance
 * Lazily initialized on first use
 */
let resendClient: Resend | null = null;

/**
 * Gets the Resend client instance
 * Creates a new instance if one doesn't exist
 *
 * @returns The Resend client instance or null if API key is not configured
 */
function getResendClient(): Resend | null {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("⚠️  RESEND_API_KEY not configured. Email sending is disabled.");
      return null;
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// ============================================================================
// Types
// ============================================================================

/**
 * Result of an email send operation
 */
export interface SendEmailResult {
  /** Whether the email was sent successfully */
  success: boolean;
  /** The Resend message ID if successful */
  messageId?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Options for sending a portfolio invitation email
 */
export interface SendInvitationEmailOptions {
  /** Email address of the recipient */
  to: string;
  /** Name of the recipient (if known) */
  recipientName?: string;
  /** Name of the person sending the invitation */
  inviterName: string;
  /** Email of the person sending the invitation */
  inviterEmail: string;
  /** Name of the portfolio */
  portfolioName: string;
  /** Role being assigned */
  role: "admin" | "member" | "viewer";
  /** The invitation token */
  token: string;
  /** When the invitation expires */
  expiresAt: Date;
}

/**
 * Options for sending a welcome email
 */
export interface SendWelcomeEmailOptions {
  /** Email address of the recipient */
  to: string;
  /** Name of the recipient */
  name: string;
}

// ============================================================================
// Email Sending Functions
// ============================================================================

/**
 * Sends a portfolio invitation email
 *
 * Sends an email to the specified recipient inviting them to join a portfolio.
 * The email includes:
 * - Who invited them
 * - Which portfolio they're invited to
 * - Their assigned role
 * - A secure link to accept the invitation
 * - Expiration information
 *
 * @param options - The invitation email options
 * @returns The result of the send operation
 *
 * @example
 * ```ts
 * const result = await sendInvitationEmail({
 *   to: "user@example.com",
 *   recipientName: "John Doe",
 *   inviterName: "Jane Smith",
 *   inviterEmail: "jane@example.com",
 *   portfolioName: "Family Properties",
 *   role: "member",
 *   token: "secure-token-123",
 *   expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
 * });
 *
 * if (result.success) {
 *   console.log(`Email sent with ID: ${result.messageId}`);
 * } else {
 *   console.error(`Failed to send email: ${result.error}`);
 * }
 * ```
 */
export async function sendInvitationEmail(
  options: SendInvitationEmailOptions
): Promise<SendEmailResult> {
  const resend = getResendClient();

  if (!resend) {
    console.log("📧 [Mock] Invitation email would be sent to:", options.to);
    console.log("📧 [Mock] Invitation URL:", `${APP_URL}/invitation/accept?token=${options.token}`);
    return {
      success: true,
      messageId: "mock-message-id-" + Date.now(),
    };
  }

  try {
    // Build the invitation URL
    const invitationUrl = `${APP_URL}/invitation/accept?token=${options.token}`;

    // Build the email props
    const emailProps: PortfolioInvitationEmailProps = {
      recipientName: options.recipientName,
      recipientEmail: options.to,
      inviterName: options.inviterName,
      inviterEmail: options.inviterEmail,
      portfolioName: options.portfolioName,
      role: options.role,
      invitationUrl,
      expiresAt: options.expiresAt,
    };

    // Render the React email to HTML
    const html = await render(PortfolioInvitationEmail(emailProps));

    // Send the email
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: options.to,
      subject: `${options.inviterName} invited you to join ${options.portfolioName} on Axori`,
      html,
    });

    if (error) {
      console.error("Failed to send invitation email:", error);
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }

    console.log(`✓ Invitation email sent to ${options.to} (ID: ${data?.id})`);
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Error sending invitation email:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Sends a welcome email to a new user
 *
 * @param options - The welcome email options
 * @returns The result of the send operation
 *
 * @example
 * ```ts
 * const result = await sendWelcomeEmail({
 *   to: "user@example.com",
 *   name: "John Doe",
 * });
 * ```
 */
export async function sendWelcomeEmail(
  options: SendWelcomeEmailOptions
): Promise<SendEmailResult> {
  const resend = getResendClient();

  if (!resend) {
    console.log("📧 [Mock] Welcome email would be sent to:", options.to);
    return {
      success: true,
      messageId: "mock-message-id-" + Date.now(),
    };
  }

  try {
    // Build the email props
    const emailProps: WelcomeEmailProps = {
      name: options.name,
    };

    // Render the React email to HTML
    const html = await render(WelcomeEmail(emailProps));

    // Send the email
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: options.to,
      subject: "Welcome to Axori!",
      html,
    });

    if (error) {
      console.error("Failed to send welcome email:", error);
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }

    console.log(`✓ Welcome email sent to ${options.to} (ID: ${data?.id})`);
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Error sending welcome email:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Checks if email sending is configured
 *
 * @returns True if the Resend API key is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Builds an invitation URL from a token
 *
 * @param token - The invitation token
 * @returns The full invitation acceptance URL
 */
export function buildInvitationUrl(token: string): string {
  return `${APP_URL}/invitation/accept?token=${token}`;
}
