import React, { useEffect, useState } from 'react'

interface AsyncLoaderProps {
  isVisible: boolean
  onComplete?: () => void
  duration?: number // in ms
}

export const AsyncLoader: React.FC<AsyncLoaderProps> = ({
  isVisible,
  onComplete,
  duration = 5000,
}) => {
  const [progress, setProgress] = useState(0)
  const [statusIndex, setStatusIndex] = useState(0)

  const statuses = [
    'Initializing Secure Handshake...',
    'Crawling Municipal Tax Records...',
    'Indexing Neighborhood Alpha...',
    'Modeling Yield Projections...',
    'Securing Asset Intelligence DNA...',
  ]

  useEffect(() => {
    if (!isVisible) {
      setProgress(0)
      setStatusIndex(0)
      return
    }

    const intervalTime = 50 // Update every 50ms
    const step = 100 / (duration / intervalTime)

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          if (onComplete) onComplete()
          return 100
        }
        return prev + step
      })
    }, intervalTime)

    // Status rotation logic
    const statusTimer = setInterval(() => {
      setStatusIndex((prev) => (prev < statuses.length - 1 ? prev + 1 : prev))
    }, duration / statuses.length)

    return () => {
      clearInterval(timer)
      clearInterval(statusTimer)
    }
  }, [isVisible, duration, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="max-w-xl w-full flex flex-col items-center">
        {/* System Identifier */}
        <div className="flex items-center gap-3 mb-16 animate-pulse">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black italic text-xl shadow-2xl bg-slate-900 text-white dark:bg-white dark:text-black">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-violet-600 dark:text-[#E8FF4D]">
              Axori Core Engine
            </span>
            <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">
              System Architecture V6.5
            </span>
          </div>
        </div>

        {/* Main Loading Visual */}
        <div className="w-full space-y-12">
          <div className="text-center">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-slate-900 dark:text-white">
              Processing Intel
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 h-4 overflow-hidden">
              <span
                key={statusIndex}
                className="inline-block animate-in slide-in-from-bottom-2 duration-300 italic"
              >
                {statuses[statusIndex]}
              </span>
            </p>
          </div>

          <div className="relative">
            {/* Progress Bar Container */}
            <div className="h-1.5 w-full rounded-full overflow-hidden relative bg-slate-200 dark:bg-white/5">
              <div
                className="h-full transition-all duration-100 ease-linear rounded-full bg-violet-600 shadow-[0_0_20px_rgba(139,92,246,0.3)] dark:bg-[#E8FF4D] dark:shadow-[0_0_20px_rgba(232,255,77,0.4)]"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Data Points Count */}
            <div className="flex justify-between mt-6 px-1">
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase opacity-30 mb-1">
                  Compute Nodes
                </span>
                <span className="text-xs font-black tabular-nums">
                  48/48 Active
                </span>
              </div>
              <div className="text-center">
                <span className="text-[8px] font-black uppercase opacity-30 mb-1">
                  Progress
                </span>
                <span className="text-xs font-black tabular-nums text-violet-600 dark:text-[#E8FF4D]">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-black uppercase opacity-30 mb-1">
                  Data Shards
                </span>
                <span className="text-xs font-black tabular-nums">
                  {(progress * 128).toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Noise Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-[0.02] pointer-events-none">
          <svg
            width="800"
            height="800"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.1"
              strokeDasharray="1 2"
            />
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.1"
              strokeDasharray="2 4"
            />
            <line
              x1="0"
              y1="50"
              x2="100"
              y2="50"
              stroke="currentColor"
              strokeWidth="0.05"
            />
            <line
              x1="50"
              y1="0"
              x2="50"
              y2="100"
              stroke="currentColor"
              strokeWidth="0.05"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
