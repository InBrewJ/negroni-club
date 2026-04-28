#!/usr/bin/env bash
# Build the image (forced linux/amd64 for an x86_64 VPS), save to a gzipped tar,
# and scp it to the target server. After this completes, run ./run-remote.sh.
#
# Override anything via env vars, e.g.:
#   HOST=other.example.com REMOTE_USER=root TAG=v2 ./deploy.sh
set -euo pipefail

HOST="${HOST:-boom.dryark.uk}"
REMOTE_USER="${REMOTE_USER:-jib}"
SSH_TARGET="${REMOTE_USER}@${HOST}"
SSH_OPTS="${SSH_OPTS:--o ServerAliveInterval=30}"

IMAGE="${IMAGE:-proto-negroni-club}"
TAG="${TAG:-latest}"
PLATFORM="${PLATFORM:-linux/amd64}"

REMOTE_DIR="${REMOTE_DIR:-/tmp}"
TARFILE="${IMAGE}_${TAG}.tar.gz"

cd "$(dirname "$0")"

echo "→ build  ${IMAGE}:${TAG} (${PLATFORM})"
docker buildx build --platform="${PLATFORM}" -t "${IMAGE}:${TAG}" --load .

echo "→ save   ${TARFILE}"
docker save "${IMAGE}:${TAG}" | gzip -1 > "${TARFILE}"
ls -lh "${TARFILE}"

echo "→ scp    ${SSH_TARGET}:${REMOTE_DIR}/${TARFILE}"
scp ${SSH_OPTS} "${TARFILE}" "${SSH_TARGET}:${REMOTE_DIR}/${TARFILE}"

echo
echo "✓ uploaded. Now run:  ./run-remote.sh"
echo "  (env passthrough: HOST=${HOST}  REMOTE_USER=${REMOTE_USER}  TAG=${TAG}  PORT=...  ORIGIN=...  RP_ID=...)"
