import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/contact')({
  component: Contact,
})

function Contact() {
  const accentColorClass = 'text-violet-600 dark:text-[#E8FF4D]'
  const inputBase =
    'w-full px-6 py-4 rounded-2xl text-sm font-bold border transition-all outline-none'
  const inputClasses = `${inputBase} bg-slate-100 border-slate-200 text-slate-900 focus:border-violet-300 focus:bg-white shadow-inner dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:border-[#E8FF4D]/50 dark:focus:bg-white/10`

  return (
    <main className="flex-grow pt-12 pb-32">
      <div className="max-w-[1440px] mx-auto px-6">
        {/* Hero Section */}
        <div className="mb-20">
          <h1 className="text-[clamp(3rem,8vw,6rem)] leading-[0.9] tracking-[-0.04em] font-extrabold uppercase mb-6 transition-colors text-slate-900 dark:text-white">
            LET'S TALK <br />
            <span className={accentColorClass}>NUMBERS</span>.
          </h1>
          <p className="max-w-xl text-xl text-slate-400 font-medium leading-relaxed">
            Whether you have 2 units or 200, our team of analysts and engineers
            is ready to help you optimize.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Contact Form Bento Card */}
          <div className="lg:col-span-7 p-10 md:p-14 rounded-[3rem] border transition-colors bg-white border-black/5 shadow-xl shadow-slate-200/50 dark:bg-[#1A1A1A] dark:border-white/5 dark:shadow-black/20">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-10 text-slate-900 dark:text-white">
              Send a Message
            </h2>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className={inputClasses}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className={inputClasses}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">
                  Portfolio Size
                </label>
                <select className={inputClasses}>
                  <option>Select size...</option>
                  <option>1-5 units</option>
                  <option>5-20 units</option>
                  <option>20-50 units</option>
                  <option>50+ units</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">
                  Your Message
                </label>
                <textarea
                  rows={5}
                  placeholder="Tell us about your portfolio goals..."
                  className={inputClasses}
                ></textarea>
              </div>
              <button className="w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-violet-200 transform transition-all active:scale-95 bg-violet-600 text-white hover:bg-violet-700 dark:bg-[#E8FF4D] dark:text-black dark:hover:bg-[#d9f03e] dark:shadow-black/30">
                DEPLOY ANALYST REQUEST
              </button>
            </form>
          </div>

          {/* Sidebar Cards */}
          <div className="lg:col-span-5 space-y-6">
            {/* Direct Contact Card */}
            <div className="p-10 rounded-[3rem] border flex flex-col justify-between transition-colors min-h-[280px] bg-slate-900 text-white dark:bg-white dark:text-black">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-6">
                  DIRECT LINE
                </p>
                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">
                  connect@axori.io
                </h3>
                <p className="text-lg font-bold opacity-60">
                  +1 (212) 555-0192
                </p>
              </div>
              <div className="flex gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-xl border flex items-center justify-center border-current opacity-30 hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="m16 12-4-4-4 4M12 16V8" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Card */}
            <div className="p-10 rounded-[3rem] border transition-colors min-h-[280px] relative overflow-hidden group bg-violet-50 border-violet-100 shadow-sm dark:bg-[#1A1A1A] dark:border-white/5">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                <svg
                  width="140"
                  height="140"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
                </svg>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">
                GLOBAL HQ
              </p>
              <h3 className="text-2xl font-black uppercase tracking-tighter transition-colors text-slate-900 dark:text-white">
                99 WALL STREET
                <br />
                SUITE 402
                <br />
                NEW YORK, NY 10005
              </h3>
              <div
                className={`mt-8 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${accentColorClass}`}
              >
                <span>View on map</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </div>
            </div>

            {/* FAQ Teaser */}
            <div className="p-10 rounded-[3rem] border border-dashed flex items-center justify-between transition-colors border-slate-300 text-slate-400 dark:border-white/10 dark:text-white/40">
              <div>
                <p className="text-xs font-black uppercase tracking-widest">
                  Looking for help?
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1">
                  Visit our documentation site
                </p>
              </div>
              <div className="w-10 h-10 rounded-full border border-current flex items-center justify-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
