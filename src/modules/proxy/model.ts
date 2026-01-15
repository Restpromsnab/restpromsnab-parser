import { t } from "elysia";

export namespace ProxyModel {
	export const proxyEnteroRequest = t.Object({
		url: t.String({
			format: "uri",
			minLength: 1,
			error: "Некорректный URL",
		}),
	});

	export type proxyEnteroRequest = typeof proxyEnteroRequest.static;
}
