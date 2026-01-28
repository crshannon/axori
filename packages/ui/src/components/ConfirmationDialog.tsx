import { cn } from "../utils/cn";
import { Modal, ModalSize } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle, Info, AlertCircle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

export type ConfirmationVariant = "danger" | "warning" | "info" | "success";

export interface ConfirmationDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog is closed */
  onClose: () => void;
  /** Callback when confirmed */
  onConfirm: () => void | Promise<void>;
  /** Dialog title */
  title: string;
  /** Dialog description/message */
  description: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Visual variant */
  variant?: ConfirmationVariant;
  /** Whether the confirm action is loading */
  isLoading?: boolean;
  /** Optional: text user must type to confirm (for destructive actions) */
  requireTypeConfirm?: string;
  /** Optional: placeholder text for the type-to-confirm input */
  typeConfirmPlaceholder?: string;
  /** Optional: countdown in seconds before confirm button is enabled */
  countdownSeconds?: number;
  /** Modal size */
  size?: ModalSize;
  /** Additional content to render */
  children?: React.ReactNode;
}

const variantConfig: Record<
  ConfirmationVariant,
  {
    icon: typeof AlertTriangle;
    iconClass: string;
    bgClass: string;
    buttonVariant: "danger" | "primary" | "secondary";
  }
> = {
  danger: {
    icon: AlertTriangle,
    iconClass: "text-red-500",
    bgClass: "bg-red-100 dark:bg-red-500/20",
    buttonVariant: "danger",
  },
  warning: {
    icon: AlertCircle,
    iconClass: "text-amber-500",
    bgClass: "bg-amber-100 dark:bg-amber-500/20",
    buttonVariant: "primary",
  },
  info: {
    icon: Info,
    iconClass: "text-blue-500",
    bgClass: "bg-blue-100 dark:bg-blue-500/20",
    buttonVariant: "primary",
  },
  success: {
    icon: CheckCircle,
    iconClass: "text-green-500",
    bgClass: "bg-green-100 dark:bg-green-500/20",
    buttonVariant: "primary",
  },
};

export const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
  isLoading = false,
  requireTypeConfirm,
  typeConfirmPlaceholder,
  countdownSeconds,
  size = "sm",
  children,
}: ConfirmationDialogProps) => {
  const [typeConfirmValue, setTypeConfirmValue] = useState("");
  const [countdown, setCountdown] = useState(countdownSeconds || 0);
  const [isConfirming, setIsConfirming] = useState(false);

  const config = variantConfig[variant];
  const Icon = config.icon;

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setTypeConfirmValue("");
      setCountdown(countdownSeconds || 0);
      setIsConfirming(false);
    }
  }, [isOpen, countdownSeconds]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  // Check if confirm is allowed
  const isTypeConfirmValid = requireTypeConfirm
    ? typeConfirmValue === requireTypeConfirm
    : true;
  const isCountdownComplete = countdown <= 0;
  const canConfirm = isTypeConfirmValid && isCountdownComplete && !isLoading && !isConfirming;

  const handleConfirm = async () => {
    if (!canConfirm) return;

    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Confirmation action failed:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      showCloseButton={false}
      closeOnOutsideClick={!isConfirming}
      closeOnEscape={!isConfirming}
    >
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div
          className={cn(
            "mb-4 flex size-16 items-center justify-center rounded-full",
            config.bgClass
          )}
        >
          <Icon className={cn("size-8", config.iconClass)} />
        </div>

        {/* Title */}
        <h3 className="
          mb-2 text-xl font-semibold text-slate-900
          dark:text-white
        ">
          {title}
        </h3>

        {/* Description */}
        <p className="
          mb-6 max-w-sm text-sm text-slate-500
          dark:text-slate-400
        ">
          {description}
        </p>

        {/* Additional content */}
        {children && <div className="mb-6 w-full">{children}</div>}

        {/* Type to confirm */}
        {requireTypeConfirm && (
          <div className="mb-6 w-full">
            <p className="
              mb-2 text-xs text-slate-500
              dark:text-slate-400
            ">
              Type{" "}
              <code className="
                rounded-sm bg-slate-100 px-1.5 py-0.5 font-mono text-red-500
                dark:bg-white/10
              ">
                {requireTypeConfirm}
              </code>{" "}
              to confirm
            </p>
            <input
              type="text"
              value={typeConfirmValue}
              onChange={(e) => setTypeConfirmValue(e.target.value)}
              placeholder={typeConfirmPlaceholder || requireTypeConfirm}
              className={cn(
                `
                  w-full rounded-xl border px-4 py-3 text-center font-mono
                  text-sm
                `,
                `
                  border-slate-200 bg-slate-50
                  dark:border-white/10 dark:bg-white/5
                `,
                "focus:ring-2 focus:ring-blue-500/50 focus:outline-none",
                isTypeConfirmValid && typeConfirmValue
                  ? `
                    border-green-500
                    dark:border-green-500
                  `
                  : ""
              )}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex w-full gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isConfirming}
            className="flex-1"
          >
            {cancelText}
          </Button>

          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1"
          >
            {isLoading || isConfirming ? (
              <span className="flex items-center gap-2">
                <svg
                  className="size-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : countdown > 0 ? (
              `Wait ${countdown}s`
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
