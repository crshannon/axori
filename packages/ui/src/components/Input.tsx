import { InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "../utils/cn";
import { FormLabel } from "./FormLabel";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: "default" | "rounded";
  required?: boolean;
}

// Shared input class for rounded variant (used in wizards and forms)
export const roundedInputClass = cn(
  "w-full px-6 py-4 rounded-2xl text-sm font-bold border outline-none transition-all",
  "bg-slate-50 border-slate-200 focus:border-violet-300",
  "dark:bg-white/5 dark:border-white/5 dark:focus:border-[#E8FF4D]/30 dark:text-white dark:placeholder:text-white/30"
);

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, variant = "default", required, id, ...props },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    const inputClassName =
      variant === "rounded"
        ? cn(
            roundedInputClass,
            error && "border-red-500 dark:border-red-500",
            className
          )
        : cn(
            "flex h-10 w-full rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-black dark:text-white ring-offset-white dark:ring-offset-black file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 dark:placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-[#E8FF4D] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50",
            error &&
              "border-red-500 dark:border-red-500 focus-visible:ring-red-500",
            className
          );

    return (
      <div className="w-full">
        {label && (
          <FormLabel htmlFor={inputId}>
            {label}
            {required && (
              <span className="text-[8px] font-mono text-red-500 dark:text-red-400 ml-2 opacity-100">
                *
              </span>
            )}
          </FormLabel>
        )}
        <input ref={ref} id={inputId} className={inputClassName} {...props} />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
