import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSignIn, useUser } from "@clerk/tanstack-react-start";
import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/sign-in" as any)({
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded: isUserLoaded } = useUser();
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isLoaded = isUserLoaded && isSignInLoaded;

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate({ to: "/board" as any });
    }
  }, [isLoaded, isSignedIn, navigate]);

  const handleBack = () => {
    navigate({ to: "/" });
  };

  const handleOAuth = async (strategy: "oauth_google" | "oauth_apple") => {
    if (!isSignInLoaded) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/board",
        redirectUrlComplete: "/board",
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "An error occurred during sign in");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!isSignInLoaded) {
      return;
    }

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate({ to: "/board" as any });
      } else {
        if (result.status === "needs_second_factor") {
          setPendingVerification(true);
        } else {
          setError("Sign in incomplete. Please try again.");
        }
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "An error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!isSignInLoaded) {
      return;
    }

    try {
      const completeSignIn = await signIn.attemptSecondFactor({
        strategy: "totp",
        code,
      });

      if (completeSignIn.status === "complete") {
        await setActive({ session: completeSignIn.createdSessionId });
        navigate({ to: "/board" as any });
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 mx-auto mb-4">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-bold text-slate-400">
            Initializing systems...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0f172a] text-white">
      {/* Left Pane - Branding */}
      <div className="hidden lg:flex lg:w-1/2 p-20 flex-col justify-between relative overflow-hidden bg-violet-600">
        {/* Background Visual Noise */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="signin-grid"
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
            <rect width="100%" height="100%" fill="url(#signin-grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <button
            onClick={handleBack}
            className="flex items-center gap-3 group mb-20 outline-none"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 transition-all group-hover:bg-white/30">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">FORGE</span>
          </button>

          <h1 className="text-[clamp(3rem,8vw,5rem)] leading-[0.95] tracking-[-0.03em] font-bold uppercase mb-8">
            COMMAND
            <br />
            CENTER
            <br />
            <span className="opacity-40">ACCESS</span>
          </h1>
          <p className="max-w-md text-xl font-medium opacity-70 leading-relaxed">
            AI-powered development workflow engine for authorized personnel
            only.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-sm font-medium opacity-60 italic">
            "Good morning, sir. I've been productive while you were away."
          </p>
        </div>
      </div>

      {/* Right Pane - Sign In Form */}
      <div className="flex-grow flex flex-col items-center justify-center p-8 md:p-12 lg:p-24 relative">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600">
            <Zap className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="w-full max-w-[440px]">
          <div className="p-10 md:p-14 rounded-3xl border bg-white/5 border-white/10">
            <header className="mb-10 text-center">
              <h2 className="text-2xl font-bold uppercase tracking-tight mb-2">
                {pendingVerification ? "Verify Code" : "Sign In"}
              </h2>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                {pendingVerification
                  ? "Enter your verification code"
                  : "Authorized personnel only"}
              </p>
            </header>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm font-semibold text-red-400">{error}</p>
              </div>
            )}

            {pendingVerification ? (
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter verification code"
                    required
                    className="w-full px-5 py-4 rounded-xl text-sm font-medium border bg-white/5 border-white/10 focus:bg-white/10 focus:border-violet-500/50 text-white outline-none transition-all placeholder:text-slate-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !isLoaded}
                  className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Verifying..." : "Verify Code"}
                </button>
              </form>
            ) : (
              <>
                {/* Social Providers */}
                <div className="space-y-3 mb-8">
                  <button
                    type="button"
                    onClick={() => handleOAuth("oauth_google")}
                    disabled={isLoading || !isLoaded}
                    className="w-full py-4 px-5 rounded-xl border flex items-center justify-center gap-3 transition-all bg-white/5 border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-widest">
                      Sign in with Google
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOAuth("oauth_apple")}
                    disabled={isLoading || !isLoaded}
                    className="w-full py-4 px-5 rounded-xl border flex items-center justify-center gap-3 transition-all bg-white border-white text-black hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C4.52 17.14 3.19 12.06 6.1 9.4c1.1-.98 2.45-1.16 3.42-1.16 1.06.03 1.95.42 2.58.42.59 0 1.76-.5 3.03-.37 1.34.14 2.34.63 2.89 1.45-2.73 1.65-2.29 5.37.45 6.47-.5 1.48-1.16 2.94-2.42 4.07zm-4.71-12.72c-.08-2.67 2.21-4.88 4.88-4.96.26 2.84-2.22 5.02-4.88 4.96z" />
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-widest">
                      Sign in with Apple
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-8">
                  <div className="flex-grow h-px bg-white/10"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    OR
                  </span>
                  <div className="flex-grow h-px bg-white/10"></div>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label
                      htmlFor="sign-in-email"
                      className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1"
                    >
                      Email Address
                    </label>
                    <input
                      id="sign-in-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      autoComplete="email"
                      required
                      className="w-full px-5 py-4 rounded-xl text-sm font-medium border bg-white/5 border-white/10 focus:bg-white/10 focus:border-violet-500/50 text-white outline-none transition-all placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="sign-in-password"
                      className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1"
                    >
                      Password
                    </label>
                    <input
                      id="sign-in-password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      className="w-full px-5 py-4 rounded-xl text-sm font-medium border bg-white/5 border-white/10 focus:bg-white/10 focus:border-violet-500/50 text-white outline-none transition-all placeholder:text-slate-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !isLoaded}
                    className="w-full mt-4 py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Authenticating..." : "Access Forge"}
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="text-center mt-8 text-[10px] uppercase font-bold tracking-widest text-slate-500">
            Restricted access - Admin credentials required
          </p>
        </div>
      </div>
    </div>
  );
}
