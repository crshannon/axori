import { createFileRoute } from "@tanstack/react-router";
import { Button, FormLabel, Input, Select, Textarea } from "@axori/ui";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Github,
  HelpCircle,
  Linkedin,
  Mail,
  MessageSquare,
  Send,
  Sparkles,
  Twitter,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/_public/contact")({
  component: Contact,
});

/**
 * Social links for the contact page
 */
const SOCIALS = [
  { icon: Twitter, label: "Twitter", href: "https://twitter.com/axori" },
  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/company/axori" },
  { icon: Github, label: "GitHub", href: "https://github.com/axori" },
] as const;

/**
 * Response time stats
 */
const RESPONSE_STATS = [
  { value: "<2h", label: "Avg Response", icon: Clock },
  { value: "24/7", label: "Support", icon: Zap },
  { value: "98%", label: "Satisfaction", icon: CheckCircle2 },
] as const;

/**
 * Contact Page Component
 *
 * Clean contact form with email-focused communication,
 * social links, and response time indicators.
 */
function Contact() {
  return (
    <main className="relative flex-grow pt-12 pb-32 overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="contact-grid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#contact-grid)" />
        </svg>
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-20 right-1/4 w-[600px] h-[600px] bg-violet-500/20 rounded-full blur-[150px] dark:bg-violet-500/10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#E8FF4D]/15 rounded-full blur-[120px] dark:bg-[#E8FF4D]/10" />
      <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] dark:bg-blue-500/5" />

      {/* Floating Elements */}
      <div className="absolute top-32 right-[15%] hidden lg:block animate-float">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-500/30 flex items-center justify-center">
          <MessageSquare className="w-7 h-7 text-white" />
        </div>
      </div>
      <div className="absolute bottom-40 left-[10%] hidden lg:block animate-float" style={{ animationDelay: "1s" }}>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
          <Mail className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="absolute top-1/2 left-[5%] hidden lg:block animate-float" style={{ animationDelay: "2s" }}>
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 md:px-6">
        {/* Hero Section */}
        <div className="mb-16 md:mb-20">
          {/* Badge */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-lg shadow-violet-500/5">
              <MessageSquare className="w-4 h-4 text-violet-500 dark:text-[#E8FF4D]" />
              <span className="text-xs font-black uppercase tracking-widest text-violet-600 dark:text-[#E8FF4D]">
                Get In Touch
              </span>
            </div>
          </div>

          <h1 className="text-[clamp(3rem,8vw,6rem)] leading-[0.9] tracking-[-0.04em] font-extrabold uppercase mb-6 transition-colors text-slate-900 dark:text-white">
            LET'S TALK <br />
            <span className="text-violet-600 dark:text-[#E8FF4D]">NUMBERS</span>.
          </h1>
          <p className="max-w-xl text-xl text-slate-500 dark:text-white/50 font-medium leading-relaxed">
            Whether you have 2 units or 200, our team of analysts and engineers
            is ready to help you optimize.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Contact Form Card */}
          <div className="lg:col-span-7 p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] border transition-all duration-500 bg-white border-slate-200 shadow-xl shadow-slate-200/50 dark:bg-[#141417] dark:border-white/10 dark:shadow-black/20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                  Send a Message
                </h2>
                <p className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">
                  We'll respond within 2 hours
                </p>
              </div>
            </div>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FormLabel>Full Name</FormLabel>
                  <Input
                    type="text"
                    variant="rounded"
                    placeholder="John Doe"
                    className="bg-slate-50 border-slate-200 shadow-inner focus:bg-white focus:border-violet-300 dark:bg-white/5 dark:border-white/10 dark:focus:bg-white/10 dark:focus:border-[#E8FF4D]/30"
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel>Email Address</FormLabel>
                  <Input
                    type="email"
                    variant="rounded"
                    placeholder="john@example.com"
                    className="bg-slate-50 border-slate-200 shadow-inner focus:bg-white focus:border-violet-300 dark:bg-white/5 dark:border-white/10 dark:focus:bg-white/10 dark:focus:border-[#E8FF4D]/30"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <FormLabel>Portfolio Size</FormLabel>
                <Select
                  variant="rounded"
                  className="bg-slate-50 border-slate-200 shadow-inner focus:bg-white focus:border-violet-300 dark:bg-white/5 dark:border-white/10 dark:focus:bg-white/10 dark:focus:border-[#E8FF4D]/30"
                >
                  <option>Select size...</option>
                  <option>1-5 units</option>
                  <option>5-20 units</option>
                  <option>20-50 units</option>
                  <option>50+ units</option>
                </Select>
              </div>
              <Textarea
                variant="rounded"
                label="Your Message"
                rows={5}
                placeholder="Tell us about your portfolio goals..."
                className="bg-slate-50 border-slate-200 shadow-inner focus:bg-white focus:border-violet-300 dark:bg-white/5 dark:border-white/10 dark:focus:bg-white/10 dark:focus:border-[#E8FF4D]/30"
              />
              <Button className="w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-violet-200 transition-all hover:scale-[1.02] bg-violet-600 text-white hover:bg-violet-700 dark:bg-[#E8FF4D] dark:text-black dark:hover:bg-[#d9f03e] dark:shadow-black/30">
                <span className="flex items-center justify-center gap-2">
                  DEPLOY ANALYST REQUEST
                  <Send className="w-4 h-4" />
                </span>
              </Button>
            </form>
          </div>

          {/* Sidebar Cards */}
          <div className="lg:col-span-5 space-y-6">
            {/* Email Card */}
            <div className="p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] border transition-all duration-500 bg-slate-900 text-white dark:bg-white dark:text-black group hover:scale-[1.02]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-black/10 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">
                  EMAIL US DIRECTLY
                </p>
              </div>
              <a
                href="mailto:connect@axori.io"
                className="block text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2 hover:text-violet-400 dark:hover:text-violet-600 transition-colors"
              >
                connect@axori.io
              </a>
              <p className="text-sm font-medium opacity-60 mb-8">
                For partnerships, press, or general inquiries
              </p>

              {/* Social Links */}
              <div className="pt-6 border-t border-white/10 dark:border-black/10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4">
                  Follow Us
                </p>
                <div className="flex gap-3">
                  {SOCIALS.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 rounded-xl border border-white/20 dark:border-black/20 flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-white/10 dark:hover:bg-black/10 transition-all hover:scale-110"
                        aria-label={social.label}
                      >
                        <Icon className="w-5 h-5" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Response Time Card */}
            <div className="p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] border transition-all duration-500 bg-gradient-to-br from-violet-600 to-violet-700 text-white border-violet-500 shadow-xl shadow-violet-200 dark:from-[#1a1a1f] dark:to-[#0f0f12] dark:border-white/10 dark:shadow-black/20 group hover:scale-[1.02]">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-white/60 dark:text-[#E8FF4D]" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 dark:text-white/40">
                  LIGHTNING FAST
                </p>
              </div>
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-6">
                We don't leave you waiting.
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {RESPONSE_STATS.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="text-center">
                      <Icon className="w-5 h-5 mx-auto mb-2 text-white/40 dark:text-[#E8FF4D]/60" />
                      <p className="text-xl md:text-2xl font-black tabular-nums">
                        {stat.value}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">
                        {stat.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FAQ Teaser */}
            <a
              href="/docs"
              className="p-6 md:p-8 rounded-[2rem] border border-dashed flex items-center justify-between transition-all duration-300 border-slate-300 hover:border-violet-400 hover:bg-violet-50 group dark:border-white/10 dark:hover:border-[#E8FF4D]/30 dark:hover:bg-white/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-violet-100 dark:group-hover:bg-[#E8FF4D]/10 transition-colors">
                  <HelpCircle className="w-6 h-6 text-slate-400 dark:text-white/40 group-hover:text-violet-600 dark:group-hover:text-[#E8FF4D] transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-white/60 group-hover:text-violet-600 dark:group-hover:text-[#E8FF4D] transition-colors">
                    Looking for help?
                  </p>
                  <p className="text-xs font-medium text-slate-400 dark:text-white/40 mt-0.5">
                    Visit our documentation site
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full border border-slate-300 dark:border-white/10 flex items-center justify-center group-hover:border-violet-400 group-hover:bg-violet-600 dark:group-hover:border-[#E8FF4D] dark:group-hover:bg-[#E8FF4D] transition-all">
                <ArrowUpRight className="w-5 h-5 text-slate-400 dark:text-white/40 group-hover:text-white dark:group-hover:text-black transition-colors" />
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Floating animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
