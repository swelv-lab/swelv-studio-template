#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Long-form content renderer
# Turns a markdown post (src/<type>/<slug>.md) into an on-brand, SEO-complete,
# self-contained article: an HTML preview, a shareable PDF, and (unless the post
# supplies its own heroImage) a 1200x630 branded hero/OG card.
#
#   ./render.sh src/essays/<slug>.md
#
# Needs google-chrome-stable (or google-chrome / chromium), ImageMagick (magick),
# python3 with pyyaml + markdown. Run from inside content/.
# ---------------------------------------------------------------------------
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
cd "$here"
# shellcheck source=../lib/brand.sh
. "$here/../lib/brand.sh"
bg="$(brand_token bg '#ffffff')"
md="${1:?usage: ./render.sh src/<type>/<slug>.md}"
base="$(basename "$md" .md)"
dir="$(dirname "$md")"
outdir="${dir/#src/output}"
mkdir -p "$outdir"

absmd="$(realpath "$md")"
outhtml="$here/$outdir/$base.html"
outpng="$here/$outdir/$base.png"
ogsrc="$here/$outdir/.$base.og.html"
heropng="$here/$outdir/$base.hero.png"
raw="$(mktemp --suffix=.png)"
trap 'rm -f "$raw" "$ogsrc"' EXIT

chrome="$(command -v google-chrome-stable || command -v google-chrome || command -v chromium || true)"
[ -z "$chrome" ] && { echo "no chrome binary found" >&2; exit 1; }
command -v magick >/dev/null 2>&1 || { echo "ImageMagick (magick) required" >&2; exit 1; }

mode="$(python3 "$here/build.py" "$absmd" "$outhtml" "$ogsrc" "$here")"

common=(--headless=new --no-sandbox --disable-gpu --hide-scrollbars --force-color-profile=srgb)

if [ "$mode" = "HERO_MODE=studio" ]; then
  # Generate the branded hero/OG card first so the article can embed it.
  "$chrome" "${common[@]}" --force-device-scale-factor=2 --window-size=1200,630 \
    --virtual-time-budget=8000 --screenshot="$heropng" "file://$ogsrc" 2>/dev/null
elif [[ "$mode" == HERO_MODE=custom:* ]]; then
  # Post supplies its own hero (Option 2): copy it beside the output so the preview resolves it.
  hf="${mode#HERO_MODE=custom:}"
  cp -f "$here/$dir/$hf" "$here/$outdir/$hf" 2>/dev/null || true
fi

# Copy any inline body images (referenced by bare filename in the markdown)
# beside the output so the article and preview resolve them.
for asset in "$here/$dir"/*.png "$here/$dir"/*.jpg "$here/$dir"/*.webp; do
  [ -f "$asset" ] && cp -f "$asset" "$here/$outdir/" 2>/dev/null || true
done

# Preview PNG (render tall, trim to the reading column)
"$chrome" "${common[@]}" --force-device-scale-factor=2 --window-size=780,8000 \
  --virtual-time-budget=12000 --screenshot="$raw" "file://$outhtml" 2>/dev/null
magick "$raw" -fuzz 1% -trim +repage -bordercolor "$bg" -border 40 "$outpng"

# LinkedIn share card (1200x630 @2x) — built by build.py alongside the post.
lihtml="$here/$outdir/$base.linkedin.html"
lipng="$here/$outdir/$base.linkedin.png"
if [ -f "$lihtml" ]; then
  "$chrome" "${common[@]}" --force-device-scale-factor=2 --window-size=1200,630 \
    --virtual-time-budget=9000 --screenshot="$lipng" "file://$lihtml" 2>/dev/null
  rm -f "$lihtml"
  echo "wrote $outdir/$base.linkedin.png + .linkedin.txt"
fi

echo "wrote $outdir/$base.html + .png ($mode)"
