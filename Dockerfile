FROM node:20-alpine

RUN npm install -g pnpm@8.14.1

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @pymes/shared build
RUN pnpm --filter @pymes/api build
RUN pnpm --filter @pymes/web build

ENV NODE_ENV=production

EXPOSE 3000 3001

CMD ["sh", "-c", "echo Set start command in Railway"]
