# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY ui/package*.json /app
RUN npm ci

COPY ui /app

RUN npx webpack

# Final stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json /app
RUN npm ci

COPY . /app
RUN rm -rf /app/ui

COPY --from=build /app/public /app/ui/public

ENV DATA_STORE=FILE

CMD ["node", "."]
