FROM node:22-slim AS builder

WORKDIR /app

# Backend package files
COPY apps/backend/package*.json ./apps/backend/

WORKDIR /app/apps/backend

RUN npm ci

WORKDIR /app

# Backend source
COPY apps/backend ./apps/backend

# Shared packages
COPY packages ./packages

WORKDIR /app/apps/backend

RUN npm run build


FROM node:22-slim AS runtime

WORKDIR /app

# Backend package files
COPY apps/backend/package*.json ./apps/backend/

WORKDIR /app/apps/backend

RUN npm ci --omit=dev

# Compiled backend
COPY --from=builder /app/apps/backend/dist ./dist

# Shared proto files
COPY --from=builder /app/packages /app/packages

USER node

EXPOSE 9000

CMD ["node", "dist/src/index.js"]