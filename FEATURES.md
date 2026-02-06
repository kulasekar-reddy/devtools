# DevTools - Feature Implementation Reference

A comprehensive reference guide documenting all implemented features for JSON/XML tools, SEO, analytics, monetization, hosting, and performance optimizations. Use this as a template when adding new tools or features.

---

## Table of Contents

1. [Core Tools Features](#core-tools-features)
2. [SEO Implementation](#seo-implementation)
3. [Analytics & Monetization](#analytics--monetization)
4. [Hosting & Configuration](#hosting--configuration)
5. [Performance Optimizations](#performance-optimizations)
6. [New Feature Checklist](#new-feature-checklist)
7. [Project Structure](#project-structure)
8. [Future Enhancements](#future-enhancements)

---

## Core Tools Features

### JSON Tools

**Files:** `tools/json-tools.html`, `js/json-tools.js`, `css/json.css`

| Feature | Function | Description |
|---------|----------|-------------|
| Format JSON | `formatJSON()` | Beautifies with 2-space indentation |
| Minify JSON | `minifyJSON()` | Compresses to single line, removes whitespace |
| Stringify | `stringifyJSON()` | Converts JS objects to escaped JSON strings |
| Parse | `parseJSON()` | Parses JSON strings to objects (handles nested) |
| Validate | `validateJSON()` | Type checking, key/item count, size, error messages |
| Tree View | `buildTree()` | Interactive, color-coded, expandable/collapsible |
| Expand All | `expandAll()` | Opens all tree nodes |
| Collapse All | `collapseAll()` | Closes all tree nodes |
| Import | `importJSON()` | File upload (.json, .txt) |
| Export | `exportJSON()` | Download as data.json |
| Copy | `copyContent()` | Context-aware clipboard copy |
| Fullscreen | `toggleFullscreen()` | Overlay mode with text/tree switching |
| Character Count | `updateCharCount()` | Real-time with locale formatting |
| Sample Data | `loadSample()` | Pre-loaded example JSON |
| Clear | `clearEditor()` | Clears editor and tree view |

#### Tree View Color Scheme

```css
/* JSON Tree Colors - css/json.css */
.tree-key { color: #2c5aa0; }      /* Keys: Blue */
.tree-string { color: #22863a; }   /* Strings: Green */
.tree-number { color: #005cc5; }   /* Numbers: Blue */
.tree-boolean { color: #d73a49; }  /* Booleans: Red */
.tree-null { color: #6f42c1; }     /* Null: Purple */
.tree-bracket { color: #6a737d; }  /* Brackets: Gray */
```

### XML Tools

**Files:** `tools/xml-tools.html`, `js/xml-tools.js`, `css/xml.css`

| Feature | Function | Description |
|---------|----------|-------------|
| Format XML | `formatXML()` | 2-space indentation, preserves special nodes |
| Minify XML | `minifyXML()` | Removes whitespace between tags |
| Validate | `validateXML()` | Root element, element/attribute count, depth |
| Statistics | `getXMLStats()` | Elements, attributes, text nodes, comments, CDATA |
| Tree View | `buildXMLTree()` | Element/namespace/attribute highlighting |
| Import | `importXML()` | Multiple formats (.xml, .xsd, .xsl, .xslt, .svg, .html) |
| Export | `exportXML()` | Download as document.xml |

#### Special XML Node Support

- **CDATA Sections:** `<![CDATA[...]]>` - Purple background
- **Comments:** `<!-- ... -->` - Gray, italicized
- **Processing Instructions:** `<?target data?>` - Blue, italicized
- **XML Declaration:** `<?xml version="1.0"?>` - Blue background
- **Namespaces:** `prefix:localName` - Red prefix, purple local name

#### XML Tree Color Scheme

```css
/* XML Tree Colors - css/xml.css */
.xml-element { color: #881280; }       /* Elements: Purple */
.xml-attribute { color: #994500; }     /* Attributes: Brown */
.xml-attr-value { color: #1a1aa6; }    /* Attr Values: Navy */
.xml-text { color: #22863a; }          /* Text: Green */
.xml-cdata { color: #6f42c1; }         /* CDATA: Purple */
.xml-comment { color: #6a737d; }       /* Comments: Gray */
.xml-pi { color: #005cc5; }            /* PI: Blue */
.xml-namespace { color: #d73a49; }     /* Namespace: Red */
```

### Timestamp Converter

**Files:** `tools/timestamp-tools.html`, `js/timestamp-tools.js`

| Feature | Function | Description |
|---------|----------|-------------|
| Epoch to Human | `convertEpochToHuman()` | Converts Unix timestamp to readable date |
| Human to Epoch | `convertDateToEpoch()` | Converts date inputs to Unix timestamp |
| Current Time | `loadCurrentTime()` | Loads current Unix timestamp |
| Live Clock | `updateLiveClock()` | Real-time epoch display (updates every second) |
| ISO 8601 Format | `formatISO8601()` | Outputs ISO 8601 formatted date |
| RFC 2822 Format | `formatRFC2822()` | Outputs RFC 2822 formatted date |
| Relative Time | `getRelativeTime()` | "2 hours ago", "in 3 days" |
| Copy Permalink | `copyPermalink()` | Shareable URL with timestamp & timezone |
| URL Params | `loadFromURL()` | Loads timestamp from URL params |

#### Timezone Support

- UTC (Coordinated Universal Time)
- IST (India Standard Time)
- EST/EDT (US Eastern)
- CST/CDT (US Central)
- MST/MDT (US Mountain)
- PST/PDT (US Pacific)
- GMT/BST (UK)
- CET/CEST (Central Europe)
- JST (Japan)
- CST (China)
- SGT (Singapore)
- GST (Gulf)
- AEST/AEDT (Australia Eastern)
- NZST/NZDT (New Zealand)

#### Permalink Format

```
https://timestamp.formatting.tech/?t=1707235200&tz=Asia/Kolkata
```

### URL Encoder / Decoder

**Files:** `tools/url-tools.html`, `js/url-tools.js`

| Feature | Function | Description |
|---------|----------|-------------|
| Encode URL | `encodeURL()` | Uses `encodeURI()` - preserves URL structure |
| Decode URL | `decodeURL()` | Uses `decodeURI()` |
| Encode Component | `encodeComponent()` | Uses `encodeURIComponent()` - encodes everything |
| Decode Component | `decodeComponent()` | Uses `decodeURIComponent()` |
| Parse URL | `parseURL()` | Breaks URL into protocol, host, path, params, hash |
| Query Builder | `buildQueryString()` | Interactive key-value param builder |
| Add Param | `addBuilderParam()` | Adds key-value pair to builder |
| Remove Param | `removeBuilderParam()` | Removes param from builder |

#### URL Components Parsed

- Protocol (http, https, etc.)
- Hostname
- Port
- Path
- Query String
- Hash/Fragment
- Individual Query Parameters (key-value pairs)

#### Encoding Differences

| Function | Encodes | Preserves |
|----------|---------|-----------|
| `encodeURI()` | Spaces, non-ASCII | `: / ? # [ ] @ ! $ & ' ( ) * + , ; =` |
| `encodeURIComponent()` | Everything except | `A-Z a-z 0-9 - _ . ~` |

### Shared Utilities

**File:** `js/utils.js`

| Function | Purpose |
|----------|---------|
| `copyToClipboard(text)` | Clipboard API with fallback |
| `escapeHtml(text)` | Escape HTML special characters |
| `setActiveNav(currentPage)` | Highlight active navigation |
| `initFullscreenKeyHandler()` | ESC key to exit fullscreen |

---

## SEO Implementation

### Meta Tags Checklist

Add to `<head>` section of every HTML page:

```html
<!-- Basic Meta Tags -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[Tool Name] - Free [Feature] Online | DevTools</title>
<meta name="description" content="[140-158 characters describing the tool]">
<meta name="keywords" content="[comma-separated keywords]">
<meta name="author" content="DevTools">
<link rel="canonical" href="https://[subdomain].formatting.tech/">
```

#### Current Implementations

| Page | Title Length | Description Length | Canonical URL |
|------|-------------|-------------------|---------------|
| Homepage | 56 chars | 158 chars | `https://formatting.tech/` |
| JSON Tools | 65 chars | 156 chars | `https://json.formatting.tech/` |
| XML Tools | 64 chars | 144 chars | `https://xml.formatting.tech/` |

### Open Graph Tags

```html
<!-- Open Graph / Social Media -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://[subdomain].formatting.tech/">
<meta property="og:title" content="[Tool Name] - [Short Description]">
<meta property="og:description" content="[Description for social sharing]">
<meta property="og:site_name" content="DevTools">
```

### Twitter Cards

```html
<!-- Twitter Card -->
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="[Tool Name] - [Short Description]">
<meta name="twitter:description" content="[Description for Twitter]">
```

### Structured Data (JSON-LD)

#### 1. WebSite Schema (Homepage)

```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "DevTools - formatting.tech",
    "description": "Free online developer tools for JSON and XML formatting",
    "url": "https://formatting.tech/"
}
</script>
```

#### 2. Organization Schema (Homepage)

```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "DevTools",
    "url": "https://formatting.tech/",
    "description": "Free developer utilities for JSON and XML processing"
}
</script>
```

#### 3. ItemList Schema (Homepage)

```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Developer Tools",
    "description": "Collection of free developer tools",
    "itemListElement": [
        {
            "@type": "ListItem",
            "position": 1,
            "name": "JSON Tools",
            "url": "https://json.formatting.tech/"
        },
        {
            "@type": "ListItem",
            "position": 2,
            "name": "XML Tools",
            "url": "https://xml.formatting.tech/"
        }
    ]
}
</script>
```

#### 4. WebApplication Schema (Tool Pages)

```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "[Tool Name]",
    "description": "[Tool description]",
    "url": "https://[subdomain].formatting.tech/",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
    },
    "featureList": [
        "Feature 1",
        "Feature 2",
        "Feature 3"
    ]
}
</script>
```

#### 5. BreadcrumbList Schema (Tool Pages)

```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://formatting.tech/"
        },
        {
            "@type": "ListItem",
            "position": 2,
            "name": "[Tool Name]",
            "item": "https://[subdomain].formatting.tech/"
        }
    ]
}
</script>
```

#### 6. FAQPage Schema (Tool Pages)

```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "What is [feature]?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "[Detailed answer]"
            }
        }
    ]
}
</script>
```

### Sitemap Configuration

**File:** `sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://formatting.tech/</loc>
    <lastmod>2026-02-05</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://formatting.tech/tools/[tool-name].html</loc>
    <lastmod>2026-02-05</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://[subdomain].formatting.tech/</loc>
    <lastmod>2026-02-05</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
```

**Priority Guidelines:**
- Homepage: `1.0`
- Main tool pages: `0.9`
- Secondary pages: `0.8`

### Robots.txt

**File:** `robots.txt`

```
User-agent: *
Allow: /

Sitemap: https://formatting.tech/sitemap.xml
```

---

## Analytics & Monetization

### Google Analytics 4

**Property ID:** `G-B4LNPCXR9M`

Add to `<head>` section of every HTML page (before other scripts):

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-B4LNPCXR9M"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-B4LNPCXR9M');
</script>
```

### Google AdSense

**Publisher ID:** `ca-pub-4697643139994449`

Add to `<head>` section of every HTML page:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4697643139994449"
    crossorigin="anonymous"></script>
```

### ads.txt

**File:** `ads.txt`

```
google.com, pub-4697643139994449, DIRECT, f08c47fec0942fa0
```

**Purpose:** Declares authorized sellers of ad inventory to prevent ad fraud.

---

## Hosting & Configuration

### Netlify Configuration

**File:** `netlify.toml`

```toml
[build]
  publish = "/"

# Subdomain redirects (200 = rewrite, keeps URL in address bar)
[[redirects]]
  from = "https://json.formatting.tech/*"
  to = "/tools/json-tools.html"
  status = 200

[[redirects]]
  from = "https://xml.formatting.tech/*"
  to = "/tools/xml-tools.html"
  status = 200

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Cache static assets for 1 year
[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Cache HTML for 1 hour
[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "public, max-age=3600"
```

### Security Headers Explained

| Header | Value | Purpose |
|--------|-------|---------|
| X-Frame-Options | DENY | Prevents clickjacking attacks |
| X-Content-Type-Options | nosniff | Prevents MIME type sniffing |
| X-XSS-Protection | 1; mode=block | Enables XSS filter |
| Referrer-Policy | strict-origin-when-cross-origin | Controls referrer information |

### Subdomain Setup

1. **DNS Configuration:** Add A/CNAME records pointing subdomains to Netlify
2. **Netlify Domain Settings:** Add subdomains as domain aliases
3. **Redirect Rules:** Configure 200 rewrites in `netlify.toml`

**Current Subdomains:**
- `json.formatting.tech` → `/tools/json-tools.html`
- `xml.formatting.tech` → `/tools/xml-tools.html`

### JavaScript Fallback Redirect

Add to homepage `<head>` for backup subdomain detection:

```html
<script>
    (function() {
        var host = window.location.hostname;
        if (host === 'json.formatting.tech') {
            window.location.href = '/tools/json-tools.html';
        } else if (host === 'xml.formatting.tech') {
            window.location.href = '/tools/xml-tools.html';
        }
    })();
</script>
```

---

## Performance Optimizations

### Font Preloading

```html
<!-- Font Preloading - Add to <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
```

### Async Script Loading

All external scripts use `async` attribute:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-B4LNPCXR9M"></script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?..."></script>
```

### Caching Strategy

| Asset Type | Cache Duration | Header Value |
|------------|---------------|--------------|
| JavaScript | 1 year | `max-age=31536000, immutable` |
| CSS | 1 year | `max-age=31536000, immutable` |
| HTML | 1 hour | `max-age=3600` |

### No Build Process

- Pure HTML, CSS, JavaScript
- No npm packages or bundlers
- Works offline without server
- Minimal external dependencies (only Google Fonts)

---

## New Feature Checklist

Use this checklist when adding a new tool:

### 1. Create Files

```
[ ] tools/[tool-name].html    - Tool page
[ ] js/[tool-name].js         - Tool logic
[ ] css/[tool-name].css       - Tool-specific styles (if needed)
```

### 2. HTML Page Setup

```
[ ] Add Google Analytics script
[ ] Add Google AdSense script
[ ] Add meta charset and viewport
[ ] Add SEO meta tags (title, description, keywords, author)
[ ] Add canonical URL
[ ] Add Open Graph tags
[ ] Add Twitter Card tags
[ ] Add WebApplication JSON-LD schema
[ ] Add BreadcrumbList JSON-LD schema
[ ] Add FAQPage JSON-LD schema (3-4 questions)
[ ] Add font preconnect links
[ ] Link main.css and tool-specific CSS
[ ] Link utils.js and tool-specific JS
```

### 3. Tool Features

```
[ ] Core functionality (format, validate, etc.)
[ ] Interactive tree/preview view
[ ] Import file functionality
[ ] Export/download functionality
[ ] Copy to clipboard
[ ] Fullscreen mode
[ ] Character count
[ ] Sample data loader
[ ] Clear/reset button
[ ] Status messages (success/error)
```

### 4. Update Existing Files

```
[ ] Add navigation link to index.html
[ ] Add navigation link to all tool pages
[ ] Add tool card to homepage
[ ] Update sitemap.xml with new URLs
[ ] Add subdomain redirect to netlify.toml
[ ] Update ItemList schema on homepage
```

### 5. SEO Checklist

```
[ ] Title tag: 50-65 characters, includes keywords
[ ] Description: 140-158 characters, compelling
[ ] Keywords: 10-15 relevant terms
[ ] Canonical URL: Subdomain version
[ ] All JSON-LD schemas validated (schema.org validator)
[ ] Sitemap includes both /tools/ and subdomain URLs
```

---

## Project Structure

```
devtools/
├── index.html              # Homepage/landing page
├── robots.txt              # Search engine directives
├── sitemap.xml             # XML sitemap for SEO
├── ads.txt                 # AdSense verification
├── netlify.toml            # Hosting configuration
├── README.md               # Project overview
├── FEATURES.md             # This file - feature reference
│
├── css/
│   ├── main.css            # Shared styles (header, footer, buttons)
│   ├── json.css            # JSON tool styles (tree view colors)
│   └── xml.css             # XML tool styles (tree view colors)
│
├── js/
│   ├── utils.js            # Shared utilities (clipboard, escape, nav)
│   ├── json-tools.js       # JSON tool functionality
│   ├── xml-tools.js        # XML tool functionality
│   ├── timestamp-tools.js  # Timestamp converter functionality
│   └── url-tools.js        # URL encoder/decoder functionality
│
└── tools/
    ├── json-tools.html     # JSON tools page
    ├── xml-tools.html      # XML tools page
    ├── timestamp-tools.html # Timestamp converter page
    └── url-tools.html      # URL encoder/decoder page
```

---

## Future Enhancements

Features not yet implemented:

### Essential Missing Features

| Feature | Priority | Notes |
|---------|----------|-------|
| Favicon | High | Add favicon.ico, apple-touch-icon |
| PWA Manifest | Medium | manifest.json for installable app |
| Service Worker | Medium | Offline caching capability |
| Custom 404 Page | Medium | Better error handling |
| ARIA Labels | Medium | Screen reader accessibility |

### Potential New Tools

- **Encoding Tools:** Base64, URL, HTML entities, JWT decoder
- **Text Tools:** Case converter, diff checker, regex tester
- **Color Tools:** Converter, picker, gradient generator
- **Hash & Crypto:** MD5, SHA, UUID, password generator
- **YAML Tools:** Format, validate, convert to/from JSON

### When Adding New Tools

1. Follow the [New Feature Checklist](#new-feature-checklist)
2. Maintain consistent UI patterns (side-by-side layout, status bar)
3. Add all SEO elements before launch
4. Test subdomain routing
5. Update this FEATURES.md with new tool documentation

---

## Quick Reference

### IDs and Keys

| Service | ID/Key |
|---------|--------|
| Google Analytics | `G-B4LNPCXR9M` |
| Google AdSense | `ca-pub-4697643139994449` |

### URLs

| Page | Main URL | Subdomain |
|------|----------|-----------|
| Homepage | `https://formatting.tech/` | - |
| JSON Tools | `https://formatting.tech/tools/json-tools.html` | `https://json.formatting.tech/` |
| XML Tools | `https://formatting.tech/tools/xml-tools.html` | `https://xml.formatting.tech/` |
| Timestamp Converter | `https://formatting.tech/tools/timestamp-tools.html` | `https://timestamp.formatting.tech/` |
| URL Encoder | `https://formatting.tech/tools/url-tools.html` | `https://url.formatting.tech/` |

---

*Last Updated: February 2026*
