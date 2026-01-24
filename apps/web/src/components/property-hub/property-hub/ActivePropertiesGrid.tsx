import { PropertyCard } from '@axori/ui'
import { formatCashFlow, formatPropertyValue, getPropertyImage } from './utils'
import { usePropertyGridMetrics } from './hooks/usePropertyGridMetrics'
import type { Property } from '@/hooks/api/useProperties'
import { useTheme } from '@/utils/providers/theme-provider'
import { cn } from '@/utils/helpers'

interface ActivePropertiesGridProps {
  properties: Array<Property>
  onPropertyClick: (propertyId: string) => void
}

interface PropertyCardWrapperProps {
  property: Property
  onPropertyClick: (propertyId: string) => void
  isDark: boolean
}

/**
 * Wrapper component that uses hooks to calculate metrics for a single property
 * This allows us to use hooks (which can't be called conditionally in a map)
 */
const PropertyCardWrapper = ({
  property,
  onPropertyClick,
  isDark,
}: PropertyCardWrapperProps) => {
  const metrics = usePropertyGridMetrics(property)

  return (
    <PropertyCard
      key={property.id}
      id={property.id}
      image={getPropertyImage(property)}
      address={property.address}
      nickname={property.strategy?.investmentStrategy || undefined}
      status={property.status.charAt(0).toUpperCase() + property.status.slice(1)}
      score={metrics.score}
      cashFlow={formatCashFlow(metrics.cashFlow)}
      currentValue={formatPropertyValue(metrics.currentValue)}
      theme={isDark ? 'dark' : 'light'}
      onClick={onPropertyClick}
      cardClassName={cn(
        'rounded-[3rem] border',
        isDark
          ? 'bg-[#1A1A1A] border-white/5'
          : 'bg-white border-slate-200 shadow-sm',
      )}
      className="hover:shadow-2xl"
    />
  )
}

export const ActivePropertiesGrid = ({
  properties,
  onPropertyClick,
}: ActivePropertiesGridProps) => {
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {properties.map((property) => (
        <PropertyCardWrapper
          key={property.id}
          property={property}
          onPropertyClick={onPropertyClick}
          isDark={isDark}
        />
      ))}
    </div>
  )
}
