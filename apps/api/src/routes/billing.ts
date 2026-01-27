/**
 * Billing API Routes
 *
 * Provides endpoints for subscription management, invoices, and payment methods.
 * Integrates with Stripe for payment processing.
 */

import { Hono } from "hono";
import Stripe from "stripe";
import { db, eq } from "@axori/db";
import { subscriptions, plans, users } from "@axori/db/src/schema";
import { requireAuth, getAuthenticatedUserId } from "../middleware/permissions";
import { withErrorHandling } from "../utils/errors";
import {
  PLAN_CONFIGS,
  getPlanByPriceId,
  mapStripeSubscriptionStatus,
} from "@axori/shared/src/integrations/stripe";

const billingRouter = new Hono();

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

// Helper to get or create Stripe customer for user
async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  // Check if user already has a subscription record with customer ID
  const [existingSub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (existingSub?.stripeCustomerId) {
    return existingSub.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
    },
  });

  // Create subscription record with customer ID (free plan by default)
  await db.insert(subscriptions).values({
    userId,
    stripeCustomerId: customer.id,
    status: "active",
    planName: "free",
  });

  return customer.id;
}

// GET /api/billing/subscription - Get current subscription
billingRouter.get(
  "/subscription",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (!subscription) {
      // Return free plan info if no subscription exists
      return c.json({
        plan: "free",
        status: "active",
        features: PLAN_CONFIGS[0].features,
        propertyLimit: PLAN_CONFIGS[0].propertyLimit,
        teamMemberLimit: PLAN_CONFIGS[0].teamMemberLimit,
      });
    }

    const planConfig = PLAN_CONFIGS.find(
      (p) => p.slug === subscription.planName
    );

    return c.json({
      id: subscription.id,
      plan: subscription.planName || "free",
      status: subscription.status,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      trialEnd: subscription.trialEnd,
      features: planConfig?.features || [],
      propertyLimit: planConfig?.propertyLimit ?? 1,
      teamMemberLimit: planConfig?.teamMemberLimit ?? 1,
    });
  }, { operation: "getSubscription" })
);

// GET /api/billing/plans - Get available plans
billingRouter.get(
  "/plans",
  withErrorHandling(async (c) => {
    // Return plan configs (can also fetch from database)
    const availablePlans = PLAN_CONFIGS.map((plan) => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      amount: plan.amount,
      interval: plan.interval,
      features: plan.features,
      propertyLimit: plan.propertyLimit,
      teamMemberLimit: plan.teamMemberLimit,
      isPopular: plan.isPopular || false,
    }));

    return c.json({ plans: availablePlans });
  }, { operation: "getPlans" })
);

// GET /api/billing/invoices - Get invoice history
billingRouter.get(
  "/invoices",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (!subscription?.stripeCustomerId) {
      return c.json({ invoices: [] });
    }

    try {
      const invoices = await stripe.invoices.list({
        customer: subscription.stripeCustomerId,
        limit: 12,
      });

      const formattedInvoices = invoices.data.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amount: (invoice.amount_paid || 0) / 100,
        currency: invoice.currency,
        description: invoice.lines.data[0]?.description || "Subscription",
        createdAt: new Date(invoice.created * 1000).toISOString(),
        paidAt: invoice.status_transitions?.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
          : null,
        invoicePdf: invoice.invoice_pdf,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
      }));

      return c.json({ invoices: formattedInvoices });
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      return c.json({ invoices: [] });
    }
  }, { operation: "getInvoices" })
);

// GET /api/billing/upcoming-invoice - Get upcoming invoice
billingRouter.get(
  "/upcoming-invoice",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (!subscription?.stripeSubscriptionId) {
      return c.json({ upcomingInvoice: null });
    }

    try {
      const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
        subscription: subscription.stripeSubscriptionId,
      });

      return c.json({
        upcomingInvoice: {
          amount: (upcomingInvoice.amount_due || 0) / 100,
          currency: upcomingInvoice.currency,
          periodStart: new Date(
            upcomingInvoice.period_start * 1000
          ).toISOString(),
          periodEnd: new Date(upcomingInvoice.period_end * 1000).toISOString(),
          nextPaymentAttempt: upcomingInvoice.next_payment_attempt
            ? new Date(
                upcomingInvoice.next_payment_attempt * 1000
              ).toISOString()
            : null,
        },
      });
    } catch (error) {
      // No upcoming invoice (e.g., free plan or canceled)
      return c.json({ upcomingInvoice: null });
    }
  }, { operation: "getUpcomingInvoice" })
);

// GET /api/billing/payment-methods - Get saved payment methods
billingRouter.get(
  "/payment-methods",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (!subscription?.stripeCustomerId) {
      return c.json({ paymentMethods: [] });
    }

    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: subscription.stripeCustomerId,
        type: "card",
      });

      // Get default payment method
      const customer = await stripe.customers.retrieve(
        subscription.stripeCustomerId
      );
      const defaultPaymentMethodId =
        typeof customer !== "string" && !customer.deleted
          ? customer.invoice_settings?.default_payment_method
          : null;

      const formattedMethods = paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
        isDefault: pm.id === defaultPaymentMethodId,
      }));

      return c.json({ paymentMethods: formattedMethods });
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
      return c.json({ paymentMethods: [] });
    }
  }, { operation: "getPaymentMethods" })
);

// POST /api/billing/checkout - Create Stripe Checkout session
billingRouter.post(
  "/checkout",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const user = c.get("user");
    const body = await c.req.json();
    const { priceId, successUrl, cancelUrl } = body;

    if (!priceId) {
      return c.json({ error: "Price ID is required" }, 400);
    }

    const customerId = await getOrCreateStripeCustomer(
      userId,
      user.email,
      `${user.firstName || ""} ${user.lastName || ""}`.trim()
    );

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url:
        successUrl || `${process.env.APP_URL}/account/billing?success=true`,
      cancel_url:
        cancelUrl || `${process.env.APP_URL}/account/billing?canceled=true`,
      metadata: {
        userId,
      },
    });

    return c.json({ url: session.url, sessionId: session.id });
  }, { operation: "createCheckoutSession" })
);

// POST /api/billing/portal - Create Stripe Customer Portal session
billingRouter.post(
  "/portal",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const body = await c.req.json();
    const { returnUrl } = body;

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (!subscription?.stripeCustomerId) {
      return c.json({ error: "No subscription found" }, 404);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl || `${process.env.APP_URL}/account/billing`,
    });

    return c.json({ url: session.url });
  }, { operation: "createPortalSession" })
);

// POST /api/billing/cancel - Cancel subscription
billingRouter.post(
  "/cancel",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const body = await c.req.json();
    const { reason, cancelImmediately = false } = body;

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (!subscription?.stripeSubscriptionId) {
      return c.json({ error: "No active subscription found" }, 404);
    }

    if (cancelImmediately) {
      // Cancel immediately
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

      await db
        .update(subscriptions)
        .set({
          status: "canceled",
          canceledAt: new Date(),
          cancellationReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.userId, userId));
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
        metadata: {
          cancellation_reason: reason,
        },
      });

      await db
        .update(subscriptions)
        .set({
          cancelAtPeriodEnd: true,
          cancellationReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.userId, userId));
    }

    return c.json({ success: true, cancelImmediately });
  }, { operation: "cancelSubscription" })
);

// POST /api/billing/resume - Resume canceled subscription
billingRouter.post(
  "/resume",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (!subscription?.stripeSubscriptionId) {
      return c.json({ error: "No subscription found" }, 404);
    }

    if (!subscription.cancelAtPeriodEnd) {
      return c.json({ error: "Subscription is not scheduled for cancellation" }, 400);
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: false,
        cancellationReason: null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId));

    return c.json({ success: true });
  }, { operation: "resumeSubscription" })
);

export default billingRouter;
