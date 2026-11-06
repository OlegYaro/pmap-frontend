#!/usr/bin/env bash
# AWS commands of the frontend. Called by CI and by hand: see infra/RUNBOOK.md.
set -euo pipefail

P=pmap-${PMAP_ENV:-dev}
STACK=$P-frontend
export AWS_REGION=${AWS_REGION:-eu-north-1}

die() { echo "$*" >&2; exit 1; }
output() {
	aws cloudformation describe-stacks --stack-name "$1" \
		--query "Stacks[0].Outputs[?OutputKey=='$2'].OutputValue" --output text
}

deploy() {
	local api bucket dist
	api=$(output "$P-gateway" ApiUrl 2>/dev/null) || die "stack $P-gateway not found: deploy the gateway of the backend first"
	aws cloudformation deploy --stack-name "$STACK" --template-file infra/frontend.yaml \
		--no-fail-on-empty-changeset --parameter-overrides ApiDomain="${api#https://}"
	bucket=$(output "$STACK" BucketName)
	dist=$(output "$STACK" DistributionId)
	npm run build
	# Files in assets/ have a hash in the name and never change. The rest (index.html and
	# files from public/) must be asked for again each time. Assets go first, so index.html
	# never points to a file that is not uploaded yet.
	aws s3 sync dist/assets "s3://$bucket/assets" --cache-control "public,max-age=31536000,immutable"
	aws s3 sync dist "s3://$bucket" --delete --exclude "assets/*" --cache-control "no-cache"
	aws cloudfront create-invalidation --distribution-id "$dist" --paths "/*" >/dev/null
	echo "$(output "$STACK" SiteUrl)"
}

check() {
	local url
	url=$(output "$STACK" SiteUrl)
	echo "site: $url"
	for path in / /transactions /api/health; do
		echo "$path -> $(curl -s -o /dev/null -w '%{http_code}' "$url$path")"
	done
}

case "${1:-}" in
deploy | check) "$1" ;;
*) die "usage: $0 deploy|check" ;;
esac
