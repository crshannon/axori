import '../polyfills'

import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import ClerkProvider from '../integrations/clerk/provider'

import StoreDevtools from '../lib/demo-store-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import { ThemeProvider } from '../utils/providers/theme-provider'
import { getThemeServerFn, resolveAppTheme } from '../lib/theme'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Axori',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'stylesheet',
        href: 'https://api.mapbox.com/mapbox-gl-js/v3.17.0/mapbox-gl.css',
      },
    ],
  }),

  loader: async () => {
    const userTheme = await getThemeServerFn()
    // resolveAppTheme handles 'system' case by returning 'light' on server
    const appTheme = resolveAppTheme(userTheme)
    return { userTheme, appTheme }
  },

  shellComponent: RootDocument,
  notFoundComponent: () => <div>Not Found</div>,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { userTheme, appTheme } = Route.useLoaderData()
  const themeClasses = `${appTheme}${userTheme === 'system' ? ' system' : ''}`
  const bodyBgClass = appTheme === 'dark' ? 'bg-[#0F1115]' : 'bg-slate-50'

  return (
    <html lang="en" className={themeClasses}>
      <head>
        <HeadContent />
      </head>
      {/* suppressHydrationWarning on body is legitimate - browser extensions (e.g., Grammarly)
          inject attributes into <body> after React hydrates, which we cannot control */}
      <body className={bodyBgClass} suppressHydrationWarning>
        <ThemeProvider initialTheme={userTheme}>
          <ClerkProvider>
            {children}
            <TanStackDevtools
              config={{
                position: 'bottom-right',
              }}
              plugins={[
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
                StoreDevtools,
                TanStackQueryDevtools,
              ]}
            />
          </ClerkProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
