import { Card, IconButton } from '@axori/ui'
import { Pencil } from 'lucide-react'
import { formatPropertyType } from '@axori/shared'
import { LearningHubButton } from '../financials/LearningHubButton'
import { getAssetConfigurationSnippets } from '@/data/learning-hub/settings-snippets'
import { usePropertyPermissions, usePropertySettings } from '@/hooks/api'
import { ReadOnlyBanner } from '@/components/property-hub/ReadOnlyBanner'
import { useDrawer, DRAWERS } from '@/lib/drawer'

interface AssetConfigurationProps {
  propertyId: string
}

/**
 * AssetConfiguration component - Displays property configuration details
 * Shows: nickname, property type, address, tax jurisdiction, currency override
 *
 * @see AXO-93 - Uses drawer factory for opening edit drawer
 */
export const AssetConfiguration = ({ propertyId }: AssetConfigurationProps) => {
  const { openDrawer } = useDrawer()
  const { formData, isLoading } = usePropertySettings(propertyId)
  const { canEdit, isReadOnly } = usePropertyPermissions(propertyId)

  const handleOpenDrawer = () => {
    openDrawer(DRAWERS.ASSET_CONFIG, { propertyId })
  }

  // Use centralized formatPropertyType function from @axori/shared

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
          Asset Configuration
        </h3>
        <div className="flex items-center gap-3">
          <LearningHubButton
            snippets={getAssetConfigurationSnippets()}
            title="Asset Configuration Learning Hub"
            subtitle="Property details and configuration"
            componentKey="asset-configuration"
          />
          {isReadOnly && <ReadOnlyBanner variant="badge" />}
          {canEdit && (
            <IconButton
              icon={Pencil}
              size="sm"
              variant="ghost"
              shape="rounded"
              onClick={handleOpenDrawer}
              aria-label="Edit asset configuration"
            />
          )}
        </div>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2">
              Property Nickname
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {formData.nickname || '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2">
              Property Type
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {formatPropertyType(formData.propertyType)}
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-500/10 dark:border-white/5">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2">
              Street Address
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {formData.address || '—'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-500 mb-2">
                City
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {formData.city || '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-500 mb-2">
                State / Region
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {formData.state || '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-500 mb-2">
                Zip Code
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {formData.zipCode || '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-500/10 dark:border-white/5">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2">
              Tax Jurisdiction
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {formData.taxJurisdiction || '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2">
              Currency Override
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {formData.currencyOverride || '—'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
