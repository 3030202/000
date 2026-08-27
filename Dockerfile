# ==============================================================================
# 000-MISSION-CONTROL: MULTI-STAGE HIGH-PERFORMANCE PRODUCTION DOCKERFILE
# Stage 1: Build & bundle React 19 + TypeScript + Vite app
# Stage 2: Distribute via minimal hardened Nginx Alpine (< 25MB total image size)
# ==============================================================================

# --- STAGE 1: BUILD ENVIRONMENT ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (utilizing Docker layer caching)
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# Copy source code and configuration files
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src

# Compile TypeScript and build production bundle into /app/dist
RUN npm run build

# --- STAGE 2: RUNTIME ENVIRONMENT ---
FROM nginx:1.27-alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom hardened nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production static build from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Native healthcheck verifying HTTP 200 OK from local nginx
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ > /dev/null || exit 1

# Launch nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
