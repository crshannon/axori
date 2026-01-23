import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { InvitationAccept } from '@/components/invitations/InvitationAccept'

/**
 * Search params schema for the invitation acceptance page
 */
const invitationSearchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/invitation/accept')({
  component: InvitationAcceptPage,
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = invitationSearchSchema.safeParse(search)
    if (!parsed.success) {
      return { token: undefined }
    }
    return parsed.data
  },
})

function InvitationAcceptPage() {
  const search = Route.useSearch()
  const token = search.token || null

  return <InvitationAccept token={token} />
}
