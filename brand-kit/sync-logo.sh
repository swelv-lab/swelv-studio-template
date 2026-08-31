#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Embed logo/mark.svg into brand.css as a data URI.
#
# The mark is painted as a CSS mask so it takes the ink colour of wherever it
# sits. It has to be EMBEDDED rather than linked, because Chrome refuses to load
# an external SVG as a mask from a file:// page — the mark silently renders as
# nothing, which is exactly the kind of bug you notice after publishing.
#
# So: edit logo/mark.svg (the readable source of truth), then run this.
#
#   ./sync-logo.sh
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")"

[ -f logo/mark.svg ] || { echo "logo/mark.svg not found" >&2; exit 1; }

# Minify lightly and percent-encode the characters that break a CSS url().
data=$(python3 - <<'PY'
import re, urllib.parse
svg = open("logo/mark.svg").read()
svg = re.sub(r"<!--.*?-->", "", svg, flags=re.S)      # drop comments
svg = re.sub(r"\s+", " ", svg).strip()                 # collapse whitespace
print(urllib.parse.quote(svg, safe="/:=?[]@!$&*+,;()-._~ "))
PY
)

python3 - "$data" <<'PY'
import re, sys
data = sys.argv[1]
css = open("brand.css").read()
block = '  --mark: url("data:image/svg+xml,%s");' % data
new, n = re.subn(r'^  --mark: url\("data:image/svg\+xml,.*?"\);$', block.replace('\\', '\\\\'), css, flags=re.M)
if n == 0:
    raise SystemExit("no --mark line found in brand.css :root — add one first")
open("brand.css", "w").write(new)
print("embedded %d bytes into brand.css" % len(data))
PY
