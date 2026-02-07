// js/search-replace.js

class SearchReplace {
    constructor() {
        this.editor = null;
        this.container = null;
        this.matches = [];
        this.currentIndex = -1;
        this.searchTerm = '';
        this.replaceTerm = '';
        this.isRegex = false;
        this.caseSensitive = false;
    }

    /**
     * Initialize the SearchReplace instance.
     * @param {HTMLElement} editorElement - The textarea element to search in.
     * @param {HTMLElement} uiContainer - The container to inject the search UI into.
     */
    init(editorElement, uiContainer) {
        this.editor = editorElement;
        this.container = uiContainer;
        
        if (!this.container) {
            console.error('SearchReplace: UI container not provided.');
            return;
        }

        this.renderUI();
        this.attachUIEvents();
        
        if (this.editor) {
            this.updateEditor(this.editor);
        }
    }

    /**
     * Update the target editor (e.g., when switching to fullscreen).
     * @param {HTMLElement} newEditor - The new textarea element.
     */
    updateEditor(newEditor) {
        this.editor = newEditor;
        this.matches = [];
        this.currentIndex = -1;
        
        // Clear old highlights if any (conceptually, though they are attached to the DOM of the old editor's container)
        // We actually need to re-run search to highlight on the new editor
        if (this.searchTerm) {
            this.search(this.searchTerm);
        }
    }

    renderUI() {
        this.container.innerHTML = "`
            <div class=\"search-toolbar\">
                <div class=\"search-group\">
                    <input type=\"text\" id=\"sr-search-input\" placeholder=\"Find...\" class=\"search-input">
                    <div class=\"search-options\">
                        <label title=\"Case Sensitive\"><input type=\"checkbox\" id=\"sr-case\"> Aa</label>
                        <label title=\"Regular Expression\"><input type=\"checkbox\" id=\"sr-regex\"> .*</label>
                    </div>
                    <button id=\"sr-prev\" title=\"Previous Match\">↑</button>
                    <button id=\"sr-next\" title=\"Next Match\">↓</button>
                </div>
                <div class=\"replace-group\">
                    <input type=\"text\" id=\"sr-replace-input\" placeholder=\"Replace...\" class=\"search-input">
                    <button id=\"sr-replace\" title=\"Replace Current\">Replace</button>
                    <button id=\"sr-replace-all\" title=\"Replace All\">Replace All</button>
                </div>
                <div class=\"search-status\" id=\"sr-status\"></div>
            </div>
        `";
    }

    attachUIEvents() {
        const searchInput = this.container.querySelector('#sr-search-input');
        const replaceInput = this.container.querySelector('#sr-replace-input');
        const caseCheck = this.container.querySelector('#sr-case');
        const regexCheck = this.container.querySelector('#sr-regex');
        const prevBtn = this.container.querySelector('#sr-prev');
        const nextBtn = this.container.querySelector('#sr-next');
        const replaceBtn = this.container.querySelector('#sr-replace');
        const replaceAllBtn = this.container.querySelector('#sr-replace-all');

        const triggerSearch = () => {
            this.searchTerm = searchInput.value;
            this.caseSensitive = caseCheck.checked;
            this.isRegex = regexCheck.checked;
            this.search(this.searchTerm);
        };

        searchInput.addEventListener('input', triggerSearch);
        caseCheck.addEventListener('change', triggerSearch);
        regexCheck.addEventListener('change', triggerSearch);

        replaceInput.addEventListener('input', (e) => {
            this.replaceTerm = e.target.value;
        });

        nextBtn.addEventListener('click', () => this.findNext());
        prevBtn.addEventListener('click', () => this.findPrevious());
        replaceBtn.addEventListener('click', () => this.replace());
        replaceAllBtn.addEventListener('click', () => this.replaceAll());
        
        // Enter key in search input -> Next
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) this.findPrevious();
                else this.findNext();
                e.preventDefault();
            }
        });

         // Enter key in replace input -> Replace
         replaceInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.replace();
                e.preventDefault();
            }
        });
    }

    search(term) {
        this.clearHighlights();
        this.matches = [];
        this.currentIndex = -1;
        this.updateStatus('');

        if (!term || !this.editor) return;

        const content = this.editor.value;
        let flags = 'g';
        if (!this.caseSensitive) flags += 'i';

        try {
            let regex;
            if (this.isRegex) {
                regex = new RegExp(term, flags);
            } else {
                regex = new RegExp(this.escapeRegExp(term), flags);
            }

            let match;
            while ((match = regex.exec(content)) !== null) {
                this.matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0]
                });
                // Prevent infinite loop for zero-length matches (regex edge case)
                if (match.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
            }

            if (this.matches.length > 0) {
                this.currentIndex = 0;
                this.highlightMatches();
                this.scrollToMatch(this.currentIndex);
                this.updateStatus(`${this.currentIndex + 1}/${this.matches.length}`);
            } else {
                this.updateStatus('No matches');
            }

        } catch (e) {
            this.updateStatus('Invalid Regex');
            console.error(e);
        }
    }

    findNext() {
        if (this.matches.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.matches.length;
        this.scrollToMatch(this.currentIndex);
        this.updateStatus(`${this.currentIndex + 1}/${this.matches.length}`);
        this.updateHighlightStyles();
    }

    findPrevious() {
        if (this.matches.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + this.matches.length) % this.matches.length;
        this.scrollToMatch(this.currentIndex);
        this.updateStatus(`${this.currentIndex + 1}/${this.matches.length}`);
        this.updateHighlightStyles();
    }

    replace() {
        if (this.matches.length === 0 || this.currentIndex === -1) return;

        const match = this.matches[this.currentIndex];
        const content = this.editor.value;
        
        const newValue = content.substring(0, match.start) + this.replaceTerm + content.substring(match.end);
        
        // Update editor
        this.editor.value = newValue;
        
        // Trigger input event to update other listeners (like char count or validation)
        this.editor.dispatchEvent(new Event('input', { bubbles: true }));

        // Re-search to refresh matches
        this.search(this.searchTerm);
    }

    replaceAll() {
        if (this.matches.length === 0) return;

        const content = this.editor.value;
        let flags = 'g';
        if (!this.caseSensitive) flags += 'i';

        try {
            let regex;
            if (this.isRegex) {
                regex = new RegExp(this.searchTerm, flags);
            } else {
                regex = new RegExp(this.escapeRegExp(this.searchTerm), flags);
            }

            const newValue = content.replace(regex, this.replaceTerm);
            this.editor.value = newValue;
            this.editor.dispatchEvent(new Event('input', { bubbles: true }));
            
            this.search(this.searchTerm); // Refresh (likely 0 matches unless replace term contains search term)

        } catch (e) {
            console.error(e);
        }
    }

    getHighlightsContainer() {
        if (!this.editor) return null;
        // Assuming structure: .input-container > .highlights + textarea
        const container = this.editor.closest('.input-container');
        if (!container) return null;
        return container.querySelector('.highlights');
    }

    highlightMatches() {
        const highlightsContainer = this.getHighlightsContainer();
        if (!highlightsContainer) return;

        highlightsContainer.innerHTML = '';
        
        const content = this.editor.value;
        const computedStyle = window.getComputedStyle(this.editor);
        const lineHeight = parseFloat(computedStyle.lineHeight);
        const paddingTop = parseFloat(computedStyle.paddingTop);
        const paddingLeft = parseFloat(computedStyle.paddingLeft);
        const borderLeft = parseFloat(computedStyle.borderLeftWidth);
        const fontFamily = computedStyle.fontFamily;
        const fontSize = computedStyle.fontSize;

        // Helper to measure text width
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${fontSize} ${fontFamily}`;
        
        // We need to handle lines. 
        // Simple approach: calculate line number and column for each match
        // NOTE: This assumes monospaced font or relies on accurate measurement. 
        // Given existing utils.js logic, it seems we are dealing with code editors (monospaced).
        // However, measuring precise pixels for variable width fonts (if any) is hard.
        // We will assume pre-wrap / code behavior.
        
        // Better approach for exact positioning in textarea:
        // Use a mirror div? existing utils.js doesn't seem to use a mirror div for the main error highlighting, 
        // just line number.
        // For search highlighting (inline), we need exact coordinates.
        // Let's use the temporary span approach which is robust enough for simple editors.
        
        const tempSpan = document.createElement('span');
        tempSpan.style.font = context.font;
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.position = 'absolute';
        tempSpan.style.whiteSpace = 'pre';
        document.body.appendChild(tempSpan);

        this.matches.forEach((match, index) => {
            const preMatch = content.substring(0, match.start);
            const lines = preMatch.split('\n');
            const lineIndex = lines.length - 1;
            const lineText = lines[lineIndex];
            
            // Measure width of text before match on the same line
            tempSpan.textContent = lineText;
            const leftOffset = tempSpan.offsetWidth;
            
            // Measure match width
            tempSpan.textContent = match.text;
            const matchWidth = tempSpan.offsetWidth;

            const top = paddingTop + (lineIndex * lineHeight);
            const left = paddingLeft + borderLeft + leftOffset;
            
            const span = document.createElement('div'); // using div for absolute pos
            span.className = 'search-highlight';
            if (index === this.currentIndex) span.classList.add('current-match');
            
            span.style.top = `${top}px`;
            span.style.left = `${left}px`;
            span.style.width = `${matchWidth}px`;
            span.style.height = `${lineHeight}px`;
            
            highlightsContainer.appendChild(span);
        });

        document.body.removeChild(tempSpan);
    }

    updateHighlightStyles() {
        const highlightsContainer = this.getHighlightsContainer();
        if (!highlightsContainer) return;
        
        const highlights = highlightsContainer.querySelectorAll('.search-highlight');
        highlights.forEach((el, i) => {
            if (i === this.currentIndex) el.classList.add('current-match');
            else el.classList.remove('current-match');
        });
    }

    clearHighlights() {
        const container = this.getHighlightsContainer();
        if (container) {
            // Only clear search highlights, not error highlights if they exist?
            // Existing utils.js clears EVERYTHING in .highlights.
            // We should probably follow that convention or risk overlap.
            // But error highlights are usually rows.
            // Let's clear everything for now to be safe, or just remove .search-highlight elements
            // If we only remove search-highlight, we might leave stale error highlights.
            // Let's remove only our class if possible, but innerHTML='' is safer to avoid leaks.
            // However, if error highlighting is active, searching might clear it. That's acceptable.
            container.innerHTML = ''; 
        }
    }

    scrollToMatch(index) {
        if (index < 0 || index >= this.matches.length || !this.editor) return;
        
        const match = this.matches[index];
        const preMatch = this.editor.value.substring(0, match.start);
        const lineIndex = (preMatch.match(/\n/g) || []).length;
        
        const computedStyle = window.getComputedStyle(this.editor);
        const lineHeight = parseFloat(computedStyle.lineHeight);
        
        // Center the match if possible
        const editorHeight = this.editor.clientHeight;
        const scrollTarget = (lineIndex * lineHeight) - (editorHeight / 2) + (lineHeight / 2);
        
        this.editor.scrollTop = Math.max(0, scrollTarget);
        this.updateHighlightStyles();
    }

    updateStatus(msg) {
        const statusEl = this.container.querySelector('#sr-status');
        if (statusEl) statusEl.textContent = msg;
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\\]/g, '\\$&');
    }
}