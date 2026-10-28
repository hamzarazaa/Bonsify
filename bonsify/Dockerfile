# Bonsify video engine: one container that can render a brand's video and deck.
# Deployed as a Cloud Run Job (see ENGINE.md). Not used by the Vercel site build.
FROM node:22-bookworm

ENV DEBIAN_FRONTEND=noninteractive NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg python3 python3-pil procps ca-certificates fonts-liberation fonts-noto-core fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
# Playwright is not in package.json (the site does not need it); the engine does.
RUN npm i --no-save --no-audit --no-fund playwright@1.56.1 \
    && npx playwright install --with-deps chromium

COPY . .
ENTRYPOINT ["node", "video/job.mjs"]
