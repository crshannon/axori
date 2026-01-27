import { cn } from "../utils/cn";
import { BaseComponentProps } from "../types";
import { X } from "lucide-react";
import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Optional description below the title */
  description?: string;
  /** Modal size variant */
  size?: ModalSize;
  /** Show close button in header */
  showCloseButton?: boolean;
  /** Close on escape key press */
  closeOnEscape?: boolean;
  /** Close when clicking outside the modal */
  closeOnOutsideClick?: boolean;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Whether to render in a portal (default: true) */
  usePortal?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[90vw] max-h-[90vh]",
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = "md",
  showCloseButton = true,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  footer,
  usePortal = true,
}: ModalProps) => {
  // Handle escape key
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === "Escape") {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        // Animation
        "animate-in fade-in duration-200"
      )}
      onClick={closeOnOutsideClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm",
          "animate-in fade-in duration-200"
        )}
      />

      {/* Modal Content */}
      <div
        className={cn(
          "relative z-50 w-full rounded-2xl bg-white shadow-2xl dark:bg-[#1A1A1A]",
          "animate-in zoom-in-95 slide-in-from-bottom-4 duration-300",
          "border border-slate-200 dark:border-white/10",
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className={cn(
              "flex items-start justify-between p-6",
              (title || description) && "border-b border-slate-200 dark:border-white/10"
            )}
          >
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="text-xl font-semibold text-slate-900 dark:text-white"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  "rounded-lg p-2 transition-colors",
                  "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                  "hover:bg-slate-100 dark:hover:bg-white/10"
                )}
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={cn("p-6", !title && !showCloseButton && "pt-6")}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className={cn(
              "flex items-center justify-end gap-3 p-6",
              "border-t border-slate-200 dark:border-white/10"
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Render in portal or inline
  if (usePortal && typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
