#!/usr/bin/env bash
# SSH into the remote server, docker load the previously-uploaded image,
# and (re)start the container bound to 127.0.0.1 on the chosen host port.
# Nginx in front of it terminates TLS for nc.dryark.uk.
#
# Override anything via env vars, e.g.:
#   PORT=4711 ORIGIN=https://nc.example.com RP_ID=nc.example.com ./run-remote.sh
set -euo pipefail

HOST="${HOST:-boom.dryark.uk}"
REMOTE_USER="${REMOTE_USER:-jib}"
SSH_TARGET="${REMOTE_USER}@${HOST}"
SSH_OPTS="${SSH_OPTS:--o ServerAliveInterval=30}"

IMAGE="${IMAGE:-proto-negroni-club}"
TAG="${TAG:-latest}"
TARFILE="${IMAGE}_${TAG}.tar.gz"
REMOTE_DIR="${REMOTE_DIR:-/tmp}"

CONTAINER="${CONTAINER:-proto-negroni-club}"
DATA_VOLUME="${DATA_VOLUME:-proto-negroni-club-data}"
PORT="${PORT:-3300}"                       # host port (bound to 127.0.0.1; nginx proxies to it)
ORIGIN="${ORIGIN:-https://nc.dryark.uk}"
RP_ID="${RP_ID:-nc.dryark.uk}"

echo "→ remote: ${SSH_TARGET}"
echo "  image:  ${IMAGE}:${TAG}"
echo "  bind:   127.0.0.1:${PORT} → container :3000"
echo "  origin: ${ORIGIN}   rpid: ${RP_ID}"

ssh ${SSH_OPTS} "${SSH_TARGET}" \
  IMAGE="${IMAGE}" TAG="${TAG}" TARFILE="${TARFILE}" \
  REMOTE_DIR="${REMOTE_DIR}" CONTAINER="${CONTAINER}" \
  DATA_VOLUME="${DATA_VOLUME}" PORT="${PORT}" \
  ORIGIN="${ORIGIN}" RP_ID="${RP_ID}" \
  bash -s <<'REMOTE'
set -euo pipefail

cd "${REMOTE_DIR}"

if [[ ! -f "${TARFILE}" ]]; then
  echo "✗ ${REMOTE_DIR}/${TARFILE} not found. Did you run ./deploy.sh first?" >&2
  exit 1
fi

echo "→ docker load"
gunzip -c "${TARFILE}" | docker load

echo "→ ensure data volume: ${DATA_VOLUME}"
docker volume create "${DATA_VOLUME}" >/dev/null

echo "→ stop existing container if any"
docker rm -f "${CONTAINER}" >/dev/null 2>&1 || true

echo "→ docker run"
docker run -d \
  --name "${CONTAINER}" \
  --restart unless-stopped \
  -p "127.0.0.1:${PORT}:3000" \
  -v "${DATA_VOLUME}:/app/data" \
  -e ORIGIN="${ORIGIN}" \
  -e RP_ID="${RP_ID}" \
  "${IMAGE}:${TAG}" >/dev/null

sleep 1
docker ps --filter "name=${CONTAINER}" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
echo
echo "→ recent logs:"
docker logs --tail 20 "${CONTAINER}"
REMOTE

echo
echo "✓ container is up. Reach it locally on the VPS via:  curl -I http://127.0.0.1:${PORT}"
echo "  Through nginx once configured: ${ORIGIN}"
