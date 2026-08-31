# Long-form content

Essays and blog articles: markdown in, a branded, SEO-complete article page out —
plus a preview PNG, a hero/OG card, and a social share card with a caption.

```
content/
├── src/
│   ├── essays/<slug>/<slug>.md   the source you actually write
│   ├── content.css               editorial furniture, on top of the brand kit
│   ├── _shell.html               the article page template
│   ├── _og.html                  the generated hero / OG card
│   └── _linkedin.html            the social share card
├── output/essays/<slug>/         generated — with one deliberate exception
├── build.py                      markdown + frontmatter → self-contained HTML
└── render.sh                     the whole pipeline
```

Needs Chrome, ImageMagick (`magick`), and python3 with `pyyaml` and `markdown`.

## Write one

```bash
cd content
mkdir -p src/essays/my-post
cp src/essays/_template/starter-essay.md src/essays/my-post/my-post.md
# edit, then:
./render.sh src/essays/my-post/my-post.md
```

Out come `my-post.html` (self-contained, styles inlined), `my-post.png` (a
preview of the whole page), `my-post.hero.png` (1200×630 hero/OG card) and
`my-post.linkedin.png` + `.linkedin.txt` (the share kit).

## Frontmatter

Every field is SEO surface, so fill them all: `title` · `slug` (**must** match the
folder and filename) · `kind` · `eyebrow` · `deck` · `description` · `author` ·
`role` · `date` · `tags[]` · `faq[]` · optional `heroImage`.

The `faq` entries become FAQPage structured data, and each answer must stand on
its own — those are what search engines and language models quote back.

## The shape

Numbered `## H2` sections, short paragraphs, one or two pull quotes, no `###`
nesting, no images. 700–1200 words. End on the argument, not a pitch.

Rhythm comes from structure, not illustration. A genuine data visual belongs
inline as on-brand SVG — raw HTML passes straight through the markdown.

## Two things that will catch you

- **`output/` is regenerated on every render — except `.linkedin.txt`.** That
  file is written once and never clobbered, so a caption you tailored survives.
  Edit it in place.
- **Markdown turns `--` into an em dash.** If your brand bans them (most house
  styles here do), write the middle dot explicitly and check the render.

## Brand strings

Titles, canonical URLs, the publisher name in the structured data and the share
card all come from [`../brand-kit/brand.json`](../brand-kit/brand.json) — never
hardcoded in `build.py`.
