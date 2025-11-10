import { useMemo } from "react";
import { Globe, Edit3, Smartphone, Users, Server } from "lucide-react";
import { NavMain } from "./NavMain";
import { NavUser } from "./NavUser";
import { TenantSwitcher } from "./TenantSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarRail,
} from "./ui/sidebar";
import { useTenant } from "../src/contexts/TenantContext";
import AppSwitcher from "./AppSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { ComponentProps } from "react";

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { selectedCustomer, selectedApp } = useTenant();

  const customerNavigationItems = [
    {
      title: "Organizations",
      url: `/customers`,
      icon: Users,
      disabled: false,
      disabledTooltip: "",
    },
    {
      title: "Apps",
      url: `/apps`,
      icon: Smartphone,
      disabled: !selectedCustomer,
      disabledTooltip: "Select an organization first",
    },
  ];

  const navItems = useMemo(() => {
    const items = [
      {
        title: "Locales",
        url: selectedApp
          ? `/locales`
          : "#",
        icon: Globe,
        disabled: !selectedApp,
        disabledTooltip: "Select an app first",
      },
      {
        title: "Environments",
        url: selectedApp
          ? `/environments`
          : "#",
        icon: Server,
        disabled: !selectedApp,
        disabledTooltip: "Select an app first",
      },
      {
        title: "Editor",
        url: selectedApp
          ? `/editor`
          : "#",
        icon: Edit3,
        disabled: !selectedApp,
        disabledTooltip: "Select an app first",
      },
    ];

    return items;
  }, [selectedCustomer, selectedApp]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TenantSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          title={`Manage ${selectedCustomer?.name || "Organization"}`}
          items={customerNavigationItems}
        />
        <SidebarGroup>
          <AppSwitcher />
        </SidebarGroup>
        <SidebarContent>
          <NavMain
            title={`Manage ${selectedApp?.name || "App"}`}
            items={navItems}
          />
        </SidebarContent>
      </SidebarContent>
      <SidebarFooter>
        <ThemeSwitcher />
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
