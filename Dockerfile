# Stage 1: Build the application
FROM node:22-alpine AS build

WORKDIR /workspace

COPY package.json package-lock.json nx.json tsconfig.json tsconfig.base.json ./
COPY apps ./apps
COPY libs ./libs
COPY packages ./packages

RUN npm ci --ignore-scripts
ARG APP_NAME
RUN test -n "$APP_NAME"
RUN npx nx build "@org/$APP_NAME" --configuration=production
RUN npm prune --omit=dev --ignore-scripts

# Stage 2: Build the runtime image
FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

ARG APP_NAME
ENV APP_NAME=$APP_NAME

COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/${APP_NAME}/dist ./dist

CMD ["sh", "-c", "node $(find dist -maxdepth 3 -name main.js -type f | head -n 1)"]
