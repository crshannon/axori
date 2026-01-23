import { Card } from '@axori/ui'

interface CloudConnectProps {
  propertyId: string
}

/**
 * CloudConnect component - Displays data access API connections
 * Shows: connected services and API actions
 */
export const CloudConnect = ({ propertyId }: CloudConnectProps) => {
  return (
    <Card
      variant="rounded"
      padding="lg"
      radius="xl"
      className="bg-slate-900 border-none text-white dark:bg-black dark:border-white/5"
    >
      <h3 className="text-xl font-black uppercase tracking-tighter mb-4">
        Cloud Connect
      </h3>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Stream: AppFolio Active
        </span>
      </div>
      <div className="space-y-4">
        <button className="w-full py-4 rounded-2xl bg-white/5 text-white/40 border border-white/5 text-[9px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">
          Rotate Intelligence Keys
        </button>
        <button className="w-full py-4 rounded-2xl bg-white/5 text-white/40 border border-white/5 text-[9px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">
          Download Asset JSON
        </button>
      </div>
    </Card>
  )
}
