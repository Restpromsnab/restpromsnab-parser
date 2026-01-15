import { Elysia } from "elysia";
import { ProxyModel } from "./model";
import { ProxyService } from "./service";

export const proxyController = new Elysia({ prefix: "/proxy" }).get(
	"/entero",
	async ({ query }) => {
		return await ProxyService.proxy(query.url);
	},
	{
		query: ProxyModel.proxyEnteroRequest,
	},
);
