import { Caption, Heading } from '@axori/ui'

interface StepperTitleProps {
  title: string
  subtitle?: string
}

export const StepperTitle = ({ title, subtitle }: StepperTitleProps) => (
  <div className="mb-12">
    <Heading level={3} className="mb-2 text-black dark:text-white">
      {title}
    </Heading>
    {subtitle && (
      <Caption className="text-slate-500 dark:text-white/70">
        {subtitle}
      </Caption>
    )}
  </div>
)
