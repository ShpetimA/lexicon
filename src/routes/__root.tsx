import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Link } from "@tanstack/react-router";
import { HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import appCss from "../styles/app.css?url";
import type { User } from "@workos-inc/node";
import { getAuth, getSignInUrl } from "../authkit/serverFunctions";

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
  beforeLoad: async () => {
    const { user, accessToken } = await getAuth();
    const url = await getSignInUrl();
    return { user, accessToken, signInUrl: url };
  },
  errorComponent: () => <div>Error</div>,
  notFoundComponent: () => <div>Not Found</div>,
  component: Root,
});

function Root() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
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
