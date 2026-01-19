{
  isCalcOpen && (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div
        className={`max-w-2xl w-full p-12 rounded-[4rem] border shadow-2xl transition-all duration-500 ${isDark ? 'bg-[#1A1A1A] border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
      >
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">
              Freedom Calculator
            </h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">
              Deriving the Strategic Monthly Target
            </p>
          </div>
          <button
            onClick={() => setIsCalcOpen(false)}
            className="p-3 opacity-40 hover:opacity-100"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
          {[
            {
              id: 'essentials',
              label: 'Essential Expenses',
              icon: '🏠',
              sub: 'Housing, Food, Health',
            },
            {
              id: 'lifestyle',
              label: 'Lifestyle Design',
              icon: '✈️',
              sub: 'Travel, Hobbies, Fun',
            },
            {
              id: 'safety',
              label: 'Safety Margin',
              icon: '🛡️',
              sub: 'Maintenance, Reserves',
            },
            {
              id: 'growth',
              label: 'Wealth Re-Investment',
              icon: '🚀',
              sub: 'For Next Acquisitions',
            },
          ].map((field) => (
            <div key={field.id} className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
                  <span>{field.icon}</span> {field.label}
                </label>
                <span className="text-sm font-black tabular-nums">
                  $
                  {calcInputs[
                    field.id as keyof typeof calcInputs
                  ].toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="15000"
                step="250"
                value={calcInputs[field.id as keyof typeof calcInputs]}
                onChange={(e) =>
                  setCalcInputs({
                    ...calcInputs,
                    [field.id]: parseInt(e.target.value),
                  })
                }
                className="w-full h-1.5 bg-slate-500/10 rounded-full appearance-none cursor-pointer accent-current"
              />
              <p className="text-[9px] font-bold opacity-30 italic leading-none">
                {field.sub}
              </p>
            </div>
          ))}
        </div>

        <div
          className={`p-8 rounded-[2.5rem] border flex items-center justify-between mb-12 ${isDark ? 'bg-white text-black border-white shadow-2xl' : 'bg-slate-900 text-white border-slate-900 shadow-2xl shadow-violet-200'}`}
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
              Calculated Sovereignty Target
            </p>
            <p className="text-4xl font-black tabular-nums tracking-tighter">
              ${calculatedFreedomTotal.toLocaleString()}
              <span className="text-base opacity-40">/ mo</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase opacity-60 mb-1">
              Annual Yield Req.
            </p>
            <p className="text-xl font-black tabular-nums tracking-tighter">
              ${(calculatedFreedomTotal * 12).toLocaleString()}
            </p>
          </div>
        </div>

        <button
          onClick={handleSyncGoal}
          className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] shadow-2xl ${isDark ? 'bg-[#E8FF4D] text-black shadow-[#E8FF4D]/20' : 'bg-violet-600 text-white shadow-violet-200'}`}
        >
          Sync Target to Journey Map
        </button>
      </div>
    </div>
  )
}
