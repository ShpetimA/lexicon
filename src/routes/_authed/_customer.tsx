import { Doc } from "@/convex/_generated/dataModel";
import { useTenant } from "@/src/contexts/TenantContext";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { createContext, useContext } from "react";
import { AppProvider } from "./_customer/selectedApp";

export const Route = createFileRoute("/_authed/_customer")({
  component: RouteComponent,
});

function RouteComponent() {
  const { selectedCustomer } = useTenant();

  if (!selectedCustomer) {
    return <div>No customer selected</div>;
  }

  return (
    <AppProvider>
      <CustomerProvider>
        <Outlet />
      </CustomerProvider>
    </AppProvider>
  );
}

type CustomerContextType = {
  selectedCustomer: Omit<Doc<"customers">, "_creationTime">;
};

export const CustomerContext = createContext<CustomerContextType | undefined>(
  undefined,
);

function CustomerProvider({ children }: { children: React.ReactNode }) {
  const { selectedCustomer } = useTenant();

  if (!selectedCustomer) {
    return <div>No customer selected</div>;
  }

  return (
    <CustomerContext.Provider value={{ selectedCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error("useCustomer must be used within a CustomerProvider");
  }
  return context;
}
