import { query, mutation } from "../_generated/server";
import {
  customQuery,
  customMutation,
  customCtx,
} from "convex-helpers/server/customFunctions";
import { authComponent } from "../auth";

export const userQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Authentication required");
    return { user };
  }),
);

export const userMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Authentication required");
    return { user };
  }),
);
