FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
# This line is optional now, but harmless to keep
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm ci --omit=dev

COPY migrations ./migrations
COPY scripts ./scripts
COPY src ./src
COPY --from=build /app/dist ./dist

RUN ln -s /mnt/secrets/ca.pem /ca.pem

EXPOSE 5000

CMD ["npm", "start"]