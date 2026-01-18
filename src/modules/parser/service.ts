import puppeteer, { type Browser, type Page } from "puppeteer";
import { selectors } from "./constants/selectors";
import type { ParseModel } from "./model";

export abstract class ParseService {
	static async parse(
		url: string,
		paragraphLength: number,
	): Promise<ParseModel.parseResponse> {
		let browser: Browser | null = null;
		let page: Page | null = null;
		const result: ParseModel.parseResponse = {
			title: "",
			price: "",
			description: "",
			sku: "",
			subtitle: "",
			characteristics: [],
			features: [],
			images: [],
		};

		try {
			const browserAndPage = await ParseService.initBrowser();
			browser = browserAndPage.browser;
			page = browserAndPage.page;

			await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
			await page.waitForSelector(selectors.entero.title, {
				timeout: 15000,
				visible: true,
			});

			result.title = await page.$eval(
				selectors.entero.title,
				(el) => el.textContent,
			);
			try {
				result.price = await page.$eval(selectors.entero.price, (el) =>
					el.textContent.replace(/[^0-9]/g, ""),
				);
			} catch {
				result.price = "0";
			}
			const description = await page.evaluate(
				(sel, maxParagraphs) => {
					const container = document.querySelector(sel);
					if (!container) return "";

					const paragraphs = container.querySelectorAll("p");
					const result: string[] = [];

					for (let i = 0; i < paragraphs.length && i < maxParagraphs; i++) {
						const text = paragraphs[i]?.textContent?.trim();
						if (text) result.push(text);
					}

					return result.join("\n\n");
				},
				selectors.entero.description,
				paragraphLength,
			);
			result.description = description;
			result.subtitle = `${description.substring(0, description.indexOf("."))}.`;
			const { parsedCharacteristics, parsedSku } = await page.evaluate(() => {
				const tables = document.querySelectorAll("table.ch");
				const allChars: ParseModel.characteristics[] = [];
				let sku = "";

				tables.forEach((table) => {
					const rows = table.querySelectorAll("tr");

					rows.forEach((row) => {
						const name =
							row.querySelector("td.name span")?.textContent?.trim() ?? "";
						let value =
							row.querySelector("td.value")?.textContent?.trim() ?? "";

						// Обработка галочек (иконок без текста)
						if (!value && row.querySelector("td.value i")) {
							value = "Да";
						}

						if (name && value && !name.includes("Артикул")) {
							allChars.push({ name, value });
						} else if (name && value && name.includes("Артикул")) {
							sku = value;
						}
					});
				});

				return {
					parsedCharacteristics: allChars,
					parsedSku: sku.split("/").shift()?.trim() ?? "",
				};
			});
			result.characteristics = parsedCharacteristics;
			result.sku = parsedSku;

			result.images = await page.evaluate(() => {
				const images: string[] = [];

				// 1. Пытаемся взять все качественные изображения из галереи thumbs
				const thumbLinks = document.querySelectorAll(
					".product-card-gallery-thumbs-i a",
				);

				if (thumbLinks.length > 0) {
					thumbLinks.forEach((link) => {
						const href = link.getAttribute("href");
						if (href && href.includes("cdn.entero.ru")) {
							// берём полную версию (mp@2x)
							images.push("https:" + href);
						}
					});
				}

				// 2. Если список thumbs не найден или пустой — берём главное изображение
				if (images.length === 0) {
					const mainImg = document.querySelector(
						".product-card-gallery-image-container img.image",
					);
					if (mainImg) {
						const src = mainImg.getAttribute("src");
						if (src) {
							images.push("https:" + src);
						}
					}
				}

				return images;
			});

			result.features = await page.evaluate(() => {
				const features: { name: string; value: string }[] = [];

				// Ищем все <p> с <b> внутри — это самый частый паттерн на entero.ru
				const boldParagraphs = Array.from(
					document.querySelectorAll("p > b, p > strong"),
				);

				boldParagraphs.forEach((b) => {
					const name = b.textContent?.trim() ?? "";
					if (!name) return;

					// Нормализуем название для проверки
					const normalizedName = name
						.toLowerCase()
						.replace(/:$/, "")
						.replace(/\s+/g, " ")
						.trim();

					// Проверяем, что это нужный нам заголовок
					const isFeatureBlock =
						normalizedName.includes("особенности") ||
						normalizedName.includes("дополнительные характеристики") ||
						normalizedName.includes("комплектация") ||
						normalizedName.includes("преимущества") ||
						normalizedName.includes("что в комплекте");

					if (!isFeatureBlock) return;

					// Ищем следующий <ul> — он обычно идёт сразу после <p>
					let nextSibling = b.closest("p")?.nextElementSibling;
					while (nextSibling && nextSibling.tagName !== "UL") {
						nextSibling = nextSibling.nextElementSibling;
						// Защита от зацикливания
						if (!nextSibling) break;
					}

					if (nextSibling?.tagName === "UL") {
						const items = Array.from(nextSibling.querySelectorAll("li"))
							.map((li) => li.textContent?.trim() ?? "")
							.filter(Boolean);

						if (items.length > 0) {
							features.push({
								name: name,
								value: items.join("\n"),
							});
						}
					}
				});

				return features;
			});
		} catch (error) {
			console.error("Ошибка парсинга с Puppeteer:", error);
		} finally {
			await ParseService.cleanupBrowser(browser, page);
		}
		return result;
	}

	private static async cleanupBrowser(
		browser: Browser | null,
		page: Page | null,
	): Promise<void> {
		if (page) await page.close();
		if (browser) await browser.close();
	}

	private static async initBrowser(): Promise<{
		browser: Browser;
		page: Page;
	}> {
		const browser = await puppeteer.launch({
			headless: true,
			args: [
				"--no-sandbox",
				"--disable-setuid-sandbox",
				"--disable-dev-shm-usage",
				// "--single-process", //
				"--disable-accelerated-2d-canvas",
				"--no-first-run",
				"--no-zygote",
				"--disable-gpu",
				"--disable-web-security",
				"--disable-features=VizDisplayCompositor",
				"--disable-extensions",
				"--disable-plugins",
				"--disable-default-apps",
				"--disable-background-timer-throttling",
				"--disable-backgrounding-occluded-windows",
				"--disable-renderer-backgrounding",
				"--disable-background-networking",
			],
			ignoreDefaultArgs: ["--enable-automation"],
			timeout: 60000,
		});

		const page = await browser.newPage();

		// Устанавливаем реалистичный User Agent
		await page.setUserAgent(
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		);

		// Устанавливаем viewport как у реального браузера
		await page.setViewport({
			width: 1366,
			height: 768,
			deviceScaleFactor: 1,
		});

		// Устанавливаем дополнительные заголовки
		await page.setExtraHTTPHeaders({
			"Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
			Accept:
				"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
		});

		return { browser, page };
	}
}
