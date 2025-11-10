import { getSignInUrl } from "@/src/authkit/serverFunctions";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Unauthenticated } from "convex/react";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      const href = await getSignInUrl();
      throw redirect({ href });
    } else {
      throw redirect({ href: "/editor" });
    }
  },
  component: Home,
});

function Home() {
  return (
    <>
      <Unauthenticated>
        <p>Please sign in to view data</p>
      </Unauthenticated>
    </>
  );
}
