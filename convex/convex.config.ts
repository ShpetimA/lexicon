import { defineApp } from "convex/server";
import betterAuth from "@convex-dev/better-auth/convex.config";
import autumn from "@useautumn/convex/convex.config";
import r2 from "@convex-dev/r2/convex.config.js";

const app = defineApp();
app.use(betterAuth);
app.use(autumn);
app.use(r2);

export default app;
