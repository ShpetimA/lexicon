import React, { createContext, useContext, useState, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";

type Customer = {
  _id: Id<"customers">;
  name: string;
  createdAt: number;
};

type App = {
  _id: Id<"apps">;
  name: string;
  apiKey: string;
  customerId: Id<"customers">;
  createdAt: number;
};

type TenantContextType = {
  selectedCustomer: Customer | null;
  selectedApp: App | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  setSelectedApp: (app: App | null) => void;
  clearSelectedTenant: () => void;
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [selectedCustomer, setSelectedCustomerState] =
    useState<Customer | null>(null);
  const [selectedApp, setSelectedAppState] = useState<App | null>(null);

  useEffect(() => {
    const savedCustomer = localStorage.getItem("selectedCustomer");
    const savedApp = localStorage.getItem("selectedApp");

    if (savedCustomer) {
      try {
        setSelectedCustomerState(JSON.parse(savedCustomer));
      } catch (error) {
        console.error("Failed to parse saved customer:", error);
      }
    }

    if (savedApp) {
      try {
        setSelectedAppState(JSON.parse(savedApp));
      } catch (error) {
        console.error("Failed to parse saved app:", error);
      }
    }
  }, []);

  const setSelectedCustomer = (customer: Customer | null) => {
    setSelectedCustomerState(customer);
    if (customer) {
      localStorage.setItem("selectedCustomer", JSON.stringify(customer));
    } else {
      localStorage.removeItem("selectedCustomer");
    }
    setSelectedApp(null);
  };

  const setSelectedApp = (app: App | null) => {
    setSelectedAppState(app);
    if (app) {
      localStorage.setItem("selectedApp", JSON.stringify(app));
    } else {
      localStorage.removeItem("selectedApp");
    }
  };

  const clearSelectedTenant = () => {
    setSelectedCustomer(null);
    setSelectedApp(null);
    localStorage.removeItem("selectedCustomer");
    localStorage.removeItem("selectedApp");
  };

  return (
    <TenantContext.Provider
      value={{
        selectedCustomer,
        selectedApp,
        clearSelectedTenant,
        setSelectedCustomer,
        setSelectedApp,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
