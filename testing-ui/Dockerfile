FROM node:18-alpine

WORKDIR /app

# Simple HTTP server to serve static files
RUN npm install -g http-server

COPY index.html .

EXPOSE 3001

CMD ["http-server", "-p", "3001", "-c-1"]
