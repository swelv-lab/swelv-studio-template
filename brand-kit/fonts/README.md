# Fonts

Empty on purpose.

Still images (posts, decks, collateral, essays) render fine from the remote
`@import` at the top of `brand.css` — Chrome resolves it during the render.

**Video is different.** Frame capture screenshots faster than a webfont can
arrive, so a video built on a remote font silently renders in the fallback stack
and the whole clip is off-brand. For video, run `../fetch-fonts.sh` to download
your typefaces here, then switch `brand.css` to the local `@font-face` block it
prints.

Only commit font files you are allowed to redistribute. SIL Open Font License
families (most of Google Fonts) are fine. A commercial desktop licence you bought
usually is not — keep those out of a public repo.
