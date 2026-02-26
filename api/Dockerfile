FROM node:20-alpine
LABEL description="TaskBoard API - N-Tier with Redis"
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1
CMD ["node", "server.js"]
