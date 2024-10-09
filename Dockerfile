ARG NODE_TAG=latest
FROM node:${NODE_TAG}-alpine

RUN mkdir /pipe
WORKDIR /pipe

# The `--force` flag force replace `yarn` if it exist in base image
# This ensure we have the latest version of package managers
RUN npm install -g --force npm pnpm yarn

COPY node_modules ./node_modules
COPY dist/ ./
COPY entrypoint.sh package.json ./

RUN chmod a+x ./**/*.js entrypoint.sh

ENTRYPOINT ["/pipe/entrypoint.sh"]
