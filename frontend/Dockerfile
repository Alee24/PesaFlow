# Build Stage
FROM node:20-slim AS builder

# Set the working directory
WORKDIR /app

# No heavy native compilation system dependencies are required for Next.js

# Accept build argument for API URL (baked into the Next.js bundle)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Production Stage
FROM node:20-slim

WORKDIR /app

# Copy the built application from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
# Copy configuration (wildcard to match .js or .ts)
COPY --from=builder /app/next.config.* ./

# Expose the frontend port
EXPOSE 3652

# Start the application
CMD ["npm", "start"]
