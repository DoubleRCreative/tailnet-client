FROM tailscale/tailscale:latest

# Install Node.js and supervisord
RUN apk add --no-cache nodejs npm supervisor

WORKDIR /app

# Copy package files and install deps
COPY app/package*.json ./
RUN npm install --omit=dev

# Copy the web app
COPY app/ ./

# Copy supervisor config
COPY scripts/supervisord.conf /etc/supervisord.conf

# Copy entrypoint
COPY scripts/start.sh /start.sh
RUN chmod +x /start.sh

# Web UI port (local only — map with -p 127.0.0.1:3000:3000)
EXPOSE 3000

ENTRYPOINT ["/start.sh"]
