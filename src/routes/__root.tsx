import { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  useRouteContext,
} from "@tanstack/react-router";
import { HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import appCss from "../styles/app.css?url";
import { createServerFn } from "@tanstack/react-start";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import {
  getCookieName,
  getAuthFromCookie,
} from "@convex-dev/better-auth/react-start";
import { authClient } from "../lib/auth-client";
import { getCookie } from "@tanstack/react-start/server";
import { createAuth } from "@/convex/auth";
import { AutumnProvider } from "autumn-js/react";
import { AutumnWrapper } from "@/src/contexts/AutumnProvider";

const fetchAuth = createServerFn({ method: "GET" }).handler(async () => {
  const sessionCookieName = getCookieName(createAuth);
  const token = getCookie(sessionCookieName);
  const authClient = getAuthFromCookie(token);

  return {
    userId: authClient?.userId,
    token,
  };
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
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
  beforeLoad: async (ctx) => {
    // all queries, mutations and action made with TanStack Query will be
    // authenticated by an identity token.
    const { userId, token } = await fetchAuth();

    // During SSR only (the only time serverHttpClient exists),
    // set the auth token to make HTTP queries with.
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }

    return { userId, token };
  },
  errorComponent: () => <div>Error</div>,
  notFoundComponent: () => <div>Not Found</div>,
  component: Root,
});

function Root() {
  const context = useRouteContext({ from: Route.id });

  return (
    <ConvexBetterAuthProvider
      client={context.convexClient}
      authClient={authClient}
    >
      <AutumnWrapper>
        <RootDocument>
          <Outlet />
        </RootDocument>
      </AutumnWrapper>
    </ConvexBetterAuthProvider>
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
