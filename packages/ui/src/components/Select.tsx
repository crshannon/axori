import { SelectHTMLAttributes, forwardRef, ReactNode, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../utils/cn";
import { roundedInputClass } from "./Input";
import { FormLabel } from "./FormLabel";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  variant?: "default" | "rounded";
  options?: Array<{ value: string; label: string }>;
  children?: ReactNode;
  required?: boolean;
}

// Shared select class for rounded variant (uses same styling as roundedInputClass)
export const roundedSelectClass = roundedInputClass;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      variant = "default",
      options,
      children,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    const selectClassName =
      variant === "rounded"
        ? cn(
            roundedSelectClass,
            "pr-10 appearance-none",
            error && "border-red-500 dark:border-red-500",
            className
          )
        : cn(
            "flex h-10 w-full rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 pr-10 text-sm text-black dark:text-white ring-offset-white dark:ring-offset-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-[#E8FF4D] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
            error &&
              "border-red-500 dark:border-red-500 focus-visible:ring-red-500",
            className
          );

    return (
      <div className="w-full">
        {label && (
          <FormLabel htmlFor={selectId}>
            {label}
            {required && (
              <span className="text-[8px] font-mono text-red-500 dark:text-red-400 ml-2 opacity-100">
                *
              </span>
            )}
          </FormLabel>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={selectClassName}
            {...props}
          >
            {options
              ? options.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="bg-white dark:bg-[#1A1A1A]"
                  >
                    {option.label}
                  </option>
                ))
              : children}
          </select>
          <ChevronDown
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none",
              variant === "rounded"
                ? "text-slate-400 dark:text-white/40"
                : "text-gray-500 dark:text-white/40"
            )}
            aria-hidden="true"
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
