/**
 * Profile Settings Page
 *
 * User profile management including name, email, and avatar.
 * Integrates with Clerk for profile updates.
 */

import { createFileRoute } from "@tanstack/react-router"
import { useUser } from "@clerk/tanstack-react-start"
import { Loading, cn } from "@axori/ui"
import { Camera, Mail, User, ExternalLink } from "lucide-react"

export const Route = createFileRoute("/_authed/account/")({
  component: ProfilePage,
})

function ProfilePage() {
  const { user, isLoaded } = useUser()

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

  return (
    <div className="p-8 w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Profile Photo Section */}
      <section className={cardClass}>
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-500" />
          Profile Photo
        </h2>

        <div className="flex items-center gap-6">
          <div className="relative">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.fullName || "Profile"}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-slate-100 dark:ring-white/10"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Your profile photo is managed through Clerk. Click below to update it.
            </p>
            <button
              onClick={() => user?.setProfileImage}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
            >
              Change Photo
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </section>

      {/* Personal Information Section */}
      <section className={cardClass}>
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-500" />
          Personal Information
        </h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={user?.firstName || ""}
                readOnly
                className={cn(
                  "w-full px-4 py-3 rounded-xl border text-sm",
                  "bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={user?.lastName || ""}
                readOnly
                className={cn(
                  "w-full px-4 py-3 rounded-xl border text-sm",
                  "bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                )}
              />
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            To update your name, please use the Clerk profile settings.
          </p>
        </div>
      </section>

      {/* Email Section */}
      <section className={cardClass}>
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-500" />
          Email Addresses
        </h2>

        <div className="space-y-4">
          {user?.emailAddresses.map((email) => (
            <div
              key={email.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-slate-50 dark:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm">{email.emailAddress}</span>
              </div>

              <div className="flex items-center gap-2">
                {email.id === user.primaryEmailAddressId && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                    Primary
                  </span>
                )}
                {email.verification?.status === "verified" && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                    Verified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
          Email addresses are managed through Clerk for security.
        </p>
      </section>

      {/* Account Info */}
      <section className={cardClass}>
        <h2 className="text-lg font-semibold mb-6">Account Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Account ID</span>
            <p className="font-mono text-xs mt-1 text-slate-700 dark:text-slate-300">
              {user?.id}
            </p>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-400">Member Since</span>
            <p className="mt-1 text-slate-700 dark:text-slate-300">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </p>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-400">Last Sign In</span>
            <p className="mt-1 text-slate-700 dark:text-slate-300">
              {user?.lastSignInAt
                ? new Date(user.lastSignInAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
