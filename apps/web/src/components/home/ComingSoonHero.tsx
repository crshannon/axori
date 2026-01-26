import { EmailCaptureForm } from "./EmailCaptureForm";
import { Sparkles } from "lucide-react";

/**
 * Coming Soon Hero Component
 *
 * The main hero section for the soft-launch landing page.
 * Features the "Coming Soon" badge, main headline, and email capture form.
 */
export function ComingSoonHero() {
  return (
    <section
      className="
        relative w-full overflow-hidden
        bg-gradient-to-b from-slate-50 via-white to-slate-50
        dark:from-[#0F1115] dark:via-[#0F1115] dark:to-[#0F1115]
        pt-12 pb-24 md:pt-20 md:pb-32
      "
    >
      {/* Background decoration */}
      <div
        className="
          absolute inset-0 opacity-30
          bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]
          from-violet-200 via-transparent to-transparent
          dark:from-violet-900/20 dark:via-transparent dark:to-transparent
        "
      />

      <div className="relative mx-auto max-w-[1440px] px-4 md:px-6">
        <div className="flex flex-col items-center text-center">
          {/* Coming Soon Badge */}
          <div
            className="
              mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2
              bg-violet-100 text-violet-700
              dark:bg-[#E8FF4D]/10 dark:text-[#E8FF4D]
              border border-violet-200 dark:border-[#E8FF4D]/20
            "
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Coming Soon
            </span>
          </div>

          {/* Main Headline */}
          <h1
            className="
              text-huge mb-6
              text-slate-900 dark:text-white
            "
          >
            Own Your{" "}
            <span
              className="
                text-violet-600 dark:text-[#E8FF4D]
              "
            >
              Wealth
            </span>
            ,<br />
            Own Your{" "}
            <span
              className="
                text-violet-600 dark:text-[#E8FF4D]
              "
            >
              Data
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="
              mb-10 max-w-2xl text-lg md:text-xl
              text-slate-600 dark:text-white/60
              leading-relaxed
            "
          >
            The investment platform real estate investors have been waiting for.
            Institutional-grade analytics, personalized insights, and the tools
            to scale your portfolio — all in one place.
          </p>

          {/* Email Capture Form */}
          <div className="w-full max-w-xl">
            <EmailCaptureForm source="hero" variant="hero" />
            <p
              className="
                mt-4 text-xs
                text-slate-500 dark:text-white/40
              "
            >
              Join the early access list. Be the first to know when we launch.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div
        className="
          absolute bottom-0 left-0 right-0 h-24
          bg-gradient-to-t from-slate-50 to-transparent
          dark:from-[#0F1115] dark:to-transparent
        "
      />
    </section>
  );
}
