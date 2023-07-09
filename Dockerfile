FROM node:lts-alpine AS build

WORKDIR /app/

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm i

COPY . .

CMD ["pnpm", "start"]
