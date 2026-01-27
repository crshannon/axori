/**
 * Stripe Integration
 *
 * Server-side Stripe client and helper functions for subscription management.
 * This module should only be used on the server (API routes).
 */

// Type definitions for Stripe (actual client is instantiated in API)
export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  publishableKey: string;
}

// Plan configuration
export interface PlanConfig {
  id: string;
  name: string;
  slug: string;
  stripePriceId: string;
  amount: number;
  interval: "month" | "year";
  features: string[];
  propertyLimit: number | null;
  teamMemberLimit: number | null;
  isPopular?: boolean;
}

// Default plan configurations (should match Stripe products)
export const PLAN_CONFIGS: PlanConfig[] = [
  {
    id: "free",
    name: "Free",
    slug: "free",
    stripePriceId: process.env.STRIPE_PRICE_FREE || "price_free",
    amount: 0,
    interval: "month",
    features: ["1 Property", "Basic Analytics", "Email Support"],
    propertyLimit: 1,
    teamMemberLimit: 1,
  },
  {
    id: "pro",
    name: "Pro",
    slug: "pro",
    stripePriceId: process.env.STRIPE_PRICE_PRO || "price_pro",
    amount: 24,
    interval: "month",
    features: [
      "5 Properties",
      "Advanced Analytics",
      "Priority Support",
      "Data Export",
    ],
    propertyLimit: 5,
    teamMemberLimit: 3,
    isPopular: true,
  },
  {
    id: "portfolio",
    name: "Portfolio",
    slug: "portfolio",
    stripePriceId: process.env.STRIPE_PRICE_PORTFOLIO || "price_portfolio",
    amount: 49,
    interval: "month",
    features: [
      "25 Properties",
      "Team Collaboration",
      "API Access",
      "Custom Reports",
    ],
    propertyLimit: 25,
    teamMemberLimit: 10,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    slug: "enterprise",
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE || "price_enterprise",
    amount: 99,
    interval: "month",
    features: [
      "Unlimited Properties",
      "Dedicated Support",
      "Custom Integrations",
      "SLA",
    ],
    propertyLimit: null, // unlimited
    teamMemberLimit: null, // unlimited
  },
];

/**
 * Get plan configuration by slug
 */
export function getPlanBySlug(slug: string): PlanConfig | undefined {
  return PLAN_CONFIGS.find((plan) => plan.slug === slug);
}

/**
 * Get plan configuration by Stripe price ID
 */
export function getPlanByPriceId(priceId: string): PlanConfig | undefined {
  return PLAN_CONFIGS.find((plan) => plan.stripePriceId === priceId);
}

/**
 * Check if user can access a feature based on their plan
 */
export function canAccessFeature(
  planSlug: string | null,
  requiredPlan: string
): boolean {
  const planOrder = ["free", "pro", "portfolio", "enterprise"];
  const userPlanIndex = planOrder.indexOf(planSlug || "free");
  const requiredPlanIndex = planOrder.indexOf(requiredPlan);
  return userPlanIndex >= requiredPlanIndex;
}

/**
 * Check if user is within property limit for their plan
 */
export function isWithinPropertyLimit(
  planSlug: string | null,
  currentPropertyCount: number
): boolean {
  const plan = getPlanBySlug(planSlug || "free");
  if (!plan || plan.propertyLimit === null) return true;
  return currentPropertyCount < plan.propertyLimit;
}

/**
 * Get remaining property slots for a plan
 */
export function getRemainingPropertySlots(
  planSlug: string | null,
  currentPropertyCount: number
): number | null {
  const plan = getPlanBySlug(planSlug || "free");
  if (!plan || plan.propertyLimit === null) return null; // unlimited
  return Math.max(0, plan.propertyLimit - currentPropertyCount);
}

// Webhook event types we handle
export const HANDLED_WEBHOOK_EVENTS = [
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.trial_will_end",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
  "customer.updated",
  "checkout.session.completed",
] as const;

export type HandledWebhookEvent = (typeof HANDLED_WEBHOOK_EVENTS)[number];

/**
 * Subscription status mapping from Stripe to our database
 */
export function mapStripeSubscriptionStatus(
  stripeStatus: string
): "active" | "trialing" | "past_due" | "canceled" | "unpaid" | "incomplete" | "incomplete_expired" | "paused" {
  const statusMap: Record<string, any> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "unpaid",
    incomplete: "incomplete",
    incomplete_expired: "incomplete_expired",
    paused: "paused",
  };
  return statusMap[stripeStatus] || "active";
}
