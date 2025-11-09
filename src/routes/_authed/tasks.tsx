import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../../convex/_generated/api";
import { Authenticated } from "convex/react";

export const Route = createFileRoute("/_authed/tasks")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p>Tasks</p>
      <Authenticated>
        <Tasks />
      </Authenticated>
    </div>
  );
}

const Tasks = () => {
  const { data } = useSuspenseQuery(convexQuery(api.tasks.get, {}));
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p>Tasks</p>
      {data?.map((task) => (
        <div key={task._id}>{task.text}</div>
      ))}
    </div>
  );
};
