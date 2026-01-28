/**
 * Profile Settings Page
 *
 * User profile management including name, email, and avatar.
 * Full-width bento-style layout with Clerk integration.
 */

import { createFileRoute } from "@tanstack/react-router"
import { useClerk, useUser } from "@clerk/tanstack-react-start"
import { Loading, cn } from "@axori/ui"
import { Camera, Check, ExternalLink, Mail, Pencil, User } from "lucide-react"

export const Route = createFileRoute("/_authed/account/")({
  component: ProfilePage,
})

function ProfilePage() {
  const { user, isLoaded } = useUser()
  const clerk = useClerk()

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" />
      </div>
    )
  }

  return (
    <div className="px-6 lg:px-12 py-10">
      {/* Page Header */}
      <div className="mb-10">
        <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
          Profile
        </h2>
        <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
          Manage your personal information and account settings
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Card - Large */}
        <div className="lg:col-span-5">
          <div
            className={cn(
              "h-full p-8 rounded-3xl border transition-all",
              "bg-white border-slate-200",
              "dark:bg-[#1A1A1A] dark:border-white/5"
            )}
          >
            <div className="flex items-start justify-between mb-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">
                Your Profile
              </span>
              <button
                onClick={() => clerk.openUserProfile()}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  "bg-slate-100 hover:bg-slate-200 text-slate-600",
                  "dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/60"
                )}
              >
                <Pencil className="size-4" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-6">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || "Profile"}
                    className="size-32 rounded-full object-cover ring-4 ring-slate-100 dark:ring-white/10"
                  />
                ) : (
                  <div className="size-32 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 dark:from-[#E8FF4D] dark:to-lime-500 flex items-center justify-center text-white dark:text-black text-4xl font-black">
                    {user?.firstName?.[0] ||
                      user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase() ||
                      "?"}
                  </div>
                )}
                <button
                  onClick={() => clerk.openUserProfile()}
                  className={cn(
                    "absolute bottom-0 right-0 p-2.5 rounded-full transition-colors",
                    "bg-violet-600 hover:bg-violet-700 text-white",
                    "dark:bg-[#E8FF4D] dark:hover:bg-[#d4eb45] dark:text-black"
                  )}
                >
                  <Camera className="size-4" />
                </button>
              </div>

              {/* Name */}
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {user?.fullName || "User"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
                {user?.primaryEmailAddress?.emailAddress}
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 w-full mt-8 pt-8 border-t border-slate-100 dark:border-white/5">
                <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {user?.createdAt
                      ? Math.floor(
                          (Date.now() - new Date(user.createdAt).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      : 0}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                    Days Active
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {user?.emailAddresses.length || 0}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                    Email{user?.emailAddresses.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Personal Information */}
          <div
            className={cn(
              "p-8 rounded-3xl border transition-all",
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
                  <User className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Personal Information
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-white/50">
                    Managed via Clerk
                  </p>
                </div>
              </div>
              <button
                onClick={() => clerk.openUserProfile()}
                className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-[#E8FF4D] dark:hover:text-[#d4eb45] transition-colors flex items-center gap-1"
              >
                Edit
                <ExternalLink className="size-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={cn(
                  "p-4 rounded-2xl",
                  "bg-slate-50 dark:bg-white/5"
                )}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-1">
                  First Name
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {user?.firstName || "—"}
                </p>
              </div>
              <div
                className={cn(
                  "p-4 rounded-2xl",
                  "bg-slate-50 dark:bg-white/5"
                )}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-1">
                  Last Name
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {user?.lastName || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Email Addresses */}
          <div
            className={cn(
              "p-8 rounded-3xl border transition-all",
              "bg-white border-slate-200",
              "dark:bg-[#1A1A1A] dark:border-white/5"
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2.5 rounded-xl",
                    "bg-blue-100 text-blue-600",
                    "dark:bg-blue-500/10 dark:text-blue-400"
                  )}
                >
                  <Mail className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Email Addresses
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-white/50">
                    {user?.emailAddresses.length} connected
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {user?.emailAddresses.map((email) => (
                <div
                  key={email.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl",
                    "bg-slate-50 dark:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 text-slate-400 dark:text-white/40" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {email.emailAddress}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {email.id === user.primaryEmailAddressId && (
                      <span
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full",
                          "bg-violet-100 text-violet-700",
                          "dark:bg-[#E8FF4D]/10 dark:text-[#E8FF4D]"
                        )}
                      >
                        Primary
                      </span>
                    )}
                    {email.verification.status === "verified" && (
                      <span
                        className={cn(
                          "flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full",
                          "bg-emerald-100 text-emerald-700",
                          "dark:bg-emerald-500/10 dark:text-emerald-400"
                        )}
                      >
                        <Check className="size-3" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Account Details */}
          <div
            className={cn(
              "p-8 rounded-3xl border transition-all",
              "bg-white border-slate-200",
              "dark:bg-[#1A1A1A] dark:border-white/5"
            )}
          >
            <h3 className="font-bold text-slate-900 dark:text-white mb-6">
              Account Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                className={cn(
                  "p-4 rounded-2xl",
                  "bg-slate-50 dark:bg-white/5"
                )}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-1">
                  Account ID
                </p>
                <p className="font-mono text-xs text-slate-600 dark:text-white/70 truncate">
                  {user?.id}
                </p>
              </div>
              <div
                className={cn(
                  "p-4 rounded-2xl",
                  "bg-slate-50 dark:bg-white/5"
                )}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-1">
                  Member Since
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
              <div
                className={cn(
                  "p-4 rounded-2xl",
                  "bg-slate-50 dark:bg-white/5"
                )}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-1">
                  Last Sign In
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {user?.lastSignInAt
                    ? new Date(user.lastSignInAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
