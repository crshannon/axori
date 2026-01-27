import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AddPropertyWizard } from '@/components/property-hub/add-property-wizard'

// Calculate which step to resume based on property data
function calculateResumeStep(property: any): number {
  console.log('🔍 calculateResumeStep called with:', {
    hasProperty: !!property,
    address: property?.address,
    hasCharacteristics: !!property?.characteristics,
    bedrooms: property?.characteristics?.bedrooms,
    hasAcquisition: !!property?.acquisition,
    ownershipStatus: property?.acquisition?.ownershipStatus,
    entityType: property?.acquisition?.entityType,
    hasLoans: !!property?.loans && property?.loans?.length > 0,
    loansCount: property?.loans?.length,
    hasRentalIncome: !!property?.rentalIncome,
    hasOperatingExpenses: !!property?.operatingExpenses,
    hasStrategy: !!property?.strategy,
  })

  if (!property) return 1

  // Step 1: Address - if no address, start here
  if (!property.address) return 1

  // Step 2: Property Details - check if characteristics exist with property type
  if (!property.characteristics || !property.characteristics.propertyType) {
    console.log('➡️ Resuming at Step 2: Missing characteristics')
    return 2
  }

  // Step 3: Ownership - check if acquisition exists with ownership status
  if (!property.acquisition || !property.acquisition.ownershipStatus) {
    console.log('➡️ Resuming at Step 3: Missing acquisition')
    return 3
  }

  // Step 4: Financing - check if loans array exists and has entries
  if (!property.loans || property.loans.length === 0) {
    console.log('➡️ Resuming at Step 4: Missing loans')
    return 4
  }

  // Step 5: Management - check if management data exists
  if (!property.management) {
    console.log('➡️ Resuming at Step 5: Missing management')
    return 5
  }

  // Step 6: Strategy - final step
  console.log('➡️ Resuming at Step 6: All data complete')
  return 6
}

export const Route = createFileRoute('/_authed/property-hub/add')({
  component: AddPropertyPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      propertyId: (search.propertyId as string) || undefined,
      step: Number(search.step) || undefined, // Allow undefined so we can calculate it
    }
  },
})

function AddPropertyPage() {
  const navigate = useNavigate()
  const { propertyId, step: urlStep } = Route.useSearch()

  const handleClose = () => {
    navigate({ to: '/property-hub' })
  }

  const handleComplete = (completedPropertyId?: string) => {
    if (completedPropertyId) {
      navigate({
        to: '/property-hub/$propertyId',
        params: { propertyId: completedPropertyId },
      })
    } else {
      navigate({ to: '/property-hub' })
    }
  }

  const handleStepChange = (newStep: number, newPropertyId?: string) => {
    navigate({
      to: '/property-hub/add',
      search: {
        propertyId: newPropertyId || propertyId, // Update propertyId if provided
        step: newStep,
      },
      replace: true, // Replace history so back button doesn't go through every step
    })
  }

  return (
    <AddPropertyWizard
      onClose={handleClose}
      onComplete={handleComplete}
      existingPropertyId={propertyId}
      initialStep={urlStep} // Pass undefined if not in URL, wizard will calculate it
      onStepChange={handleStepChange}
      calculateResumeStep={calculateResumeStep}
    />
  )
}
