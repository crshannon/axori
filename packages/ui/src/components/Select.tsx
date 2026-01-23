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
            "appearance-none pr-10",
            error && `
              border-red-500
              dark:border-red-500
            `,
            className
          )
        : cn(
            `
              flex h-10 w-full appearance-none rounded-md border border-gray-300
              bg-white px-3 py-2 pr-10 text-sm text-black ring-offset-white
              focus-visible:ring-2 focus-visible:ring-blue-500
              focus-visible:ring-offset-2 focus-visible:outline-none
              disabled:cursor-not-allowed disabled:opacity-50
              dark:border-white/10 dark:bg-white/5 dark:text-white
              dark:ring-offset-black
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
          <FormLabel htmlFor={selectId}>
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
                    className="
                      bg-white
                      dark:bg-[#1A1A1A]
                    "
                  >
                    {option.label}
                  </option>
                ))
              : children}
          </select>
          <ChevronDown
            className={cn(
              `
                pointer-events-none absolute top-1/2 right-3 size-5
                -translate-y-1/2
              `,
              variant === "rounded"
                ? `
                  text-slate-400
                  dark:text-white/40
                `
                : `
                  text-gray-500
                  dark:text-white/40
                `
            )}
            aria-hidden="true"
          />
        </div>
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

Select.displayName = "Select";
