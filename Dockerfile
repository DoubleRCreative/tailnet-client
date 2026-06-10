# Stage 1: Build Vue frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Final image
FROM tailscale/tailscale:latest

RUN apk add --no-cache nodejs npm supervisor

WORKDIR /app

# Backend dependencies
COPY app/package*.json ./
RUN npm install --omit=dev

# Backend application
COPY app/ ./

# Built frontend (overwrites app/public/)
COPY --from=frontend-builder /build/dist /app/public

# Process manager and entrypoint
COPY scripts/supervisord.conf /etc/supervisord.conf
COPY scripts/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3000

ENTRYPOINT ["/start.sh"]
