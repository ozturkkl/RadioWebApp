FROM node:20-slim

WORKDIR /app

# Only install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

ENV NODE_ENV=production
ENV PORT=3000
ENV PROTOCOL_HEADER=x-forwarded-proto
ENV HOST_HEADER=x-forwarded-host

# Install nodemon for watching files
RUN npm install -g nodemon

EXPOSE 3000

# Use nodemon to watch the build directory and restart on changes
CMD ["nodemon", "--watch", "build", "--exec", "node build"] 