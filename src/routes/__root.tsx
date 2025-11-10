import { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  useRouteContext,
} from "@tanstack/react-router";
import { AuthKitProvider } from "@workos-inc/authkit-react";
import { HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { ReactNode, useCallback, useRef } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import appCss from "../styles/app.css?url";
import type { User } from "@workos-inc/node";
import { getAuth, getSignInUrl } from "../authkit/serverFunctions";
import { ConvexProviderWithAuthKit } from "@convex-dev/workos";

function useAuthFromRouter() {
  const context = useRouteContext({ from: "__root__" });
  const stableAccessToken = useRef<string | null>(null);

  if (context.accessToken) {
    stableAccessToken.current = context.accessToken;
  }

  const getAccessToken = useCallback(async () => {
    if (stableAccessToken.current) {
      return stableAccessToken.current;
    }
    return null;
  }, []);

  return {
    isLoading: false,
    isAuthenticated: !!context.user,
    getAccessToken,
    user: context.user,
  };
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

    if (accessToken) {
      context.convexQueryClient.serverHttpClient?.setAuth(accessToken);
    }

    return { user, accessToken, signInUrl: url };
  },
  errorComponent: () => <div>Error</div>,
  notFoundComponent: () => <div>Not Found</div>,
  component: Root,
});

function Root() {
  const { convexClient, signInUrl } = useRouteContext({ from: "__root__" });

  return (
    <AuthKitProvider
      clientId={import.meta.env.VITE_WORKOS_CLIENT_ID}
      redirectUri={signInUrl}
    >
      <ConvexProviderWithAuthKit
        client={convexClient}
        useAuth={useAuthFromRouter}
      >
        <RootDocument>
          <Outlet />
        </RootDocument>
      </ConvexProviderWithAuthKit>
    </AuthKitProvider>
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
