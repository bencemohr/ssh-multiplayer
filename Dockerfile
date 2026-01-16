# Next.js Frontend Dockerfile
FROM node:22-alpine

WORKDIR /app

# Install dependencies for node-gyp (needed for some packages)
RUN apk add --no-cache libc6-compat

# Copy package files first for better caching
COPY app/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY app/ .

# Expose the Next.js dev server port
EXPOSE 3000

# Start the development server
CMD ["npm", "run", "dev"]
