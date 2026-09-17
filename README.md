# Venkat Pandey’s portfolio

A responsive personal portfolio and photography gallery, served as a static site on GitHub Pages. HTML, CSS, and vanilla JavaScript; no build step or package installation required.

## Local preview

From the repository root:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. The stylesheet uses Google Fonts with local system fallbacks. Existing Google Analytics configuration remains in `index.html`.

## Photography

The gallery preserves each photograph’s aspect ratio. Visitors can select a thumbnail, browse the full collection, use arrow keys, swipe, or expand the gallery. The Play control starts a five-second slideshow. Manual navigation pauses playback. Playback waits while the gallery is offscreen or the browser tab is hidden. Reduced-motion preferences remove animations and pause active playback when enabled.

Expanded view uses browser fullscreen when supported and an in-page overlay otherwise. Escape closes it; keyboard focus stays inside the gallery and returns to the Expand control on exit.

### Add a photograph

1. Add the original to `images/show/` and a small WebP preview to `images/thumbs/` (around 360 pixels wide).
2. Add an entry to the array in `assets/js/photos.js`, with `src`, `thumb`, `title`, descriptive `alt`, `category`, `width`, and `height`.
3. Refresh the preview. Counts, thumbnails, and the collection grid come from that array.

Filenames do not need consecutive numbering. The first static gallery image in `index.html` provides a fallback without JavaScript; update its image and caption if you remove that photograph. Hero photos also reference originals in `index.html`.

## Editing and verification

- `index.html`: biography, work, links, hero, and page structure.
- `assets/css/main.css`: current styles, responsive layout, and reduced-motion overrides. This file is maintained directly; legacy Sass and vendor files are retained for history and are not loaded by the page.
- `assets/js/main.js`: navigation and gallery behavior.
- `assets/js/photos.js`: photograph metadata.

Before publishing, check JavaScript syntax (`node --check assets/js/main.js` and `node --check assets/js/photos.js`) and `git diff --check`. Preview desktop and mobile layouts; check slideshow playback, rapid navigation, first/last wraparound, thumbnails, image-load failure, expanded view, keyboard focus, and reduced motion.

Photo titles describe the images; they do not assert locations or dates. Career details come from the existing site and should be updated when needed.
