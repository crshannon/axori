/**
 * Security Settings Page
 *
 * MFA management, active sessions, and login history.
 * Full-width bento-style layout with Clerk integration.
 */

import { createFileRoute } from "@tanstack/react-router"
import { useClerk, useSession, useUser } from "@clerk/tanstack-react-start"
import { Loading, cn } from "@axori/ui"
import {
  Clock,
  Globe,
  History,
  Key,
  LogOut,
  Monitor,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from "lucide-react"
import { useState } from "react"

export const Route = createFileRoute("/_authed/account/security")({
  component: SecurityPage,
})

function SecurityPage() {
  const { user, isLoaded } = useUser()
  const { session } = useSession()
  const clerk = useClerk()
  const [_revokingSession, setRevokingSession] = useState<string | null>(null)

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" />
      </div>
    )
  }

  const hasTwoFactor = user?.twoFactorEnabled
  const hasPhoneVerified = user?.phoneNumbers.some(
    (p) => p.verification.status === "verified"
  )

  const handleSignOutAllDevices = async () => {
    try {
      await clerk.signOut({ sessionId: "all" })
    } catch {
      // Error handling - sign out failure is non-critical
    }
  }

  return (
    <div className="px-6 lg:px-12 py-10">
      {/* Page Header */}
      <div className="mb-10">
        <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
          Security
        </h2>
        <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
          Manage your authentication methods and review account activity
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Security Status - Span 5 */}
        <div className="lg:col-span-5">
          <div
            className={cn(
              "h-full p-8 rounded-3xl border",
              "bg-white border-slate-200",
              "dark:bg-[#1A1A1A] dark:border-white/5"
            )}
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">
              Security Status
            </span>

            <div className="mt-6 flex flex-col items-center text-center">
              <div
                className={cn(
                  "size-24 rounded-full flex items-center justify-center mb-6",
                  hasTwoFactor
                    ? "bg-emerald-100 dark:bg-emerald-500/10"
                    : "bg-amber-100 dark:bg-amber-500/10"
                )}
              >
                {hasTwoFactor ? (
                  <ShieldCheck className="size-12 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ShieldAlert className="size-12 text-amber-600 dark:text-amber-400" />
                )}
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {hasTwoFactor ? "Protected" : "At Risk"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-white/50 mt-2 max-w-xs">
                {hasTwoFactor
                  ? "Your account has two-factor authentication enabled"
                  : "Enable two-factor authentication for better security"}
              </p>

              {/* Security Score */}
              <div className="w-full mt-8 pt-8 border-t border-slate-100 dark:border-white/5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500 dark:text-white/50">
                    Security Score
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {hasTwoFactor ? "Strong" : "Weak"}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      hasTwoFactor
                        ? "bg-emerald-500 dark:bg-emerald-400 w-[85%]"
                        : "bg-amber-500 dark:bg-amber-400 w-[35%]"
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Two-Factor Authentication */}
          <div
            className={cn(
              "p-8 rounded-3xl border",
              "bg-white border-slate-200",
              "dark:bg-[#1A1A1A] dark:border-white/5"
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2.5 rounded-xl",
                    "bg-violet-100 text-violet-600",
                    "dark:bg-[#E8FF4D]/10 dark:text-[#E8FF4D]"
                  )}
                >
                  <Shield className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-white/50">
                    Add extra security to your account
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full",
                  hasTwoFactor
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                )}
              >
                {hasTwoFactor ? (
                  <>
                    <ShieldCheck className="size-3" />
                    Enabled
                  </>
                ) : (
                  <>
                    <ShieldAlert className="size-3" />
                    Not Enabled
                  </>
                )}
              </span>
            </div>

            <div className="space-y-3">
              {/* Authenticator App */}
              <div
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl",
                  "bg-slate-50 dark:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                    <Key className="size-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-900 dark:text-white">
                      Authenticator App
                    </p>
                    <p className="text-xs text-slate-500 dark:text-white/50">
                      Google Authenticator, Authy, etc.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => clerk.openUserProfile()}
                  className={cn(
                    "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors",
                    user?.totpEnabled
                      ? "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
                      : "bg-violet-600 text-white hover:bg-violet-700 dark:bg-[#E8FF4D] dark:text-black dark:hover:bg-[#d4eb45]"
                  )}
                >
                  {user?.totpEnabled ? "Manage" : "Set Up"}
                </button>
              </div>

              {/* SMS Verification */}
              <div
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl",
                  "bg-slate-50 dark:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
                    <Smartphone className="size-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-900 dark:text-white">
                      SMS Verification
                    </p>
                    <p className="text-xs text-slate-500 dark:text-white/50">
                      Text message codes
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => clerk.openUserProfile()}
                  className={cn(
                    "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors",
                    hasPhoneVerified
                      ? "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
                      : "bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
                  )}
                >
                  {hasPhoneVerified ? "Manage" : "Set Up"}
                </button>
              </div>
            </div>
          </div>

          {/* Password */}
          <div
            className={cn(
              "p-8 rounded-3xl border",
              "bg-white border-slate-200",
              "dark:bg-[#1A1A1A] dark:border-white/5"
            )}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className={cn(
                  "p-2.5 rounded-xl",
                  "bg-blue-100 text-blue-600",
                  "dark:bg-blue-500/10 dark:text-blue-400"
                )}
              >
                <Key className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Password
                </h3>
                <p className="text-xs text-slate-500 dark:text-white/50">
                  Update your password or sign-in methods
                </p>
              </div>
            </div>

            <button
              onClick={() => clerk.openUserProfile()}
              className={cn(
                "w-full px-4 py-3 rounded-2xl text-sm font-medium transition-colors",
                "bg-slate-50 hover:bg-slate-100 text-slate-700",
                "dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/70"
              )}
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Active Sessions - Full Width */}
        <div className="lg:col-span-12">
          <div
            className={cn(
              "p-8 rounded-3xl border",
              "bg-white border-slate-200",
              "dark:bg-[#1A1A1A] dark:border-white/5"
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2.5 rounded-xl",
                    "bg-emerald-100 text-emerald-600",
                    "dark:bg-emerald-500/10 dark:text-emerald-400"
                  )}
                >
                  <Monitor className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Active Sessions
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-white/50">
                    Devices currently signed in to your account
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOutAllDevices}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="size-4" />
                Sign Out All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Session */}
              {session && (
                <div
                  className={cn(
                    "p-4 rounded-2xl border-2",
                    "bg-violet-50 border-violet-200",
                    "dark:bg-[#E8FF4D]/5 dark:border-[#E8FF4D]/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-violet-100 dark:bg-[#E8FF4D]/10 flex items-center justify-center">
                      <Monitor className="size-5 text-violet-600 dark:text-[#E8FF4D]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-900 dark:text-white">
                          Current Session
                        </p>
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full bg-violet-600 text-white dark:bg-[#E8FF4D] dark:text-black">
                          This Device
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-white/50 flex items-center gap-1.5 mt-1">
                        <Clock className="size-3" />
                        Active now
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Placeholder for other sessions */}
              <div
                className={cn(
                  "p-4 rounded-2xl flex items-center justify-center",
                  "bg-slate-50 dark:bg-white/5"
                )}
              >
                <p className="text-xs text-slate-400 dark:text-white/30 text-center">
                  Other sessions managed via Clerk
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Login History - Full Width */}
        <div className="lg:col-span-12">
          <div
            className={cn(
              "p-8 rounded-3xl border",
              "bg-white border-slate-200",
              "dark:bg-[#1A1A1A] dark:border-white/5"
            )}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className={cn(
                  "p-2.5 rounded-xl",
                  "bg-slate-100 text-slate-600",
                  "dark:bg-white/5 dark:text-white/60"
                )}
              >
                <History className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Recent Activity
                </h3>
                <p className="text-xs text-slate-500 dark:text-white/50">
                  Your recent sign-in history
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Last Sign In */}
              {user?.lastSignInAt && (
                <div
                  className={cn(
                    "p-4 rounded-2xl",
                    "bg-slate-50 dark:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                      <Globe className="size-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-slate-900 dark:text-white">
                          Last Sign In
                        </p>
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          Success
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
                        {new Date(user.lastSignInAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Created */}
              {user?.createdAt && (
                <div
                  className={cn(
                    "p-4 rounded-2xl",
                    "bg-slate-50 dark:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
                      <Key className="size-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-900 dark:text-white">
                        Account Created
                      </p>
                      <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
