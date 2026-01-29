/**
 * Agent Assignment Modal
 *
 * Modal for assigning an AI agent to a ticket with protocol selection
 */

import { useState, useEffect } from "react"
import { X, Bot, Cpu, Zap, Check, Sparkles } from "lucide-react"
import { clsx } from "clsx"
import {
  useAgentProtocols,
  useSuggestProtocol,
  useCreateExecution,
  type AgentProtocol,
} from "@/hooks/api/use-agents"

interface AssignAgentModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: {
    id: string
    identifier: string
    title: string
    type: string
    estimate?: number | null
    labels?: string[] | null
  }
}

export function AssignAgentModal({ isOpen, onClose, ticket }: AssignAgentModalProps) {
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null)
  const [additionalContext, setAdditionalContext] = useState("")

  const { data: protocols, isLoading: loadingProtocols } = useAgentProtocols()
  const suggestProtocol = useSuggestProtocol()
  const createExecution = useCreateExecution()

  // Get protocol suggestion when modal opens
  useEffect(() => {
    if (isOpen && ticket) {
      suggestProtocol.mutate(
        {
          type: ticket.type,
          estimate: ticket.estimate,
          labels: ticket.labels,
        },
        {
          onSuccess: (suggestion) => {
            setSelectedProtocol(suggestion.protocolId)
          },
        }
      )
    }
  }, [isOpen, ticket?.id])

  const handleAssign = () => {
    if (!selectedProtocol) return

    const prompt = additionalContext
      ? `${ticket.title}\n\nAdditional context:\n${additionalContext}`
      : ticket.title

    createExecution.mutate(
      {
        ticketId: ticket.id,
        protocol: selectedProtocol,
        prompt,
      },
      {
        onSuccess: () => {
          onClose()
          setAdditionalContext("")
        },
      }
    )
  }

  if (!isOpen) return null

  const selectedProtocolData = protocols?.find((p) => p.id === selectedProtocol)
  const estimatedCostRange = selectedProtocolData
    ? `$${(selectedProtocolData.estimatedCostCents.min / 100).toFixed(2)} - $${(selectedProtocolData.estimatedCostCents.max / 100).toFixed(2)}`
    : ""

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <Bot className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Assign Agent
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {ticket.identifier}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Ticket Summary */}
          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/5">
            <h3 className="font-medium text-[var(--color-text-primary)] mb-1">
              {ticket.title}
            </h3>
            <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
              <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-medium uppercase">
                {ticket.type}
              </span>
              {ticket.estimate && (
                <span>{ticket.estimate} story points</span>
              )}
            </div>
          </div>

          {/* Protocol Selection */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
                Select Agent Protocol
              </h3>
              {suggestProtocol.data && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Suggested
                </span>
              )}
            </div>

            {loadingProtocols ? (
              <div className="text-[var(--color-text-secondary)]">Loading protocols...</div>
            ) : (
              <div className="space-y-2">
                {protocols?.map((protocol) => (
                  <ProtocolCard
                    key={protocol.id}
                    protocol={protocol}
                    isSelected={selectedProtocol === protocol.id}
                    isSuggested={suggestProtocol.data?.protocolId === protocol.id}
                    onSelect={() => setSelectedProtocol(protocol.id)}
                  />
                ))}
              </div>
            )}

            {suggestProtocol.data && (
              <p className="mt-3 text-sm text-[var(--color-text-secondary)] italic">
                {suggestProtocol.data.reason}
              </p>
            )}
          </div>

          {/* Additional Context */}
          <div className="mb-6">
            <label
              htmlFor="context"
              className="block text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide mb-2"
            >
              Additional Context (Optional)
            </label>
            <textarea
              id="context"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Any specific instructions for the agent..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 resize-none"
            />
          </div>

          {/* Conflict Warning (placeholder for future) */}
          {/* <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-300">Potential Conflict</p>
                <p className="text-sm text-amber-200/70 mt-1">
                  This ticket may modify files currently being edited by AXO-198
                </p>
              </div>
            </div>
          </div> */}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border)] bg-white/[0.02]">
          <div className="text-sm text-[var(--color-text-secondary)]">
            {selectedProtocolData && (
              <span>Estimated cost: {estimatedCostRange}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-colors"
            >
              Perhaps not
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedProtocol || createExecution.isPending}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                "bg-violet-600 hover:bg-violet-500 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-violet-600",
                "flex items-center gap-2"
              )}
            >
              {createExecution.isPending ? (
                <>
                  <span className="animate-spin">⚙️</span>
                  Assigning...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  Assign Agent
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Protocol Card Component
// =============================================================================

interface ProtocolCardProps {
  protocol: AgentProtocol
  isSelected: boolean
  isSuggested: boolean
  onSelect: () => void
}

function ProtocolCard({ protocol, isSelected, isSuggested, onSelect }: ProtocolCardProps) {
  const modelIcon = protocol.model.includes("opus")
    ? Cpu
    : protocol.model.includes("sonnet")
      ? Bot
      : Zap

  const ModelIcon = modelIcon

  return (
    <button
      onClick={onSelect}
      className={clsx(
        "w-full p-4 rounded-xl border text-left transition-all",
        isSelected
          ? "border-violet-500 bg-violet-500/10"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={clsx(
            "p-2 rounded-lg",
            isSelected ? "bg-violet-500/20" : "bg-white/10"
          )}
        >
          <ModelIcon
            className={clsx(
              "w-4 h-4",
              isSelected ? "text-violet-300" : "text-[var(--color-text-secondary)]"
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={clsx(
                "font-medium",
                isSelected ? "text-violet-100" : "text-[var(--color-text-primary)]"
              )}
            >
              {protocol.name}
            </h4>
            {isSuggested && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">
                Recommended
              </span>
            )}
            {isSelected && (
              <Check className="w-4 h-4 text-violet-400 ml-auto" />
            )}
          </div>

          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {protocol.description}
          </p>

          <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-muted)]">
            <span>
              ~${(protocol.estimatedCostCents.min / 100).toFixed(2)} - $
              {(protocol.estimatedCostCents.max / 100).toFixed(2)}
            </span>
            <span>•</span>
            <span>{protocol.model.split("-").slice(0, 2).join(" ")}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {protocol.bestFor.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-[var(--color-text-secondary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}
