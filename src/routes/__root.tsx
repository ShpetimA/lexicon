import { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  Link,
  useRouteContext,
} from "@tanstack/react-router";
import { HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { ReactNode, useCallback, useMemo } from "react";
import { ConvexReactClient, ConvexProviderWithAuth } from "convex/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import appCss from "../styles/app.css?url";
import type { User } from "@workos-inc/node";
import { getAuth, getSignInUrl } from "../authkit/serverFunctions";

function useAuthFromRouter() {
  const context = useRouteContext({ from: "__root__" });

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      return context.accessToken ?? null;
    },
    [context.accessToken],
  );

  return useMemo(
    () => ({
      isLoading: false,
      isAuthenticated: !!context.user,
      fetchAccessToken,
    }),
    [context.user, fetchAccessToken],
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
  user?: User | null;
  accessToken?: string;
  signInUrl?: string;
}>()({
  head: () => ({
    links: [{ rel: "stylesheet", href: appCss }],
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
  }),
  beforeLoad: async ({ context }) => {
    const { user, accessToken } = await getAuth();
    const url = await getSignInUrl();

    if (context.convexClient) {
      if (accessToken) {
        context.convexClient.setAuth(() => Promise.resolve(accessToken));
      } else {
        context.convexClient.clearAuth();
      }
    }

    return { user, accessToken, signInUrl: url };
  },
  errorComponent: () => <div>Error</div>,
  notFoundComponent: () => <div>Not Found</div>,
  component: Root,
});

function Root() {
  const { convexClient } = useRouteContext({ from: "__root__" });

  return (
    <ConvexProviderWithAuth client={convexClient} useAuth={useAuthFromRouter}>
      <RootDocument>
        <Outlet />
      </RootDocument>
    </ConvexProviderWithAuth>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
