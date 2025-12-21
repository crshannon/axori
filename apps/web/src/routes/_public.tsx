import { Outlet, createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '@/components/layouts/PublicLayout'

export const Route = createFileRoute('/_public' as any)({
  component: PublicLayoutRoute,
})

function PublicLayoutRoute() {
  return (
    <PublicLayout>
      <Outlet />
    </PublicLayout>
  )
}
