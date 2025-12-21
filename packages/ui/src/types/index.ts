// Common component prop types

export type Variant = "primary" | "secondary" | "danger" | "success" | "warning";
export type Size = "sm" | "md" | "lg";

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

