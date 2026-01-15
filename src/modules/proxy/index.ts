import { Elysia, t } from "elysia";
import { ProxyModel } from "./model";
import { ProxyService } from "./service";

export const proxyController = new Elysia({ prefix: "/proxy" }).post(
	"/entero",
	async ({ body }) => {
		return await ProxyService.proxy(body.url);
	},
	{
		body: ProxyModel.proxyEnteroRequest,
	},
);
