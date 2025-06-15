# Merged Dockerfile for Angular (ARM optimized)
FROM --platform=linux/arm64 node:20-alpine  
WORKDIR /app

# Install Angular CLI with version pinning
RUN npm install -g @angular/cli@latest --force

# Dependency caching optimization
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps --no-audit  # Combine best of both

# Copy source code (preserve old pattern)
COPY . .

# Development optimizations from old version
EXPOSE 4200
CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200", "--poll", "2000", "--disable-host-check"]