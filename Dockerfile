FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}

# Install curl and download config file
RUN apt-get update && apt-get install -y curl \
    && curl -f ${CONFIG_URL} -o ./src/lib/config/config.ts || exit 1 \
    && apt-get remove -y curl && apt-get autoremove -y && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN npm run build

FROM node:20-slim AS runner

WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/build ./build
COPY --from=builder /app/src/lib/config/config.ts ./src/lib/config/
RUN npm ci --omit=dev

ENV NODE_ENV=production
ENV PORT=3000
ENV PROTOCOL_HEADER=x-forwarded-proto
ENV HOST_HEADER=x-forwarded-host

EXPOSE 3000
CMD ["node", "build"] 