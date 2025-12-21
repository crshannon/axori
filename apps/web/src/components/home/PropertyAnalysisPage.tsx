
import React from 'react';
import PropertyScoreGauge from './PropertyScoreGauge';

interface PropertyAnalysisPageProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onBack: () => void;
  propertyId: string | null;
}

const PropertyAnalysisPage: React.FC<PropertyAnalysisPageProps> = ({ theme, toggleTheme, onBack, propertyId }) => {
  const isDark = theme === 'dark';
  const cardClass = `p-10 rounded-[3.5rem] border transition-all duration-500 ${isDark ? 'bg-[#1A1A1A] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`;

  // Mock property data (assuming we fetched it using propertyId)
  const prop = {
    addr: '4402 Westview Dr, Austin, TX',
    match: 98,
    iq: 92,
    price: '$425,000',
    type: 'Multi-Family Duplex',
    yearBuilt: '1984 (Renovated 2021)',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200',
    metrics: [
      { l: 'Gross Yield', v: '7.8%' },
      { l: 'Cap Rate', v: '6.2%' },
      { l: 'Cash-on-Cash', v: '11.4%' },
      { l: 'Debt Coverage', v: '1.65x' }
    ],
    swot: {
      strengths: ['Section 8 voucher readiness', 'Low structural risk score', 'Recent HVAC upgrade'],
      weaknesses: ['Shared utility metering', 'Limited off-street parking'],
      opportunities: ['ADU potential in backyard', 'Tax abatement available'],
      threats: ['New high-density supply nearby']
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${isDark ? 'bg-[#0F1115] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Header Navigation */}
      <header className={`px-8 py-6 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${isDark ? 'bg-black/60 border-white/5' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black uppercase tracking-tighter leading-none">{prop.addr}</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Deep Dive Report — #{propertyId || '0x402'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className={`px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isDark ? 'bg-[#E8FF4D] text-black shadow-lg hover:scale-105' : 'bg-violet-600 text-white shadow-xl shadow-violet-200 hover:scale-105'}`}>
            Export Full Report
          </button>
        </div>
      </header>

      <main className="flex-grow p-8 max-w-[1440px] mx-auto w-full">
        
        {/* Top Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-8 rounded-[4rem] overflow-hidden relative min-h-[500px] shadow-2xl">
            <img src={prop.image} className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" alt={prop.addr} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
              <div>
                <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">{prop.addr}</h2>
                <div className="flex gap-3">
                  <span className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest">{prop.type}</span>
                  <span className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest">{prop.yearBuilt}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">List Price</p>
                <p className="text-4xl font-black text-[#E8FF4D] tracking-tighter">{prop.price}</p>
              </div>
            </div>
          </div>

          <div className={`${cardClass} lg:col-span-4 flex flex-col justify-center items-center text-center`}>
            <PropertyScoreGauge score={prop.iq} size="lg" />
            <div className="mt-12 space-y-6 w-full">
              <div className="flex justify-between items-center px-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">DNA Match</span>
                <span className={`text-xl font-black ${isDark ? 'text-[#E8FF4D]' : 'text-violet-600'}`}>{prop.match}%</span>
              </div>
              <div className="h-2 w-full bg-slate-500/10 rounded-full overflow-hidden">
                <div className={`h-full ${isDark ? 'bg-[#E8FF4D]' : 'bg-violet-600'} rounded-full`} style={{ width: `${prop.match}%` }}></div>
              </div>
              <p className="text-xs font-bold text-slate-500 italic px-6 leading-relaxed">
                "This property is in the top 2% of matches for your <strong>Cash Flow</strong> strategy."
              </p>
            </div>
          </div>
        </div>

        {/* High Precision Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {prop.metrics.map(m => (
            <div key={m.l} className={`${cardClass} p-8 flex flex-col justify-between`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{m.l}</p>
              <p className="text-4xl font-black tabular-nums tracking-tighter mt-4">{m.v}</p>
            </div>
          ))}
        </div>

        {/* Advanced Context Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Market Sentiment / Heatmap Simulator */}
          <div className={`${cardClass} lg:col-span-7 overflow-hidden relative`}>
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Market Sentiment</h3>
              <div className="flex gap-4">
                <span className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500">
                  <div className="w-2 h-2 rounded-full bg-current"></div> Rising Demand
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { l: 'Median Rent', v: '$2,850', s: '+12% YoY' },
                { l: 'Days on Market', v: '14', s: '-4d YoY' },
                { l: 'Sales Velocity', v: 'High', s: 'Tier 1' }
              ].map(stat => (
                <div key={stat.l} className={`p-6 rounded-3xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <p className="text-[9px] font-black uppercase text-slate-500 mb-2">{stat.l}</p>
                  <p className="text-xl font-black tracking-tight">{stat.v}</p>
                  <p className="text-[8px] font-bold text-emerald-500 mt-1 uppercase">{stat.s}</p>
                </div>
              ))}
            </div>

            <div className={`h-40 w-full rounded-3xl border border-dashed relative overflow-hidden flex items-center justify-center ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
               <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <svg width="100%" height="100%"><defs><pattern id="grid-mini" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid-mini)" /></svg>
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Sub-market Heatmap Analysis — Loading...</p>
            </div>
          </div>

          {/* SWOT Intelligence */}
          <div className={`${cardClass} lg:col-span-5`}>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-10">SWOT Intelligence</h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Strengths</p>
                <ul className="space-y-2">
                  {prop.swot.strengths.map(s => <li key={s} className="text-[10px] font-bold uppercase opacity-60 flex gap-2"><span className="text-emerald-500">+</span> {s}</li>)}
                </ul>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">Weaknesses</p>
                <ul className="space-y-2">
                  {prop.swot.weaknesses.map(w => <li key={w} className="text-[10px] font-bold uppercase opacity-60 flex gap-2"><span className="text-red-500">−</span> {w}</li>)}
                </ul>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Opportunities</p>
                <ul className="space-y-2">
                  {prop.swot.opportunities.map(o => <li key={o} className="text-[10px] font-bold uppercase opacity-60 flex gap-2"><span className="text-blue-500">→</span> {o}</li>)}
                </ul>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Threats</p>
                <ul className="space-y-2">
                  {prop.swot.threats.map(t => <li key={t} className="text-[10px] font-bold uppercase opacity-60 flex gap-2"><span className="text-amber-500">!</span> {t}</li>)}
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Final Conclusion / AI Recommendation */}
        <div className={`p-16 rounded-[4rem] text-center border-2 transition-all duration-700 ${isDark ? 'bg-black border-[#E8FF4D]/20' : 'bg-white border-violet-100 shadow-2xl shadow-violet-100'}`}>
          <div className={`w-16 h-16 rounded-3xl mx-auto mb-10 flex items-center justify-center text-3xl font-black shadow-2xl ${isDark ? 'bg-[#E8FF4D] text-black' : 'bg-violet-600 text-white'}`}>A</div>
          <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-6">AI RECOMMENDATION</h2>
          <p className="max-w-2xl mx-auto text-xl font-medium text-slate-500 italic mb-12 leading-relaxed">
            "Based on your current portfolio debt-to-equity ratio and the local market forecast, we recommend <strong>Deploying Capital</strong> to this asset with a target exit in <strong>Q3 2029</strong>."
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
             <button className={`px-16 py-6 rounded-full font-black uppercase tracking-widest text-xs transition-all ${isDark ? 'bg-white text-black hover:scale-105' : 'bg-slate-900 text-white hover:scale-105'}`}>
                Request Pro-Forma Audit
             </button>
             <button className={`px-16 py-6 rounded-full font-black uppercase tracking-widest text-xs transition-all border-2 ${isDark ? 'border-white/10 text-white hover:bg-white/5' : 'border-slate-200 text-slate-900 hover:bg-slate-50'}`}>
                Schedule with Advisor
             </button>
          </div>
        </div>

      </main>

      {/* Footer Branding */}
      <footer className="py-20 px-8 text-center opacity-20">
         <p className="text-[10px] font-black uppercase tracking-[0.5em]">Axori High-Fidelity Intelligence Report — Confidential</p>
      </footer>

    </div>
  );
};

export default PropertyAnalysisPage;
