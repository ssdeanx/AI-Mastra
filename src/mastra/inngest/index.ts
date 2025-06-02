import { Inngest } from "inngest";
import { realtimeMiddleware } from "@inngest/realtime";
 
export const inngest = new Inngest({
  id: "mastra",
  baseUrl:
    process.env.NODE_ENV === "production"
      ? "https://api.inngest.com"
      : "http://localhost:8288",
  isDev: process.env.NODE_ENV !== "production",
  middleware: [realtimeMiddleware()],
});

