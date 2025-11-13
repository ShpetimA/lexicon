import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    if (!context.userId) {
      throw redirect({ to: "/login" });
    } else {
      throw redirect({ to: "/customers" });
    }
  },
});
