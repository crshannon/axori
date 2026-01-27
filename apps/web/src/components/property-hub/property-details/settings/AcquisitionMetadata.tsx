import { Button, Card } from '@axori/ui'
import { LearningHubButton } from '../financials/LearningHubButton'
import { getAcquisitionMetadataSnippets } from '@/data/learning-hub/settings-snippets'
import { usePropertyPermissions, usePropertySettings } from '@/hooks/api'
import { ReadOnlyBanner } from '@/components/property-hub/ReadOnlyBanner'
import { DRAWERS, useDrawer } from '@/lib/drawer'

interface AcquisitionMetadataProps {
  propertyId: string
}

/**
 * AcquisitionMetadata component - Displays property acquisition details
 * Shows: purchase price, closing date, year built
 *
 * @see AXO-93 - Uses drawer factory for opening edit drawer
 */
export const AcquisitionMetadata = ({
  propertyId,
}: AcquisitionMetadataProps) => {
  const { openDrawer } = useDrawer()
  const { formData, isLoading } = usePropertySettings(propertyId)
  const { canEdit, isReadOnly } = usePropertyPermissions(propertyId)

  const handleOpenDrawer = () => {
    openDrawer(DRAWERS.ACQUISITION, { propertyId })
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
          {isReadOnly && <ReadOnlyBanner variant="badge" />}
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              className="px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
              onClick={handleOpenDrawer}
            >
              Edit
            </Button>
          )}
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
