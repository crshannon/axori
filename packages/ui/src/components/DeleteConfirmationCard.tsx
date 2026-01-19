import { HTMLAttributes } from "react";
import { Button } from "./Button";
import { Typography } from "./Typography";
import { cn } from "../utils/cn";

export interface DeleteConfirmationCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Title text for the delete confirmation */
  title?: string;
  /** Description/warning message */
  description: string;
  /** Cancel button text */
  cancelText?: string;
  /** Delete button text */
  deleteText?: string;
  /** Loading state - shows loading text on delete button */
  isLoading?: boolean;
  /** Handler for cancel action */
  onCancel: () => void;
  /** Handler for delete action */
  onDelete: () => void;
  /** Whether the delete button is disabled */
  disabled?: boolean;
}

/**
 * DeleteConfirmationCard - A reusable delete confirmation card component
 *
 * Displays a warning card with a delete confirmation message and cancel/delete buttons.
 * Uses the design system's Button and Typography components for consistency.
 *
 * @example
 * ```tsx
 * <DeleteConfirmationCard
 *   title="Delete Transaction"
 *   description="Are you sure you want to permanently delete this transaction? This action cannot be undone."
 *   onCancel={() => setShowConfirm(false)}
 *   onDelete={handleDelete}
 *   isLoading={isDeleting}
 * />
 * ```
 */
export const DeleteConfirmationCard = ({
  title = "Delete",
  description,
  cancelText = "Cancel",
  deleteText = "Delete Permanently",
  isLoading = false,
  onCancel,
  onDelete,
  disabled = false,
  className,
  ...props
}: DeleteConfirmationCardProps) => {
  return (
    <div
      className={cn(
        "p-6 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-200 dark:border-rose-800 w-full",
        className
      )}
      {...props}
    >
      <Typography
        variant="h5"
        weight="black"
        className="text-rose-600 dark:text-rose-400 mb-2"
      >
        {title}
      </Typography>
      <Typography
        variant="body-sm"
        className="text-rose-700 dark:text-rose-300 mb-4"
      >
        {description}
      </Typography>
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={onCancel}
          disabled={disabled || isLoading}
          variant="outline"
          size="md"
          className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest"
        >
          {cancelText}
        </Button>
        <Button
          type="button"
          onClick={onDelete}
          disabled={disabled || isLoading}
          variant="danger"
          size="md"
          className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest"
        >
          {isLoading ? "Deleting..." : deleteText}
        </Button>
      </div>
    </div>
  );
};
