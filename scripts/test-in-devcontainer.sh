#!/usr/bin/env bash
#
# Validate the configs the CAP generator emits by running the generated project's
# FIRST COMMIT inside the very devcontainer the generator produces.
#
#   scaffold a sample project  ->  devcontainer up  ->  git commit (in container)
#
# The commit fires simple-git-hooks' pre-commit (`npx lint-staged && npm test`),
# so prettier, eslint and the ts-jest/cds.test suite all run against the real
# image + features (debian base, node, cap-dev-stack, typescript, ...). A clean
# commit (exit 0) means the generated configs actually work in the container —
# not just in this repo's environment.
#
# Requires Docker. Inside this repo's dev container, add the docker-in-docker
# feature and rebuild; in CI run on a Docker-enabled host (Azure ubuntu-latest).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Resolve the devcontainer CLI: prefer a system binary, fall back to node_modules.
if command -v devcontainer >/dev/null 2>&1; then
  DEVCONTAINER=(devcontainer)
elif [ -x "${REPO_ROOT}/node_modules/.bin/devcontainer" ]; then
  DEVCONTAINER=("${REPO_ROOT}/node_modules/.bin/devcontainer")
else
  echo "❌ devcontainer CLI not found. Run 'npm install' first." >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "❌ docker is not available." >&2
  echo "   Inside this repo's dev container, add the docker-in-docker feature to" >&2
  echo "   .devcontainer/devcontainer.json and rebuild; in CI run on a Docker-" >&2
  echo "   enabled host." >&2
  exit 1
fi

# Use a fixed workspace path so the devcontainer CLI always generates the same
# image name hash. This is required for Docker image caching to work across
# pipeline runs — a random mktemp path would produce a different hash each time,
# causing the CLI to rebuild the image even when a cached image is loaded.
WORKSPACE="/tmp/devcontainer-smoke-test"
rm -rf "${WORKSPACE}"
mkdir -p "${WORKSPACE}"
# Matches the generated devcontainer's runArgs --name (customerNameNormalized.projectNameNormalized).
CONTAINER_NAME="cbs.devcontainer-smoke-test"

cleanup() {
  docker rm -f "$(docker ps -aqf "label=devcontainer.local_folder=${WORKSPACE}")" >/dev/null 2>&1 || true
  docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
  rm -rf "${WORKSPACE}"
}
trap cleanup EXIT

echo "🧩 Scaffolding a sample CAP project into ${WORKSPACE} ..."
node "${SCRIPT_DIR}/generate-sample.mjs" "${WORKSPACE}"

echo "🐳 Building & starting the generated devcontainer ..."
"${DEVCONTAINER[@]}" up --workspace-folder "${WORKSPACE}"

echo "🔒 Running the first-commit gate inside the container ..."
"${DEVCONTAINER[@]}" exec --workspace-folder "${WORKSPACE}" bash -lc '
  set -euo pipefail
  echo "→ npm install"
  npm install
  echo "→ cds-typer (generate CDS model types like the IDE/cds watch would)"
  npx cds-typer "*"
  echo "→ activate git hooks"
  npx simple-git-hooks
  git config user.email "ci@cbs.local"
  git config user.name "CI"
  git add -A
  echo "→ git commit (fires pre-commit: npx lint-staged && npm test)"
  git commit -m "chore: scaffold generated CAP project"
'

echo "🎉 The generated project committed cleanly inside its devcontainer — configs are valid."
