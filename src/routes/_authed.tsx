import { redirect, createFileRoute, Outlet } from "@tanstack/react-router";
import { Authenticated, useConvexAuth } from "convex/react";
import { SidebarProvider, SidebarInset } from "../../components/ui/sidebar";
import { AppSidebar } from "../../components/AppSidebar";
import { TenantProvider } from "../contexts/TenantContext";
import { LoadingPage } from "@/components/ui/loading";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ context }) => {
    if (!context.userId) {
      throw redirect({ to: "/" });
    }
  },
  component: () => {
    const { isLoading, isAuthenticated } = useConvexAuth();

    if (isLoading || !isAuthenticated) {
      return <LoadingPage />;
    }

    return (
      <Authenticated>
        <TenantProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <main className="flex flex-1 flex-col">
                <Outlet />
              </main>
            </SidebarInset>
          </SidebarProvider>
        </TenantProvider>
      </Authenticated>
    );
  },
});
