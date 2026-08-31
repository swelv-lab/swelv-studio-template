#!/usr/bin/env bash
# Read a colour token out of the brand kit, so the render scripts never carry a
# hardcoded hex. Trimming and padding an image needs to know the ground colour,
# and that answer must come from brand-kit/brand.css like everything else.
#
#   bg="$(brand_token bg '#ffffff')"
brand_token() {
  local name="$1" fallback="${2:-#ffffff}" css
  css="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/brand-kit/brand.css"
  [ -f "$css" ] || { printf '%s' "$fallback"; return; }
  local v
  v="$(grep -m1 -oE -- "--${name}:[[:space:]]*[^;]+" "$css" | sed -E "s/--${name}:[[:space:]]*//" | tr -d ' ')"
  printf '%s' "${v:-$fallback}"
}
