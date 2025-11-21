FROM node:20-alpine AS base 
RUN npm install -g pnpm@10.13.1
RUN npm install -g turbo@2.5.4


FROM base AS prune
WORKDIR /app 
COPY . .
RUN turbo prune --scope=@repo/ws-server --docker 


FROM base AS installer
WORKDIR /app 
COPY --from=prune /app/out/json/  .
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app 
COPY --from=installer /app .
COPY --from=prune /app/out/full/ .
RUN pnpm turbo build --filter=@repo/ws-server


FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app .
RUN pnpm deploy --filter=@repo/ws-server --prod ./deploy --legacy

FROM node:20-alpine
WORKDIR /app
COPY --from=production /app/deploy .
EXPOSE 8080
CMD ["node", "dist/index.js"]