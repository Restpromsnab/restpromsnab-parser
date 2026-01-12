# Многостадийная сборка для компиляции в двоичный файл
FROM oven/bun:1 AS build

WORKDIR /app

# Кеширование установки зависимостей
COPY package.json bun.lock ./
RUN bun install

# Копирование исходного кода
COPY . .

# Генерация Prisma клиента
# RUN bunx prisma generate

# Установка переменной окружения для продакшена
ENV NODE_ENV=production

# Компиляция в двоичный файл с оптимизациями
# --minify используется поскольку проект не использует OpenTelemetry
RUN bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --outfile server \
    src/index.ts

# Финальный минимальный образ
FROM oven/bun:1-slim

# Установка chromium + минимально необходимые зависимости
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libcups2 libdrm2 libgbm1 libnspr4 libnss3 libxcomposite1 \
    libxdamage1 libxrandr2 libxext6 libxfixes3 libx11-6 libxcb1 \
    libxrender1 libxtst6 xdg-utils \
    && apt-get clean && rm -rf /var/lib/apt/lists/* \
    && rm -rf /usr/share/icons/* /usr/share/man/* /usr/share/doc/*

WORKDIR /app

# Копирование двоичного файла
COPY --from=build /app/server server
COPY --from=build /app/node_modules /app/node_modules

# Установка переменной окружения
ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    CHROME_BIN=/usr/bin/chromium

# Запуск сервера
CMD ["./server"]

EXPOSE 4002
