FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=5000
ENV SQLITE_DB_PATH=/data/quotations.db
ENV CORS_ORIGIN=*

RUN mkdir -p /data

EXPOSE 5000

CMD ["node", "server.js"]
