# SQLStack

The SQLStack website: Rust-backed SQL and Python tools for data engineers.

## Local preview

Serve this directory with any static web server. For example:

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173`. No build step or package installation is required to serve the site.

The page uses self-hosted Inter and Space Grotesk fonts. Their licenses are included in
`assets/fonts/`. Product icons are optimized PNG derivatives of the original brand artwork.

The theme defaults to the system preference. The accessible header toggle saves an explicit
light/dark preference in the browser. Without JavaScript, the page remains usable in light mode.

## Checks

Browser tests cover theme selection and persistence, keyboard navigation, responsive layouts,
product statuses, sharing metadata, image dimensions and favicon transparency. They require Node.js and Python 3:

```sh
npm ci
npx playwright install chromium
npm test
```

`CHROMIUM_EXECUTABLE_PATH` can point to an existing Chromium installation instead of downloading one.
The test server starts and stops automatically. GitHub Actions runs the same checks without any
publishing or deployment step.

## Sharing assets

`favicon.ico` contains transparent 16px, 32px and 48px icons. The PNG favicons preserve the same
original SQLStack mark without its former white backing. The existing theme script selects a white
variant for dark browser chrome using the system preference, independently of the page's theme
override. The 180px Apple home-screen icon retains its opaque background.
`assets/og-sqlstack-dark.png` is an opaque 1200 × 630 sharing card using the original SQLStack
wordmark and the site's Inter typography on a near-black background. Its branding and text fit
inside the central 630px square so small thumbnail crops retain the complete message. The previous
`assets/og-sqlstack.png` remains available for cached metadata. These use the original raster artwork,
not replacement logos or SVG originals.

Canonical and Open Graph/Twitter URLs target `https://sqlstack.io/`. Local previews can verify the
metadata and assets, but public social-crawler validation requires a separately authorized deployment.
