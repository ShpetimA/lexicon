import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/tasks")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p>Tasks</p>
    </div>
  );
}
