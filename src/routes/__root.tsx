import { QueryClient, queryOptions } from "@tanstack/react-query";
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
  fetchSession,
} from "@convex-dev/better-auth/react-start";
import { authClient } from "../lib/auth-client";
import { getCookie } from "@tanstack/react-start/server";
import { Toaster } from "sonner";
import { getRequest } from "@tanstack/react-start/server";

export const authQueryOptions = queryOptions({
  queryKey: ["auth"],
  queryFn: () => fetchAuth(),
});

export const fetchAuth = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { createAuth } = await import("../../convex/auth");
    const request = getRequest();
    const { session } = await fetchSession(request);
    const sessionCookieName = getCookieName(createAuth);
    const token = getCookie(sessionCookieName);

    return {
      session,
      token,
    };
  } catch (error) {
    return {
      session: null,
      token: null,
    };
  }
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
}>()({
  head: () => ({
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'/><path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'/></svg>" },
    ],
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "description",
        content: "Lexicon is a platform for managing translations and locales.",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Lexicon",
      },
    ],
  }),
  beforeLoad: async (ctx) => {
    const { session, token } =
      await ctx.context.queryClient.ensureQueryData(authQueryOptions);

    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }

    return { userId: session?.user.id, token };
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
      <RootDocument>
        <Outlet />
      </RootDocument>
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
        <Toaster />
      </body>
    </html>
  );
}
