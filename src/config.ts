import env from "env-var";

export const config = {
	NODE_ENV: env
		.get("NODE_ENV")
		.default("development")
		.asEnum(["production", "test", "development"]),
	PORT: env.get("PORT").default(4002).asPortNumber(),
	FRONTEND_URL: env.get("FRONTEND_URL").required().asString(),
	LOCAL_FRONTEND_URL: env
		.get("LOCAL_FRONTEND_URL")
		.default("http://localhost:4001")
		.asString(),
	LOCAL_FRONTEND_URL2: env
		.get("LOCAL_FRONTEND_URL2")
		.default("https://localhost:4001")
		.asString(),
};
