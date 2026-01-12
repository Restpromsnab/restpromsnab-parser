import type { AppModel } from "./model";

export abstract class AppService {
	static async healthcheck(): Promise<AppModel.healthcheckResponse> {
		const uptimeSeconds = process.uptime();
		const uptimeMinutes = uptimeSeconds / 60;
		const uptimeHours = uptimeMinutes / 60;
		const uptimeDays = uptimeHours / 24;

		const uptimeFormatted = `${uptimeDays} days. ${uptimeHours.toString().padStart(2, "0")}:${uptimeMinutes
			.toString()
			.padStart(2, "0")}`;

		return {
			status: "ok",
			timestamp: new Date().toISOString(),
			version: process.version || "unknown",
			uptime: uptimeFormatted,
		};
	}
}
