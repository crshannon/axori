import { useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-react-start'
import { Button } from '@axori/ui'
import { Clock } from 'lucide-react'
import { BentoCard } from '@/components/cards/BentoCard'

export function Hero() {
  const navigate = useNavigate()

  // useUser hook - safe to call since Hero is rendered inside ClerkProvider when configured
  const { isSignedIn = false, user = null } = useUser()

  console.log('isSignedIn', isSignedIn)
  console.log('user', user)

  const handleNavigateAdmin = () => {
    // Navigate to admin - will work once route is created
    navigate({ to: '/admin' as any })
  }

  const handleStartJourney = () => {
    console.log('handleStartJourney called', { isSignedIn })
    if (typeof window === 'undefined') {
      console.log('Running on server, skipping navigation')
      return
    }
    if (isSignedIn) {
      // Navigate to dashboard - will work once route is created
      navigate({ to: '/dashboard' as any })
    } else {
      // Navigate to sign-up page
      navigate({ to: '/sign-up' })
    }
  }

  return (
    <section className="px-4 pb-12 max-w-[1440px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Main Title Bento Card */}
        <BentoCard
          span="seven-twelfths"
          variant="stats"
          padding="xl"
          minHeightClass="min-h-[500px] md:min-h-[600px]"
          className="flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
                <div className="w-4 h-6 bg-white dark:bg-black"></div>
                <div className="w-4 h-6 transition-colors duration-500 bg-violet-500 dark:bg-[#E8FF4D]"></div>
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">
                Investment Intel — 25
              </span>
            </div>
            {isSignedIn &&
              user?.publicMetadata &&
              (user.publicMetadata as { isAdmin?: boolean }).isAdmin && (
                <button
                  type="button"
                  onClick={handleNavigateAdmin}
                  className="text-[9px] font-black uppercase tracking-widest opacity-10 hover:opacity-100 transition-opacity"
                >
                  System Entry
                </button>
              )}
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-none">
            OWN YOUR
            <br />
            WEALTH,
            <br />
            OWN YOU
          </h1>

          <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-8 mt-12">
            <Button
              onClick={handleStartJourney}
              className="text-xs font-black uppercase tracking-widest px-10 py-5 rounded-full hover:scale-105 transition-transform self-start shadow-xl shadow-slate-200/50 bg-white text-slate-900 hover:bg-white/90 dark:bg-black dark:text-white dark:hover:bg-black/90 dark:shadow-black/30"
            >
              START YOUR JOURNEY
            </Button>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-1 h-6 transition-colors duration-500 bg-white/10 dark:bg-black/10 ${
                      i % 2 === 0 ? 'h-4' : ''
                    }`}
                  ></div>
                ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest max-w-[100px] leading-tight opacity-60">
                PREMIUM WEALTH EXPERIENCE
              </span>
            </div>
          </div>
        </BentoCard>

        {/* Feature Image Bento Card */}
        <BentoCard
          span="five-twelfths"
          variant="image"
          minHeightClass="min-h-[400px] md:min-h-full"
          className="group cursor-pointer"
        >
          <img
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1000"
            alt="Luxury Architecture"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>

          <div className="absolute top-8 left-8">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              </svg>
            </div>
          </div>

          <div className="absolute bottom-10 left-10">
            <h3 className="text-white text-3xl font-black uppercase leading-none tracking-tighter">
              BUILD ON YOUR
              <br />
              OWN TERMS
            </h3>
          </div>
        </BentoCard>

        {/* Contact/CTA Bento Card */}
        <BentoCard
          span="seven-twelfths"
          padding="lg"
          variant="contact"
          className="flex flex-col md:flex-row gap-10 items-center justify-between relative"
        >
          <div className="w-full md:w-1/3 aspect-[4/5] bg-slate-200 rounded-3xl overflow-hidden shadow-2xl shadow-slate-300/50 relative dark:shadow-black/30">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600"
              alt="Investor Profile"
              className="w-full h-full object-cover grayscale"
            />
          </div>
          <div className="flex-1 space-y-12">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                24/7 SUPPORT
              </span>
              <div className="flex items-center gap-2 text-right">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  99 WALL ST
                  <br />
                  NEW YORK, NY
                </span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-slate-900 dark:bg-black">
                  <Clock
                    className="w-3.5 h-3.5 text-white dark:text-[#E2B1A8]"
                    strokeWidth={3}
                  />
                </div>
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
              CONTACT US &
              <br />
              GROW STRONGER
            </h2>
          </div>
        </BentoCard>

        {/* Stats Bento Card */}
        <BentoCard
          span="five-twelfths"
          padding="lg"
          variant="stats"
          className="flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-7xl font-black tabular-nums tracking-tighter">
                4.98
              </span>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">
                  BASED ON 1.2K REVIEWS
                </span>
              </div>
            </div>
            <div className="w-10 h-10 border-2 rounded-full flex items-center justify-center font-black italic text-lg transition-colors border-white dark:border-black">
              A
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-12">
            {[
              'AI ANALYTICS',
              'TAX STRATEGY',
              'LEGAL INTEL',
              'PORTFOLIO OS',
              'AUDIT READY',
              'CPA EXPORT',
            ].map((tag, idx) => (
              <div
                key={idx}
                className="border rounded-full px-4 py-3 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all cursor-default whitespace-nowrap border-white/10 hover:bg-white hover:text-slate-900 dark:border-black/10 dark:hover:bg-black dark:hover:text-white"
              >
                {tag}
              </div>
            ))}
          </div>
        </BentoCard>
      </div>
    </section>
  )
}
