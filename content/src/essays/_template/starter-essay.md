---
title: How to write one of these
slug: starter-essay
kind: article
eyebrow: Starter
deck: The starter essay. Copy this folder, keep the frontmatter, replace everything else.
description: A worked skeleton for a long-form post — the frontmatter fields that matter, the section shape, and the two things that will catch you.
author: Your Name
role: Your Role
date: 2026-01-01
tags:
  - writing
  - starter
faq:
  - q: Why does every field in the frontmatter matter?
    a: Each one becomes a real thing in the output. The deck becomes the social card subtitle, the description becomes the meta description, the FAQ becomes FAQPage structured data, and the tags become the caption hashtags. A blank field is a blank surface downstream.
  - q: How long should an essay be?
    a: Between 700 and 1200 words. Shorter reads as a post that wanted to be a post; longer starts needing subheadings inside subheadings, which is the point at which it is two essays.
  - q: Where do the images go?
    a: Nowhere. The body is image-free by design, and the rhythm comes from numbered sections and pull quotes instead. A genuine data visual belongs inline as on-brand SVG, which passes straight through the markdown.
---

This is the starter. Copy the folder, keep the frontmatter fields, and replace
everything below. It exists so the pipeline has something to render on a fresh
clone, and so the shape of a finished piece is visible before you write one.

## Start with the argument

Before the first sentence, answer one question: what does the reader believe at
the end that they did not believe at the start? If the answer is "that we are
good at this", it is not an essay yet.

> An essay that could have been a landing page was a landing page. The thing that
> makes it worth reading is that it argues something a reasonable person could
> disagree with.

Everything after that is structure.

## Keep the sections numbered and few

Three to five `## H2` sections, each one making a single move. The renderer draws
the numbers, so write plain titles. No `###` nesting: if a section needs
sub-sections, it is carrying two ideas and should be split.

Short paragraphs. One or two pull quotes, used for your sharpest lines rather
than for decoration.

## Two things that will catch you

`output/` is regenerated on every render, with one deliberate exception: the
caption file is written once and never overwritten, so a caption you tailored
survives. Edit that one in place.

And markdown converts a double hyphen into an em dash. Most house styles here ban
those, so write the middle dot explicitly and check the rendered page before you
call it done.

## Then read the rules

`docs/writing-rules.md` before you start, not after. Long-form attracts the
banned antithesis pair (*"X is A. Y is B."*) more than any other surface in this
studio, and it is much cheaper to avoid than to edit out.
