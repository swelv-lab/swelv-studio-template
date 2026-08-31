#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Combine one rendered deck's slide PNGs into a single shareable PDF.
# Slides are ordered by filename, so keep the NN- number prefix on each slide.
#
#   ./to-pdf.sh <deck>        # e.g. ./to-pdf.sh seed-round
#
# Reads output/<deck>/*.png (render the slides first with ./render.sh) and
# writes output/<deck>.pdf. Requires ImageMagick (magick).
# ---------------------------------------------------------------------------
set -euo pipefail

deck="${1:?usage: ./to-pdf.sh <deck>}"
deck="${deck%/}"                       # tolerate a trailing slash
srcdir="output/${deck#output/}"        # tolerate output/<deck> or <deck>

[ -d "$srcdir" ] || { echo "no rendered slides at ${srcdir}/ — render them first" >&2; exit 1; }

magick="$(command -v magick || command -v convert || true)"
[ -z "$magick" ] && { echo "ImageMagick (magick) not found on PATH" >&2; exit 1; }

# Sorted glob so NN-prefixed slides land in order.
shopt -s nullglob
pngs=( "$srcdir"/*.png )
shopt -u nullglob
[ "${#pngs[@]}" -eq 0 ] && { echo "no PNGs in ${srcdir}/" >&2; exit 1; }

out="output/${deck}.pdf"
IFS=$'\n' sorted=($(printf '%s\n' "${pngs[@]}" | sort)); unset IFS

"$magick" "${sorted[@]}" "$out"
echo "wrote ${out} (${#sorted[@]} slides)"
