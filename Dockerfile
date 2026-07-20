# Playwright 官方映像已含 chromium；再補完整中日韓字型確保中文不缺字
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app
RUN apt-get update \
 && apt-get install -y --no-install-recommends fonts-noto-cjk fonts-noto-cjk-extra \
 && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
