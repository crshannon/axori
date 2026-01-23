import { TextareaHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "../utils/cn";
import { FormLabel } from "./FormLabel";
import { roundedInputClass } from "./Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  variant?: "default" | "rounded";
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, label, error, variant = "default", required, id, rows = 3, ...props },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;

    const textareaClassName =
      variant === "rounded"
        ? cn(
            roundedInputClass,
            "resize-none", // Prevent manual resizing for rounded variant
            error && `
              border-red-500
              dark:border-red-500
            `,
            className
          )
        : cn(
            `
              flex min-h-[80px] w-full resize-y rounded-md border
              border-gray-300 bg-white px-3 py-2 text-sm text-black
              ring-offset-white
              placeholder:text-gray-500
              focus-visible:ring-2 focus-visible:ring-blue-500
              focus-visible:ring-offset-2 focus-visible:outline-none
              disabled:cursor-not-allowed disabled:opacity-50
              dark:border-white/10 dark:bg-white/5 dark:text-white
              dark:ring-offset-black
              dark:placeholder:text-white/40
              dark:focus-visible:ring-[#E8FF4D]
              dark:focus-visible:ring-offset-black
            `,
            error &&
              `
                border-red-500
                focus-visible:ring-red-500
                dark:border-red-500
              `,
            className
          );

    return (
      <div className="w-full">
        {label && (
          <FormLabel htmlFor={textareaId}>
            {label}
            {required && (
              <span className="
                ml-2 font-mono text-[8px] text-red-500 opacity-100
                dark:text-red-400
              ">
                *
              </span>
            )}
          </FormLabel>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={textareaClassName}
          {...props}
        />
        {error && (
          <p className="
            mt-1 text-sm text-red-600
            dark:text-red-400
          ">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

