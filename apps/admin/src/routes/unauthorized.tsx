import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Home, ShieldX } from "lucide-react";

export const Route = createFileRoute("/unauthorized" as any)({
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] p-6">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
          <ShieldX className="h-10 w-10 text-red-500" />
        </div>

        {/* Title */}
        <h1 className="mb-2 text-2xl font-bold text-white">Access Denied</h1>

        {/* Message */}
        <p className="mb-8 text-slate-400">
          I&apos;m sorry, but you don&apos;t have permission to access this
          resource. Please contact your administrator if you believe this is an
          error.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>

        {/* Help text */}
        <p className="mt-8 text-xs text-slate-500">
          Need access? Contact your system administrator or team lead.
        </p>
      </div>
    </div>
  );
}
