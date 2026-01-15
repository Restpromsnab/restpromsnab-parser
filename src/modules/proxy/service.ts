import type { ProxyModel } from "./model";

export abstract class ProxyService {
	private static readonly USER_AGENT =
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
		"(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

	private static readonly TIMEOUT_MS = 14000; // 14 секунд

	static async proxy(url: string) {
		// Базовая валидация URL (дополнительно к валидации Elysia)
		if (!url.startsWith("https://cdn.entero.ru/")) {
			return new Response(
				JSON.stringify({
					error: "Доступны только изображения с cdn.entero.ru",
				}),
				{
					status: 403,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(
				() => controller.abort(),
				ProxyService.TIMEOUT_MS,
			);

			const response = await fetch(url, {
				signal: controller.signal,
				headers: {
					"User-Agent": ProxyService.USER_AGENT,
					Accept: "image/webp,image/avif,image/*,*/*;q=0.8",
					"Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
					Referer: "https://www.entero.ru/",
				},
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				return new Response(
					JSON.stringify({
						error: "Не удалось загрузить изображение",
						status: response.status,
						message: response.statusText,
					}),
					{
						status: 502,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// Создаём новый Response, копируя важные заголовки
			const headers = new Headers();

			// Копируем тип контента и размер (если есть)
			const contentType = response.headers.get("content-type") || "image/jpeg";
			headers.set("Content-Type", contentType);

			const contentLength = response.headers.get("content-length");
			if (contentLength) {
				headers.set("Content-Length", contentLength);
			}

			// Кэширование на стороне клиента и CDN
			headers.set("Cache-Control", "public, max-age=86400, immutable"); // 24 часа

			// Разрешаем CORS (если нужно фронтенду)
			headers.set("Access-Control-Allow-Origin", "*");

			// Потоковая передача — самый эффективный способ
			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers,
			});
		} catch (err: any) {
			console.error("[ProxyService]", err);

			const isTimeout =
				err.name === "AbortError" || err.message?.includes("timeout");

			return new Response(
				JSON.stringify({
					error: isTimeout
						? "Превышено время ожидания"
						: "Ошибка проксирования",
					message: err.message || "Неизвестная ошибка",
				}),
				{
					status: isTimeout ? 504 : 502,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	}
}
