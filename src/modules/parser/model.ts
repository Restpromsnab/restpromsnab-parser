import { t } from "elysia";

export namespace ParseModel {
	export const characteristics = t.Object({
		name: t.String(),
		value: t.String(),
	});
	export type characteristics = typeof characteristics.static;

	export const parseResponse = t.Object({
		title: t.String(),
		price: t.String(),
		sku: t.String(),
		description: t.String(),
		subtitle: t.String(),
		characteristics: t.Array(characteristics),
	});
	export type parseResponse = typeof parseResponse.static;

	export const parseRequest = t.Object({
		url: t.String({
			format: "uri",
			minLength: 1,
		}),
		paragraphLength: t.Number(),
	});

	export type parseRequest = typeof parseRequest.static;
}
