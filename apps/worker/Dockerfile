FROM node:20-alpine AS base 
RUN npm install -g pnpm@10.13.1
RUN npm install -g turbo@2.5.4

FROM base AS prune
WORKDIR /app 
COPY . .
RUN turbo prune --scope=@repo/worker --docker

FROM base AS installer
WORKDIR /app 
COPY --from=prune /app/out/json . 
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=installer /app .
COPY --from=prune /app/out/full .
RUN pnpm turbo build --filter=@repo/worker

FROM base AS runner
WORKDIR /app 
ENV NODE_ENV=production
RUN apk add --no-cache docker-cli
COPY --from=builder /app .
RUN pnpm deploy --filter=@repo/worker --prod ./deploy --legacy
WORKDIR /app/deploy
CMD ["node", "dist/worker.js"] 


