import { HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";
import { BaseComponentProps } from "../types";

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/50" />
      <div
        className={cn(
          "relative z-50 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="text-xl font-semibold mb-4">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
};

