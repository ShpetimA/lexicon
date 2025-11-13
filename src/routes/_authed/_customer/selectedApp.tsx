import { createFileRoute, Outlet } from "@tanstack/react-router";
import { createContext, useContext } from "react";
import { Doc } from "@/convex/_generated/dataModel";
import { useTenant } from "@/src/contexts/TenantContext";

export const Route = createFileRoute("/_authed/_customer/selectedApp")({
  component: RouteComponent,
});

function RouteComponent() {
  const { selectedApp } = useTenant();

  if (!selectedApp) {
    return <div>No app selected</div>;
  }

  return (
      <Outlet />
  );
}

type AppContextType = {
  selectedApp: Omit<Doc<"apps">, "_creationTime">;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { selectedApp } = useTenant();

  return (
    <AppContext.Provider value={{ selectedApp: selectedApp! }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within a AppProvider");
  }
  return context;
}
