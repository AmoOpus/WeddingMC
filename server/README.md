# Andrew Mo — Go SSR server

This is a server-rendered version of the Andrew Mo wedding MC site, built with
Go's standard library only (no external dependencies — nothing to `go mod
download`). It exists to do two things the static (GitHub Pages) version
can't:

1. **Server-side render** the full page — including every carousel
   testimonial — so the complete content is present in the very first HTML
   response, before any JavaScript runs. That's the "SSR" part.
2. **Actually send contact-form submissions by email**, via SMTP, with no
   third-party form service required.

## Important: this needs a different host than GitHub Pages

GitHub Pages only serves static files — it cannot run a Go binary or answer
`POST /contact` with real logic. If you want this SSR version live, you'll
need a host that runs a process, for example:

- [Fly.io](https://fly.io), [Render](https://render.com), or
  [Railway](https://railway.app) — all have free/cheap tiers and deploy a Go
  binary or Dockerfile directly.
- A small VPS (e.g. a $5/mo droplet) running the binary behind a process
  manager (systemd, etc.) and a reverse proxy (Caddy/Nginx) for HTTPS.
- Google Cloud Run / AWS App Runner if you want a container-based option.

If you'd rather keep using GitHub Pages, keep using the static site in the
repo root (`index.html`, `styles.css`, `script.js`, `testimonials.json`,
`assets/`) — it already has the same SEO meta tags and JSON-LD, just with a
FormSubmit.co-based contact form (posts straight to
`mcmoandrew@gmail.com`, no account signup) instead of this Go backend.

## Running locally

```bash
cd server
go build -o server .
SMTP_USER=you@gmail.com SMTP_PASS=your-app-password ./server
```

Then visit `http://localhost:8080`. See `.env.example` for every variable
this reads (`SITE_URL`, `PORT`, `SMTP_*`, `CONTACT_TO_EMAIL`).

No `.env` loader is wired in (to avoid adding a dependency) — either export
the variables yourself, or add a tiny loader / use `godotenv` if you'd
prefer that workflow.

## Getting the contact form to email you

The form posts to `/contact`, which sends an email via SMTP to
`CONTACT_TO_EMAIL` (defaults to **mcmoandrew@gmail.com**). The simplest way
to get this working with a Gmail account:

1. Turn on 2-Step Verification on the Gmail account you want to send *from*
   (this can be the same mcmoandrew@gmail.com account, or a separate one —
   either works, since `SMTP_USER` and `CONTACT_TO_EMAIL` are independent).
2. Generate an **App Password** at
   <https://myaccount.google.com/apppasswords>.
3. Set `SMTP_USER` to that Gmail address and `SMTP_PASS` to the 16-character
   app password (not your normal Gmail password — Google blocks plain
   password SMTP login).
4. Leave `SMTP_HOST`/`SMTP_PORT` as `smtp.gmail.com` / `587`.

If you'd rather not use Gmail's SMTP directly (it's fine for low volume, but
transactional email providers give you better deliverability and don't risk
your personal account getting flagged), point `SMTP_HOST`/`SMTP_USER`/
`SMTP_PASS` at a provider like Resend, Postmark, or Mailgun instead — they
all offer plain SMTP credentials that drop into this same code unchanged.

The handler also has a basic honeypot field (`company`) to quietly ignore
bot submissions — the visible form doesn't include that field, so real
visitors never trigger it.

## SEO notes (what's actually implemented, and what isn't)

Implemented, in both this server's template and the static `index.html`:

- Unique `<title>` and meta description built around "Cantonese Wedding MC"
  and "ABC Wedding MC", plus the same phrases woven naturally into visible
  body copy (the About section) — Google weighs visible content far more
  than meta tags.
- Open Graph + Twitter Card tags for link previews.
- `rel=canonical`.
- JSON-LD structured data (`Person`, `Service`, `WebSite`) describing
  Andrew, his languages, and his service area, marked up per schema.org.
  Deliberately **not** included: `Review`/`AggregateRating` markup. The
  testimonials on this site are placeholder/demo copy, not independently
  verifiable third-party reviews, and marking them up as schema.org
  `Review`s would misrepresent them as such — which is against Google's
  structured data guidelines and risks a manual action. Add that markup
  only once there are genuine, attributable reviews (ideally sourced from
  Google Business Profile or a similar third party) behind it.
- `robots.txt` and `sitemap.xml`.
- Server-rendered carousel content (this server only) — the testimonials
  are in the raw HTML, not injected by JavaScript after the fact.

**Not implemented, because no amount of on-page markup does this on its
own:** actually ranking for competitive terms depends heavily on backlinks,
domain age/authority, reviews on Google Business Profile, and real user
engagement — none of which a template can manufacture. Treat this as
removing on-page friction, not a ranking guarantee. For local terms like
"Cantonese Wedding MC Sydney," a **Google Business Profile** listing usually
moves the needle more than anything on the page itself — worth setting up
alongside this.

## File layout

```
server/
├── main.go              HTTP handlers, email sending, template data
├── go.mod
├── .env.example
├── templates/
│   └── index.gohtml      The page template (SSR'd on every request)
├── static/                Served at /static/*
│   ├── styles.css
│   ├── script.js
│   └── assets/images/
└── testimonials.json      Embedded at build time; edit and rebuild to update reviews
```
