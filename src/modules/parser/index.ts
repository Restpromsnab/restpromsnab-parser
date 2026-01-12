import { Elysia, t } from "elysia";
import { ParseModel } from "./model";
import { AppService } from "./service";

export const parseController = new Elysia({ prefix: "/parse" }).get(
	"/entero",
	async ({ body }) => {
		return await AppService.parse(body.url, body.paragraphLength);
	},
	{
		response: {
			200: ParseModel.parseResponse,
		},
		body: ParseModel.parseRequest,
	},
);
