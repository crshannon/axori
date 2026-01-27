/**
 * Cancel Subscription Modal
 *
 * Multi-step confirmation modal for subscription cancellation.
 */

import { useState } from "react";
import { Modal, Button, cn } from "@axori/ui";
import { AlertTriangle, Calendar, CreditCard, X } from "lucide-react";
import { useCancelSubscription, useSubscription } from "@/hooks/api/useBilling";

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CancelStep = "reason" | "confirm" | "success";

const CANCELLATION_REASONS = [
  { id: "too_expensive", label: "Too expensive" },
  { id: "not_using", label: "Not using it enough" },
  { id: "missing_features", label: "Missing features I need" },
  { id: "found_alternative", label: "Found an alternative" },
  { id: "temporary", label: "Just need a break" },
  { id: "other", label: "Other" },
];

export function CancelSubscriptionModal({
  isOpen,
  onClose,
}: CancelSubscriptionModalProps) {
  const [step, setStep] = useState<CancelStep>("reason");
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [cancelImmediately, setCancelImmediately] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const { data: subscription } = useSubscription();
  const { mutate: cancelSubscription, isPending, isSuccess } = useCancelSubscription();

  const handleCancel = () => {
    cancelSubscription(
      {
        reason: selectedReason,
        cancelImmediately,
      },
      {
        onSuccess: () => {
          setStep("success");
        },
      }
    );
  };

  const handleClose = () => {
    setStep("reason");
    setSelectedReason("");
    setCancelImmediately(false);
    setConfirmText("");
    onClose();
  };

  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        step === "success"
          ? "Subscription Canceled"
          : "Cancel Your Subscription"
      }
      size="md"
    >
      {step === "reason" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              We'd hate to see you go! Let us know why you're leaving so we can
              improve.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Why are you canceling?
            </p>
            <div className="space-y-2">
              {CANCELLATION_REASONS.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={cn(
                    "w-full p-3 rounded-xl border text-left text-sm transition-all",
                    selectedReason === reason.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                      : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                  )}
                >
                  {reason.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleClose} className="flex-1">
              Keep Subscription
            </Button>
            <Button
              variant="danger"
              onClick={() => setStep("confirm")}
              disabled={!selectedReason}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-white/5">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium">Access until period end</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Keep access until {periodEnd || "your billing period ends"}
                </p>
              </div>
              <input
                type="radio"
                checked={!cancelImmediately}
                onChange={() => setCancelImmediately(false)}
                className="ml-auto"
              />
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-white/5">
              <X className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium">Cancel immediately</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lose access right away (no refund)
                </p>
              </div>
              <input
                type="radio"
                checked={cancelImmediately}
                onChange={() => setCancelImmediately(true)}
                className="ml-auto"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Type <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 font-mono text-red-500">CANCEL</code> to confirm
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="CANCEL"
              className={cn(
                "w-full px-4 py-3 rounded-xl border text-sm text-center font-mono",
                "bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10",
                "focus:outline-none focus:ring-2 focus:ring-red-500/50"
              )}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setStep("reason")}
              className="flex-1"
            >
              Go Back
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              disabled={confirmText !== "CANCEL" || isPending}
              className="flex-1"
            >
              {isPending ? "Canceling..." : "Cancel Subscription"}
            </Button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">
              Your subscription has been canceled
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {cancelImmediately
                ? "Your access has been revoked immediately."
                : `You'll continue to have access until ${periodEnd}.`}
            </p>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Changed your mind? You can reactivate your subscription at any time
            from your billing settings.
          </p>

          <Button variant="primary" onClick={handleClose} className="w-full">
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
}
