# Andrew Mo — Wedding MC

A single-page promotional website for a fictional wedding master of ceremonies, "Andrew Mo." Built with plain HTML, CSS, and JavaScript — no frameworks, no build step, no dependencies to install.

This is a **portfolio / demo project**. Andrew Mo, the testimonials, and the illustrated portraits are all fictional placeholder content.

## Structure

```
andrew-mo-site/
├── index.html            Page markup and content
├── styles.css             All styling (palette, layout, responsive rules, 3D flip effect)
├── script.js              Renders the carousel from data, handles interactions
├── testimonials.json      Data source for the 7 carousel tiles (image, quote, rating)
├── assets/
│   └── images/            7 hand-coded SVG cartoon portraits, one per suit/look
└── README.md              You are here
```

## Design notes

- **Palette:** a dark "formal wedding night" theme — deep espresso black (`#15110E`), a bordeaux/plum depth color (`#2B1015`) used on the flip-card backs, and candlelight gold (`#C9A227`) as the accent, against warm ivory text (`#F2E9D8`). Chosen to feel like an evening reception rather than a bright daytime brochure.
- **Type:** [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) for headings, [Jost](https://fonts.google.com/specimen/Jost) for body and UI text, loaded from Google Fonts with system-font fallbacks.
- **Header:** intentionally just the wordmark, top-left — no nav links or buttons competing for attention.
- **Layout inspiration:** the sticky top-left wordmark, horizontal image carousel, and tile-based content grid are loosely inspired by the layout patterns of modern athlete/personality portfolio sites — restructured here for a wedding-industry audience with an entirely original palette, type system, and copy. No names, logos, or likenesses from any real person or brand are used anywhere in this project.
- **Portraits:** all 7 gallery images are original, hand-authored SVG illustrations (simple geometric cartoon busts), not photographs or scraped assets. Each fills its full tile edge-to-edge (no rounded corners, no whitespace border), with the look's name sitting in a bottom gradient overlay directly on the image.

## The flip carousel

Each of the 7 tiles in the "Seven nights, seven suits" gallery is a 3D flip card:

- **Front:** the illustrated portrait and the name of that look (e.g. "Burgundy Elegance").
- **Back:** a short testimonial quote (under 120 characters) and a star rating rendered with `★` / `☆` characters.

The flip is a CSS `transform: rotateY(180deg)` on `.tile-inner`, triggered by:

- **Mouse hover** (`:hover`)
- **Keyboard focus** (`:focus` / `:focus-visible`) — tab onto a tile and it flips
- **Click or Enter/Space** — toggles a `.is-flipped` class in JavaScript, so touchscreens (which have no hover state) can flip a card too

Arrow keys (`←` `→`) move focus between tiles and scroll the active tile into view. The carousel also has visible previous/next buttons for mouse users, and respects `prefers-reduced-motion` by shortening/disabling transitions for users who have that OS setting enabled.

## Data-driven content

The 7 tiles are **not hardcoded** in `index.html`. `script.js` fetches `testimonials.json` on page load and builds each `<li class="tile">` from that data (image path, alt text, look name, quote, star rating). To change or add a testimonial, edit `testimonials.json` — no HTML editing required.

> **Note on opening the file directly:** browsers restrict `fetch()` of local files when a page is opened via `file://` (double-clicking `index.html`). To handle this gracefully, `script.js` falls back to an inline copy of the same data if the fetch fails, so the site still works when opened directly. For full data-driven behavior (editing `testimonials.json` and seeing it reflected without touching JS), run a local server as described below.

## Running it locally

You don't need Node, npm, or any build tooling. Pick whichever is easiest:

### Option A — just open it
Double-click `index.html`, or drag it into a browser window. The site will work, using the built-in fallback testimonial data (see note above).

### Option B — a local server (recommended, so `testimonials.json` is editable live)
From inside the `andrew-mo-site/` folder, run one of:

```bash
# Python 3
python3 -m http.server 8000

# Node (if you have npx available)
npx serve .
```

Then visit `http://localhost:8000` in your browser.

## Deploying with GitHub Pages

This is a static site (no build step, no server-side code), so GitHub Pages can host it directly:

1. Push this folder to a GitHub repository (e.g. `weddingMC`).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Pick the `main` branch and the `/ (root)` folder, then **Save**.
5. GitHub will publish the site at `https://<your-username>.github.io/weddingMC/` within a minute or two (refresh the Pages settings screen to see the live link once it's ready).

Because `testimonials.json` is fetched with `fetch()`, it works correctly once served over `https://` by GitHub Pages — the file:// fallback described above is only needed for opening the file directly from a local disk.

## Accessibility notes

- All images have descriptive `alt` text.
- The carousel is a keyboard-operable `region` with arrow-key navigation between tiles and Enter/Space to flip.
- Interactive elements have a visible focus ring (`:focus-visible`) using the gold accent against the ivory/navy palette, which meets WCAG AA contrast.
- The mobile navigation toggle exposes `aria-expanded` state.
- Motion (the flip transition, smooth scrolling) is reduced for users with `prefers-reduced-motion: reduce` set at the OS level.

## Editing

- **Copy:** edit directly in `index.html`.
- **Testimonials / ratings / images used in the carousel:** edit `testimonials.json`.
- **Colors, type, spacing, breakpoints:** edit the CSS custom properties at the top of `styles.css` (`:root { ... }`) and the two `@media` blocks near the bottom for tablet/mobile tuning.
- **Portraits:** replace the SVGs in `assets/images/` with your own (keep the same filenames referenced in `testimonials.json`, or update the `image` field accordingly).
