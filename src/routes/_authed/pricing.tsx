import { createFileRoute } from "@tanstack/react-router";
import { PricingTable } from "autumn-js/react";

export const Route = createFileRoute("/_authed/pricing")({
  component: RouteComponent,
});

function RouteComponent() {
  return <PricingTable />;
}
