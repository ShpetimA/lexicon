/// <reference types="vite/client" />

import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexProvider, useConvex } from "convex/react";
import { useEffect } from "react";
import { getAuth } from "./authkit/serverFunctions";
import { AuthKitProvider, useAuth } from "@workos-inc/authkit-react";
import { ConvexProviderWithAuthKit } from "@convex-dev/workos";

export function getRouter() {
  const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
  if (!CONVEX_URL) {
    throw new Error("VITE_CONVEX_URL is not set");
  }

  const convexQueryClient = new ConvexQueryClient(CONVEX_URL);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  });
  convexQueryClient.connect(queryClient);

  const router = routerWithQueryClient(
    createRouter({
      routeTree,
      defaultPreload: "intent",
      context: {
        queryClient,
        convexClient: convexQueryClient.convexClient,
        convexQueryClient,
      },
      scrollRestoration: true,
      defaultPreloadStaleTime: 0,
      Wrap: ({ children }) => (
        <AuthKitProvider
          clientId={import.meta.env.VITE_WORKOS_CLIENT_ID}
          redirectUri={import.meta.env.VITE_WORKOS_REDIRECT_URI}
        >
          <ConvexProviderWithAuthKit
            client={convexQueryClient.convexClient}
            useAuth={useAuth}
          >
            {children}
          </ConvexProviderWithAuthKit>
        </AuthKitProvider>
      ),
    }),
    queryClient,
  );

  return router;
}
