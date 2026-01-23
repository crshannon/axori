import { Label } from "./Typography";
import type { ReactNode, LabelHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
}

export const FormLabel = ({
  children,
  className,
  ...props
}: FormLabelProps) => (
  <Label
    size="sm"
    className={cn(
      `
        mb-2 ml-2 block text-slate-500
        dark:text-white/70
      `,
      className
    )}
    {...props}
  >
    {children}
  </Label>
);
