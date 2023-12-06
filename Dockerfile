ARG NODE_TAG
FROM node:${NODE_TAG}

RUN corepack enable
RUN apk add wget 
RUN wget -P / https://bitbucket.org/bitbucketpipelines/bitbucket-pipes-toolkit-bash/raw/0.4.0/common.sh

RUN mkdir /pipe
WORKDIR /pipe

COPY tsconfig.json ./
COPY pack*.json ./
RUN npm ci
COPY entrypoint.sh ./
COPY pipe ./pipe
RUN chmod a+x ./pipe/*.ts entrypoint.sh

ENTRYPOINT ["/pipe/entrypoint.sh"]
