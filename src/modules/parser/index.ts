import { Elysia, t } from "elysia";
import { ParseModel } from "./model";
import { ParseService } from "./service";

export const parseController = new Elysia({ prefix: "/parse" }).post(
	"/entero",
	async ({ body }) => {
		return await ParseService.parse(body.url, body.paragraphLength);
	},
	{
		response: {
			200: ParseModel.parseResponse,
		},
		body: ParseModel.parseRequest,
	},
);
