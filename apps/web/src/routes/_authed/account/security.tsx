/**
 * Security Settings Page
 *
 * MFA management, active sessions, and login history.
 * Integrates with Clerk for security features.
 */

import { createFileRoute } from "@tanstack/react-router"
import { useUser, useSession, useClerk } from "@clerk/tanstack-react-start"
import { Loading, cn } from "@axori/ui"
import {
  Shield,
  Smartphone,
  Monitor,
  Globe,
  Clock,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Key,
  History,
} from "lucide-react"
import { useState } from "react"

export const Route = createFileRoute("/_authed/account/security")({
  component: SecurityPage,
})

function SecurityPage() {
  const { user, isLoaded } = useUser()
  const { session } = useSession()
  const clerk = useClerk()
  const [revokingSession, setRevokingSession] = useState<string | null>(null)

  const cardClass = cn(
    "p-8 rounded-3xl border transition-all duration-500",
    "bg-white border-slate-200 shadow-sm",
    "dark:bg-[#1A1A1A] dark:border-white/5"
  )

  if (!isLoaded) {
    return (
      <div className="p-8 w-full flex items-center justify-center min-h-[400px]">
        <Loading size="lg" />
      </div>
    )
  }

  const hasTwoFactor = user?.twoFactorEnabled

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSession(sessionId)
    try {
      const sessionToRevoke = user?.getSessions()
      // For now, we'll use Clerk's signOut for the current session
      // In a full implementation, you'd call the session revoke API
      if (sessionId === session?.id) {
        await clerk.signOut()
      }
    } catch (error) {
      console.error("Failed to revoke session:", error)
    } finally {
      setRevokingSession(null)
    }
  }

  const handleSignOutAllDevices = async () => {
    try {
      await clerk.signOut({ sessionId: "all" })
    } catch (error) {
      console.error("Failed to sign out all devices:", error)
    }
  }

  return (
    <div className="p-8 w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Two-Factor Authentication */}
      <section className={cardClass}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Two-Factor Authentication
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Add an extra layer of security to your account
            </p>
          </div>

          {hasTwoFactor ? (
            <span className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
              <ShieldCheck className="w-4 h-4" />
              Enabled
            </span>
          ) : (
            <span className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
              <ShieldAlert className="w-4 h-4" />
              Not Enabled
            </span>
          )}
        </div>

        <div className="space-y-4">
          {/* TOTP */}
          <div className={cn(
            "flex items-center justify-between p-4 rounded-xl",
            "bg-slate-50 dark:bg-white/5"
          )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Authenticator App</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Use an app like Google Authenticator or Authy
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                // Opens Clerk's UserProfile for MFA setup
                clerk.openUserProfile()
              }}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                user?.totpEnabled
                  ? "bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              )}
            >
              {user?.totpEnabled ? "Manage" : "Set Up"}
            </button>
          </div>

          {/* SMS */}
          <div className={cn(
            "flex items-center justify-between p-4 rounded-xl",
            "bg-slate-50 dark:bg-white/5"
          )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-sm">SMS Verification</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Receive verification codes via text message
                </p>
              </div>
            </div>

            <button
              onClick={() => clerk.openUserProfile()}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                user?.phoneNumbers?.some(p => p.verification?.status === "verified")
                  ? "bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20"
                  : "bg-purple-500 text-white hover:bg-purple-600"
              )}
            >
              {user?.phoneNumbers?.some(p => p.verification?.status === "verified") ? "Manage" : "Set Up"}
            </button>
          </div>
        </div>
      </section>

      {/* Active Sessions */}
      <section className={cardClass}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-500" />
              Active Sessions
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage devices where you're currently signed in
            </p>
          </div>

          <button
            onClick={handleSignOutAllDevices}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out All
          </button>
        </div>

        <div className="space-y-3">
          {/* Current Session */}
          {session && (
            <div className={cn(
              "flex items-center justify-between p-4 rounded-xl",
              "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20"
            )}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">Current Session</p>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300">
                      This Device
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3" />
                    Active now
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Note about other sessions */}
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">
            Additional session details are available through Clerk's user management
          </p>
        </div>
      </section>

      {/* Login History */}
      <section className={cardClass}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-blue-500" />
              Recent Login Activity
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Review recent sign-in activity on your account
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Last sign in */}
          {user?.lastSignInAt && (
            <div className={cn(
              "flex items-center justify-between p-4 rounded-xl",
              "bg-slate-50 dark:bg-white/5"
            )}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Last Sign In</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {new Date(user.lastSignInAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                Successful
              </span>
            </div>
          )}

          {/* Account created */}
          {user?.createdAt && (
            <div className={cn(
              "flex items-center justify-between p-4 rounded-xl",
              "bg-slate-50 dark:bg-white/5"
            )}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                  <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Account Created</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
          Full login history is available through your security dashboard
        </p>
      </section>

      {/* Password Section */}
      <section className={cardClass}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-500" />
              Password
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Change your password or update your sign-in methods
            </p>
          </div>
        </div>

        <button
          onClick={() => clerk.openUserProfile()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
        >
          Manage Password & Sign-in Methods
        </button>
      </section>
    </div>
  )
}
