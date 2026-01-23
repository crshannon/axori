import { Card } from '@axori/ui'
import { LearningHubButton } from '../financials/LearningHubButton'
import { getAssetDnaSnippets } from '@/data/learning-hub/settings-snippets'

interface AssetDnaCalibrationProps {
  propertyId: string
  selectedDna?: string
}

/**
 * AssetDnaCalibration component - Displays investment strategy selection
 * Shows: Yield Maximization, Equity Growth, Capital Recirculation
 */
export const AssetDnaCalibration = ({
  propertyId,
  selectedDna = 'Yield Maximization',
}: AssetDnaCalibrationProps) => {
  return (
    <Card
      variant="rounded"
      padding="lg"
      radius="xl"
      className="bg-gradient-to-br from-indigo-500/5 to-transparent"
    >
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-black uppercase tracking-tighter">
          Asset DNA Calibration
        </h3>
        <div className="flex items-center gap-3">
          <LearningHubButton
            snippets={getAssetDnaSnippets()}
            title="Asset DNA Learning Hub"
            subtitle="Investment strategy and calibration"
            componentKey="asset-dna-calibration"
          />
          <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-violet-500/20 text-violet-400">
            Locked to Portfolio
          </span>
        </div>
      </div>
      <p className="text-sm font-medium leading-relaxed opacity-60 mb-10 max-w-xl">
        Changing the core thesis for this asset will recalibrate all ROI
        projections, exit strategies, and legal alert sensitivities.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          'Yield Maximization',
          'Equity Growth',
          'Capital Recirculation',
        ].map((dna) => (
          <div
            key={dna}
            className={`p-6 rounded-[2rem] border text-left transition-all ${
              dna === selectedDna
                ? 'bg-slate-900 text-white border-slate-900 shadow-xl dark:bg-white dark:text-black dark:border-white'
                : 'border-slate-100 dark:border-white/5'
            }`}
          >
            <p className="text-[11px] font-black uppercase tracking-tight">
              {dna}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
