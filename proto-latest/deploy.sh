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

echo "→ bump   version"
old_v=$(sed -nE 's/^const VERSION[[:space:]]*=[[:space:]]*"v([0-9]+)".*/\1/p' sw.js | head -1)
if [[ -z "$old_v" ]]; then
  echo "✗ couldn't parse v<N> from sw.js VERSION — auto-bump aborted" >&2
  exit 1
fi
new_v=$((old_v + 1))
sed -i.bak -E 's/^(const VERSION[[:space:]]*=[[:space:]]*")v[0-9]+(".*)$/\1v'"$new_v"'\2/' sw.js
sed -i.bak -E 's/^([[:space:]]*const APP_VERSION[[:space:]]*=[[:space:]]*")v[0-9]+(".*)$/\1v'"$new_v"'\2/' index.html
rm -f sw.js.bak index.html.bak
echo "  v${old_v} → v${new_v}"

echo "→ check  version lockstep"
sw_v=$(sed -nE 's/^const VERSION[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/p' sw.js | head -1)
app_v=$(sed -nE 's/^[[:space:]]*const APP_VERSION[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/p' index.html | head -1)
if [[ -z "$sw_v" || -z "$app_v" || "$sw_v" != "$app_v" ]]; then
  echo "✗ version drift: sw.js=${sw_v:-missing}, index.html=${app_v:-missing}. Bump both before deploying." >&2
  exit 1
fi
echo "  both at ${sw_v}"

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
