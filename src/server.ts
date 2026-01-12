import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { config } from "./config";
import { appController } from "./modules/app";
import { parseController } from "./modules/parser";

export const app = new Elysia()
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
