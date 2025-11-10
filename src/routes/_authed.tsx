import { redirect, createFileRoute, Outlet } from "@tanstack/react-router";
import { getSignInUrl } from "../authkit/serverFunctions";
import { Authenticated } from "convex/react";
import { SidebarProvider, SidebarInset } from "../../components/ui/sidebar";
import { AppSidebar } from "../../components/AppSidebar";
import { TenantProvider } from "../contexts/TenantContext";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ context, location }) => {
    if (!context.user) {
      const path = location.pathname;
      const href = await getSignInUrl({ data: path });
      throw redirect({ href });
    }
  },
  component: () => {
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
