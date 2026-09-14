# samsweb_6.7

## Preserved homepage behavior

- `index.html` remains the ball homepage.
- Balls start white until their section is opened.
- Opening a ball assigns that section one persistent color stored in the browser.
- Returning, refreshing, or reopening the site keeps that color history.
- Ball-to-ball and ball-to-wall collisions do not alter color.
- Matter.js movement, drag behavior, circle sizing, friction, restitution, and links remain in `script.js`.

## Navigation

- The homepage switch opens `contentconnectomev1.html`, the hybrid document/connectome view.
- `Directory` opens `directory.html`, a separate static page with no toggle.
- Directory and category links open full project pages directly.
- Project back arrows use browser history, with the existing page href as a fallback.
- In hybrid view, the divider between document and graph remains draggable on desktop and mobile.

## Tier-2 category rows

The category pages `audio.html`, `video.html`, `disco.html`, `dico.html`, `cogito.html`, `lego.html`, and `scribo.html` use `tier2.css`.

They are vertically stacked, full-width project rows rather than a card grid. Each row contains:

- `.project-card-thumbnail` for a thumbnail or the `THUMBNAIL COMING SOON !` placeholder.
- `.project-card-title` for the project title.
- `.project-card-description` for a short visible description.

The supplied local images and PDF-derived thumbnails are stored in `assets/thumbnails/`.

## Full-screen media pages

Single video and embedded-audio pages use `media-embed-page.css` and fill the viewport on desktop and mobile. Multi-item audio pages use stacked full-viewport media panels in the same stylesheet.

## Adding text without visible placeholders

Pages include an empty element such as:

```html
<section class="project-introduction"><!-- ADD OPTIONAL VISIBLE PROJECT INTRODUCTION HERE. --></section>
```

Put visible HTML text inside the section. It occupies no space while empty.

Search-only terms can be added to:

```html
<meta name="keywords" content="">
```

## Access screen

The shared code is `2003!`. The access screen is applied to the previously designated restricted pages, including Running Text Block and Cat a logue.

This is a client-side deterrent, not secure authentication. Public GitHub Pages files remain discoverable.


## 6.9 archive/connectome additions
New unfinished archive pages are grouped under `archive/`. Each page contains HTML comments marking where to insert text, media, and documentation. Connectome nodes and cross-links are defined in `site-data.js`.


## 6.10 changes
- Disco and its child pages are access-gated.
- User-supplied MUSH, Longplayer, Long Form Audio Meditation, and Snake Oil thumbnails are in `assets/thumbnails/`.
- Colorful map thumbnails were removed; the grey Algorithm Reform node-map thumbnail remains.
- Ball visit colors refresh correctly after browser Back / bfcache restoration.
