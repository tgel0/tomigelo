# tomigelo.com

> The personal site of Tomi Gelo — software engineer, maker, and dad.

Live: **[tomigelo.com](https://tomigelo.com)**

A single-page portfolio built as a plain static site: no framework, no build step, no
JavaScript. Just HTML, CSS, and a handful of assets, served by Firebase Hosting. Feel
free to fork it as a starting point for your own site.

## Features

- **Markdown-minimal design** — flat layout, hairline rules, monospace frontmatter, and `#` / `##` / `-` syntax cues instead of cards.
- **Automatic light/dark** via the CSS `light-dark()` function and `prefers-color-scheme` — one token set, no theme-toggle JS.
- **Accessible** — correct heading hierarchy, a skip link, visible `:focus-visible` rings, plus `prefers-reduced-motion` and `prefers-contrast` support.
- **Fast** — no build, no web fonts, no JS; an avatar sized to its display; long-cached static assets.
- **Secure by default** — CSP, `nosniff`, referrer-policy, and permissions-policy headers set in `firebase.json`.
- **Privacy-friendly analytics** with [Plausible](https://plausible.io).

## Tech stack

- HTML + CSS (container queries, `light-dark()`, `:has()`, `@starting-style`, scroll-driven animations).
- Firebase Hosting for serving, HTTPS, and headers.
- Plausible for analytics.

## Project structure

```
src/
  index.html            # the page
  styles.css            # all styling
  404.html              # custom not-found page
  avatar.webp           # profile photo (~72px display, 176px source)
  og-image.webp         # social share preview
  favicon.svg           # SVG favicon (T monogram)
  apple-touch-icon.png  # iOS home-screen icon
  icon-192.webp         # PWA manifest icon
  icon-512.webp         # PWA manifest icon
  site.webmanifest      # web app manifest
  robots.txt
  sitemap.xml
firebase.json           # hosting: headers, caching, cleanUrls
.firebaserc             # Firebase project binding
```

## Getting started

Serve the `src/` directory with any static server:

```bash
git clone https://github.com/tgel0/tomigelo.git
cd tomigelo
python3 -m http.server --directory src 8000
# then open http://localhost:8000
```

Or open `src/index.html` directly — note that root-absolute paths like `/favicon.svg`
only resolve when the directory is served, not over `file://`.

## Customizing it for yourself

1. **Content** — edit `src/index.html`: the `<h1>` name, the frontmatter `<dl>`, the project `<li>`s, and the sidebar.
2. **Avatar & share image** — replace `src/avatar.webp` (display ~72px, so ~176px source is plenty) and `src/og-image.webp`.
3. **Favicon & icons** — replace `src/favicon.svg`, `src/apple-touch-icon.png`, and `src/icon-*.webp`.
4. **Domain & analytics** — update the canonical/OG URLs in `index.html` and the `data-domain` on the Plausible `<script>`.
5. **Firebase project** — change the project in `.firebaserc` and adjust `firebase.json`.
6. Bump the `?v=` query on `styles.css` / `avatar.webp` whenever those files change (long-cache invalidation).

## Deployment

```bash
npx firebase-tools deploy --only hosting
```

Requires the Firebase CLI and a logged-in account with access to the configured project.

## Notes

- **Caching:** static assets use `Cache-Control: max-age=31536000, immutable`; HTML revalidates hourly (see `firebase.json`).
- **Security headers:** CSP, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` are set in `firebase.json`.

## License

[MIT](./LICENSE) — fork it, use it, make it yours.
