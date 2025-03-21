ARG NODE_TAG
FROM node:${NODE_TAG}-alpine AS builder

# `WORKDIR` will create the folder if it doesn't exist
WORKDIR /build-stage
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run build

# This remove dev dependencies from `node_modules` folder
RUN npm prune --production

FROM node:${NODE_TAG}-alpine

WORKDIR /pipe

RUN corepack enable

COPY --from=builder /build-stage/node_modules ./node_modules
COPY --from=builder /build-stage/dist/ ./
COPY --from=builder /build-stage/entrypoint.sh ./

RUN chmod a+x entrypoint.sh

ENTRYPOINT ["/pipe/entrypoint.sh"]
