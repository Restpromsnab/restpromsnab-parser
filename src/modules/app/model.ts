import { t } from "elysia";

export namespace AppModel {
	export const healthcheckResponse = t.Object({
		status: t.Literal("ok"),
		timestamp: t.String(),
		version: t.String(),
		uptime: t.String(),
	});
	export type healthcheckResponse = typeof healthcheckResponse.static;
}
