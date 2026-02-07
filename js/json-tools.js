// JSON Tools JavaScript - Large File Support with Virtual Tree

// ===== GLOBALS =====
let currentMode = 'text'; // 'text' or 'tree'
let jsonWorker = null;
let workerCallbacks = new Map();
let callbackId = 0;

// Parsed JSON state
let parsedJson = null;
let jsonStats = null;
let searchReplace = null;

// Virtual tree state
const treeState = {
    nodes: new Map(),          // id -> node data
    visibleNodeIds: [],        // IDs of visible nodes (in order)
    expandedNodes: new Set(),  // IDs of expanded nodes
    rowHeight: 24,
    viewportHeight: 500,
    scrollTop: 0,
    bufferSize: 10
};

// ===== HELPER FUNCTIONS =====
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>'"]/g, m => map[m]);
}

function generateId() {
    return 'node_' + (++callbackId);
}

// ===== WEB WORKER =====
function initWorker() {
    if (jsonWorker) return;

    try {
        jsonWorker = new Worker('../js/json-worker.js');
        jsonWorker.onmessage = handleWorkerMessage;
        jsonWorker.onerror = (e) => {
            console.error('Worker error:', e);
            showStatusMessage('Worker error: ' + e.message, 'error');
        };
    } catch (e) {
        console.warn('Web Worker not supported, falling back to main thread');
    }
}

function handleWorkerMessage(e) {
    const { type, id, success, result, error, stats } = e.data;
    const callback = workerCallbacks.get(id);

    if (callback) {
        workerCallbacks.delete(id);
        if (success) {
            callback.resolve({ result, stats });
        } else {
            callback.reject(error);
        }
    }
}

function workerRequest(type, data) {
    return new Promise((resolve, reject) => {
        if (!jsonWorker) {
            // Fallback for browsers without Worker support
            return fallbackOperation(type, data).then(resolve).catch(reject);
        }

        const id = 'req_' + (++callbackId);
        workerCallbacks.set(id, { resolve, reject });
        jsonWorker.postMessage({ type, id, data });

        // Timeout after 30 seconds
        setTimeout(() => {
            if (workerCallbacks.has(id)) {
                workerCallbacks.delete(id);
                reject({ message: 'Operation timed out' });
            }
        }, 30000);
    });
}

// Fallback for main thread processing
function fallbackOperation(type, data) {
    return new Promise((resolve, reject) => {
        try {
            switch (type) {
                case 'parse':
                    const parsed = JSON.parse(data);
                    resolve({ result: parsed, stats: { type: typeof parsed } });
                    break;
                case 'format':
                    resolve({ result: JSON.stringify(JSON.parse(data), null, 2) });
                    break;
                case 'minify':
                    resolve({ result: JSON.stringify(JSON.parse(data)) });
                    break;
                case 'validate':
                    JSON.parse(data);
                    resolve({ result: { valid: true } });
                    break;
                default:
                    reject({ message: 'Unknown operation' });
            }
        } catch (e) {
            reject({ message: e.message });
        }
    });
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    setActiveNav('json-tools.html');
    initWorker();

    const editor = document.getElementById('json-editor');
    if (editor) {
        editor.addEventListener('input', updateCharCount);
        updateCharCount();
        initHighlightSync('json-editor');
        
        if (typeof SearchReplace !== 'undefined') {
            searchReplace = new SearchReplace();
            const searchContainer = document.getElementById('json-search-container');
            if (searchContainer) {
                searchReplace.init(editor, searchContainer);
            }
        }
    }

    // Tree view scroll handler
    const treeView = document.getElementById('tree-view');
    if (treeView) {
        treeView.addEventListener('scroll', handleTreeScroll);
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
    const editor = document.getElementById('json-editor');
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

// ===== LOADING OVERLAY =====
function showLoading(message = 'Processing JSON...') {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        const text = overlay.querySelector('.loading-text');
        if (text) text.textContent = message;
        overlay.classList.remove('hidden');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// ===== MODE SWITCHING =====
function showTextMode() {
    currentMode = 'text';
    const inputContainer = document.querySelector('.input-container');
    if (inputContainer) inputContainer.style.display = 'flex';
    document.getElementById('json-editor').style.display = 'block';
    document.getElementById('tree-view').classList.remove('active');
    document.getElementById('text-mode-btn').classList.add('active');
    document.getElementById('tree-mode-btn').classList.remove('active');

    const searchContainer = document.getElementById('json-search-container');
    if (searchContainer) {
        searchContainer.style.display = 'block';
        if (searchReplace) {
            searchReplace.init(document.getElementById('json-editor'), searchContainer);
        }
    }
}

async function showTreeMode() {
    const editor = document.getElementById('json-editor');
    const content = editor.value.trim();
    clearHighlights();

    if (!content) {
        showStatusMessage('Please enter JSON to view as tree', 'error');
        return;
    }

    showLoading('Parsing JSON...');

    try {
        const { result, stats } = await workerRequest('parse', content);
        parsedJson = result;
        jsonStats = stats;

        // Initialize virtual tree
        initVirtualTree(parsedJson);

        const treeView = document.getElementById('tree-view');
        renderVirtualTree();

        currentMode = 'tree';
        const inputContainer = document.querySelector('.input-container');
        if (inputContainer) inputContainer.style.display = 'none';
        editor.style.display = 'none';
        treeView.classList.add('active');
        document.getElementById('text-mode-btn').classList.remove('active');
        document.getElementById('tree-mode-btn').classList.add('active');

        const searchContainer = document.getElementById('json-search-container');
        if (searchContainer) searchContainer.style.display = 'none';

        const nodeCount = stats?.totalNodes || treeState.nodes.size;
        showStatusMessage(`Tree view: ${nodeCount.toLocaleString()} nodes, depth ${stats?.maxDepth || 0}`);
    } catch (error) {
        showStatusMessage('Invalid JSON: ' + error.message, 'error');
        const line = getJsonErrorLine(error.message, content);
        if (line) highlightError(line);
    } finally {
        hideLoading();
    }
}

// ===== VIRTUAL TREE =====
function initVirtualTree(json) {
    treeState.nodes.clear();
    treeState.visibleNodeIds = [];
    treeState.expandedNodes.clear();
    treeState.scrollTop = 0;

    // Create root nodes
    if (Array.isArray(json)) {
        json.forEach((item, index) => {
            const nodeId = `[${index}]`;
            createTreeNode(nodeId, `[${index}]`, null, index, item, 0);
        });
    } else if (typeof json === 'object' && json !== null) {
        Object.keys(json).forEach((key, index) => {
            const nodeId = key;
            createTreeNode(nodeId, key, key, null, json[key], 0);
        });
    }

    updateVisibleNodes();
}

function createTreeNode(id, path, key, arrayIndex, value, depth) {
    const type = getValueType(value);
    const childCount = type === 'object' ? Object.keys(value).length :
                       type === 'array' ? value.length : 0;

    const node = {
        id,
        path,
        key,
        arrayIndex,
        value,
        type,
        depth,
        childCount,
        childrenLoaded: false,
        childIds: []
    };

    treeState.nodes.set(id, node);
    return node;
}

function getValueType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
}

function updateVisibleNodes() {
    treeState.visibleNodeIds = [];

    // Get all root nodes (depth 0)
    const rootNodes = [];
    treeState.nodes.forEach(node => {
        if (node.depth === 0) rootNodes.push(node);
    });

    // Sort root nodes by their original order
    rootNodes.sort((a, b) => {
        if (a.arrayIndex !== null && b.arrayIndex !== null) {
            return a.arrayIndex - b.arrayIndex;
        }
        return 0;
    });

    // Traverse and collect visible nodes
    for (const root of rootNodes) {
        collectVisibleNodes(root);
    }
}

function collectVisibleNodes(node) {
    treeState.visibleNodeIds.push(node.id);

    // If expanded and has children
    if (treeState.expandedNodes.has(node.id) && (node.type === 'object' || node.type === 'array')) {
        // Load children if not loaded
        if (!node.childrenLoaded) {
            loadNodeChildren(node);
        }

        // Collect visible children
        for (const childId of node.childIds) {
            const childNode = treeState.nodes.get(childId);
            if (childNode) {
                collectVisibleNodes(childNode);
            }
        }
    }
}

function loadNodeChildren(node) {
    if (node.childrenLoaded) return;

    const value = node.value;
    node.childIds = [];

    if (Array.isArray(value)) {
        value.forEach((item, index) => {
            const childPath = `${node.path}[${index}]`;
            const childId = childPath;
            createTreeNode(childId, childPath, null, index, item, node.depth + 1);
            node.childIds.push(childId);
        });
    } else if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach((key, index) => {
            const childPath = node.path ? `${node.path}.${key}` : key;
            const childId = childPath;
            createTreeNode(childId, childPath, key, null, value[key], node.depth + 1);
            node.childIds.push(childId);
        });
    }

    node.childrenLoaded = true;
}

function renderVirtualTree() {
    const treeView = document.getElementById('tree-view');
    if (!treeView) return;

    const totalHeight = treeState.visibleNodeIds.length * treeState.rowHeight;
    const startIndex = Math.max(0, Math.floor(treeState.scrollTop / treeState.rowHeight) - treeState.bufferSize);
    const endIndex = Math.min(
        treeState.visibleNodeIds.length,
        Math.ceil((treeState.scrollTop + treeState.viewportHeight) / treeState.rowHeight) + treeState.bufferSize
    );

    // Get or create content container
    let content = treeView.querySelector('.virtual-tree-content');
    if (!content) {
        treeView.innerHTML = '';
        content = document.createElement('div');
        content.className = 'virtual-tree-content';
        content.style.position = 'relative';
        treeView.appendChild(content);
    }
    content.style.height = `${totalHeight}px`;

    // Get or create viewport
    let viewport = content.querySelector('.virtual-tree-viewport');
    if (!viewport) {
        viewport = document.createElement('div');
        viewport.className = 'virtual-tree-viewport';
        viewport.style.position = 'absolute';
        viewport.style.left = '0';
        viewport.style.right = '0';
        content.appendChild(viewport);
    }
    
    viewport.style.transform = `translateY(${startIndex * treeState.rowHeight}px)`;

    let html = '';
    for (let i = startIndex; i < endIndex; i++) {
        const nodeId = treeState.visibleNodeIds[i];
        const node = treeState.nodes.get(nodeId);
        if (node) {
            html += renderTreeNode(node);
        }
    }

    // Only update if content changed (to avoid unnecessary reflows)
    if (viewport.innerHTML !== html) {
        viewport.innerHTML = html;
        // Re-attach handlers to new elements
        addVirtualTreeHandlers();
    }
}

function renderTreeNode(node) {
    const indent = node.depth * 20;
    const isExpanded = treeState.expandedNodes.has(node.id);

    let html = `<div class="virtual-tree-row" data-node-id="${node.id}" style="padding-left: ${indent}px;">`;

    // Key or index display
    const keyDisplay = node.key !== null
        ? `<span class="tree-key">${escapeHtml(node.key)}</span>: `
        : (node.arrayIndex !== null ? `<span class="tree-index">[${node.arrayIndex}]</span> ` : '');

    if (node.type === 'object' || node.type === 'array') {
        const bracket = node.type === 'object' ? '{' : '[';
        const closeBracket = node.type === 'object' ? '}' : ']';
        const toggle = node.childCount > 0
            ? `<span class="tree-toggle" data-action="toggle">${isExpanded ? '−' : '+'}</span> `
            : '';

        if (isExpanded || node.childCount === 0) {
            html += `${toggle}${keyDisplay}<span class="tree-bracket">${bracket}</span>`;
            if (node.childCount === 0) {
                html += `<span class="tree-bracket">${closeBracket}</span>`;
            } else {
                html += ` <span class="tree-info">${node.childCount} ${node.type === 'array' ? 'items' : 'keys'}</span>`;
            }
        } else {
            html += `${toggle}${keyDisplay}<span class="tree-bracket">${bracket}</span>`;
            html += `<span class="tree-collapsed-preview">...${node.childCount} ${node.type === 'array' ? 'items' : 'keys'}...</span>`;
            html += `<span class="tree-bracket">${closeBracket}</span>`;
        }
    } else {
        html += keyDisplay;
        html += renderValue(node.value, node.type);
    }

    html += '</div>';
    return html;
}

function renderValue(value, type) {
    switch (type) {
        case 'string':
            const displayValue = value.length > 100 ? value.substring(0, 100) + '...' : value;
            return `<span class="tree-string">"${escapeHtml(displayValue)}"</span>`;
        case 'number':
            return `<span class="tree-number">${value}</span>`;
        case 'boolean':
            return `<span class="tree-boolean">${value}</span>`;
        case 'null':
            return `<span class="tree-null">null</span>`;
        default:
            return `<span>${escapeHtml(String(value))}</span>`;
    }
}

function addVirtualTreeHandlers() {
    const treeView = document.getElementById('tree-view');
    if (!treeView) return;

    treeView.querySelectorAll('.virtual-tree-row').forEach(row => {
        row.addEventListener('click', (e) => {
            const toggle = e.target.closest('[data-action="toggle"]');
            if (toggle) {
                const nodeId = row.dataset.nodeId;
                toggleTreeNode(nodeId);
            }
        });

        // Double-click to copy path
        row.addEventListener('dblclick', () => {
            const nodeId = row.dataset.nodeId;
            const node = treeState.nodes.get(nodeId);
            if (node) {
                copyToClipboard(node.path).then(() => {
                    showStatusMessage(`Copied path: ${node.path}`);
                });
            }
        });
    });
}

function toggleTreeNode(nodeId) {
    if (treeState.expandedNodes.has(nodeId)) {
        treeState.expandedNodes.delete(nodeId);
    } else {
        treeState.expandedNodes.add(nodeId);
    }
    updateVisibleNodes();
    renderVirtualTree();
}

function handleTreeScroll() {
    const treeView = document.getElementById('tree-view');
    if (!treeView) return;

    treeState.scrollTop = treeView.scrollTop;
    treeState.viewportHeight = treeView.clientHeight;

    requestAnimationFrame(() => renderVirtualTree());
}

function expandAll() {
    treeState.nodes.forEach(node => {
        if (node.type === 'object' || node.type === 'array') {
            if (node.childCount > 0) {
                treeState.expandedNodes.add(node.id);
                if (!node.childrenLoaded) {
                    loadNodeChildren(node);
                }
            }
        }
    });
    updateVisibleNodes();
    renderVirtualTree();
    showStatusMessage('All nodes expanded');
}

function collapseAll() {
    treeState.expandedNodes.clear();
    updateVisibleNodes();
    renderVirtualTree();
    showStatusMessage('All nodes collapsed');
}

// ===== JSON OPERATIONS =====
async function formatJSON() {
    const editor = document.getElementById('json-editor');
    const content = editor.value.trim();
    clearHighlights();

    if (!content) {
        showStatusMessage('Please enter JSON to format', 'error');
        return;
    }

    const isLargeFile = content.length > 500 * 1024;
    if (isLargeFile) showLoading('Formatting large JSON...');

    try {
        const { result } = await workerRequest('format', content);
        editor.value = result;
        updateCharCount();
        showTextMode();
        showStatusMessage('JSON formatted successfully');
        updateFullscreenContent();
    } catch (error) {
        showStatusMessage('Invalid JSON: ' + error.message, 'error');
        const line = getJsonErrorLine(error.message, content);
        if (line) highlightError(line);
    } finally {
        hideLoading();
    }
}

async function minifyJSON() {
    const editor = document.getElementById('json-editor');
    const content = editor.value.trim();
    clearHighlights();

    if (!content) {
        showStatusMessage('Please enter JSON to minify', 'error');
        return;
    }

    const isLargeFile = content.length > 500 * 1024;
    if (isLargeFile) showLoading('Minifying large JSON...');

    try {
        const { result } = await workerRequest('minify', content);
        editor.value = result;
        updateCharCount();
        showTextMode();
        showStatusMessage('JSON minified successfully');
        updateFullscreenContent();
    } catch (error) {
        showStatusMessage('Invalid JSON: ' + error.message, 'error');
        const line = getJsonErrorLine(error.message, content);
        if (line) highlightError(line);
    } finally {
        hideLoading();
    }
}

async function validateJSON() {
    const editor = document.getElementById('json-editor');
    const content = editor.value.trim();
    clearHighlights();

    if (!content) {
        showStatusMessage('Please enter JSON to validate', 'error');
        return;
    }

    const isLargeFile = content.length > 500 * 1024;
    if (isLargeFile) showLoading('Validating large JSON...');

    try {
        const { result } = await workerRequest('validate', content);
        let message = `Valid JSON - Type: ${result.type}`;
        if (result.topLevelKeys) {
            message += `, ${result.topLevelKeys.toLocaleString()} keys`;
        }
        if (result.totalNodes) {
            message += `, ${result.totalNodes.toLocaleString()} nodes`;
        }
        message += `, ${content.length.toLocaleString()} chars`;
        showStatusMessage(message, 'success');
    } catch (error) {
        showStatusMessage('Invalid JSON: ' + error.message, 'error');
        const line = getJsonErrorLine(error.message, content);
        if (line) highlightError(line);
    } finally {
        hideLoading();
    }
}

function stringifyJSON() {
    const editor = document.getElementById('json-editor');
    const content = editor.value.trim();
    clearHighlights();

    if (!content) {
        showStatusMessage('Please enter content to stringify', 'error');
        return;
    }

    try {
        let obj;
        try {
            obj = (new Function('return ' + content))();
        } catch (e) {
            obj = JSON.parse(content);
        }

        const stringified = JSON.stringify(JSON.stringify(obj));
        editor.value = stringified;
        updateCharCount();
        showTextMode();
        showStatusMessage('Content stringified successfully');
        updateFullscreenContent();
    } catch (error) {
        showStatusMessage('Invalid input: ' + error.message, 'error');
    }
}

function parseJSON() {
    const editor = document.getElementById('json-editor');
    const content = editor.value.trim();
    clearHighlights();

    if (!content) {
        showStatusMessage('Please enter a JSON string to parse', 'error');
        return;
    }

    try {
        let parsed = JSON.parse(content);
        if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
        }
        const result = JSON.stringify(parsed);
        editor.value = result;
        updateCharCount();
        showTextMode();
        showStatusMessage('JSON string parsed successfully');
        updateFullscreenContent();
    } catch (error) {
        showStatusMessage('Invalid JSON string: ' + error.message, 'error');
        const line = getJsonErrorLine(error.message, content);
        if (line) highlightError(line);
    }
}

// ===== SAMPLE DATA =====
function loadSample() {
    clearHighlights();
    const sampleJSON = `{
  "name": "DevTools",
  "version": "1.0.0",
  "description": "Free developer utilities",
  "features": [
    "JSON formatting",
    "XML tools",
    "Tree view"
  ],
  "author": {
    "name": "Developer",
    "email": "dev@example.com"
  },
  "settings": {
    "theme": "light",
    "autoFormat": true,
    "indentSize": 2
  },
  "stats": {
    "users": 10000,
    "rating": 4.8,
    "isActive": true,
    "lastUpdate": null
  }
}`;

    document.getElementById('json-editor').value = sampleJSON;
    updateCharCount();
    showTextMode();
    showStatusMessage('Sample JSON loaded');
}

// ===== CLEAR =====
function clearEditor() {
    clearHighlights();
    document.getElementById('json-editor').value = '';
    document.getElementById('tree-view').innerHTML = '';
    parsedJson = null;
    jsonStats = null;
    treeState.nodes.clear();
    treeState.visibleNodeIds = [];
    treeState.expandedNodes.clear();
    updateCharCount();
    showTextMode();
    showStatusMessage('Editor cleared');
}

// ===== IMPORT/EXPORT =====
function importJSON() {
    document.getElementById('file-input').click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileSizeKB = file.size / 1024;
    if (fileSizeKB > 500) {
        showLoading(`Loading ${file.name} (${(fileSizeKB / 1024).toFixed(1)} MB)...`);
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        clearHighlights();
        document.getElementById('json-editor').value = e.target.result;
        updateCharCount();
        showTextMode();
        showStatusMessage(`Imported ${file.name} (${fileSizeKB > 1024 ? (fileSizeKB / 1024).toFixed(1) + ' MB' : Math.round(fileSizeKB) + ' KB'})`);
        hideLoading();
    };
    reader.onerror = function() {
        showStatusMessage('Error reading file', 'error');
        hideLoading();
    };
    reader.readAsText(file);
    event.target.value = '';
}

function exportJSON() {
    const content = document.getElementById('json-editor').value;
    if (!content.trim()) {
        showStatusMessage('Nothing to export', 'error');
        return;
    }

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatusMessage('JSON exported successfully');
}

// ===== COPY =====
function copyContent() {
    const editor = document.getElementById('json-editor');
    const overlay = document.getElementById('fullscreen-overlay');
    const isFullscreen = overlay && !overlay.hidden;

    let content;
    if (isFullscreen) {
        const fsEditor = document.getElementById('json-editor-fs');
        content = fsEditor ? fsEditor.value : editor.value;
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
    const editor = document.getElementById('json-editor');

    if (overlay.hidden) {
        content.innerHTML = '';

        if (currentMode === 'tree') {
            const treeView = document.getElementById('tree-view');
            // Move tree view to fullscreen content to preserve event listeners and state
            content.appendChild(treeView);
            // Trigger render to update viewport dimensions
            requestAnimationFrame(() => renderVirtualTree());
        } else {
            createFullscreenTextarea(editor.value);
        }

        overlay.hidden = false;
        document.body.classList.add('fullscreen-active');

        if (currentMode !== 'tree' && searchReplace) {
             const fsContainer = document.getElementById('fullscreen-search-container');
             const fsEditor = document.getElementById('json-editor-fs');
             if (fsContainer && fsEditor) {
                 fsContainer.style.display = 'block';
                 searchReplace.init(fsEditor, fsContainer);
             }
        }
    } else {
        exitFullscreen();
    }
}

function createFullscreenTextarea(value) {
    const content = document.getElementById('fullscreen-content');
    const editor = document.getElementById('json-editor');

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
    textarea.id = 'json-editor-fs';
    textarea.value = value;
    textarea.addEventListener('input', function() {
        editor.value = this.value;
        updateCharCount();
    });

    inputContainer.appendChild(textarea);
    content.appendChild(inputContainer);

    initHighlightSync('json-editor-fs');
}

function exitFullscreen() {
    const overlay = document.getElementById('fullscreen-overlay');
    if (overlay) {
        // Move tree view back if it's in fullscreen
        const treeView = document.getElementById('tree-view');
        const editorContent = document.querySelector('.editor-content');
        const fullscreenContent = document.getElementById('fullscreen-content');

        if (treeView && fullscreenContent.contains(treeView) && editorContent) {
            editorContent.appendChild(treeView);
            // Trigger render to update viewport dimensions
            requestAnimationFrame(() => renderVirtualTree());
        }

        overlay.hidden = true;
        document.body.classList.remove('fullscreen-active');

        if (searchReplace && currentMode !== 'tree') {
            const normalContainer = document.getElementById('json-search-container');
            const normalEditor = document.getElementById('json-editor');
            if (normalContainer && normalEditor) {
                searchReplace.init(normalEditor, normalContainer);
            }
        }
    }
}

function showTreeModeFullscreen() {
    if (!isFullscreenActive()) return;

    const editor = document.getElementById('json-editor');
    const content = editor.value.trim();
    clearHighlights();

    if (!content) {
        showStatusMessage('Please enter JSON to view as tree', 'error');
        return;
    }

    // Hide search in fullscreen tree mode
    const fsSearchContainer = document.getElementById('fullscreen-search-container');
    if (fsSearchContainer) fsSearchContainer.style.display = 'none';

    // For fullscreen tree, trigger the normal tree mode first
    showTreeMode().then(() => {
        const treeView = document.getElementById('tree-view');
        const fsContent = document.getElementById('fullscreen-content');

        // Move tree view to fullscreen
        fsContent.innerHTML = '';
        fsContent.appendChild(treeView);
        
        // Trigger render to update viewport dimensions
        requestAnimationFrame(() => renderVirtualTree());
    });
}

function updateFullscreenContent() {
    if (!isFullscreenActive()) return;

    const editor = document.getElementById('json-editor');
    const fsEditor = document.getElementById('json-editor-fs');

    if (fsEditor) {
        fsEditor.value = editor.value;
    } else {
        createFullscreenTextarea(editor.value);
    }
}

// ===== ERROR HANDLING =====
function getJsonErrorLine(errorMessage, jsonContent) {
    const positionMatch = errorMessage.match(/position (\d+)/);
    if (positionMatch) {
        const position = parseInt(positionMatch[1], 10);

        let i = position - 1;
        while (i >= 0 && /\s/.test(jsonContent[i])) {
            i--;
        }

        if (i >= 0) {
            const prevChar = jsonContent[i];
            const currChar = jsonContent[position];

            if (/[0-9"}\]le]/.test(prevChar) && /["{\[\dxfnt]/.test(currChar)) {
                const substring = jsonContent.substring(0, i + 1);
                return substring.split('\n').length;
            }
        }

        const substring = jsonContent.substring(0, position);
        return substring.split('\n').length;
    }

    const lineMatch = errorMessage.match(/line (\d+)/);
    if (lineMatch) {
        return parseInt(lineMatch[1], 10);
    }

    return null;
}

// Legacy tree functions for backwards compatibility
function buildTree(obj, key = null, level = 0) {
    // This is now replaced by virtual tree, but kept for fullscreen compatibility
    const indent = '  '.repeat(level);
    let html = '';

    if (obj === null) {
        html += `<span class="tree-line">${indent}${key ? `<span class="tree-key">${escapeHtml(key)}</span>: ` : ''}<span class="tree-null">null</span></span>\n`;
    } else if (typeof obj === 'boolean') {
        html += `<span class="tree-line">${indent}${key ? `<span class="tree-key">${escapeHtml(key)}</span>: ` : ''}<span class="tree-boolean">${obj}</span></span>\n`;
    } else if (typeof obj === 'number') {
        html += `<span class="tree-line">${indent}${key ? `<span class="tree-key">${escapeHtml(key)}</span>: ` : ''}<span class="tree-number">${obj}</span></span>\n`;
    } else if (typeof obj === 'string') {
        html += `<span class="tree-line">${indent}${key ? `<span class="tree-key">${escapeHtml(key)}</span>: ` : ''}<span class="tree-string">"${escapeHtml(obj)}"</span></span>\n`;
    } else if (Array.isArray(obj)) {
        if (obj.length === 0) {
            html += `<span class="tree-line">${indent}${key ? `<span class="tree-key">${escapeHtml(key)}</span>: ` : ''}<span class="tree-bracket">[]</span></span>\n`;
        } else {
            html += `<span class="tree-line tree-expandable">${indent}<span class="tree-toggle">-</span> ${key ? `<span class="tree-key">${escapeHtml(key)}</span>: ` : ''}<span class="tree-bracket">[</span> <span style="color: #718096;">${obj.length} items</span></span>\n`;
            html += `<div class="tree-node">`;
            obj.forEach((item) => {
                html += buildTree(item, null, level + 1);
            });
            html += `</div>`;
            html += `<span class="tree-line">${indent}<span class="tree-bracket">]</span></span>\n`;
        }
    } else if (typeof obj === 'object') {
        const keys = Object.keys(obj);
        if (keys.length === 0) {
            html += `<span class="tree-line">${indent}${key ? `<span class="tree-key">${escapeHtml(key)}</span>: ` : ''}<span class="tree-bracket">{}</span></span>\n`;
        } else {
            html += `<span class="tree-line tree-expandable">${indent}<span class="tree-toggle">-</span> ${key ? `<span class="tree-key">${escapeHtml(key)}</span>: ` : ''}<span class="tree-bracket">{</span> <span style="color: #718096;">${keys.length} keys</span></span>\n`;
            html += `<div class="tree-node">`;
            keys.forEach((k) => {
                html += buildTree(obj[k], k, level + 1);
            });
            html += `</div>`;
            html += `<span class="tree-line">${indent}<span class="tree-bracket">}</span></span>\n`;
        }
    }

    return html;
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
