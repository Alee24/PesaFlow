# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema (needed for postinstall generation)
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript project
RUN npm run build

# Make startup script executable
RUN chmod +x startup.sh

# Expose the API port
EXPOSE 2365

# Start the application via startup script
CMD ["./startup.sh"]
