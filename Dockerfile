FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Only CONFIG_URL needs to be a build arg since it's used during build
ARG CONFIG_URL
ENV CONFIG_URL=${CONFIG_URL}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}

RUN wget -O ./src/lib/config/config.ts ${CONFIG_URL}

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