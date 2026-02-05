# DevTools - Multi-Tool Website for Developers

A scalable, modular collection of free developer utilities. Built with clean separation of concerns for easy expansion.

## 🏗️ Project Structure

```
devtools/
├── index.html              # Homepage/landing page
├── css/
│   ├── main.css           # Shared styles for all tools
│   └── json.css           # JSON-specific styles
├── js/
│   ├── utils.js           # Shared utility functions
│   └── json-tools.js      # JSON tool functionality
└── tools/
    └── json-tools.html    # JSON tools page
```

## 🎯 Current Features

### JSON Tools (Fully Implemented)
- ✅ **Escape / Unescape** - Handle special characters in JSON strings
- ✅ **Format JSON** - Beautify with 2-space indentation
- ✅ **Minify JSON** - Compress JSON to single line
- ✅ **String to JSON** - Convert plain strings to JSON format
- ✅ **JSON to String** - Parse and convert JSON to strings
- ✅ **Validate JSON** - Check validity with detailed error messages
- ✅ **Tree View** - Interactive collapsible hierarchical visualization

## 📦 Adding New Tools

The architecture is designed for easy expansion. Here's how to add a new tool category (e.g., XML, Encoding, etc.):

### 1. Create Tool-Specific CSS
```bash
# Create a new CSS file for your tool
devtools/css/xml.css
```

### 2. Create Tool-Specific JavaScript
```bash
# Create a new JS file with your tool's logic
devtools/js/xml-tools.js
```

### 3. Create Tool Page
```bash
# Create the HTML page in the tools directory
devtools/tools/xml-tools.html
```

### 4. Update Navigation
Add the new tool link to the navigation in:
- `index.html` (homepage)
- `tools/json-tools.html` (and all other tool pages)

### 5. Add Tool Card to Homepage
Add a new tool card in `index.html` to showcase the new tool.

## 🎨 Design Principles

- **Simple & Clean** - Minimal colors, maximum focus on functionality
- **Side-by-Side Layout** - Input and output always visible together
- **Maximum Data Space** - Wide text areas for comfortable editing
- **Responsive** - Works on all screen sizes
- **No Dependencies** - Pure HTML, CSS, and JavaScript

## 🔧 File Organization Benefits

### Shared Resources (`main.css` & `utils.js`)
- **Header/Footer** - Consistent navigation across all tools
- **Base Styles** - Typography, buttons, forms, layouts
- **Utility Functions** - Status messages, character counters, clipboard
- **Easy Maintenance** - Change once, applies everywhere

### Tool-Specific Resources
- **Isolated CSS** - Each tool has its own styling (e.g., `json.css` for tree view)
- **Isolated JS** - Each tool has its own logic (e.g., `json-tools.js`)
- **No Conflicts** - Tools don't interfere with each other
- **Easy Debugging** - Clear separation makes troubleshooting simple

## 🚀 Usage

1. Open `index.html` in any modern web browser
2. Navigate to the tool you need
3. All tools work completely offline - no server required!

## 📝 Future Tool Ideas

Based on the homepage, planned tools include:
- XML Tools (format, validate, XPath)
- Encoding Tools (Base64, URL, HTML entities, JWT)
- Text Tools (case converter, diff checker, regex tester)
- Color Tools (converter, picker, gradient generator)
- Hash & Crypto (MD5, SHA, UUID, password generator)

## 🎯 Code Reusability

### Reusable Functions (in `utils.js`)
- `showStatus(statusId, message, type)` - Display status messages
- `initCharCounter(inputId, countId)` - Setup character counting
- `copyToClipboard(text)` - Copy text with fallback
- `escapeHtml(text)` - Safely escape HTML
- `setActiveNav(currentPage)` - Highlight active navigation

### Reusable Styles (in `main.css`)
- `.editor-layout` - Side-by-side input/output grid
- `.editor-panel` - Container for text areas
- `.controls` - Button toolbar
- `.status-bar` - Success/error messages
- `.workspace` - Main content container

## 💡 Best Practices Applied

1. **Separation of Concerns** - HTML, CSS, JS in separate files
2. **Modularity** - Each tool is independent
3. **Reusability** - Shared code in common files
4. **Scalability** - Easy to add new tools
5. **Maintainability** - Clear structure and naming
6. **Performance** - Minimal CSS/JS, no external dependencies
7. **User Experience** - Keyboard shortcuts, real-time feedback

## 🛠️ Development Workflow

To add a new tool category:

1. **Plan the features** - What operations will it support?
2. **Create CSS file** - Any unique styles for this tool
3. **Create JS file** - Implement the tool logic
4. **Create HTML page** - Build the user interface
5. **Update navigation** - Add links in all pages
6. **Update homepage** - Add tool card with features
7. **Test thoroughly** - Verify all features work

## 🌐 Deployment & Subdomains

This project is configured to work with a custom domain (`formatting.tech`). The `CNAME` file in the root directory handles the main domain configuration for GitHub Pages.

### Setting up Subdomains (json.formatting.tech & xml.formatting.tech)

If you are hosting on **GitHub Pages**, there is a limitation: **GitHub Pages supports only one custom domain per repository.**

To make the subdomains work, you have two options:

#### Option 1: DNS Forwarding (Recommended for GitHub Pages)
Configure "URL Redirect" or "Forwarding" rules in your DNS provider's dashboard (e.g., Namecheap, GoDaddy, Cloudflare):
*   `json.formatting.tech` → `https://formatting.tech/tools/json-tools.html`
*   `xml.formatting.tech` → `https://formatting.tech/tools/xml-tools.html`

#### Option 2: Advanced Hosting (Netlify, Vercel, Cloudflare Pages)
If you want to keep the subdomains in the address bar using a single repository, deploy this project to **Netlify** or **Vercel**. These platforms support "Domain Aliases" which allow multiple domains to serve the same site.
1.  Connect your repo to Netlify/Vercel.
2.  Add `json.formatting.tech` and `xml.formatting.tech` as domain aliases in the project settings.
3.  The script in `index.html` will automatically detect the subdomain and redirect to the correct tool.

## 📄 License

Free to use, modify, and distribute. No attribution required.
