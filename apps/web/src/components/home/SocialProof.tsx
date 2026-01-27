import { Star } from "lucide-react";

/**
 * Social Proof / Testimonials Section
 *
 * Showcases investor testimonials and trust signals
 * with an animated marquee effect.
 */

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "Finally, a platform that understands how serious investors think. The analytics are institutional-grade.",
    name: "Marcus Chen",
    role: "Portfolio: 47 Units",
    avatar: "MC",
    rating: 5,
  },
  {
    quote:
      "Went from spreadsheets to complete visibility in one weekend. My CPA is thrilled.",
    name: "Sarah Williams",
    role: "Portfolio: 12 Units",
    avatar: "SW",
    rating: 5,
  },
  {
    quote:
      "The Freedom Number tracker keeps me motivated. I can actually see my path to FI.",
    name: "James Rodriguez",
    role: "Portfolio: 8 Units",
    avatar: "JR",
    rating: 5,
  },
  {
    quote:
      "Investment scoring changed how I evaluate deals. Saved me from two bad purchases already.",
    name: "Emily Thompson",
    role: "Portfolio: 23 Units",
    avatar: "ET",
    rating: 5,
  },
  {
    quote:
      "The tax optimization tools alone paid for 10 years of subscription in the first month.",
    name: "David Park",
    role: "Portfolio: 31 Units",
    avatar: "DP",
    rating: 5,
  },
  {
    quote:
      "Clean interface, powerful insights. This is what real estate software should be.",
    name: "Lisa Martinez",
    role: "Portfolio: 15 Units",
    avatar: "LM",
    rating: 5,
  },
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="flex-shrink-0 w-[350px] p-6 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-lg hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 group">
      {/* Rating */}
      <div className="flex gap-0.5 mb-4">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star
            key={i}
            className="w-4 h-4 fill-[#E8FF4D] text-[#E8FF4D] dark:fill-[#E8FF4D] dark:text-[#E8FF4D]"
          />
        ))}
      </div>

      {/* Quote */}
      <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-white/70 mb-6">
        "{testimonial.quote}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 dark:from-[#E8FF4D] dark:to-lime-400 flex items-center justify-center">
          <span className="text-xs font-black text-white dark:text-black">
            {testimonial.avatar}
          </span>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {testimonial.name}
          </p>
          <p className="text-xs text-slate-500 dark:text-white/40">
            {testimonial.role}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SocialProof() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-slate-100/50 dark:bg-[#0c0c0e]">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-500/5 via-transparent to-transparent dark:from-violet-500/5 dark:via-transparent dark:to-transparent" />

      <div className="relative mx-auto max-w-[1440px] px-4 md:px-6 mb-12">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-[#E8FF4D]">
            Trusted by Investors
          </p>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            Loved by{" "}
            <span className="text-violet-600 dark:text-[#E8FF4D]">
              2,400+
            </span>{" "}
            Property Investors
          </h2>
        </div>
      </div>

      {/* Marquee Container */}
      <div className="relative">
        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-100/50 dark:from-[#0c0c0e] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-100/50 dark:from-[#0c0c0e] to-transparent z-10 pointer-events-none" />

        {/* First row - moving left */}
        <div className="flex gap-6 mb-6 animate-marquee-left">
          {[...testimonials, ...testimonials].map((testimonial, index) => (
            <TestimonialCard key={`row1-${index}`} testimonial={testimonial} />
          ))}
        </div>

        {/* Second row - moving right */}
        <div className="flex gap-6 animate-marquee-right">
          {[...testimonials.reverse(), ...testimonials].map(
            (testimonial, index) => (
              <TestimonialCard key={`row2-${index}`} testimonial={testimonial} />
            )
          )}
        </div>
      </div>

      {/* Trust badges */}
      <div className="relative mx-auto max-w-[1440px] px-4 md:px-6 mt-16">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          <div className="flex items-center gap-3 text-slate-400 dark:text-white/30">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider">
              SOC 2 Compliant
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 dark:text-white/30">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider">
              256-bit Encryption
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 dark:text-white/30">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
              />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider">
              99.9% Uptime
            </span>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee-left {
          animation: marquee-left 40s linear infinite;
        }
        .animate-marquee-right {
          animation: marquee-right 40s linear infinite;
        }
        .animate-marquee-left:hover,
        .animate-marquee-right:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
