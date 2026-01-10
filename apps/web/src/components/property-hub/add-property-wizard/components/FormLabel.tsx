import { Label } from '@axori/ui'
import type { ReactNode } from 'react'

interface FormLabelProps {
  children: ReactNode
  [key: string]: unknown
}

export const FormLabel = ({ children, ...props }: FormLabelProps) => (
  <Label
    size="sm"
    className="mb-2 block ml-2 text-slate-500 dark:text-white/70"
    {...props}
  >
    {children}
  </Label>
)

