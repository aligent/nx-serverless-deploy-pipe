#!/usr/bin/env bash
set -euo pipefail

: "${NODE_TAG:?NODE_TAG must be set}"
: "${DOCKER_ACCOUNT:?DOCKER_ACCOUNT must be set}"
: "${CLOUD_BUILDER_NAME:?CLOUD_BUILDER_NAME must be set}"
: "${DOCKER_ACCESS_TOKEN:?DOCKER_ACCESS_TOKEN must be set}"

mkdir -vp ~/.docker/cli-plugins/
ARCH=amd64
BUILDX_URL=$(curl -s https://raw.githubusercontent.com/docker/actions-toolkit/main/.github/buildx-lab-releases.json \
  | jq -r ".latest.assets[] | select(endswith(\"linux-$ARCH\"))")
curl --silent -L --output ~/.docker/cli-plugins/docker-buildx "$BUILDX_URL"
chmod a+x ~/.docker/cli-plugins/docker-buildx

echo "$DOCKER_ACCESS_TOKEN" | docker login --username "$DOCKER_ACCOUNT" --password-stdin
docker buildx create --use --driver cloud "${DOCKER_ACCOUNT}/${CLOUD_BUILDER_NAME}"

docker buildx build \
  --platform linux/amd64 \
  --build-arg NODE_TAG="${NODE_TAG}" \
  --output=type=cacheonly \
  .