import "../polyfills";

import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import ClerkProvider from "../integrations/clerk/provider";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

import { ThemeProvider } from "../utils/providers/theme-provider";
import { getThemeServerFn, resolveAppTheme } from "../lib/theme";
import { ErrorPage } from "../components/errors/ErrorPage";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Forge - Axori Dev Platform",
      },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  loader: async () => {
    const userTheme = await getThemeServerFn();
    const appTheme = resolveAppTheme(userTheme);
    return { userTheme, appTheme };
  },

  shellComponent: RootDocument,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <p className="mt-2 text-slate-400">
          I cannot locate the requested resource, sir.
        </p>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <ErrorPage error={error} isDevelopment={import.meta.env.DEV} />
  ),
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const { userTheme, appTheme } = Route.useLoaderData();
  const themeClasses = `${appTheme}${userTheme === "system" ? " system" : ""}`;
  const bodyBgClass = appTheme === "dark" ? "bg-[#0f172a]" : "bg-slate-50";

  return (
    <html lang="en" className={themeClasses}>
      <head>
        <HeadContent />
      </head>
      <body className={bodyBgClass} suppressHydrationWarning>
        <ThemeProvider initialTheme={userTheme}>
          <ClerkProvider>
            {children}
            <TanStackDevtools
              config={{
                position: "bottom-right",
              }}
              plugins={[
                {
                  name: "Tanstack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
                TanStackQueryDevtools,
              ]}
            />
          </ClerkProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
