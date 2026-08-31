#!/usr/bin/env python3
# ---------------------------------------------------------------------------
# Content builder — markdown + frontmatter -> one self-contained,
# on-brand, SEO-complete article HTML (+ a hero/OG card source in studio mode).
# Called by render.sh; Chrome then turns the HTML into a preview PNG + PDF.
#
#   build.py <src.md> <out.html> <og_src.html> <content_dir>
# Prints  HERO_MODE=studio | HERO_MODE=custom  on stdout.
# ---------------------------------------------------------------------------
import sys, os, re, html, json, datetime
import yaml, markdown

src, out_html, og_src, here = sys.argv[1:5]

# The brand's strings live in the brand kit, never in this file. /setup-brand
# rewrites brand.json; everything below just reads it.
KIT = os.path.join(here, "..", "brand-kit")
brand = json.load(open(os.path.join(KIT, "brand.json"), encoding="utf-8"))
BRAND_NAME = brand.get("name", "")
BRAND_URL = brand.get("url", "").rstrip("/")
BLOG_BASE = BRAND_URL + brand.get("blogPath", "/blog")

raw = open(src, encoding="utf-8").read()
m = re.match(r"^---\n(.*?)\n---\n?(.*)$", raw, re.S)
fm = yaml.safe_load(m.group(1)) if m else {}
body_md = (m.group(2) if m else raw).strip()
fm = fm or {}


def esc(s):
    return html.escape(str(s), quote=True)


title = fm.get("title", "Untitled")
slug = fm.get("slug") or os.path.splitext(os.path.basename(src))[0]
eyebrow = fm.get("eyebrow", "")
deck = fm.get("deck", "")
desc = fm.get("description") or deck
author = fm.get("author", "")
role = fm.get("role", "")
tags = fm.get("tags", []) or []
faq = fm.get("faq", []) or []
canonical = fm.get("canonical") or f"{BLOG_BASE}/{slug}"
hero_custom = fm.get("heroImage")
cta_text = fm.get("ctaText", brand.get("ctaText", ""))
cta_href = fm.get("ctaHref", brand.get("ctaHref", BRAND_URL))

d = fm.get("date", "")
if isinstance(d, (datetime.date, datetime.datetime)):
    date_disp, date_iso = d.strftime("%-d %b %Y"), d.strftime("%Y-%m-%d")
else:
    date_disp = date_iso = str(d)

# markdown -> html (+ auto heading ids + toc tree)
md = markdown.Markdown(
    extensions=["extra", "sane_lists", "smarty", "toc"],
    extension_configs={"toc": {"toc_depth": "2-3"}},
)
body_html = md.convert(body_md)
readtime = max(1, round(len(re.findall(r"\w+", body_md)) / 200))

# TOC from top-level (H2) tokens
toc_html = ""
h2s = md.toc_tokens
if h2s:
    items = "".join(
        f'<li><a href="#{t["id"]}"><span class="n">{i:02d}</span>'
        f'<span>{esc(html.unescape(t["name"]))}</span></a></li>'
        for i, t in enumerate(h2s, 1)
    )
    toc_html = f'<nav class="toc" aria-label="Contents"><ol>{items}</ol></nav>'

# byline
spans = []
if author:
    spans.append(f'<span class="who">{esc(author)}</span>')
if role:
    spans.append(f"<span>{esc(role)}</span>")
if date_disp:
    spans.append(f"<span>{esc(date_disp)}</span>")
spans.append(f"<span>{readtime} min read</span>")
byline = '<span class="dot">·</span>'.join(spans)

# hero
if hero_custom:
    hero_html = f'<figure class="hero"><img src="{esc(hero_custom)}" alt="{esc(title)}"></figure>'
    og_image = hero_custom
else:
    hero_png = f"{slug}.hero.png"
    hero_html = f'<figure class="hero"><img src="{hero_png}" alt="{esc(title)}"></figure>'
    og_image = canonical.rsplit("/", 1)[0] + f"/{hero_png}"

# faq (+ schema)
faq_html, faq_schema = "", []
if faq:
    dl = ""
    for it in faq:
        q, a = it.get("q", ""), it.get("a", "")
        dl += f"<dt>{esc(q)}</dt><dd>{esc(a)}</dd>"
        faq_schema.append(
            {"@type": "Question", "name": q,
             "acceptedAnswer": {"@type": "Answer", "text": a}}
        )
    faq_html = f'<section class="faq"><h2>Frequently asked questions</h2><dl>{dl}</dl></section>'

# CTA + footer are supplied by the landing's blog page chrome, not here.
cta_html = ""

# JSON-LD (Article + FAQPage — schema the live site is missing today)
graph = [{
    "@type": "BlogPosting", "headline": title, "description": desc,
    "datePublished": date_iso, "dateModified": date_iso,
    "author": {"@type": "Person", "name": author, "jobTitle": role},
    "publisher": {"@type": "Organization", "name": BRAND_NAME, "url": BRAND_URL},
    "mainEntityOfPage": canonical, "image": og_image,
    "keywords": ", ".join(tags),
}]
if faq_schema:
    graph.append({"@type": "FAQPage", "mainEntity": faq_schema})
jsonld = json.dumps({"@context": "https://schema.org", "@graph": graph}, indent=2)

# inline the brand kit + content styles -> fully self-contained output
brand_css = open(os.path.join(KIT, "brand.css"), encoding="utf-8").read()
content_css = open(os.path.join(here, "src", "content.css"), encoding="utf-8").read()
styles = brand_css + "\n" + content_css

shell = open(os.path.join(here, "src", "_shell.html"), encoding="utf-8").read()
repl = {
    "META_TITLE": esc(f"{title} · {BRAND_NAME}"), "META_DESC": esc(desc),
    "CANONICAL": esc(canonical), "OG_TITLE": esc(title), "OG_IMAGE": esc(og_image),
    "JSONLD": jsonld, "STYLES": styles, "EYEBROW": esc(eyebrow), "TITLE": esc(title),
    "BYLINE": byline, "HERO": hero_html,
    "TOC": toc_html, "BODY": body_html,
    "FAQ": faq_html, "CTA": cta_html,
}
for k, v in repl.items():
    shell = shell.replace("%%" + k + "%%", v)
open(out_html, "w", encoding="utf-8").write(shell)

# ── LinkedIn share card (the image the author uploads in place of the auto link
#    preview) + a caption scaffold. Both land beside the post in output/. ──────
outbase = os.path.splitext(os.path.basename(out_html))[0]
outdir = os.path.dirname(out_html)
li_hero = os.path.basename(str(hero_custom)) if hero_custom else f"{slug}.hero.png"
li = open(os.path.join(here, "src", "_linkedin.html"), encoding="utf-8").read()
for k, v in {
    "STYLES": brand_css,
    "MODE": "photo" if hero_custom else "plain",
    "HERO_SRC": esc(li_hero),
    "SECTION": esc(brand.get("sectionLabel", "Insights")),
    "EYEBROW": esc(f"{brand.get('sectionLabel', 'Insights')} · {eyebrow}" if eyebrow else brand.get("sectionLabel", "Insights")),
    "TITLE": esc(title),
    "DESC": esc(deck or desc),
    "WORDMARK": esc(brand.get("wordmark", BRAND_NAME)),
    "BLOGLABEL": esc(brand.get("blogLabel", "")),
}.items():
    li = li.replace("%%" + k + "%%", v)
open(os.path.join(outdir, f"{outbase}.linkedin.html"), "w", encoding="utf-8").write(li)

# Caption scaffold — written once, then never clobbered so a tailored caption survives.
li_txt = os.path.join(outdir, f"{outbase}.linkedin.txt")
if not os.path.exists(li_txt):
    tags_h = ["#" + "".join(w[:1].upper() + w[1:] for w in str(t).split()) for t in tags]
    hashtags = " ".join(dict.fromkeys(tags_h + [brand.get("defaultHashtag", "")])).strip()
    caption = f"{deck or desc}\n\nRead the full piece: {canonical}\n\n{hashtags}\n"
    open(li_txt, "w", encoding="utf-8").write(caption)

if not hero_custom:
    ogt = open(os.path.join(here, "src", "_og.html"), encoding="utf-8").read()
    for k, v in {
        "STYLES": brand_css,
        "EYEBROW": esc(eyebrow or brand.get("sectionLabel", "")),
        "TITLE": esc(title),
        "WORDMARK": esc(brand.get("wordmark", BRAND_NAME)),
        "TAGLINE": esc(brand.get("tagline", "")),
    }.items():
        ogt = ogt.replace("%%" + k + "%%", v)
    open(og_src, "w", encoding="utf-8").write(ogt)
    print("HERO_MODE=studio")
else:
    print("HERO_MODE=custom:" + os.path.basename(str(hero_custom)))
