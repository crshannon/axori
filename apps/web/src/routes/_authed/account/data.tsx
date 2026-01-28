/**
 * Data & Privacy Settings Page
 *
 * Data export requests and account deletion.
 * Full-width bento-style layout with GDPR compliance features.
 */

import { createFileRoute } from "@tanstack/react-router"
import { useUser } from "@clerk/tanstack-react-start"
import { Button, Loading, cn } from "@axori/ui"
import {
  AlertTriangle,
  Archive,
  CheckCircle,
  Clock,
  Download,
  FileArchive,
  Lock,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { useState } from "react"

export const Route = createFileRoute("/_authed/account/data")({
  component: DataPrivacyPage,
})

// Mock data export requests (will come from API)
const MOCK_EXPORT_REQUESTS = [
  {
    id: "exp_1",
    requestedAt: "2024-01-10T10:30:00Z",
    status: "completed",
    expiresAt: "2024-01-17T10:30:00Z",
    downloadUrl: "#",
  },
  {
    id: "exp_2",
    requestedAt: "2023-12-15T14:00:00Z",
    status: "expired",
    expiresAt: "2023-12-22T14:00:00Z",
  },
]

function DataPrivacyPage() {
  const { user, isLoaded } = useUser()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isRequestingExport, setIsRequestingExport] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" />
      </div>
    )
  }

  const handleRequestExport = async () => {
    setIsRequestingExport(true)
    // TODO: Call API to request data export
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsRequestingExport(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return
    setIsDeleting(true)
    // TODO: Call API to delete account
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsDeleting(false)
  }

  const pendingExports = MOCK_EXPORT_REQUESTS.filter(
    (e) => e.status === "pending"
  )
  const completedExports = MOCK_EXPORT_REQUESTS.filter(
    (e) => e.status === "completed"
  )

  return (
    <div className="px-6 lg:px-12 py-10">
      {/* Page Header */}
      <div className="mb-10">
        <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
          Data & Privacy
        </h2>
        <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
          Export your data or delete your account
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Data Rights Summary - Span 5 */}
        <div className="lg:col-span-5">
          <div
            className={cn(
              "h-full p-8 rounded-3xl border",
              "bg-white border-slate-200",
              "dark:bg-[#1A1A1A] dark:border-white/5"
            )}
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">
              Your Data Rights
            </span>

            <div className="mt-6 space-y-6">
              {/* Right to Access */}
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "p-2.5 rounded-xl flex-shrink-0",
                    "bg-emerald-100 text-emerald-600",
                    "dark:bg-emerald-500/10 dark:text-emerald-400"
                  )}
                >
                  <Download className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Right to Access
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
                    Download a copy of all your data including properties,
                    transactions, documents, and settings.
                  </p>
                </div>
              </div>

              {/* Right to Portability */}
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "p-2.5 rounded-xl flex-shrink-0",
                    "bg-blue-100 text-blue-600",
                    "dark:bg-blue-500/10 dark:text-blue-400"
                  )}
                >
                  <FileArchive className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Right to Portability
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
                    Export data in standard formats (JSON, CSV) to transfer to
                    other services.
                  </p>
                </div>
              </div>

              {/* Right to Erasure */}
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "p-2.5 rounded-xl flex-shrink-0",
                    "bg-red-100 text-red-600",
                    "dark:bg-red-500/10 dark:text-red-400"
                  )}
                >
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Right to Erasure
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
                    Permanently delete your account and all associated data.
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              {/* Privacy Shield */}
              <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-4" />
                  <span className="text-xs font-bold">GDPR Compliant</span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-white/30 mt-2">
                  Your data is encrypted at rest and in transit. We never sell
                  your personal information.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Span 7 */}
        <div className="lg:col-span-7 space-y-6">
          {/* Export Data Card */}
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
                  <Archive className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Export Your Data
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-white/50">
                    Download a complete copy of your data
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-white/70">
                Request an export of all your Axori data. The export will
                include:
              </p>

              <ul className="grid grid-cols-2 gap-2">
                {[
                  "Properties & portfolios",
                  "Financial transactions",
                  "Documents & files",
                  "Account settings",
                  "Notification history",
                  "Activity logs",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/50"
                  >
                    <CheckCircle className="size-3.5 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>

              <div
                className={cn(
                  "p-4 rounded-2xl flex items-center gap-3",
                  "bg-amber-50 border border-amber-200",
                  "dark:bg-amber-500/5 dark:border-amber-500/20"
                )}
              >
                <Clock className="size-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Export requests typically complete within 24 hours. Download
                  links expire after 7 days.
                </p>
              </div>

              <Button
                onClick={handleRequestExport}
                disabled={isRequestingExport || pendingExports.length > 0}
                className={cn(
                  "w-full px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-wider",
                  "bg-violet-600 text-white hover:bg-violet-700",
                  "dark:bg-[#E8FF4D] dark:text-black dark:hover:bg-[#d4eb45]",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isRequestingExport
                  ? "Requesting..."
                  : pendingExports.length > 0
                    ? "Export in Progress"
                    : "Request Data Export"}
              </Button>
            </div>
          </div>

          {/* Previous Exports */}
          {MOCK_EXPORT_REQUESTS.length > 0 && (
            <div
              className={cn(
                "p-8 rounded-3xl border",
                "bg-white border-slate-200",
                "dark:bg-[#1A1A1A] dark:border-white/5"
              )}
            >
              <h3 className="font-bold text-slate-900 dark:text-white mb-6">
                Previous Exports
              </h3>

              <div className="space-y-3">
                {MOCK_EXPORT_REQUESTS.map((exp) => (
                  <div
                    key={exp.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl",
                      "bg-slate-50 dark:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <FileArchive className="size-5 text-slate-400 dark:text-white/40" />
                      <div>
                        <p className="font-medium text-sm text-slate-900 dark:text-white">
                          Data Export
                        </p>
                        <p className="text-xs text-slate-500 dark:text-white/50">
                          Requested{" "}
                          {new Date(exp.requestedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full",
                          exp.status === "completed"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : exp.status === "pending"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                              : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-white/40"
                        )}
                      >
                        {exp.status}
                      </span>

                      {exp.status === "completed" && exp.downloadUrl && (
                        <button
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            "bg-violet-100 text-violet-600 hover:bg-violet-200",
                            "dark:bg-[#E8FF4D]/10 dark:text-[#E8FF4D] dark:hover:bg-[#E8FF4D]/20"
                          )}
                        >
                          <Download className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Danger Zone - Full Width */}
        <div className="lg:col-span-12">
          <div
            className={cn(
              "p-8 rounded-3xl border-2",
              "bg-red-50 border-red-200",
              "dark:bg-red-500/5 dark:border-red-500/20"
            )}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className={cn(
                  "p-2.5 rounded-xl",
                  "bg-red-100 text-red-600",
                  "dark:bg-red-500/10 dark:text-red-400"
                )}
              >
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-red-900 dark:text-red-400">
                  Danger Zone
                </h3>
                <p className="text-xs text-red-600 dark:text-red-400/70">
                  Irreversible actions that affect your account
                </p>
              </div>
            </div>

            {!showDeleteConfirm ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Delete Account
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-white/60 mt-1">
                    Permanently delete your account and all associated data.
                    This action cannot be undone.
                  </p>
                </div>
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  className={cn(
                    "px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider whitespace-nowrap",
                    "bg-red-600 text-white hover:bg-red-700",
                    "dark:bg-red-500 dark:hover:bg-red-600"
                  )}
                >
                  Delete Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={cn(
                    "p-4 rounded-2xl",
                    "bg-white border border-red-200",
                    "dark:bg-red-500/10 dark:border-red-500/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Lock className="size-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-900 dark:text-red-400">
                        This will permanently delete:
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-red-700 dark:text-red-300">
                        <li>• All {user?.emailAddresses.length || 0} linked email addresses</li>
                        <li>• Your profile and account settings</li>
                        <li>• All properties and financial data</li>
                        <li>• All uploaded documents</li>
                        <li>• Your subscription (no refunds)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-2">
                    Type <span className="font-mono font-bold">DELETE</span> to
                    confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border text-sm font-mono",
                      "bg-white border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20",
                      "dark:bg-white/5 dark:border-white/10 dark:focus:border-red-500",
                      "outline-none transition-all"
                    )}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText("")
                    }}
                    className={cn(
                      "flex-1 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider",
                      "bg-slate-100 text-slate-700 hover:bg-slate-200",
                      "dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                    )}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== "DELETE" || isDeleting}
                    className={cn(
                      "flex-1 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider",
                      "bg-red-600 text-white hover:bg-red-700",
                      "dark:bg-red-500 dark:hover:bg-red-600",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isDeleting ? "Deleting..." : "Permanently Delete"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
