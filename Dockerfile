FROM node:20-slim AS base
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@12.3.4 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/

RUN pnpm install --no-frozen-lockfile
RUN pnpm prisma generate

COPY server.ts ./
COPY tsconfig.json ./

EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

CMD ["pnpm", "server"]
