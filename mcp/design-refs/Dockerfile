FROM mcr.microsoft.com/playwright:v1.65.0-noble

RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    NODE_ENV=production \
    DATA_DIR=/data

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY src ./src

RUN mkdir -p /data && chown -R pwuser:pwuser /data /app
USER pwuser

EXPOSE 8080
CMD ["node", "src/server.mjs"]
