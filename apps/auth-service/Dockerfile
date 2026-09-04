FROM node:22-slim AS builder

WORKDIR /app

COPY apps/auth-service/package*.json ./apps/auth-service/

WORKDIR /app/apps/auth-service

RUN npm ci

WORKDIR /app

COPY apps/auth-service ./apps/auth-service
COPY packages ./packages

WORKDIR /app/apps/auth-service

RUN npm run build


FROM node:22-slim AS runtime

WORKDIR /app

COPY apps/auth-service/package*.json ./apps/auth-service/

WORKDIR /app/apps/auth-service

RUN npm ci --omit=dev

COPY --from=builder /app/apps/auth-service/dist ./dist
COPY --from=builder /app/packages /app/packages

USER node

EXPOSE 9001

CMD ["node", "dist/src/index.js"]