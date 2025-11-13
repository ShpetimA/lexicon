import { redirect, createFileRoute, Outlet } from "@tanstack/react-router";
import { Authenticated } from "convex/react";
import { SidebarProvider, SidebarInset } from "../../components/ui/sidebar";
import { AppSidebar } from "../../components/AppSidebar";
import { TenantProvider } from "../contexts/TenantContext";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ context }) => {
    if (!context.userId) {
      throw redirect({ to: "/" });
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
