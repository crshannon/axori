import { Card } from '@axori/ui'
import { usePropertyPermissions } from '@/hooks/api'
import { ReadOnlyBanner } from '@/components/property-hub/ReadOnlyBanner'

interface Collaborator {
  name: string
  role: string
  status: string
}

interface StakeholderMatrixProps {
  propertyId: string
  collaborators?: Array<Collaborator>
}

/**
 * StakeholderMatrix component - Displays property collaborators and stakeholders
 * Shows: collaborator list with roles and status
 */
export const StakeholderMatrix = ({
  propertyId,
  collaborators = [],
}: StakeholderMatrixProps) => {
  const { canAdmin, isReadOnly } = usePropertyPermissions(propertyId)

  return (
    <Card variant="rounded" padding="lg" radius="xl">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-2xl font-black uppercase tracking-tighter">
          Stakeholder Matrix
        </h3>
        <div className="flex items-center gap-3">
          {isReadOnly && <ReadOnlyBanner variant="badge" />}
          {canAdmin && (
            <button
              className={`px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5`}
            >
              Invite Collaborator
            </button>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {collaborators.length > 0 ? (
          collaborators.map((c) => (
            <div
              key={c.name}
              className={`p-6 rounded-[2rem] border flex items-center justify-between bg-slate-50 border-slate-100 dark:bg-black/20 dark:border-white/5`}
            >
              <div className="flex items-center gap-6">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs bg-white shadow-sm dark:bg-white/5`}
                >
                  {c.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-tight">
                    {c.name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {c.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <span
                  className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-emerald-200 text-emerald-600 dark:border-emerald-500/20 dark:text-emerald-500`}
                >
                  {c.status}
                </span>
                {canAdmin && (
                  <button className="text-slate-400 hover:text-red-500 transition-colors">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <p className="text-sm font-bold">No collaborators yet</p>
            <p className="text-xs mt-2 opacity-60">
              Invite team members to collaborate on this property
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
