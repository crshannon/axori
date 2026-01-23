import { AlertTriangle, ChevronDown, ChevronUp, Code, Home, RefreshCw } from 'lucide-react'
import { Button } from '@axori/ui'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'

interface ErrorPageProps {
  error?: Error | unknown
  errorInfo?: React.ErrorInfo | { componentStack?: string }
  isDevelopment?: boolean
}

export function ErrorPage({ error, errorInfo, isDevelopment = false }: ErrorPageProps) {
  const [showDetails, setShowDetails] = useState(false)
  const isDev = isDevelopment || import.meta.env.DEV

  const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error')
  const errorStack = error instanceof Error ? error.stack : undefined

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0F1115]">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-8">
          {/* Error Icon */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-center mb-2 text-slate-900 dark:text-white">
            Something went wrong
          </h1>

          {/* Error Message */}
          <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
            {errorMessage}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </Button>
            <Button
              variant="outline"
              asChild
            >
              <Link to="/" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Go Home
              </Link>
            </Button>
          </div>

          {/* Development Debug Info */}
          {isDev && (
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between text-left p-4 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span className="font-medium text-slate-900 dark:text-white">
                    Debug Information
                  </span>
                </div>
                {showDetails ? (
                  <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                )}
              </button>

              {showDetails && (
                <div className="mt-4 p-4 rounded-lg bg-slate-900 dark:bg-black text-slate-100 font-mono text-sm overflow-auto max-h-96">
                  {/* Error Message */}
                  <div className="mb-4">
                    <div className="text-slate-400 text-xs mb-1">Error Message:</div>
                    <div className="text-red-400">{errorMessage}</div>
                  </div>

                  {/* Stack Trace */}
                  {errorStack && (
                    <div className="mb-4">
                      <div className="text-slate-400 text-xs mb-1">Stack Trace:</div>
                      <pre className="text-xs whitespace-pre-wrap break-words text-slate-300">
                        {errorStack}
                      </pre>
                    </div>
                  )}

                  {/* Component Stack */}
                  {errorInfo?.componentStack && (
                    <div className="mb-4">
                      <div className="text-slate-400 text-xs mb-1">Component Stack:</div>
                      <pre className="text-xs whitespace-pre-wrap break-words text-slate-300">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}

                  {/* Environment Info */}
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="text-slate-400 text-xs mb-2">Environment:</div>
                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="text-slate-500">Mode:</span>{' '}
                        <span className="text-slate-300">{import.meta.env.MODE}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Dev:</span>{' '}
                        <span className="text-slate-300">{String(import.meta.env.DEV)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">URL:</span>{' '}
                        <span className="text-slate-300">{window.location.href}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">User Agent:</span>{' '}
                        <span className="text-slate-300 text-xs break-all">
                          {navigator.userAgent}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Production Message */}
          {!isDev && (
            <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                If this problem persists, please contact support with the error message above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
