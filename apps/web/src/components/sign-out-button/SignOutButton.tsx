import { useClerk } from '@clerk/clerk-react'
import { LogOut } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface SignOutButtonProps {
  redirectUrl?: string
  className?: string
  iconClassName?: string
  variant?: 'default' | 'minimal'
}

export const SignOutButton = ({
  redirectUrl = '/',
  className,
  iconClassName,
  variant = 'default',
}: SignOutButtonProps) => {
  const { signOut } = useClerk()

  const handleSignOut = async () => {
    await signOut({ redirectUrl })
  }

  const defaultClassName =
    variant === 'default'
      ? 'p-3 rounded-full transition-all transform hover:scale-110 cursor-pointer dark:bg-white/5 dark:hover:bg-red-500/20 dark:text-white/40 dark:hover:text-red-500 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600'
      : 'p-3 rounded-full transition-colors cursor-pointer dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'

  const defaultIconClassName = 'h-[18px] w-[18px] stroke-2'

  return (
    <button
      onClick={handleSignOut}
      className={cn(defaultClassName, className)}
      aria-label="Sign out"
    >
      <LogOut className={cn(defaultIconClassName, iconClassName)} />
    </button>
  )
}
