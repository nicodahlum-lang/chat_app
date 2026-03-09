# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json yarn.lock ./

# Enable Corepack for Yarn 4
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

# Copy yarn config
COPY .yarnrc.yml ./
COPY .yarn ./.yarn

# Install dependencies
RUN yarn install --immutable

# Copy source code and Prisma schema
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

# Generate Prisma client
RUN npx prisma generate

# Build the NestJS app
RUN yarn build

# Production stage
FROM node:20-slim AS production

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Enable Corepack
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

# Copy package files and install production deps
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
RUN yarn workspaces focus --production || yarn install

# Copy built app and Prisma files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3000

# Run migrations and start
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/main"]
