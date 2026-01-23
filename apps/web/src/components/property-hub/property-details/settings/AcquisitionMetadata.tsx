import { Card, IconButton } from '@axori/ui'
import { Pencil } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { LearningHubButton } from '../financials/LearningHubButton'
import { getAcquisitionMetadataSnippets } from '@/data/learning-hub/settings-snippets'
import { usePropertySettings } from '@/hooks/api'

interface AcquisitionMetadataProps {
  propertyId: string
}

/**
 * AcquisitionMetadata component - Displays property acquisition details
 * Shows: purchase price, closing date, year built
 */
export const AcquisitionMetadata = ({ propertyId }: AcquisitionMetadataProps) => {
  const navigate = useNavigate()
  const { formData, isLoading } = usePropertySettings(propertyId)

  const handleOpenDrawer = () => {
    navigate({
      to: '/property-hub/$propertyId/settings',
      params: { propertyId },
      search: {
        drawer: 'acquisition',
      },
    })
  }

  if (isLoading) {
    return (
      <Card variant="rounded" padding="lg" radius="xl">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 bg-slate-200 dark:bg-white/5 rounded" />
          <div className="h-8 w-32 bg-slate-200 dark:bg-white/5 rounded" />
        </div>
      </Card>
    )
  }

  return (
    <Card variant="rounded" padding="lg" radius="xl">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-2xl font-black uppercase tracking-tighter">
          Acquisition Metadata
        </h3>
        <div className="flex items-center gap-3">
          <LearningHubButton
            snippets={getAcquisitionMetadataSnippets()}
            title="Acquisition Metadata Learning Hub"
            subtitle="Purchase information and details"
            componentKey="acquisition-metadata"
          />
          <IconButton
            icon={Pencil}
            size="sm"
            variant="ghost"
            shape="rounded"
            onClick={handleOpenDrawer}
            aria-label="Edit acquisition metadata"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="text-[10px] font-black uppercase text-slate-500 mb-2">
            Purchase Price
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {formData.purchasePrice || '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-slate-500 mb-2">
            Closing Date
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {formData.closingDate
              ? new Date(formData.closingDate).toLocaleDateString()
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-slate-500 mb-2">
            Year Built
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {formData.yearBuilt || '—'}
          </p>
        </div>
      </div>
    </Card>
  )
}
