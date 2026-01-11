import { Heading, Overline, Typography } from '@axori/ui'
import { useProperty } from '@/hooks/api/useProperties'

interface PropertyHeroProps {
  propertyId: string
  portfolioEquity?: string | number
}

export const PropertyHero = ({
  propertyId,
  portfolioEquity = '$210,000',
}: PropertyHeroProps) => {
  const { data: property, isLoading } = useProperty(propertyId)

  // Show loading state
  if (isLoading || !property) {
    return (
      <div className="lg:col-span-8 rounded-[4rem] overflow-hidden relative min-h-[500px] shadow-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
    )
  }

  // Construct full address - use fullAddress if available, otherwise construct from parts
  const fullAddress =
    property.fullAddress ||
    (property.address && property.city && property.state && property.zipCode
      ? `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`
      : property.address || 'Address not available')

  const formattedEquity =
    typeof portfolioEquity === 'number'
      ? `$${portfolioEquity.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
      : portfolioEquity

  const imageUrl =
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200' // TODO: Add property images

  return (
    <div className="lg:col-span-8 rounded-[4rem] overflow-hidden relative min-h-[500px] shadow-2xl">
      <img
        src={imageUrl}
        className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
        alt={fullAddress}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
        <div>
          <Heading
            level={3}
            className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4"
          >
            {property.address}
          </Heading>

          <div className="flex gap-3">
            {property.characteristics?.propertyType && (
              <span className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest">
                {property.characteristics.propertyType}
              </span>
            )}
            {property.management && (
              <span className="px-4 py-2 rounded-xl bg-indigo-500/40 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest">
                {property.management.isSelfManaged
                  ? 'Self-Managed'
                  : property.management.companyName || 'Property Manager'}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <Overline className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1 dark:text-white">
            Portfolio Equity
          </Overline>
          <Typography
            variant="h3"
            className="text-4xl font-black text-[#E8FF4D] tracking-tighter"
          >
            {formattedEquity}
          </Typography>
        </div>
      </div>
    </div>
  )
}
