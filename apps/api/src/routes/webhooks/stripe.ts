/**
 * Stripe Webhook Handler
 *
 * Handles incoming webhooks from Stripe for subscription lifecycle events.
 * This endpoint should be publicly accessible (no auth required).
 */

import { Hono } from "hono";
import Stripe from "stripe";
import { db, eq } from "@axori/db";
import { subscriptions, users } from "@axori/db/src/schema";
import {
  getPlanByPriceId,
  mapStripeSubscriptionStatus,
  HANDLED_WEBHOOK_EVENTS,
} from "@axori/shared/src/integrations/stripe";

const stripeWebhookRouter = new Hono();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

// POST /api/webhooks/stripe - Handle Stripe webhooks
stripeWebhookRouter.post("/", async (c) => {
  const signature = c.req.header("stripe-signature");
  const rawBody = await c.req.text();

  if (!signature) {
    console.error("[Stripe Webhook] No signature provided");
    return c.json({ error: "No signature" }, 400);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Stripe Webhook] Signature verification failed: ${errorMessage}`);
    return c.json({ error: "Invalid signature" }, 400);
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleTrialWillEnd(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return c.json({ received: true });
  } catch (error) {
    console.error(`[Stripe Webhook] Error handling event: ${error}`);
    return c.json({ error: "Webhook handler failed" }, 500);
  }
});

// Handle checkout session completed
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId;
  const customerId = session.customer as string;

  if (!userId || !customerId) {
    console.error("[Stripe Webhook] Missing userId or customerId in checkout session");
    return;
  }

  // Get subscription details
  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.log("[Stripe Webhook] No subscription in checkout session (one-time payment?)");
    return;
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = stripeSubscription.items.data[0]?.price.id;
  const planConfig = getPlanByPriceId(priceId);

  // Update or create subscription record
  await db
    .insert(subscriptions)
    .values({
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      status: mapStripeSubscriptionStatus(stripeSubscription.status),
      planName: planConfig?.slug || "pro",
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      trialStart: stripeSubscription.trial_start
        ? new Date(stripeSubscription.trial_start * 1000)
        : null,
      trialEnd: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        status: mapStripeSubscriptionStatus(stripeSubscription.status),
        planName: planConfig?.slug || "pro",
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialStart: stripeSubscription.trial_start
          ? new Date(stripeSubscription.trial_start * 1000)
          : null,
        trialEnd: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
        updatedAt: new Date(),
      },
    });

  console.log(`[Stripe Webhook] Checkout completed for user ${userId}, plan: ${planConfig?.slug}`);
}

// Handle subscription updates
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  const planConfig = getPlanByPriceId(priceId);

  // Find subscription by customer ID
  const [existingSub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1);

  if (!existingSub) {
    console.error(`[Stripe Webhook] No subscription found for customer ${customerId}`);
    return;
  }

  await db
    .update(subscriptions)
    .set({
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: mapStripeSubscriptionStatus(subscription.status),
      planName: planConfig?.slug || existingSub.planName,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
      trialStart: subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : null,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId));

  console.log(`[Stripe Webhook] Subscription updated for customer ${customerId}`);
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  await db
    .update(subscriptions)
    .set({
      status: "canceled",
      stripeSubscriptionId: null,
      stripePriceId: null,
      planName: "free",
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId));

  console.log(`[Stripe Webhook] Subscription deleted for customer ${customerId}`);
}

// Handle trial ending soon
async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user to send notification
  const [existingSub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1);

  if (existingSub) {
    // TODO: Send email notification about trial ending
    console.log(`[Stripe Webhook] Trial ending soon for user ${existingSub.userId}`);
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Update subscription status to active if it was past_due
  await db
    .update(subscriptions)
    .set({
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId));

  console.log(`[Stripe Webhook] Payment succeeded for customer ${customerId}`);
}

// Handle failed payment
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  await db
    .update(subscriptions)
    .set({
      status: "past_due",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId));

  // TODO: Send email notification about failed payment
  console.log(`[Stripe Webhook] Payment failed for customer ${customerId}`);
}

export default stripeWebhookRouter;
