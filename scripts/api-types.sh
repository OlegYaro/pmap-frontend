#!/usr/bin/env bash
# Regenerates src/api/schema.d.ts from $VITE_API_TARGET/openapi.json (npm run api:types).
# VITE_API_TARGET comes from the shell or, when not set there, from .env.local.
# openapi-typescript needs the TypeScript 5 compiler API; the project uses TypeScript 7, so the
# generator runs through npx with both versions pinned.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${VITE_API_TARGET:-}" && -f .env.local ]]; then
	VITE_API_TARGET=$(sed -n 's/^VITE_API_TARGET=//p' .env.local | tail -1 | tr -d "\"'\r")
fi
: "${VITE_API_TARGET:?set VITE_API_TARGET to the backend base URL (in the shell or .env.local)}"

npx --yes -p typescript@5.9.3 -p openapi-typescript@7.13.0 \
	openapi-typescript "${VITE_API_TARGET%/}/openapi.json" -o src/api/schema.d.ts
