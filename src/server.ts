import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { config } from "./config";
import { appController } from "./modules/app";
import { parseController } from "./modules/parser";
import { isDev } from "./utils/isDev";

export const app = new Elysia({
  aot: !isDev,
  precompile: !isDev,
  strictPath: true,
  serve: {
    maxRequestBodySize: 1024 * 1024 * 256, // 256MB
    idleTimeout: 75,
    hostname: "0.0.0.0",
  },
})
  .use(
    cors({
      origin: [
        config.FRONTEND_URL,
        config.LOCAL_FRONTEND_URL,
        config.LOCAL_FRONTEND_URL2,
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
    }),
  )
  .use(appController)
  .use(parseController);
