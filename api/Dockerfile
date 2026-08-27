# ==============================================================================
# 000-API: MONITORING MICROSERVICE DOCKERFILE
# Pure Node.js 20 Alpine — zero npm dependencies, ~50MB total image
# Needs access to /proc, /sys and docker socket for live metrics
# ==============================================================================

FROM node:20-alpine AS runner

# Install docker CLI (for docker ps) — Alpine package
RUN apk add --no-cache docker-cli

WORKDIR /app

COPY package.json ./
COPY server.js ./

# Use non-root user for security (but keep docker group access)
# Note: docker socket access requires GID 999 (docker) or privileged
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

EXPOSE 4000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:4000/health || exit 1

# Run as root to allow /proc and docker socket access
# Production note: restrict this further with docker socket proxy if needed
CMD ["node", "server.js"]
