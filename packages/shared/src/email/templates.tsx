// React Email templates for transactional emails

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import {
  PORTFOLIO_ROLE_LABELS,
  PORTFOLIO_ROLE_DESCRIPTIONS,
  type PortfolioRole,
} from "@axori/permissions";

// ============================================================================
// Shared Styles
// ============================================================================

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
  maxWidth: "580px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0 20px",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 24px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#000",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "24px 24px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "16px 24px 0",
};

const link = {
  color: "#556cd6",
  textDecoration: "underline",
};

// ============================================================================
// Welcome Email
// ============================================================================

export interface WelcomeEmailProps {
  name: string;
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Axori</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to Axori, {name}!</Heading>
          <Text style={text}>
            Thank you for joining Axori. We're excited to help you manage your
            properties.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================================================
// Portfolio Invitation Email
// ============================================================================

export interface PortfolioInvitationEmailProps {
  /** Name of the person being invited (if known) */
  recipientName?: string;
  /** Email of the person being invited */
  recipientEmail: string;
  /** Name of the person sending the invitation */
  inviterName: string;
  /** Email of the person sending the invitation */
  inviterEmail: string;
  /** Name of the portfolio they're being invited to */
  portfolioName: string;
  /** Role they're being invited as */
  role: PortfolioRole;
  /** Full URL with token for accepting the invitation */
  invitationUrl: string;
  /** When the invitation expires */
  expiresAt: Date;
}

/**
 * Get role label for display in emails
 * Uses centralized constants from @axori/permissions
 */
function getRoleLabel(role: string): string {
  return PORTFOLIO_ROLE_LABELS[role as PortfolioRole] || role;
}

/**
 * Get role description for display in emails
 * Uses centralized constants from @axori/permissions
 * Formats the description to be more action-oriented for email context
 */
function getRoleDescription(role: string): string {
  const description = PORTFOLIO_ROLE_DESCRIPTIONS[role as PortfolioRole];
  if (!description) return "access the portfolio";

  // Format description to be more action-oriented for emails
  // Convert "Can X" to "X" and make it lowercase for natural flow
  return description
    .replace(/^Can /i, "")
    .replace(/\.$/, "")
    .toLowerCase();
}

/**
 * Portfolio Invitation Email Template
 *
 * Sent when a user is invited to join a portfolio. The email includes:
 * - Who invited them and to which portfolio
 * - What role they'll have
 * - A secure link to accept the invitation
 * - Expiration information
 *
 * @example
 * ```tsx
 * <PortfolioInvitationEmail
 *   recipientEmail="john@example.com"
 *   inviterName="Jane Smith"
 *   inviterEmail="jane@example.com"
 *   portfolioName="Family Properties"
 *   role="member"
 *   invitationUrl="https://app.axori.com/invitation/accept?token=abc123"
 *   expiresAt={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
 * />
 * ```
 */
export function PortfolioInvitationEmail({
  recipientName,
  recipientEmail,
  inviterName,
  inviterEmail,
  portfolioName,
  role,
  invitationUrl,
  expiresAt,
}: PortfolioInvitationEmailProps) {
  const greeting = recipientName ? `Hi ${recipientName}` : "Hi";
  const roleLabel = getRoleLabel(role);
  const roleDescription = getRoleDescription(role);

  // Format expiration date
  const formattedExpiresAt = expiresAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} invited you to join {portfolioName} on Axori
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={{ padding: "24px 24px 0" }}>
            <Text style={{ ...text, textAlign: "center", margin: "0 0 8px", fontSize: "14px", color: "#8898aa" }}>
              Portfolio Invitation
            </Text>
          </Section>

          {/* Main Content */}
          <Heading style={h1}>You've been invited!</Heading>

          <Text style={text}>
            {greeting},
          </Text>

          <Text style={text}>
            <strong>{inviterName}</strong> ({inviterEmail}) has invited you to join the{" "}
            <strong>{portfolioName}</strong> portfolio on Axori as a <strong>{roleLabel}</strong>.
          </Text>

          <Text style={text}>
            As a {roleLabel}, you'll be able to {roleDescription}.
          </Text>

          {/* CTA Button */}
          <Section style={buttonContainer}>
            <Button style={button} href={invitationUrl}>
              Accept Invitation
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Additional Info */}
          <Text style={{ ...text, fontSize: "14px", color: "#666" }}>
            This invitation was sent to <strong>{recipientEmail}</strong> and will expire on{" "}
            <strong>{formattedExpiresAt}</strong>.
          </Text>

          <Text style={{ ...text, fontSize: "14px", color: "#666" }}>
            If the button above doesn't work, copy and paste this link into your browser:
          </Text>

          <Text style={{ ...text, fontSize: "12px", wordBreak: "break-all" }}>
            <Link href={invitationUrl} style={link}>
              {invitationUrl}
            </Link>
          </Text>

          <Hr style={hr} />

          {/* Footer */}
          <Text style={footer}>
            If you didn't expect this invitation or believe it was sent in error, you can safely ignore this email.
            The invitation will expire automatically.
          </Text>

          <Text style={footer}>
            &copy; {new Date().getFullYear()} Axori. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================================================
// Coming Soon Confirmation Email
// ============================================================================

export interface ComingSoonConfirmationEmailProps {
  firstName: string;
}

/**
 * Coming Soon Confirmation Email Template
 *
 * Sent when someone signs up for the waitlist/coming soon email capture.
 * The email is warm, personal, and sets expectations for what's coming.
 */
export function ComingSoonConfirmationEmail({
  firstName,
}: ComingSoonConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You're on the list, {firstName}!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={{ padding: "24px 24px 0" }}>
            <Text
              style={{
                ...text,
                textAlign: "center",
                margin: "0 0 8px",
                fontSize: "14px",
                color: "#8898aa",
              }}
            >
              Welcome to Axori
            </Text>
          </Section>

          {/* Main Content */}
          <Heading style={h1}>You're on the list, {firstName}!</Heading>

          <Text style={text}>Thanks for your interest in Axori!</Text>

          <Text style={text}>
            We're building something special for real estate investors like you
            — a platform that puts YOUR investment strategy at the center, not
            generic market data.
          </Text>

          <Text style={{ ...text, fontWeight: "600" }}>
            Here's what you can look forward to:
          </Text>

          <Text style={{ ...text, marginLeft: "16px" }}>
            • <strong>Personalized portfolio analytics</strong> — See your real
            numbers, not industry averages
          </Text>
          <Text style={{ ...text, marginLeft: "16px", marginTop: "8px" }}>
            • <strong>Smart tax optimization insights</strong> — Depreciation
            tracking and cost segregation tools
          </Text>
          <Text style={{ ...text, marginLeft: "16px", marginTop: "8px" }}>
            • <strong>Real-time property performance</strong> — Know exactly how
            each property is performing
          </Text>
          <Text style={{ ...text, marginLeft: "16px", marginTop: "8px" }}>
            • <strong>Institutional-grade tools</strong> — The same analytics
            the big players use
          </Text>

          <Hr style={hr} />

          <Text style={text}>
            We're putting the finishing touches on things and will reach out the
            moment we're ready for you.
          </Text>

          <Text style={text}>
            In the meantime, feel free to reply to this email with any questions
            or features you'd love to see. We read every message.
          </Text>

          <Text style={{ ...text, fontWeight: "600" }}>
            Talk soon,
            <br />
            The Axori Team
          </Text>

          <Hr style={hr} />

          {/* Footer */}
          <Text style={{ ...footer, fontStyle: "italic" }}>
            P.S. As an early supporter, you'll get priority access when we
            launch.
          </Text>

          <Text style={footer}>
            &copy; {new Date().getFullYear()} Axori. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
