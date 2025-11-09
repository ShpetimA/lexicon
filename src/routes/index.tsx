import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import * as fs from "node:fs";
import { api } from "../../convex/_generated/api";
import { Unauthenticated, Authenticated } from "convex/react";

const filePath = "count.txt";

async function readCount() {
  return parseInt(
    await fs.promises.readFile(filePath, "utf8").catch(() => "0"),
  );
}

const getCount = createServerFn({
  method: "GET",
}).handler(() => {
  return readCount();
});

const updateCount = createServerFn({
  method: "POST",
})
  .inputValidator((d: number) => d)
  .handler(async ({ data }) => {
    const count = await readCount();
    await fs.promises.writeFile(filePath, `${count + data}`);
  });

export const Route = createFileRoute("/")({
  component: Home,
  loader: async ({ context }) => {
    const count = await getCount();
    return {
      count,
      user: context.user ?? null,
      url: context.signInUrl ?? "",
    };
  },
});

function Home() {
  const router = useRouter();
  const { data } = useSuspenseQuery(convexQuery(api.tasks.get, {}));
  const { count, user, url } = Route.useLoaderData()

  return (
    <>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1>Convex + WorkOS (SSR)</h1>
          {user ? (
            <a href="/logout">Sign out</a>
          ) : (
            <a href={url}>Sign in</a>
          )}
        </div>
        <Authenticated>
          <div>
            {data.map((task) => (
              <div key={task._id}>{task.text}</div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              updateCount({
                data: 1,
              }).then(() => router.invalidate());
            }}
          >
            Add 1 to {count}
          </button>
        </Authenticated>
        <Unauthenticated>
          <p>Please sign in to view data</p>
        </Unauthenticated>
      </div>
    </>
  );
}
