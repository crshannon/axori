/**
 * Plan Selection Drawer
 *
 * Allows users to compare and select subscription plans.
 */

import { Button, Drawer, cn } from "@axori/ui";
import { ArrowRight, Building, Check, Crown, Sparkles, Zap } from "lucide-react";
import type { DrawerComponentProps } from "@/lib/drawer/registry";
import { useCreateCheckoutSession, usePlans, useSubscription } from "@/hooks/api/useBilling";

const PLAN_ICONS: Partial<Record<string, typeof Zap>> = {
  free: Zap,
  pro: Sparkles,
  portfolio: Building,
  enterprise: Crown,
};

export function PlanSelectionDrawer({ isOpen, onClose }: DrawerComponentProps) {
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { mutate: createCheckout, isPending: isCheckingOut } = useCreateCheckoutSession();

  const currentPlanSlug = subscription?.plan || "free";
  const isLoading = plansLoading || subLoading;

  const handleSelectPlan = (priceId: string, planSlug: string) => {
    if (planSlug === currentPlanSlug) return;
    if (planSlug === "free") {
      // Downgrade to free - redirect to portal
      return;
    }

    createCheckout({
      priceId,
      successUrl: `${window.location.origin}/account/billing?success=true&plan=${planSlug}`,
      cancelUrl: `${window.location.origin}/account/billing?canceled=true`,
    });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Your Plan"
      description="Select the plan that best fits your needs"
      size="xl"
    >
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans?.map((plan) => {
              const Icon = PLAN_ICONS[plan.slug] || Zap;
              const isCurrent = plan.slug === currentPlanSlug;
              const isUpgrade =
                ["pro", "portfolio", "enterprise"].indexOf(plan.slug) >
                ["pro", "portfolio", "enterprise"].indexOf(currentPlanSlug);

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative p-6 rounded-2xl border-2 transition-all",
                    isCurrent
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10"
                      : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20",
                    plan.isPopular && !isCurrent && "border-purple-300 dark:border-purple-500/30"
                  )}
                >
                  {plan.isPopular && !isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold rounded-full bg-purple-500 text-white">
                      Popular
                    </span>
                  )}

                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold rounded-full bg-blue-500 text-white">
                      Current Plan
                    </span>
                  )}

                  <div className="text-center mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </div>
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    <p className="text-2xl font-bold mt-1">
                      ${plan.amount}
                      <span className="text-sm font-normal text-slate-500">
                        /{plan.interval}
                      </span>
                    </p>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-slate-600 dark:text-slate-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                      {plan.propertyLimit
                        ? `Up to ${plan.propertyLimit} properties`
                        : "Unlimited properties"}
                    </p>

                    <Button
                      variant={isCurrent ? "secondary" : isUpgrade ? "primary" : "secondary"}
                      disabled={isCurrent || isCheckingOut}
                      onClick={() => handleSelectPlan(plan.slug, plan.slug)}
                      className="w-full"
                    >
                      {isCurrent ? (
                        "Current Plan"
                      ) : isCheckingOut ? (
                        "Processing..."
                      ) : isUpgrade ? (
                        <>
                          Upgrade <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                      ) : (
                        "Downgrade"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-white/5">
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
            All plans include a 14-day free trial. Cancel anytime.
            <br />
            <span className="text-xs">
              Prices in USD. Billed monthly unless otherwise specified.
            </span>
          </p>
        </div>
      </div>
    </Drawer>
  );
}
