import { Link, createFileRoute } from "@tanstack/react-router";
import { useUser } from "@clerk/tanstack-react-start";
import { LayoutDashboard, Zap } from "lucide-react";

export const Route = createFileRoute("/" as any)({
  component: LandingPage,
});

function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] p-8">
      <div className="text-center space-y-8 max-w-lg">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">FORGE</h1>
        </div>

        <p className="text-lg text-slate-400">
          AI-Powered Development Workflow Engine
        </p>

        <div className="text-sm text-slate-500 italic">
          "Good morning, sir. I've been productive while you were away."
        </div>

        {isLoaded && (
          <div className="pt-4">
            {isSignedIn ? (
              <Link
                to="/board"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Enter Forge
              </Link>
            ) : (
              <a
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
              >
                Sign In
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
