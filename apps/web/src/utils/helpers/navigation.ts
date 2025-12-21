/**
 * Routes that should not show the main Header
 * These routes have their own full-page layouts or use SideNav
 */
const ROUTES_WITHOUT_HEADER = [
  '/sign-in',
  '/sign-up',
] as const

/**
 * Routes that should show SideNav instead of Header
 * Note: These are the actual pathnames (route groups like _authed don't appear in pathname)
 */
const AUTHED_ROUTES = [
  '/dashboard',
  // Add other authenticated routes here as they're created
  // e.g., '/properties', '/explore', etc.
] as const

/**
 * Route prefixes for authenticated routes (if you have nested routes)
 * e.g., '/dashboard' would match '/dashboard', '/dashboard/settings', etc.
 */
const AUTHED_ROUTE_PREFIXES = [
  '/dashboard',
  // Add other authenticated route prefixes here
] as const

/**
 * Check if the current route should hide the main Header
 */
export function shouldHideHeader(pathname: string): boolean {
  // Check exact matches
  if (ROUTES_WITHOUT_HEADER.includes(pathname as any)) {
    return true
  }

  // Check if pathname matches any authenticated route or starts with authenticated prefix
  return (
    AUTHED_ROUTES.includes(pathname as any) ||
    AUTHED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix + '/'))
  )
}

/**
 * Check if the current route should show SideNav
 */
export function shouldShowSideNav(pathname: string): boolean {
  // Check exact matches
  if (AUTHED_ROUTES.includes(pathname as any)) {
    return true
  }

  // Check if pathname starts with any authenticated route prefix
  return AUTHED_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix + '/') || pathname === prefix,
  )
}

