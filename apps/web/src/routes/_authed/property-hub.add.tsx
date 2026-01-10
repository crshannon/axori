import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AddPropertyWizard } from '@/components/property-hub/add-property-wizard'

export const Route = createFileRoute('/_authed/property-hub/add')({
  component: AddPropertyPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      propertyId: (search.propertyId as string) || undefined,
      step: Number(search.step) || 1,
    }
  },
})

function AddPropertyPage() {
  const navigate = useNavigate()
  const { propertyId, step } = Route.useSearch()

  const handleClose = () => {
    navigate({ to: '/property-hub' })
  }

  const handleComplete = (propertyId?: string) => {
    if (propertyId) {
      navigate({ to: '/property-hub/$propertyId', params: { propertyId } })
    } else {
      navigate({ to: '/property-hub' })
    }
  }
  
  const handleStepChange = (newStep: number, newPropertyId?: string) => {
    navigate({
      to: '/property-hub/add',
      search: { 
        propertyId: newPropertyId || propertyId, // Update propertyId if provided
        step: newStep 
      },
      replace: true, // Replace history so back button doesn't go through every step
    })
  }

  return (
    <AddPropertyWizard
      onClose={handleClose}
      onComplete={handleComplete}
      existingPropertyId={propertyId}
      initialStep={step}
      onStepChange={handleStepChange}
    />
  )
}

