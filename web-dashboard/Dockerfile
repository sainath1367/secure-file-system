FROM node:18-bullseye-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and allow sharp to use prebuilt Linux binaries
RUN npm install

# Copy application code
COPY server.js .
COPY ai ./ai
COPY auth ./auth
COPY data ./data
COPY public ./public

# Create storage directories
RUN mkdir -p /app/storage/{keys,encrypted,encrypted-images,decrypted,decrypted-images,logs}

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["npm", "start"]
