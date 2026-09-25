<!--
  ASIC Network docs template. to add a page:
  1. copy this file to src/your-page-slug.md (kebab-case, describes the page)
  2. replace the "# Title" below: that heading becomes the page title
  3. add it to src/SUMMARY.md wherever it belongs in the reading order
  4. commit to main; CI builds and publishes automatically

  rules:
  - exactly one "# " heading per page, at the top
  - raw HTML is allowed (unlike the old renderer): use it for embeds
    (e.g. an <iframe> to an interactive widget) when plain markdown isn't enough
  - images: commit them under src/img/ and reference relative to this file,
    e.g. img/foo.png
  - link to other pages by their filename, e.g. [see also](other-page.md) —
    mdBook rewrites the .md link to the right .html automatically
  - see any existing page for a full example of every supported construct
-->

# Project Title

One or two sentences on what this page covers and what the reader will have working at the end.

## Overview

Context, theory, background.

## Prerequisites

- tool or PDK
- prior page: [example](other-page.md)

## Steps

1. first step
2. second step

```bash
# commands go in fenced blocks with a language tag
echo "hello"
```

## Results

| metric | value |
|--------|------:|
| example | 1.0 |

## Checklist

- [ ] item

---

*Questions? Ask in the network Discord.*
