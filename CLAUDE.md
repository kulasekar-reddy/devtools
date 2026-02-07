# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevTools is a static web-based developer utility suite at **formatting.tech**. Pure HTML/CSS/JavaScript with no build system, no package manager, and no framework. All processing is client-side and works offline.

## Running Locally

```bash
python3 -m http.server 8000
# or
npx http-server
```

No build step, linting, or test suite exists. Verify changes manually in the browser.

## Deployment

Deployed via **Netlify** from the `main` branch. Subdomain routing is configured in `netlify.toml` (e.g., `json.formatting.tech` → `tools/json-tools.html`). Cache: 1 year for JS/CSS, 1 hour for HTML.

## Architecture

Each tool follows the same pattern: an HTML page in `tools/`, a JS file in `js/`, and an optional CSS file in `css/`.

**Shared code:**
- `js/utils.js` — Common functions: `showStatus()`, `initCharCounter()`, `copyToClipboard()`, `escapeHtml()`, `setActiveNav()`, `toggleFullscreen()`, `initHighlightSync()`
- `js/search-replace.js` — Class-based search/replace module used by JSON, XML, and YAML tools
- `css/main.css` — Base styles, CSS variables, layout system, navigation, responsive design

**Tools:**
| Tool | HTML | JS | CSS |
|------|------|----|-----|
| JSON | `tools/json-tools.html` | `js/json-tools.js` + `js/json-worker.js` (Web Worker) | `css/json.css` |
| XML | `tools/xml-tools.html` | `js/xml-tools.js` | `css/xml.css` |
| YAML | `tools/yml-tools.html` | `js/yml-tools.js` (uses `js/js-yaml.min.js`) | `css/yml.css` |
| Diff | `tools/diff-tools.html` | `js/diff-tools.js` | `css/diff.css` |
| Timestamp | `tools/timestamp-tools.html` | `js/timestamp-tools.js` | (main.css only) |
| URL | `tools/url-tools.html` | `js/url-tools.js` | (main.css only) |

## Key Patterns

- **Initialization**: All tools use `document.addEventListener('DOMContentLoaded', ...)` and call `setActiveNav()` first
- **HTML structure**: `.workspace` > `.workspace-header` > `.controls` > `.editor-layout` (side-by-side `.editor-panel` divs) > `.status-bar`
- **Naming**: kebab-case for HTML IDs/CSS classes, camelCase for JS functions
- **Performance**: JSON uses a Web Worker (`json-worker.js`) for parsing large files; tree views use virtual rendering with lazy-loaded nodes
- **Fullscreen**: Overlay modal toggled with F key or button, implemented in `utils.js`

## SEO Implementation

Every page includes a single `<script type="application/ld+json">` with a `@graph` array combining multiple schemas:

**Homepage (`index.html`) schemas:**

- `WebSite` — site name, URL, description
- `Organization` — publisher identity
- `ItemList` — lists all tools with position and subdomain URL (update this when adding a tool)

**Tool page schemas (all three required):**

- `WebApplication` — `applicationCategory: "DeveloperApplication"`, `operatingSystem: "Any"`, `offers` with `price: "0"`, and a `featureList` array of the tool's capabilities
- `BreadcrumbList` — two items: Home (`https://formatting.tech/`) → Tool Name (subdomain URL)
- `FAQPage` — 4 `Question`/`Answer` pairs that match the visible accordion content on the page

**Meta tags (every page):**

- `<title>` (under 70 chars), `<meta name="description">` (150-160 chars), `<meta name="keywords">`, `<meta name="author" content="DevTools">`
- `<link rel="canonical">` — tool pages use subdomain URL (e.g., `https://json.formatting.tech/`), homepage uses `https://formatting.tech/`
- Open Graph: `og:type=website`, `og:url`, `og:title`, `og:description`, `og:site_name=DevTools`, `og:image` pointing to `https://formatting.tech/images/og-image.png` (1200x630)
- Twitter Card: `twitter:card=summary`, `twitter:title`, `twitter:description`, `twitter:image`

## Sitemap & Robots

**`sitemap.xml`:** Each tool gets **two** entries — the `/tools/` path and the subdomain URL — both at priority `0.9` with `changefreq=weekly`. Homepage is priority `1.0` with `changefreq=monthly`. Update `lastmod` dates when modifying a tool.

**`robots.txt`:** Allow-all with sitemap reference. No changes needed for new tools.

## Analytics & AdSense

**Google Analytics 4** (property `G-B4LNPCXR9M`):

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-B4LNPCXR9M"></script>
<script>
  window.addEventListener('load', function() {
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-B4LNPCXR9M');
  });
</script>
```

Loaded `async`, initialized on `window.load` to avoid blocking rendering. Copy this snippet to every new page.

**Google AdSense** (publisher `ca-pub-4697643139994449`):

```html
<script async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4697643139994449"
        crossorigin="anonymous"
        data-ad-frequency-hint="30s"></script>
```

Auto ads only — no manual `<ins>` placements. The `data-ad-frequency-hint="30s"` limits ad injection frequency to reduce CLS. Copy this tag to every new page.

## Page Performance Patterns

Target: **PageSpeed >90**. The `<head>` loading strategy is critical:

1. **Critical inline CSS** — Minified reset, CSS variables, header, and container styles in a `<style>` block. Ensures above-the-fold renders before external CSS loads.
2. **Font loading** (non-blocking):

   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Fira+Code:wght@400;500&display=swap">
   <link rel="stylesheet" href="...same URL..." media="print" onload="this.media='all'">
   ```

   The `media="print"` trick loads fonts without blocking render; `display=swap` prevents invisible text.

3. **Tool-specific CSS** (async):

   ```html
   <link rel="preload" href="../css/tool.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
   <noscript><link rel="stylesheet" href="../css/tool.css"></noscript>
   ```

4. **Scripts** — All app JS uses `defer`; third-party (GA, AdSense) uses `async`

5. **DNS prefetch** — Add for third-party origins:

   ```html
   <link rel="dns-prefetch" href="https://www.googletagmanager.com">
   <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com">
   ```

6. **Cache headers** (`netlify.toml`): JS/CSS → `max-age=31536000, immutable`; HTML → `max-age=3600`

## Adding a New Tool

1. Create `tools/<name>-tools.html` using the `<head>` template from an existing tool page (critical inline CSS, font preload, async tool CSS, dns-prefetch, GA snippet, AdSense tag, deferred scripts)
2. Create `js/<name>-tools.js` with DOMContentLoaded initialization
3. Create `css/<name>.css` if tool-specific styles are needed (load async with preload pattern)
4. Add navigation link to **all** existing HTML pages (header nav is duplicated per page)
5. Add tool card to `index.html` homepage
6. Add the tool to the `ItemList` schema in `index.html`
7. Add JSON-LD `@graph` with `WebApplication` + `BreadcrumbList` + `FAQPage` schemas
8. Add full meta tags: `<title>`, description, keywords, canonical (subdomain URL), Open Graph, Twitter Card
9. Add subdomain redirect in `netlify.toml`
10. Add **two** entries to `sitemap.xml` — the `/tools/` path and the subdomain URL

## Conventions

- **Commit style**: Conventional commits (`feat:`, `fix:`, `perf:`, `chore:`)
- **No external dependencies** except js-yaml (vendored), Google Fonts, Analytics, and AdSense
- **PageSpeed target**: >90 score — avoid changes that hurt performance (large images, render-blocking resources, excessive DOM)
- Navigation is **not** templated — changes to the header/nav must be applied to every HTML file
