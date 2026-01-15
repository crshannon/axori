import { HTMLAttributes, ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../utils/cn";
import { IconButton } from "./IconButton";
import { Heading } from "./Typography";

export interface DrawerProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback when drawer should close */
  onClose: () => void;
  /** Drawer title */
  title?: string;
  /** Drawer subtitle */
  subtitle?: string;
  /** Drawer content */
  children?: ReactNode;
  /** Footer actions (buttons, etc.) */
  footer?: ReactNode;
  /** Drawer width */
  width?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Whether clicking overlay closes the drawer */
  closeOnOverlayClick?: boolean;
  /** Whether pressing escape closes the drawer */
  closeOnEscape?: boolean;
}

const widthClasses = {
  sm: "w-full max-w-md", // 448px
  md: "w-full max-w-lg", // 512px
  lg: "w-full max-w-2xl", // 672px
  xl: "w-full max-w-4xl", // 896px
  "2xl": "w-full max-w-6xl", // 1152px
};

export const Drawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "lg",
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  ...props
}: DrawerProps) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Track if drawer should be visible (for animation)
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle mount/unmount with animation
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Trigger animation after DOM update
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      // Wait for close animation before unmounting
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  const drawerContent = (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "drawer-title" : undefined}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={cn(
            "relative w-screen transform transition-transform duration-300 ease-in-out",
            isAnimating ? "translate-x-0" : "translate-x-full",
            widthClasses[width]
          )}
        >
          <div
            className={cn(
              "flex h-full flex-col bg-white dark:bg-[#1A1A1A] shadow-xl",
              "border-l border-slate-200 dark:border-white/10",
              className
            )}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {/* Header */}
            {(title || subtitle || showCloseButton) && (
              <div className="flex items-start justify-between px-6 py-6">
                <div className="flex-1">
                  {title && (
                    <Heading
                      id="drawer-title"
                      level={4}
                      className="text-2xl font-black uppercase tracking-tighter dark:text-white"
                    >
                      {title}
                    </Heading>
                  )}

                  {subtitle && (
                    <Heading
                      id="drawer-title"
                      level={6}
                      className="text-lg font-black uppercase tracking-tighter dark:text-slate-400"
                    >
                      {subtitle}
                    </Heading>
                  )}
                </div>
                {showCloseButton && (
                  <IconButton
                    icon={X}
                    onClick={onClose}
                    size="md"
                    variant="default"
                    shape="rounded"
                    aria-label="Close drawer"
                  />
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="border-t border-slate-200 dark:border-white/10 px-6 py-4">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render to portal to ensure it's at the root level
  if (typeof window === "undefined") return null;
  return createPortal(drawerContent, document.body);
};
