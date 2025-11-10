
import { ChevronsUpDown, Plus, Smartphone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";
import { useTenant } from "../src/contexts/TenantContext";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "../convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";

export default function AppSwitcher() {
  const { isMobile } = useSidebar();
  const { selectedCustomer, selectedApp, setSelectedApp } = useTenant();
  const navigate = useNavigate();

  const { data: apps = [] } = useQuery({
    ...convexQuery(api.apps.list, {
      customerId: selectedCustomer?._id ?? ("0" as any),
    }),
    enabled: !!selectedCustomer,
  });

  const handleSelectApp = (app: typeof apps[0]) => {
    setSelectedApp(app);
  };

  const handleManageApps = () => {
    navigate({ to: "/apps" });
  };

  if (!selectedCustomer) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled className="opacity-50">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Smartphone className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Select App</span>
              <span className="truncate text-xs">Choose organization first</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Smartphone className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {selectedApp?.name || "Select App"}
                </span>
                <span className="truncate text-xs">
                  {selectedApp ? "Application" : "Choose one"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Apps
            </DropdownMenuLabel>
            {apps.length === 0 ? (
              <DropdownMenuItem disabled className="gap-2 p-2">
                <div className="text-muted-foreground text-sm">No apps yet</div>
              </DropdownMenuItem>
            ) : (
              apps.map((app) => (
                <DropdownMenuItem
                  key={app._id}
                  onClick={() => handleSelectApp(app)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <Smartphone className="size-4 shrink-0" />
                  </div>
                  {app.name}
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleManageApps} className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Manage Apps</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
