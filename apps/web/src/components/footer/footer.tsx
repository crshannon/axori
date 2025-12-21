import { Link } from '@tanstack/react-router'

export const Footer = () => {
  return (
    <footer className="py-20 px-4 transition-colors duration-500 border-t bg-slate-50 text-slate-500 border-black/5 dark:bg-black dark:text-slate-200 dark:border-white/5">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-20">
          <div className="max-w-sm">
            <Link
              to="/"
              className="flex items-center gap-2 mb-8 outline-none group text-left"
            >
              <div className="w-8 h-8 rounded flex items-center justify-center transition-all group-hover:scale-110 bg-slate-900 dark:bg-white">
                <span className="font-black italic transition-colors text-white dark:text-black">
                  A
                </span>
              </div>
              <span className="text-xl font-extrabold tracking-tight uppercase transition-colors text-slate-900 dark:text-white">
                AXORI
              </span>
            </Link>
            <p className="text-sm font-bold uppercase tracking-widest opacity-40 leading-relaxed">
              Real estate investment intelligence for the modern portfolio
              manager. Built by investors, for the top 1%.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
            <div>
              <h4 className="font-black uppercase text-[10px] tracking-[0.3em] mb-8 transition-colors text-slate-900 dark:text-white">
                PRODUCT
              </h4>
              <ul className="space-y-4 text-xs font-bold uppercase tracking-widest transition-colors text-slate-400 hover:text-violet-600 dark:text-slate-500 dark:hover:text-[#E8FF4D]">
                <li>
                  <Link to="/" className="hover:text-current transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/pricing"
                    className="hover:text-current transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    to="/analysis"
                    className="hover:text-current transition-colors"
                  >
                    Analysis Engine
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-black uppercase text-[10px] tracking-[0.3em] mb-8 transition-colors text-slate-900 dark:text-white">
                COMPANY
              </h4>
              <ul className="space-y-4 text-xs font-bold uppercase tracking-widest transition-colors text-slate-400 hover:text-violet-600 dark:text-slate-500 dark:hover:text-[#E8FF4D]">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-current transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-current transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-current transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
            <div className="hidden md:block">
              <h4 className="font-black uppercase text-[10px] tracking-[0.3em] mb-8 transition-colors text-slate-900 dark:text-white">
                SOCIAL
              </h4>
              <ul className="space-y-4 text-xs font-bold uppercase tracking-widest transition-colors text-slate-400 hover:text-violet-600 dark:text-slate-500 dark:hover:text-[#E8FF4D]">
                <li>
                  <a href="#" className="hover:text-current transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-current transition-colors">
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t flex flex-col md:flex-row justify-between items-center gap-6 border-black/5 dark:border-white/5">
          <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40 transition-colors text-slate-500 dark:text-slate-200">
            © {new Date().getFullYear()} AXORI TECH. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-10 text-xs font-black uppercase tracking-[0.3em] opacity-40 transition-colors text-slate-500 dark:text-slate-200">
            <a
              href="#"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Legal
            </a>
            <a
              href="#"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
