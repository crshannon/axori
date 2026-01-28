import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { useComingSoonMode } from '@/hooks/useFeatureFlags'
import { EmailCaptureForm } from '@/components/home/EmailCaptureForm'

export const Footer = () => {
  const comingSoonMode = useComingSoonMode()

  return (
    <footer className="relative overflow-hidden transition-colors duration-500 bg-slate-50 text-slate-500 dark:bg-[#0a0a0c] dark:text-slate-200">
      {/* Email Capture Section - Only in coming soon mode */}
      {comingSoonMode && (
        <div
          id="waitlist"
          className="relative border-b border-black/5 dark:border-white/5"
        >
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent dark:via-violet-500/5" />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-500/10 rounded-full blur-[100px] dark:bg-violet-500/5" />

          <div className="relative max-w-[1400px] mx-auto px-4 py-24 md:py-32">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
              {/* Left content */}
              <div className="max-w-lg">
                <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-[#E8FF4D]/10 border border-violet-200 dark:border-[#E8FF4D]/20">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-[#E8FF4D]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-[#E8FF4D]">
                    Limited Spots
                  </span>
                </div>
                <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-slate-900 dark:text-white leading-[0.95]">
                  Be Among
                  <br />
                  The First
                </h3>
                <p className="text-base font-medium text-slate-500 dark:text-white/50 max-w-md">
                  Join 2,400+ investors already on the waitlist. Get exclusive
                  early access and founder pricing when we launch.
                </p>
              </div>

              {/* Right - Form */}
              <div className="w-full lg:w-auto lg:min-w-[420px]">
                <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl shadow-violet-500/5 dark:shadow-none">
                  <EmailCaptureForm source="footer" variant="footer" />
                  <div className="mt-4 flex items-center gap-4 text-[10px] text-slate-400 dark:text-white/30 font-medium">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Free forever tier
                    </span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Cancel anytime
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Footer */}
      <div className="max-w-[1400px] mx-auto px-4 py-16 md:py-20">
        <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-20">
          <div className="max-w-sm">
            <Link
              to="/"
              className="flex items-center gap-2 mb-8 outline-none group text-left"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-200">
                <span className="font-black italic text-lg transition-colors text-white dark:text-black">
                  A
                </span>
              </div>
              <span className="text-xl font-black tracking-tighter uppercase transition-colors text-slate-900 dark:text-white">
                AXORI
              </span>
            </Link>
            <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-white/40 mb-8">
              Real estate investment intelligence for the modern portfolio
              manager. Built by investors, for ambitious wealth builders.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all group"
              >
                <svg
                  className="w-4 h-4 text-slate-500 dark:text-white/50 group-hover:text-slate-900 dark:group-hover:text-white transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all group"
              >
                <svg
                  className="w-4 h-4 text-slate-500 dark:text-white/50 group-hover:text-slate-900 dark:group-hover:text-white transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-16">
            <div>
              <h4 className="font-black uppercase text-[10px] tracking-[0.2em] mb-6 text-slate-900 dark:text-white">
                PRODUCT
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/"
                    className="text-sm font-medium text-slate-500 dark:text-white/50 hover:text-violet-600 dark:hover:text-[#E8FF4D] transition-colors inline-flex items-center gap-1 group"
                  >
                    Features
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/pricing"
                    className="text-sm font-medium text-slate-500 dark:text-white/50 hover:text-violet-600 dark:hover:text-[#E8FF4D] transition-colors inline-flex items-center gap-1 group"
                  >
                    Pricing
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/analysis"
                    className="text-sm font-medium text-slate-500 dark:text-white/50 hover:text-violet-600 dark:hover:text-[#E8FF4D] transition-colors inline-flex items-center gap-1 group"
                  >
                    Analysis Engine
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-black uppercase text-[10px] tracking-[0.2em] mb-6 text-slate-900 dark:text-white">
                COMPANY
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/about"
                    className="text-sm font-medium text-slate-500 dark:text-white/50 hover:text-violet-600 dark:hover:text-[#E8FF4D] transition-colors inline-flex items-center gap-1 group"
                  >
                    About
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-sm font-medium text-slate-500 dark:text-white/50 hover:text-violet-600 dark:hover:text-[#E8FF4D] transition-colors inline-flex items-center gap-1 group"
                  >
                    Contact
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm font-medium text-slate-500 dark:text-white/50 hover:text-violet-600 dark:hover:text-[#E8FF4D] transition-colors inline-flex items-center gap-1 group"
                  >
                    Careers
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
              </ul>
            </div>
            <div className="hidden md:block">
              <h4 className="font-black uppercase text-[10px] tracking-[0.2em] mb-6 text-slate-900 dark:text-white">
                LEGAL
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-sm font-medium text-slate-500 dark:text-white/50 hover:text-violet-600 dark:hover:text-[#E8FF4D] transition-colors"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm font-medium text-slate-500 dark:text-white/50 hover:text-violet-600 dark:hover:text-[#E8FF4D] transition-colors"
                  >
                    Terms
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm font-medium text-slate-500 dark:text-white/50 hover:text-violet-600 dark:hover:text-[#E8FF4D] transition-colors"
                  >
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-medium text-slate-400 dark:text-white/30">
            © {new Date().getFullYear()} Axori Technologies Inc. All rights
            reserved.
          </p>
          <div className="flex items-center gap-6 text-xs font-medium text-slate-400 dark:text-white/30">
            <a
              href="#"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
