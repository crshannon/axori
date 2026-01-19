export default function WealthJourneyPage() {


import React, { useState } from 'react';

interface WealthJourneyPageProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLogout: () => void;
  onNavigateDashboard: () => void;
  onNavigateExplore: () => void;
  onNavigateVendors: () => void;
  onNavigatePropertyHub: () => void;
}

type DriverId = 'paydown' | 'rent_reset' | 'tax_seg' | 'acquisition' | 'utility_recovery' | 'refi_pivot';

interface WealthMission {
  id: DriverId;
  title: string;
  description: string;
  monthlyImpact: number;
  impactLabel: string;
  icon: string;
  color: string;
  education: string;
  steps: string[];
}

const WealthJourneyPage: React.FC<WealthJourneyPageProps> = ({
  theme,
  toggleTheme,
  onLogout,
  onNavigateDashboard,
  onNavigateExplore,
  onNavigateVendors,
  onNavigatePropertyHub
}) => {
  const isDark = theme === 'dark';

  // User Profile / Goal State
  const [freedomGoal, setFreedomGoal] = useState(12000);
  const [currentNet, setCurrentNet] = useState(2450);
  const [riskProfile, setRiskProfile] = useState<'Conservative' | 'Moderate' | 'Aggressive'>('Moderate');
  const [selectedPriorities, setSelectedPriorities] = useState<DriverId[]>(['paydown', 'rent_reset', 'utility_recovery']);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);

  // Calculator State
  const [calcInputs, setCalcInputs] = useState({
    essentials: 4500,
    lifestyle: 3500,
    safety: 2000,
    growth: 2000
  });

  const missions: WealthMission[] = [
    {
      id: 'paydown',
      title: 'High-Rate Mortgage Paydown',
      description: 'Eliminate the 7.2% debt on Asset_02 to recapture monthly service.',
      monthlyImpact: 840,
      impactLabel: 'Expense Recapture',
      icon: '📉',
      color: 'bg-emerald-500',
      education: 'Paying down a 7% mortgage is equivalent to finding a risk-free 7% return. It instantly boosts net monthly cash flow.',
      steps: ['Identify highest interest debt', 'Redirect 20% of net flow to principal', 'Recalculate LTV monthly']
    },
    {
      id: 'rent_reset',
      title: 'Market Rent Stabilization',
      description: 'Reset under-market units to current Austin zip-code benchmarks.',
      monthlyImpact: 1200,
      impactLabel: 'Revenue Lift',
      icon: '📈',
      color: 'bg-violet-500',
      education: 'A $100/mo increase across a 10-unit portfolio adds $12,000/yr in pure profit, often worth $150k+ in forced appreciation.',
      steps: ['Run neighborhood rent audit', 'Draft lease renewal addendums', 'Upgrade Unit A appliances for premium tier']
    },
    {
      id: 'tax_seg',
      title: 'Cost Segregation Study',
      description: 'Accelerate depreciation to offset current active rental income.',
      monthlyImpact: 650,
      impactLabel: 'Tax Savings Inflow',
      icon: '🛡️',
      color: 'bg-indigo-500',
      education: 'Depreciating carpets, appliances, and landscaping over 5 years instead of 27.5 creates a massive tax shield.',
      steps: ['Order engineering report', 'CPA re-classification', 'Re-invest refund into next down payment']
    },
    {
      id: 'acquisition',
      title: 'Next Quadplex Acquisition',
      description: 'Leverage current equity to scale into a high-yield multi-family.',
      monthlyImpact: 1800,
      impactLabel: 'New Net Inflow',
      icon: '🏗️',
      color: 'bg-amber-500',
      education: 'Scaling units is the fastest way to bridge large gaps, provided the debt coverage ratio remains above 1.25x.',
      steps: ['Define buy-box (4+ units)', 'Secure DSCR pre-approval', 'Execute off-market mailing']
    },
    {
      id: 'utility_recovery',
      title: 'Utility Bill-Back (RUBS)',
      description: 'Shift water and trash costs back to tenants via ratio billing.',
      monthlyImpact: 350,
      impactLabel: 'OpEx Reduction',
      icon: '🚰',
      color: 'bg-sky-500',
      education: 'Landlord-paid utilities are "invisible leaks". Implementing RUBS aligns tenant behavior with cost savings.',
      steps: ['Review municipal billing laws', 'Update lease utility clause', 'Onboard billing provider']
    },
    {
      id: 'refi_pivot',
      title: 'Rate-and-Term Refinance',
      description: 'Swap current bridge loan for long-term fixed financing.',
      monthlyImpact: 520,
      impactLabel: 'Debt Service Savings',
      icon: '⛽',
      color: 'bg-rose-500',
      education: 'Moving from a 9% hard money loan to a 6.5% DSCR loan drastically increases the "Net Flow" of a property.',
      steps: ['Get bank appraisal', 'LTV optimization audit', 'Lock fixed rate window']
    }
  ];

  const togglePriority = (id: DriverId) => {
    if (selectedPriorities.includes(id)) {
      setSelectedPriorities(selectedPriorities.filter(p => p !== id));
    } else if (selectedPriorities.length < 3) {
      setSelectedPriorities([...selectedPriorities, id]);
    }
  };

  const activeMissions = selectedPriorities.map(id => missions.find(m => m.id === id)!);
  const totalMissionImpact = activeMissions.reduce((acc, m) => acc + m.monthlyImpact, 0);
  const gap = freedomGoal - currentNet;
  const projectedPercentage = Math.round(((currentNet + totalMissionImpact) / freedomGoal) * 100);
  const gapPercentage = Math.min(100, Math.round((currentNet / freedomGoal) * 100));
  const isNewInvestor = currentNet < 1000;

  const calculatedFreedomTotal = calcInputs.essentials + calcInputs.lifestyle + calcInputs.safety + calcInputs.growth;

  const handleSyncGoal = () => {
    setFreedomGoal(calculatedFreedomTotal);
    setIsCalcOpen(false);
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-500 font-sans overflow-hidden ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-slate-50 text-slate-900'}`}>

      {/* Sidebar Rail */}
      <aside className={`w-20 md:w-24 flex flex-col items-center py-10 border-r transition-all duration-500 z-50 ${isDark ? 'bg-black border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-16 shadow-lg transition-colors ${isDark ? 'bg-white text-black' : 'bg-slate-900 text-white'}`}>
          <span className="font-black italic text-xl">A</span>
        </div>
        <nav className="flex flex-col gap-8 flex-grow">
          {[
            { id: 'dash', onClick: onNavigateDashboard, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>, active: false },
            { id: 'wealth', onClick: () => {}, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h20"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/><circle cx="12" cy="12" r="10"/></svg>, active: true },
            { id: 'explore', onClick: onNavigateExplore, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2 5.6-5.6 2 2-5.6 5.6-2z"/></svg>, active: false },
            { id: 'props', onClick: onNavigatePropertyHub, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M3 7v1a3 3 0 0 0 6 0V7"/><path d="M9 7v1a3 3 0 0 0 6 0V7"/><path d="M15 7v1a3 3 0 0 0 6 0V7"/><path d="M19 21V11"/><path d="m5 11 7-7 7 7"/><path d="M5 21v-10"/></svg>, active: false },
            { id: 'vendors', onClick: onNavigateVendors, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>, active: false },
          ].map((item) => (
            <button key={item.id} onClick={item.onClick} className={`p-4 rounded-2xl transition-all group relative ${item.active ? (isDark ? 'bg-[#E8FF4D] text-black shadow-lg shadow-[#E8FF4D]/20' : 'bg-violet-600 text-white shadow-lg shadow-violet-200') : (isDark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-900')}`}>
              {item.icon}
            </button>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-6">
          <button onClick={toggleTheme} className={`p-3 rounded-xl transition-all ${isDark ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-500'}`}>
            {isDark ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>}
          </button>
          <button onClick={onLogout} className={`p-3 rounded-xl transition-all ${isDark ? 'bg-white/5 text-white/40 hover:text-red-500' : 'bg-slate-100 text-slate-500 hover:text-red-600'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col overflow-y-auto h-screen relative">

        <header className={`px-12 py-10 flex items-center justify-between transition-all duration-500 sticky top-0 z-40 backdrop-blur-xl border-b ${isDark ? 'bg-black/60 border-white/5' : 'bg-white/90 border-slate-200'}`}>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">Wealth Journey</h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3 italic">Autonomous Strategic Roadmap</p>
          </div>
          <div className="flex items-center gap-12">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Projected Milestone</p>
                <div className="flex items-baseline gap-2 justify-end">
                   <span className={`text-3xl font-black tabular-nums ${isDark ? 'text-[#E8FF4D]' : 'text-violet-600'}`}>{projectedPercentage}%</span>
                   <span className="text-[10px] font-black opacity-30">of Goal</span>
                </div>
             </div>
             <button
                onClick={() => setIsDrawerOpen(true)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black shadow-xl border transition-all hover:scale-105 active:scale-95 ${isDark ? 'bg-[#1A1A1A] border-white/10 hover:border-[#E8FF4D]/30' : 'bg-white border-slate-200 hover:border-violet-300 shadow-sm'}`}
             >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
             </button>
          </div>
        </header>

        <div className="p-12 space-y-16 max-w-[1600px] mx-auto w-full">

          {/* THE ROADMAP */}
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className={`p-16 rounded-[4rem] border transition-all duration-500 relative overflow-hidden ${isDark ? 'bg-[#121212] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>

                <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16 relative z-10">
                   <div>
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 inline-block ${isDark ? 'bg-[#E8FF4D] text-black shadow-lg shadow-[#E8FF4D]/20' : 'bg-violet-600 text-white shadow-lg shadow-violet-200'}`}>Active Deployment Protocol</span>
                      <div className="flex items-center gap-6">
                        <h2 className="text-6xl font-black uppercase tracking-tighter leading-[0.9]">The Roadmap</h2>
                        <button
                          onClick={() => setIsCalcOpen(true)}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all hover:scale-110 active:scale-95 ${isDark ? 'bg-white/5 border-white/10 text-[#E8FF4D]' : 'bg-slate-50 border-slate-200 text-violet-600'}`}
                          title="Open Freedom Calculator"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19h16M4 5h16M12 5v14M8 5v14M16 5v14"/></svg>
                        </button>
                      </div>
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-6 italic max-w-xl">
                        Closing the <span className="text-current">${gap.toLocaleString()}</span> gap through specific operational actions. Optimized for <span className="text-current">{riskProfile}</span> deployment.
                      </p>
                   </div>
                   <div className="flex gap-4">
                      <button onClick={() => setIsDrawerOpen(true)} className={`px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest border transition-all hover:bg-slate-500/5 ${isDark ? 'border-white/10 text-white' : 'border-slate-200 text-slate-900'}`}>
                         Modify Strategy →
                      </button>
                   </div>
                </div>

                {selectedPriorities.length > 0 ? (
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                      {activeMissions.map((mission, index) => (
                         <div key={mission.id} className={`p-10 rounded-[3.5rem] border flex flex-col transition-all hover:translate-y-[-4px] ${isDark ? 'bg-black/40 border-white/5' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
                            <div className="flex items-center gap-6 mb-12">
                               <div className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black text-2xl shadow-xl ${isDark ? 'bg-white text-black' : 'bg-slate-900 text-white'}`}>{index + 1}</div>
                               <div>
                                  <h3 className="text-xl font-black uppercase tracking-tighter leading-none mb-1">{mission.title}</h3>
                                  <p className={`text-[10px] font-black uppercase tracking-[0.1em] ${isDark ? 'text-[#E8FF4D]' : 'text-violet-600'}`}>+${mission.monthlyImpact}/mo Impact</p>
                               </div>
                            </div>

                            <div className="space-y-6 mb-12 flex-grow">
                               {mission.steps.map((step, si) => (
                                  <div key={si} className="flex gap-5 group cursor-pointer">
                                     <div className={`w-6 h-6 rounded-xl border-2 shrink-0 flex items-center justify-center transition-all ${isDark ? 'border-white/10 group-hover:border-[#E8FF4D]' : 'border-slate-200 group-hover:border-violet-600'}`}>
                                        <div className={`w-2 h-2 rounded-lg bg-current opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                                     </div>
                                     <p className="text-sm font-bold tracking-tight opacity-50 group-hover:opacity-100 transition-opacity leading-relaxed">{step}</p>
                                  </div>
                               ))}
                            </div>

                            <div className={`mt-auto p-6 rounded-3xl ${isDark ? 'bg-white/5' : 'bg-white border border-slate-100 shadow-sm'}`}>
                               <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Driver Mechanics:</p>
                               <p className="text-[11px] italic font-medium opacity-60 leading-relaxed">"{mission.education}"</p>
                            </div>
                         </div>
                      ))}
                   </div>
                ) : (
                  <div className={`p-20 rounded-[3rem] text-center border-2 border-dashed ${isDark ? 'border-white/5' : 'border-slate-200'} opacity-40`}>
                     <p className="text-xl font-black uppercase tracking-widest">No active missions selected.</p>
                     <p className="text-xs font-bold uppercase tracking-widest mt-2">Open Command to initialize your journey.</p>
                  </div>
                )}
             </div>
          </section>

          {/* Impact Visualization / Gap Analysis */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <div className={`lg:col-span-8 p-12 rounded-[3.5rem] border ${isDark ? 'bg-[#1A1A1A] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-sm'} flex flex-col justify-between relative overflow-hidden`}>
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-black uppercase tracking-tighter">Financial Freedom Gap</h3>
                      <button
                        onClick={() => setIsCalcOpen(true)}
                        className={`text-[9px] font-black uppercase tracking-[0.2em] border px-4 py-2 rounded-xl transition-all ${isDark ? 'border-white/10 hover:bg-white/5 text-white/40' : 'border-slate-200 hover:bg-slate-50 text-slate-400'}`}
                      >
                        Recalculate Target
                      </button>
                   </div>
                   <div className="flex items-baseline gap-4 mb-10">
                      <p className="text-7xl font-black tabular-nums tracking-tighter">${gap.toLocaleString()}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Remaining / mo</p>
                   </div>

                   <div className="space-y-4">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                         <span className="opacity-40">Current Position</span>
                         <span>${currentNet.toLocaleString()}</span>
                      </div>
                      <div className="relative h-12 flex items-center group">
                         <div className={`absolute left-0 h-full w-full rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}></div>
                         <div
                            className={`absolute left-0 h-full rounded-l-2xl transition-all duration-1000 ease-out flex items-center justify-end px-6 ${isDark ? 'bg-white/20' : 'bg-slate-300'}`}
                            style={{ width: `${gapPercentage}%` }}
                         />
                         <div
                            className={`absolute h-full transition-all duration-1000 delay-500 ease-out border-x-2 border-white/10 ${isDark ? 'bg-[#E8FF4D]' : 'bg-violet-600 shadow-xl'}`}
                            style={{
                               left: `${gapPercentage}%`,
                               width: `${Math.min(100 - gapPercentage, (totalMissionImpact / freedomGoal) * 100)}%`,
                               borderTopRightRadius: projectedPercentage >= 100 ? '1rem' : '0',
                               borderBottomRightRadius: projectedPercentage >= 100 ? '1rem' : '0',
                            }}
                         >
                            <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-black uppercase tracking-widest animate-bounce">
                               +{projectedPercentage - gapPercentage}% Lift Active
                            </div>
                         </div>
                      </div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                         <span className={isDark ? 'text-[#E8FF4D]' : 'text-violet-600'}>Projected Path</span>
                         <span>${(currentNet + totalMissionImpact).toLocaleString()}</span>
                      </div>
                   </div>
                </div>
             </div>

             <div className={`lg:col-span-4 p-12 rounded-[3.5rem] border transition-all duration-700 relative overflow-hidden group ${isDark ? 'bg-white text-black shadow-2xl' : 'bg-slate-900 text-white shadow-2xl shadow-slate-200'}`}>
                <div className="relative z-10 h-full flex flex-col justify-between">
                   <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Next Goal Post</h3>
                      <p className="text-4xl font-black tabular-nums tracking-tighter mb-4">Lv. {Math.floor(currentNet/5000) + 2}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Reach $5k Monthly Inflow</p>
                   </div>
                   <div className="mt-12">
                      <button onClick={onNavigateDashboard} className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all hover:scale-105 ${isDark ? 'bg-black text-white' : 'bg-[#E8FF4D] text-black'}`}>
                         Apply Tactics to Assets
                      </button>
                   </div>
                </div>
             </div>
          </section>

        </div>

        <footer className="py-20 text-center opacity-10 border-t border-slate-500/10 dark:border-white/5 mt-32">
            <p className="text-[10px] font-black uppercase tracking-[2em]">Axori Journey OS V6.8.0 - 2024</p>
        </footer>

        {/* Global Sovereignty Command Drawer */}
        <div className={`fixed top-0 right-0 h-full w-full md:w-[650px] z-[100] transition-transform duration-700 ease-in-out shadow-[-30px_0_60px_rgba(0,0,0,0.3)] ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'} ${isDark ? 'bg-[#121212]' : 'bg-slate-50'}`}>
           <div className="h-full flex flex-col p-12 overflow-y-auto relative no-scrollbar">
              <header className="flex justify-between items-center mb-16">
                 <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black italic text-sm ${isDark ? 'bg-white text-black' : 'bg-slate-900 text-white'}`}>A</div>
                    <span className="text-[11px] font-black uppercase tracking-widest opacity-40">Journey Command</span>
                 </div>
                 <button onClick={() => setIsDrawerOpen(false)} className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white shadow-sm hover:bg-slate-50'}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                 </button>
              </header>

              <div className="space-y-16">
                 {/* Financial Target Section */}
                 <section className="space-y-8">
                    <h3 className="text-xl font-black uppercase tracking-tighter">Strategic Objective</h3>
                    <div className="space-y-10">
                       {/* Wealth Calculator Trigger Card */}
                       <button
                        onClick={() => setIsCalcOpen(true)}
                        className={`w-full p-8 rounded-[2.5rem] border text-left transition-all group overflow-hidden relative ${isDark ? 'bg-white/5 border-white/10 hover:border-[#E8FF4D]/30' : 'bg-white border-slate-200 hover:border-violet-300 shadow-sm'}`}
                       >
                         <div className="flex justify-between items-center relative z-10">
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Discovery Utility</p>
                               <h4 className="text-2xl font-black uppercase tracking-tight">Freedom Calculator</h4>
                               <p className="text-xs font-medium text-slate-500 mt-2 max-w-xs">Derive your monthly target by auditing Essentials, Lifestyle, and Safety buffers.</p>
                            </div>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${isDark ? 'bg-[#E8FF4D] text-black' : 'bg-violet-600 text-white shadow-lg shadow-violet-200'}`}>
                               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 19h16M4 5h16M12 5v14M8 5v14M16 5v14"/></svg>
                            </div>
                         </div>
                         <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                            <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2V9h-2V7h4v10z"/></svg>
                         </div>
                       </button>

                       <div>
                          <div className="flex justify-between mb-4 px-2">
                             <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Active Freedom Goal</label>
                             <span className="text-lg font-black tabular-nums">${freedomGoal.toLocaleString()}</span>
                          </div>
                          <input
                             type="range" min="1000" max="50000" step="500" value={freedomGoal}
                             onChange={(e) => setFreedomGoal(Number(e.target.value))}
                             className="w-full h-1.5 bg-slate-500/10 rounded-full appearance-none cursor-pointer accent-current"
                          />
                       </div>
                    </div>
                 </section>

                 <div className="h-px bg-slate-500/10 w-full"></div>

                 {/* Active Missions Selector */}
                 <section className="space-y-8 pb-16">
                    <div className="flex justify-between items-end">
                       <div className="flex flex-col gap-2">
                          <h3 className="text-xl font-black uppercase tracking-tighter">Mission Marketplace</h3>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Select 3 tangible drivers for your roadmap.</p>
                       </div>
                       <div className="flex gap-1.5 mb-1">
                          {[1,2,3].map(i => (
                             <div key={i} className={`w-2.5 h-6 rounded-full transition-all duration-500 ${i <= selectedPriorities.length ? (isDark ? 'bg-[#E8FF4D]' : 'bg-violet-600') : 'bg-slate-500/10'}`}></div>
                          ))}
                       </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                       {missions.map(mission => {
                          const isSelected = selectedPriorities.includes(mission.id);
                          const isDisabled = !isSelected && selectedPriorities.length >= 3;

                          return (
                             <button
                                key={mission.id}
                                disabled={isDisabled}
                                onClick={() => togglePriority(mission.id)}
                                className={`p-8 rounded-[2.5rem] border flex items-center gap-6 text-left transition-all duration-500 relative overflow-hidden group ${
                                   isSelected
                                   ? (isDark ? 'bg-white text-black border-white shadow-2xl scale-[1.02]' : 'bg-slate-900 text-white border-slate-900 shadow-2xl scale-[1.02]')
                                   : isDisabled
                                      ? 'opacity-20 grayscale cursor-not-allowed shadow-none'
                                      : (isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-200 hover:shadow-lg shadow-sm')
                                }`}
                             >
                                <div className={`w-16 h-16 rounded-[1.5rem] shrink-0 flex items-center justify-center text-3xl transition-all duration-500 ${
                                   isSelected ? (isDark ? 'bg-black text-white' : 'bg-white text-slate-900 shadow-lg') : 'bg-slate-500/10'
                                }`}>
                                   {mission.icon}
                                </div>
                                <div className="flex-grow">
                                   <div className="flex justify-between items-center mb-1">
                                      <h4 className="text-lg font-black uppercase tracking-tight">{mission.title}</h4>
                                      {isSelected && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                                   </div>
                                   <div className="flex gap-4">
                                      <p className={`text-[10px] font-bold uppercase tracking-widest leading-none ${isSelected ? 'opacity-60' : 'text-slate-500'}`}>+${mission.monthlyImpact}/mo</p>
                                      <span className="text-[10px] opacity-20">|</span>
                                      <p className={`text-[10px] font-bold uppercase tracking-widest leading-none opacity-40`}>{mission.impactLabel}</p>
                                   </div>
                                </div>
                             </button>
                          );
                       })}
                    </div>
                 </section>

                 <div className="sticky bottom-0 bg-inherit pt-8 border-t border-slate-500/10">
                    <button
                       onClick={() => setIsDrawerOpen(false)}
                       className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-95 ${isDark ? 'bg-[#E8FF4D] text-black shadow-[#E8FF4D]/20' : 'bg-violet-600 text-white shadow-violet-200'}`}
                    >
                       Initialize Protocol
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* Freedom Calculator Modal */}
        {isCalcOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in">
            <div className={`max-w-2xl w-full p-12 rounded-[4rem] border shadow-2xl transition-all duration-500 ${isDark ? 'bg-[#1A1A1A] border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <header className="flex justify-between items-center mb-12">
                <div>
                   <h2 className="text-3xl font-black uppercase tracking-tighter">Freedom Calculator</h2>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Deriving the Strategic Monthly Target</p>
                </div>
                <button onClick={() => setIsCalcOpen(false)} className="p-3 opacity-40 hover:opacity-100">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
                 {[
                   { id: 'essentials', label: 'Essential Expenses', icon: '🏠', sub: 'Housing, Food, Health' },
                   { id: 'lifestyle', label: 'Lifestyle Design', icon: '✈️', sub: 'Travel, Hobbies, Fun' },
                   { id: 'safety', label: 'Safety Margin', icon: '🛡️', sub: 'Maintenance, Reserves' },
                   { id: 'growth', label: 'Wealth Re-Investment', icon: '🚀', sub: 'For Next Acquisitions' }
                 ].map(field => (
                   <div key={field.id} className="space-y-4">
                      <div className="flex justify-between items-end">
                         <label className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
                           <span>{field.icon}</span> {field.label}
                         </label>
                         <span className="text-sm font-black tabular-nums">${calcInputs[field.id as keyof typeof calcInputs].toLocaleString()}</span>
                      </div>
                      <input
                        type="range" min="0" max="15000" step="250"
                        value={calcInputs[field.id as keyof typeof calcInputs]}
                        onChange={(e) => setCalcInputs({...calcInputs, [field.id]: parseInt(e.target.value)})}
                        className="w-full h-1.5 bg-slate-500/10 rounded-full appearance-none cursor-pointer accent-current"
                      />
                      <p className="text-[9px] font-bold opacity-30 italic leading-none">{field.sub}</p>
                   </div>
                 ))}
              </div>

              <div className={`p-8 rounded-[2.5rem] border flex items-center justify-between mb-12 ${isDark ? 'bg-white text-black border-white shadow-2xl' : 'bg-slate-900 text-white border-slate-900 shadow-2xl shadow-violet-200'}`}>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Calculated Sovereignty Target</p>
                    <p className="text-4xl font-black tabular-nums tracking-tighter">${calculatedFreedomTotal.toLocaleString()}<span className="text-base opacity-40">/ mo</span></p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black uppercase opacity-60 mb-1">Annual Yield Req.</p>
                    <p className="text-xl font-black tabular-nums tracking-tighter">${(calculatedFreedomTotal * 12).toLocaleString()}</p>
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
        )}

        {/* Drawer Backdrop */}
        {isDrawerOpen && (
           <div
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-md z-[90] transition-opacity duration-700"
           />
        )}
      </main>
    </div>
  );
};

export default WealthJourneyPage;
