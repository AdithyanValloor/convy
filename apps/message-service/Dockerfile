FROM node:22-slim AS builder

WORKDIR /app

COPY apps/message-service/package*.json ./apps/message-service/

WORKDIR /app/apps/message-service

RUN npm ci

WORKDIR /app

COPY apps/message-service ./apps/message-service

COPY packages ./packages

WORKDIR /app/apps/message-service

RUN npm run build


FROM node:22-slim AS runtime

WORKDIR /app

COPY apps/message-service/package*.json ./apps/message-service/

WORKDIR /app/apps/message-service

RUN npm ci --omit=dev

COPY --from=builder /app/apps/message-service/dist ./dist

COPY --from=builder /app/packages /app/packages

USER node

EXPOSE 9002

CMD ["node", "dist/src/index.js"]