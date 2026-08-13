#!/usr/bin/env bash

set -Eeuo pipefail

WEB_URL="${WEB_URL:-https://staging.kurvenfunk.at}"
API_URL="${API_URL:-https://api-staging.kurvenfunk.at}"
AUTH_URL="${AUTH_URL:-https://auth-staging.kurvenfunk.at}"

echo "=== STAGING E2E ==="

check_url() {
  local name="$1"
  local url="$2"

  echo
  echo "--- $name ---"
  echo "$url"

  curl \
    --fail \
    --silent \
    --show-error \
    --retry 6 \
    --retry-delay 5 \
    --retry-all-errors \
    "$url" \
    >/dev/null

  echo "$name: OK"
}

check_url \
  "Web health" \
  "$WEB_URL/health"

check_url \
  "API health" \
  "$API_URL/api/v1/health"

check_url \
  "API liveness" \
  "$API_URL/api/v1/health/live"

check_url \
  "API readiness" \
  "$API_URL/api/v1/health/ready"

check_url \
  "Keycloak realm" \
  "$AUTH_URL/realms/kurvenfunk"

echo
echo "=== STAGING E2E passed ==="
