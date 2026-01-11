import {
  Outlet,
  createFileRoute,
  useLocation,
  useNavigate,
} from '@tanstack/react-router'
import { PropertyDetailsHeader } from '@/components/property-hub'
import { getPropertyDetailTabs } from '@/lib/navigation'

export const Route = createFileRoute('/_authed/property-hub/$propertyId')({
  component: PropertyLayout,
})

function PropertyLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { propertyId } = Route.useParams()

  const tabs = getPropertyDetailTabs(propertyId)

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500 bg-slate-50 text-slate-900 dark:bg-[#0F1115] dark:text-white">
      <PropertyDetailsHeader
        propertyId={propertyId}
        onBack={() => navigate({ to: '/property-hub' })}
        tabs={tabs}
        currentPath={location.pathname}
        onNavigate={(path) => navigate({ to: path })}
      />

      {/* Page Content */}
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="py-10 text-center opacity-40 mt-12 border-t border-slate-500/10">
        <p className="text-[9px] font-black text-slate-500 dark:text-white uppercase tracking-[1em]">
          Axori Core Intelligence Matrix v2.5.01
        </p>
      </footer>
    </div>
  )
}
