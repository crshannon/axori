import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorPageProps {
  error: Error;
  isDevelopment?: boolean;
}

export function ErrorPage({ error, isDevelopment = false }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] p-8 text-white">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">
            I regret to inform you...
          </h1>
          <p className="text-slate-400">
            Something unexpected has occurred. My sincerest apologies.
          </p>
        </div>

        {isDevelopment && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-left">
            <p className="font-mono text-sm text-red-300">{error.message}</p>
            {error.stack && (
              <pre className="mt-2 max-h-40 overflow-auto text-xs text-red-400/80">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
