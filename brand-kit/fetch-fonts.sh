#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Download the brand's typefaces as local files.
#
# Still images (posts, decks, collateral, essays) render fine from the remote
# @import at the top of brand.css. VIDEO capture does not — headless Chrome
# screenshots frames faster than a webfont can arrive, so a video built on a
# remote font renders in the fallback stack and looks wrong.
#
# Run this once, then swap the @import in brand.css for the @font-face block
# it prints at the end.
#
#   ./fetch-fonts.sh
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p fonts

# Google Fonts serves woff2 to modern UAs; ask with a Chrome UA so we get them.
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

fetch_family() {
  local css_url="$1" prefix="$2"
  local css; css="$(curl -sfL -A "$UA" "$css_url")" || { echo "could not reach Google Fonts" >&2; exit 1; }
  local i=0
  while read -r url; do
    i=$((i + 1))
    curl -sfL -A "$UA" "$url" -o "fonts/${prefix}-${i}.woff2"
  done < <(printf '%s\n' "$css" | grep -oE 'https://[^)]+\.woff2' | sort -u)
  echo "  ${prefix}: ${i} file(s)"
}

echo "Fetching brand typefaces into fonts/ …"
# EDIT THESE TWO LINES to match the families in brand.css.
fetch_family "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700" "sans"
fetch_family "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600" "mono"

cat <<'EOT'

Done. Now replace the @import at the top of brand-kit/brand.css with:

  @font-face { font-family: "BrandSans"; src: url("./fonts/sans-1.woff2") format("woff2"); font-weight: 400; font-display: block; }
  @font-face { font-family: "BrandSans"; src: url("./fonts/sans-2.woff2") format("woff2"); font-weight: 500; font-display: block; }
  @font-face { font-family: "BrandSans"; src: url("./fonts/sans-3.woff2") format("woff2"); font-weight: 700; font-display: block; }
  @font-face { font-family: "BrandMono"; src: url("./fonts/mono-1.woff2") format("woff2"); font-weight: 400; font-display: block; }

…and point --sans / --mono at "BrandSans" / "BrandMono". Check which weight
landed in which numbered file before you commit to the mapping.

Licensing: only ship font files you are allowed to redistribute. Google Fonts
families under the SIL Open Font License are fine. A commercial licence you
bought usually is not — keep those out of a public repo.
EOT
