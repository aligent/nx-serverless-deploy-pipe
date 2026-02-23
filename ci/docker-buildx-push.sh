#!/usr/bin/env bash
set -euo pipefail

: "${NODE_TAG:?NODE_TAG must be set}"
: "${DOCKER_ACCOUNT:?}"
: "${CLOUD_BUILDER_NAME:?}"

mkdir -vp ~/.docker/cli-plugins/
ARCH=amd64
BUILDX_URL=$(curl -s https://raw.githubusercontent.com/docker/actions-toolkit/main/.github/buildx-lab-releases.json \
  | jq -r ".latest.assets[] | select(endswith(\"linux-$ARCH\"))")
curl --silent -L --output ~/.docker/cli-plugins/docker-buildx "$BUILDX_URL"
chmod a+x ~/.docker/cli-plugins/docker-buildx

echo "$DOCKER_ACCESS_TOKEN" | docker login --username "$DOCKER_ACCOUNT" --password-stdin
# Unique per build, so it never collides
BUILDER_NAME="cloud-${DOCKER_ACCOUNT}-${CLOUD_BUILDER_NAME}-${BITBUCKET_BUILD_NUMBER:-local}"
docker buildx create --use --driver --name "$BUILDER_NAME" cloud "${DOCKER_ACCOUNT}/${CLOUD_BUILDER_NAME}"

IMAGE_NAME="${DOCKER_ACCOUNT}/${BITBUCKET_REPO_SLUG}"
echo "Pushing ${IMAGE_NAME}:${NODE_TAG}"

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --push \
  --build-arg NODE_TAG="${NODE_TAG}" \
  --tag "${IMAGE_NAME}:${NODE_TAG}" \
  .