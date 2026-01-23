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
  `
    w-full rounded-2xl border px-6 py-4 text-sm font-bold transition-all
    outline-none
  `,
  `
    border-slate-200 bg-slate-50
    focus:border-violet-300
  `,
  `
    dark:border-white/5 dark:bg-white/5 dark:text-white
    dark:placeholder:text-white/30
    dark:focus:border-[#E8FF4D]/30
  `
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
            error && `
              border-red-500
              dark:border-red-500
            `,
            className
          )
        : cn(
            `
              flex h-10 w-full rounded-md border border-gray-300 bg-white px-3
              py-2 text-sm text-black ring-offset-white
              file:border-0 file:bg-transparent file:text-sm file:font-medium
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
          <FormLabel htmlFor={inputId}>
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
        <input ref={ref} id={inputId} className={inputClassName} {...props} />
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

Input.displayName = "Input";
