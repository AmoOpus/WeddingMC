# Andrew Mo — Wedding MC

A single-page promotional website for a fictional wedding master of ceremonies, "Andrew Mo." The primary build is plain HTML, CSS, and JavaScript — no frameworks, no build step. A second, optional Go implementation lives in `server/` for anyone who wants real server-side rendering and native email delivery instead of GitHub Pages + a third-party form service.

This is a **portfolio / demo project**. Andrew Mo and the testimonials are placeholder content; the seven carousel photos are real uploaded images, colour-graded to match the site.

## Structure

```
andrew-mo-site/
├── index.html            Page markup, SEO meta tags, JSON-LD structured data
├── styles.css            All styling (palette, layout, responsive rules, 3D flip effect, parallax)
├── script.js             Renders the carousel from data, carousel autoplay, parallax, form submit, scroll reveal
├── testimonials.json     Data source for the 7 carousel tiles (image, quote, author, rating)
├── assets/images/        7 graded carousel photos + 2 parallax section photos + hero bokeh background
├── server/                Optional Go SSR version — see server/README.md
└── README.md              You are here
```

## Design notes

- **Palette:** a dark "formal wedding night" theme — deep espresso black (`#15110E`), a bordeaux/plum depth colour (`#2B1015`) used on the flip-card backs, and candlelight gold (`#C9A227`) as the accent, against warm ivory text (`#F2E9D8`).
- **Type:** [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) for headings, [Jost](https://fonts.google.com/specimen/Jost) for body and UI text, loaded from Google Fonts with system-font fallbacks.
- **Header:** wordmark on the left, a "Contact me" button on the right that jumps straight to the enquiry form (`#contact`) — no other nav links.
- **Hero:** a generated, warm-toned bokeh/fairy-lights SVG background with a scroll-linked parallax drift.
- **Two additional full-bleed photo sections** (also parallax) break up the long-form copy: one after "How it works," one right before the About section.
- **Portraits:** the 7 carousel images are real photos, cropped to a consistent frame and colour-graded (desaturated, warmed, vignetted) so they read as one cohesive set rather than seven different lighting setups. Bold gold borders make each tile stand out against the dark background.

## The flip carousel

Each of the 7 tiles is a 3D flip card:

- **Front:** the full-bleed photo, no caption.
- **Back:** a darkened, blurred version of that same photo behind the star rating and testimonial quote — not a flat colour.

The flip is a CSS `transform: rotateY(180deg)` on `.tile-inner`, triggered by mouse hover, keyboard focus, or a click/Enter/Space (for touchscreens, which have no hover state). Arrow keys move focus between tiles. The carousel **auto-rotates** every ~3.8s and **permanently stops** the moment a person interacts with a tile (click, tap, tab into, or scroll it) — see `setupCarouselAutoplay` in `script.js`.

## Data-driven content

The 7 tiles are **not hardcoded** in `index.html`. `script.js` fetches `testimonials.json` on page load and builds each tile from that data (image path, alt text, look name, quote, author, star rating). To change or add a testimonial, edit `testimonials.json`.

> **Note on opening the file directly:** browsers restrict `fetch()` of local files when a page is opened via `file://`. `script.js` falls back to an inline copy of the same data (`FALLBACK_TESTIMONIALS`) if the fetch fails, kept in sync with `testimonials.json` by hand — update both together.

## Running it locally

```bash
# Python 3
python3 -m http.server 8000

# or Node
npx serve .
```

Then visit `http://localhost:8000`. Double-clicking `index.html` also works, using the fallback data described above.

## The enquiry form

The form at the bottom of the page posts to [FormSubmit.co](https://formsubmit.co), which delivers submissions straight to **mcmoandrew@gmail.com** with no account signup required — the destination email is embedded directly in the form's `action` URL (`https://formsubmit.co/ajax/mcmoandrew@gmail.com`).

**One-time step:** the first real submission triggers a confirmation email from FormSubmit to `mcmoandrew@gmail.com`. Until that confirmation link is clicked, submissions aren't delivered (this is FormSubmit's anti-spam measure, not a bug). After confirming once, every future submission arrives by email automatically, formatted as a table (`_template=table`).

`script.js`'s `setupContactForm()` submits via `fetch()` so the page shows an inline "thanks, Andrew will reply within two business days" message instead of redirecting to FormSubmit's site. To point the form at a different address or service, change the form's `action` attribute in `index.html` — no JavaScript changes needed as long as the new endpoint accepts a POST and returns a 2xx response.

If you'd rather have full control over email delivery (custom subject logic, no third-party dependency, etc.), see `server/README.md` for the Go version, which sends mail directly via SMTP from your own backend.

## SEO

- Unique `<title>` and meta description built around "Andrew Mo," "Cantonese Wedding MC," and "ABC Wedding MC" — also woven naturally into visible body copy (the About section), since Google weighs visible content more heavily than meta tags alone.
- Open Graph + Twitter Card tags for link previews, `rel="canonical"`.
- JSON-LD structured data (`Person`, `Service`, `WebSite`) describing Andrew, the languages he hosts in, and his service area.
- **Deliberately not included:** `Review`/`AggregateRating` schema. The testimonials here are placeholder demo copy, not independently verifiable third-party reviews — marking them up as schema.org `Review`s would misrepresent them as such, which is against Google's structured data guidelines and risks a manual action. Add that markup only once there are genuine, attributable reviews behind it (ideally sourced from Google Business Profile or a similar third party).
- Static HTML is already fully crawlable without JavaScript; the only JS-dependent content is the carousel, which is supplementary (photos + quotes), not primary page copy.
- No amount of on-page markup guarantees rankings for competitive terms — that depends heavily on backlinks, domain authority, and (for local search specifically) a Google Business Profile listing, which will likely move the needle more than anything in this repo.

## Accessibility notes

- All images have descriptive `alt` text (or `aria-label` for CSS background images).
- The carousel is a keyboard-operable region with arrow-key navigation and Enter/Space to flip.
- Visible focus rings (`:focus-visible`) in gold against the dark palette meet WCAG AA contrast.
- Motion (flip transitions, parallax, scroll-reveal, carousel autoplay) is disabled for users with `prefers-reduced-motion: reduce` set at the OS level.

## Editing

- **Copy:** edit directly in `index.html`.
- **Testimonials / ratings / images used in the carousel:** edit `testimonials.json`, and update `FALLBACK_TESTIMONIALS` in `script.js` to match.
- **Colours, type, spacing, breakpoints:** CSS custom properties at the top of `styles.css` (`:root { ... }`), plus the two `@media` blocks near the bottom.
- **Parallax section photos:** three full-bleed bands use `.parallax-photo--groomsmen`, `.parallax-photo--tent`, and `.parallax-photo--cheering` in `styles.css`, pointing at `assets/images/parallax-groomsmen.jpg`, `parallax-tent.jpg`, and `parallax-cheering.jpg` respectively.
- **Enquiry form destination:** the `action` attribute on `#contactForm` in `index.html` (see "The enquiry form" above).
