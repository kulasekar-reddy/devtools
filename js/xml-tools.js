// XML Tools JavaScript - Single Window In-Place Editing

let currentMode = 'text'; // 'text' or 'tree'
let searchReplace = null;
let searchReplace = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setActiveNav('xml-tools.html');

    const editor = document.getElementById('xml-editor');
    if (editor) {
        editor.addEventListener('input', updateCharCount);
        updateCharCount();
        initHighlightSync('xml-editor');
        
        if (typeof SearchReplace !== 'undefined') {
            searchReplace = new SearchReplace();
            const searchContainer = document.getElementById('xml-search-container');
            if (searchContainer) {
                searchReplace.init(editor, searchContainer);
            }
        }
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            exitFullscreen();
        }
    });

    // Close fullscreen when clicking on backdrop
    const overlay = document.getElementById('fullscreen-overlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                exitFullscreen();
            }
        });
    }

    // Explicitly handle close button click
    const closeBtn = document.querySelector('.fullscreen-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            exitFullscreen();
        });
    }
});

// ===== CHARACTER COUNT =====
function updateCharCount() {
    const editor = document.getElementById('xml-editor');
    const count = document.getElementById('char-count');
    const countFs = document.getElementById('char-count-fs');
    const length = editor ? editor.value.length : 0;
    const text = `${length.toLocaleString()} characters`;
    if (count) count.textContent = text;
    if (countFs) countFs.textContent = text;
}

// ===== STATUS MESSAGES =====
function showStatusMessage(message, type = 'success') {
    const statusBar = document.getElementById('status-bar');
    if (statusBar) {
        statusBar.textContent = message;
        statusBar.className = 'status-bar show ' + type;
        setTimeout(() => {
            statusBar.textContent = '';
            statusBar.className = 'status-bar';
        }, 7000);
    }
}

// ===== MODE SWITCHING =====
function showTextMode() {
    currentMode = 'text';
    const inputContainer = document.querySelector('.input-container');
    if (inputContainer) inputContainer.style.display = 'flex';
    document.getElementById('xml-editor').style.display = 'block';
    document.getElementById('tree-view').classList.remove('active');
    document.getElementById('text-mode-btn').classList.add('active');
    document.getElementById('tree-mode-btn').classList.remove('active');

    const searchContainer = document.getElementById('xml-search-container');
    if (searchContainer) {
        searchContainer.style.display = 'block';
        if (searchReplace) {
            searchReplace.init(document.getElementById('xml-editor'), searchContainer);
        }
    }
}

function showTreeMode() {
    const editor = document.getElementById('xml-editor');
    const content = editor.value.trim();
    clearHighlights();

    if (!content) {
        showStatusMessage('Please enter XML to view as tree', 'error');
        return;
    }

    try {
        const doc = parseXML(content);
        const treeView = document.getElementById('tree-view');
        treeView.innerHTML = buildXMLTree(doc);
        addTreeHandlers();

        currentMode = 'tree';
        const inputContainer = document.querySelector('.input-container');
        if (inputContainer) inputContainer.style.display = 'none';
        editor.style.display = 'none';
        treeView.classList.add('active');
        document.getElementById('text-mode-btn').classList.remove('active');
        document.getElementById('tree-mode-btn').classList.add('active');
        
        const searchContainer = document.getElementById('xml-search-container');
        if (searchContainer) searchContainer.style.display = 'none';

    } catch (error) {
        showStatusMessage('Invalid XML: ' + error.message, 'error');
        const line = getXmlErrorLine(error.message, content);
        if (line) highlightError(line);
    }
}

// ===== XML PARSING =====
function parseXML(xmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
        const errorText = parseError.textContent || parseError.innerText;
        throw new Error(errorText.split('\n')[0] || 'XML parsing error');
    }
    return doc;
}

// ===== FORMAT XML =====
function formatXML() {
    const editor = document.getElementById('xml-editor');
    const content = editor.value.trim();
    clearHighlights();

    if (!content) {
        showStatusMessage('Please enter XML to format', 'error');
        return;
    }

    try {
        parseXML(content); // Validate first
        const formatted = formatXMLString(content);
        editor.value = formatted;
        updateCharCount();
        showTextMode();
        showStatusMessage('XML formatted successfully');

        // Update fullscreen if open
        updateFullscreenContent();
    } catch (error) {
        showStatusMessage('Invalid XML: ' + error.message, 'error');
        const line = getXmlErrorLine(error.message, content);
        if (line) highlightError(line);
    }
}

function formatXMLString(xml) {
    const PADDING = '  ';
    let formatted = '';
    let indent = 0;

    xml = xml.replace(/>\s*</g, '><').trim();

    const tokens = [];
    let current = '';
    let inCDATA = false;
    let inComment = false;
    let inPI = false;

    for (let i = 0; i < xml.length; i++) {
        const char = xml[i];
        current += char;

        if (current.endsWith('<![CDATA[')) inCDATA = true;
        if (inCDATA && current.endsWith(']]>')) {
            inCDATA = false;
            tokens.push(current);
            current = '';
            continue;
        }
        if (current.endsWith('<!--')) inComment = true;
        if (inComment && current.endsWith('-->')) {
            inComment = false;
            tokens.push(current);
            current = '';
            continue;
        }
        if (current.endsWith('<?')) inPI = true;
        if (inPI && current.endsWith('?>')) {
            inPI = false;
            tokens.push(current);
            current = '';
            continue;
        }

        if (!inCDATA && !inComment && !inPI && char === '>') {
            tokens.push(current);
            current = '';
        }
    }
    if (current.trim()) tokens.push(current);

    tokens.forEach((token, index) => {
        token = token.trim();
        if (!token) return;

        if (token.startsWith('<?xml')) {
            formatted += token + '\n';
        } else if (token.startsWith('<?')) {
            formatted += PADDING.repeat(indent) + token + '\n';
        } else if (token.startsWith('<!--')) {
            formatted += PADDING.repeat(indent) + token + '\n';
        } else if (token.startsWith('<![CDATA[')) {
            formatted += PADDING.repeat(indent) + token + '\n';
        } else if (token.startsWith('</')) {
            indent = Math.max(0, indent - 1);
            formatted += PADDING.repeat(indent) + token + '\n';
        } else if (token.endsWith('/>')) {
            formatted += PADDING.repeat(indent) + token + '\n';
        } else if (token.startsWith('<')) {
            formatted += PADDING.repeat(indent) + token;
            const nextToken = tokens[index + 1]?.trim();
            if (nextToken && !nextToken.startsWith('<')) {
                // Text content follows
            } else {
                formatted += '\n';
                indent++;
            }
        } else {
            const nextToken = tokens[index + 1]?.trim();
            if (nextToken && nextToken.startsWith('</')) {
                formatted += token;
                indent = Math.max(0, indent - 1);
            } else {
                formatted += PADDING.repeat(indent) + token + '\n';
            }
        }
    });

    return formatted.trim();
}

// ===== MINIFY XML =====
function minifyXML() {
    const editor = document.getElementById('xml-editor');
    const content = editor.value.trim();
    clearHighlights();

    if (!content) {
        showStatusMessage('Please enter XML to minify', 'error');
        return;
    }

    try {
        parseXML(content);
        const minified = content.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
        editor.value = minified;
        updateCharCount();
        showTextMode();
        showStatusMessage('XML minified successfully');
        updateFullscreenContent();
    } catch (error) {
        showStatusMessage('Invalid XML: ' + error.message, 'error');
        const line = getXmlErrorLine(error.message, content);
        if (line) highlightError(line);
    }
}

// ===== VALIDATE XML =====
function validateXML() {
    const editor = document.getElementById('xml-editor');
    const content = editor.value.trim();
    clearHighlights();

    if (!content) {
        showStatusMessage('Please enter XML to validate', 'error');
        return;
    }

    try {
        const doc = parseXML(content);
        const root = doc.documentElement;
        const stats = getXMLStats(root);

        let message = `Valid XML - Root: <${root.tagName}>, Elements: ${stats.elements}, Attributes: ${stats.attributes}, Depth: ${stats.maxDepth}`;
        showStatusMessage(message, 'success');
    } catch (error) {
        showStatusMessage('Invalid XML: ' + error.message, 'error');
        const line = getXmlErrorLine(error.message, content);
        if (line) highlightError(line);
    }
}

function getXMLStats(node, depth = 0) {
    const stats = { elements: 0, attributes: 0, textNodes: 0, comments: 0, cdata: 0, maxDepth: depth };

    if (node.nodeType === Node.ELEMENT_NODE) {
        stats.elements = 1;
        stats.attributes = node.attributes.length;
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        stats.textNodes = 1;
    } else if (node.nodeType === Node.COMMENT_NODE) {
        stats.comments = 1;
    } else if (node.nodeType === Node.CDATA_SECTION_NODE) {
        stats.cdata = 1;
    }

    node.childNodes.forEach(child => {
        const childStats = getXMLStats(child, depth + 1);
        stats.elements += childStats.elements;
        stats.attributes += childStats.attributes;
        stats.textNodes += childStats.textNodes;
        stats.comments += childStats.comments;
        stats.cdata += childStats.cdata;
        stats.maxDepth = Math.max(stats.maxDepth, childStats.maxDepth);
    });

    return stats;
}

// ===== TREE VIEW =====
function buildXMLTree(node, level = 0) {
    let html = '';
    const indent = '  '.repeat(level);

    if (node.nodeType === Node.DOCUMENT_NODE) {
        if (node.xmlVersion) {
            const encoding = node.xmlEncoding ? ` encoding="${node.xmlEncoding}"` : '';
            html += `<span class="tree-line"><span class="tree-declaration">&lt;?xml version="${node.xmlVersion}"${encoding}?&gt;</span></span>\n`;
        }
        node.childNodes.forEach(child => {
            html += buildXMLTree(child, level);
        });
        return html;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName;
        const hasChildren = node.childNodes.length > 0;
        const hasOnlyTextChild = hasChildren && node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE;
        const elementCount = countChildElements(node);

        let attrsHtml = '';
        if (node.attributes.length > 0) {
            Array.from(node.attributes).forEach(attr => {
                attrsHtml += ` <span class="tree-attribute">${escapeHtml(attr.name)}</span>=<span class="tree-attr-value">"${escapeHtml(attr.value)}"</span>`;
            });
        }

        const formattedTagName = formatTagName(tagName);

        if (!hasChildren) {
            html += `<span class="tree-line">${indent}<span class="tree-bracket">&lt;</span>${formattedTagName}${attrsHtml}<span class="tree-bracket"> /&gt;</span><span class="tree-empty-badge">(empty)</span></span>\n`;
        } else if (hasOnlyTextChild) {
            const text = node.textContent.trim();
            html += `<span class="tree-line">${indent}<span class="tree-bracket">&lt;</span>${formattedTagName}${attrsHtml}<span class="tree-bracket">&gt;</span><span class="tree-text">${escapeHtml(text)}</span><span class="tree-bracket">&lt;/</span>${formattedTagName}<span class="tree-bracket">&gt;</span></span>\n`;
        } else {
            html += `<span class="tree-line tree-expandable">${indent}<span class="tree-toggle">-</span> <span class="tree-bracket">&lt;</span>${formattedTagName}${attrsHtml}<span class="tree-bracket">&gt;</span><span class="tree-child-count">${elementCount} child${elementCount !== 1 ? 'ren' : ''}</span></span>\n`;
            html += `<div class="tree-node">`;
            node.childNodes.forEach(child => {
                html += buildXMLTree(child, level + 1);
            });
            html += `</div>`
            html += `<span class="tree-line">${indent}<span class="tree-bracket">&lt;/</span>${formattedTagName}<span class="tree-bracket">&gt;</span></span>\n`;
        }
    } else if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) {
            html += `<span class="tree-line">${indent}<span class="tree-text">${escapeHtml(text)}</span></span>\n`;
        }
    } else if (node.nodeType === Node.COMMENT_NODE) {
        html += `<span class="tree-line">${indent}<span class="tree-comment">&lt;!-- ${escapeHtml(node.textContent.trim())} --&gt;</span></span>\n`;
    } else if (node.nodeType === Node.CDATA_SECTION_NODE) {
        html += `<span class="tree-line">${indent}<span class="tree-cdata">&lt;![CDATA[${escapeHtml(node.textContent)}]]&gt;</span></span>\n`;
    } else if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
        html += `<span class="tree-line">${indent}<span class="tree-pi">&lt;?${node.target} ${escapeHtml(node.data)}?&gt;</span></span>\n`;
    }

    return html;
}

function formatTagName(tagName) {
    if (tagName.includes(':')) {
        const parts = tagName.split(':');
        return `<span class="tree-namespace">${escapeHtml(parts[0])}</span>:<span class="tree-element">${escapeHtml(parts[1])}</span>`;
    }
    return `<span class="tree-element">${escapeHtml(tagName)}</span>`;
}

function countChildElements(node) {
    let count = 0;
    node.childNodes.forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) count++;
        else if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) count++;
        else if (child.nodeType === Node.COMMENT_NODE) count++;
        else if (child.nodeType === Node.CDATA_SECTION_NODE) count++;
    });
    return count;
}

function addTreeHandlers() {
    document.querySelectorAll('.tree-expandable').forEach(node => {
        node.addEventListener('click', function(e) {
            const toggle = this.querySelector('.tree-toggle');
            const treeNode = this.nextElementSibling;
            if (treeNode && treeNode.classList.contains('tree-node')) {
                treeNode.classList.toggle('tree-collapsed');
                toggle.textContent = treeNode.classList.contains('tree-collapsed') ? '+' : '-';
            }
        });
    });
}

function collapseAll() {
    const overlay = document.getElementById('fullscreen-overlay');
    const isFullscreen = overlay && !overlay.hidden;

    let container;
    if (isFullscreen) {
        container = document.getElementById('fullscreen-content');
    } else if (currentMode === 'tree') {
        container = document.getElementById('tree-view');
    }

    if (!container) return;

    container.querySelectorAll('.tree-node').forEach(node => node.classList.add('tree-collapsed'));
    container.querySelectorAll('.tree-toggle').forEach(toggle => toggle.textContent = '+');
    showStatusMessage('All nodes collapsed');
}

function expandAll() {
    const overlay = document.getElementById('fullscreen-overlay');
    const isFullscreen = overlay && !overlay.hidden;

    let container;
    if (isFullscreen) {
        container = document.getElementById('fullscreen-content');
    } else if (currentMode === 'tree') {
        container = document.getElementById('tree-view');
    }

    if (!container) return;

    container.querySelectorAll('.tree-node').forEach(node => node.classList.remove('tree-collapsed'));
    container.querySelectorAll('.tree-toggle').forEach(toggle => toggle.textContent = '-');
    showStatusMessage('All nodes expanded');
}

// ===== SAMPLE DATA =====
function loadSample() {
    clearHighlights();
    const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore xmlns:bk="http://example.com/books">
    <bk:book category="fiction" isbn="978-0-13-468599-1">
        <bk:title lang="en">The Great Gatsby</bk:title>
        <bk:author>F. Scott Fitzgerald</bk:author>
        <bk:year>1925</bk:year>
        <bk:price currency="USD">10.99</bk:price>
        <bk:description><![CDATA[A story of decadence & excess in the Jazz Age.]]></bk:description>
    </bk:book>
    <bk:book category="non-fiction" isbn="978-0-06-112008-4">
        <bk:title lang="en">To Kill a Mockingbird</bk:title>
        <bk:author>Harper Lee</bk:author>
        <bk:year>1960</bk:year>
        <bk:price currency="USD">12.99</bk:price>
        <!-- A classic of American literature -->
    </bk:book>
    <bk:book category="children">
        <bk:title lang="en">Charlotte's Web</bk:title>
        <bk:author>E.B. White</bk:author>
        <bk:year>1952</bk:year>
        <bk:price currency="USD">8.99</bk:price>
        <bk:reviews />
    </bk:book>
</bookstore>`;

    document.getElementById('xml-editor').value = sampleXML;
    updateCharCount();
    showTextMode();
    showStatusMessage('Sample XML loaded');
}

// ===== CLEAR =====
function clearEditor() {
    clearHighlights();
    document.getElementById('xml-editor').value = '';
    document.getElementById('tree-view').innerHTML = '';
    updateCharCount();
    showTextMode();
    showStatusMessage('Editor cleared');
}

// ===== IMPORT/EXPORT =====
function importXML() {
    document.getElementById('file-input').click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        clearHighlights();
        document.getElementById('xml-editor').value = e.target.result;
        updateCharCount();
        showTextMode();
        showStatusMessage(`Imported ${file.name}`);
    };
    reader.onerror = function() {
        showStatusMessage('Error reading file', 'error');
    };
    reader.readAsText(file);
    event.target.value = '';
}

function exportXML() {
    const content = document.getElementById('xml-editor').value;
    if (!content.trim()) {
        showStatusMessage('Nothing to export', 'error');
        return;
    }

    const blob = new Blob([content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatusMessage('XML exported successfully');
}

// ===== COPY =====
function copyContent() {
    const editor = document.getElementById('xml-editor');
    const overlay = document.getElementById('fullscreen-overlay');
    const isFullscreen = overlay && !overlay.hidden;

    let content;
    if (isFullscreen) {
        // In fullscreen, get content from fullscreen area
        const fsTreeView = document.querySelector('#fullscreen-content .tree-view');
        const fsEditor = document.getElementById('xml-editor-fs');
        if (fsTreeView) {
            content = editor.value; // Copy the actual XML, not tree text
        } else if (fsEditor) {
            content = fsEditor.value;
        } else {
            content = editor.value;
        }
    } else {
        content = editor.value;
    }

    if (!content || !content.trim()) {
        showStatusMessage('Nothing to copy', 'error');
        return;
    }

    copyToClipboard(content).then(() => {
        showStatusMessage('Copied to clipboard');
    }).catch(() => {
        showStatusMessage('Failed to copy', 'error');
    });
}

// ===== FULLSCREEN =====
function isFullscreenActive() {
    const overlay = document.getElementById('fullscreen-overlay');
    return overlay && !overlay.hidden;
}

function toggleFullscreen() {
    const overlay = document.getElementById('fullscreen-overlay');
    const content = document.getElementById('fullscreen-content');
    const editor = document.getElementById('xml-editor');

    if (overlay.hidden) {
        content.innerHTML = '';

        if (currentMode === 'tree') {
            // Show tree view in fullscreen
            const treeView = document.getElementById('tree-view');
            const treeClone = document.createElement('div');
            treeClone.className = 'tree-view active';
            treeClone.innerHTML = treeView.innerHTML;
            content.appendChild(treeClone);
            // Re-add tree handlers to the cloned tree
            addTreeHandlersToContainer(treeClone);
        } else {
            // Show textarea in fullscreen
            createFullscreenTextarea(editor.value);
        }

        overlay.hidden = false;
        document.body.classList.add('fullscreen-active');

        if (currentMode === 'text' && searchReplace) {
            const fsContainer = document.getElementById('fullscreen-search-container');
            const fsEditor = document.getElementById('xml-editor-fs'); // This ID is created by createFullscreenTextarea
            if (fsContainer && fsEditor) {
                fsContainer.style.display = 'block';
                searchReplace.init(fsEditor, fsContainer);
            }
        } else if (currentMode === 'tree') {
            const fsContainer = document.getElementById('fullscreen-search-container');
            if (fsContainer) fsContainer.style.display = 'none';
        }
    } else {
        exitFullscreen();
    }
}

function createFullscreenTextarea(value) {
    const content = document.getElementById('fullscreen-content');
    const editor = document.getElementById('xml-editor');

    content.innerHTML = '';
    
    const inputContainer = document.createElement('div');
    inputContainer.className = 'input-container';
    
    const backdrop = document.createElement('div');
    backdrop.className = 'highlight-backdrop';
    
    const highlights = document.createElement('div');
    highlights.className = 'highlights';
    
    backdrop.appendChild(highlights);
    inputContainer.appendChild(backdrop);
    
    const textarea = document.createElement('textarea');
    textarea.id = 'xml-editor-fs';
    textarea.value = value;
    textarea.addEventListener('input', function() {
        editor.value = this.value;
        updateCharCount();
    });
    
    inputContainer.appendChild(textarea);
    content.appendChild(inputContainer);
    
    initHighlightSync('xml-editor-fs');
}

function addTreeHandlersToContainer(container) {
    container.querySelectorAll('.tree-expandable').forEach(node => {
        node.addEventListener('click', function(e) {
            e.stopPropagation();
            const toggle = this.querySelector('.tree-toggle');
            const treeNode = this.nextElementSibling;
            if (treeNode && treeNode.classList.contains('tree-node')) {
                treeNode.classList.toggle('tree-collapsed');
                toggle.textContent = treeNode.classList.contains('tree-collapsed') ? '+' : '-';
            }
        });
    });
}

function exitFullscreen() {
    const overlay = document.getElementById('fullscreen-overlay');
    if (overlay) {
        overlay.hidden = true;
        document.body.classList.remove('fullscreen-active');
        
        if (searchReplace && currentMode === 'text') {
            const normalContainer = document.getElementById('xml-search-container');
            const normalEditor = document.getElementById('xml-editor');
            if (normalContainer && normalEditor) {
                searchReplace.init(normalEditor, normalContainer);
            }
        }
    }
}

function showTreeModeFullscreen() {
    if (!isFullscreenActive()) return;

    const editor = document.getElementById('xml-editor');
    const content = editor.value.trim();
    clearHighlights();

    if (!content) {
        showStatusMessage('Please enter XML to view as tree', 'error');
        return;
    }

    const fsSearchContainer = document.getElementById('fullscreen-search-container');
    if (fsSearchContainer) fsSearchContainer.style.display = 'none';

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'application/xml');
    const parseError = doc.querySelector('parsererror');

    if (parseError) {
        showStatusMessage('Invalid XML: Unable to parse', 'error');
        return;
    }

    const fsContent = document.getElementById('fullscreen-content');

    // Create tree view in fullscreen
    const treeClone = document.createElement('div');
    treeClone.className = 'tree-view active';
    treeClone.innerHTML = buildXMLTree(doc);

    fsContent.innerHTML = '';
    fsContent.appendChild(treeClone);
    addTreeHandlersToContainer(treeClone);

    currentMode = 'tree';
    showStatusMessage('Tree view generated');
}

function updateFullscreenContent() {
    if (!isFullscreenActive()) return;

    const editor = document.getElementById('xml-editor');
    const content = document.getElementById('fullscreen-content');
    const fsEditor = document.getElementById('xml-editor-fs');

    // If there's a textarea in fullscreen, update it
    if (fsEditor) {
        fsEditor.value = editor.value;
    } else {
        // If tree view was showing, switch to textarea with new content
        createFullscreenTextarea(editor.value);
    }
}

function getXmlErrorLine(errorMessage, xmlContent) {
    const lineMatch = errorMessage.match(/line (\d+)/i) || errorMessage.match(/Line Number (\d+)/i);
    if (lineMatch) {
        return parseInt(lineMatch[1], 10);
    }
    return null;
}