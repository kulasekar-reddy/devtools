// YAML Tools JavaScript - Single Window In-Place Editing

// Helper function to escape HTML entities
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

let currentMode = 'text'; // 'text' or 'tree'

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setActiveNav('yml-tools.html');

    const editor = document.getElementById('yaml-editor');
    if (editor) {
        editor.addEventListener('input', updateCharCount);
        updateCharCount();
        initHighlightSync('yaml-editor');
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
    const editor = document.getElementById('yaml-editor');
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
    document.getElementById('yaml-editor').style.display = 'block';
    document.getElementById('tree-view').classList.remove('active');
    document.getElementById('text-mode-btn').classList.add('active');
    document.getElementById('tree-mode-btn').classList.remove('active');
}

// Helper to safely get jsyaml instance
function getJsYaml() {
    if (typeof jsyaml !== 'undefined') return jsyaml;
    if (window.jsyaml) return window.jsyaml;
    throw new Error('YAML library not loaded. Please check your internet connection or refresh.');
}

function showTreeMode() {
    const editor = document.getElementById('yaml-editor');
    const content = editor.value.trim();
    clearHighlights();

    if (!content) {
        showStatusMessage('Please enter YAML to view as tree', 'error');
        return;
    }

    try {
        const yaml = getJsYaml();
        const parsed = yaml.load(content);
        const treeView = document.getElementById('tree-view');
        treeView.innerHTML = buildTree(parsed);
        addTreeHandlers();

        currentMode = 'tree';
        const inputContainer = document.querySelector('.input-container');
        if (inputContainer) inputContainer.style.display = 'none';
        editor.style.display = 'none';
        treeView.classList.add('active');
        document.getElementById('text-mode-btn').classList.remove('active');
        document.getElementById('tree-mode-btn').classList.add('active');
        showStatusMessage('Tree view generated');
    } catch (error) {
        showStatusMessage('Error: ' + error.message, 'error');
        const line = getYamlErrorLine(error, content);
        if (line) highlightError(line);
    }
}

// ===== FORMAT YAML =====
function formatYAML() {
    const editor = document.getElementById('yaml-editor');
    const content = editor.value.trim();
    clearHighlights();

    if (!content) {
        showStatusMessage('Please enter YAML to format', 'error');
        return;
    }

    try {
        const yaml = getJsYaml();
        const parsed = yaml.load(content);
        const formatted = yaml.dump(parsed, { indent: 2 });
        editor.value = formatted;
        updateCharCount();
        showTextMode();
        showStatusMessage('YAML formatted successfully');
        updateFullscreenContent();
    } catch (error) {
        showStatusMessage('Error: ' + error.message, 'error');
        const line = getYamlErrorLine(error, content);
        if (line) highlightError(line);
    }
}

// ===== YAML TO JSON =====
function yamlToJson() {
    const editor = document.getElementById('yaml-editor');
    const content = editor.value.trim();
    clearHighlights();

    if (!content) {
        showStatusMessage('Please enter YAML to convert', 'error');
        return;
    }

    try {
        const yaml = getJsYaml();
        const parsed = yaml.load(content);
        const json = JSON.stringify(parsed, null, 2);
        editor.value = json;
        updateCharCount();
        showTextMode();
        showStatusMessage('Converted to JSON successfully');
        updateFullscreenContent();
    } catch (error) {
        showStatusMessage('Error: ' + error.message, 'error');
        const line = getYamlErrorLine(error, content);
        if (line) highlightError(line);
    }
}

// ===== JSON TO YAML =====
function jsonToYaml() {
    const editor = document.getElementById('yaml-editor');
    const content = editor.value.trim();
    clearHighlights();

    if (!content) {
        showStatusMessage('Please enter JSON to convert', 'error');
        return;
    }

    try {
        const yaml = getJsYaml();
        const parsed = JSON.parse(content);
        const yamlStr = yaml.dump(parsed, { indent: 2 });
        editor.value = yamlStr;
        updateCharCount();
        showTextMode();
        showStatusMessage('Converted to YAML successfully');
        updateFullscreenContent();
    } catch (error) {
        showStatusMessage('Error: ' + error.message, 'error');
        // JSON parse error, reuse getJsonErrorLine? 
        // We are in yml-tools.js, so we don't have getJsonErrorLine unless I copy it or use the one from utils if I had put it there.
        // I didn't put getJsonErrorLine in utils. I'll just leave it for now or implement a simple version.
    }
}

// ===== VALIDATE YAML =====
function validateYAML() {
    const editor = document.getElementById('yaml-editor');
    const content = editor.value.trim();
    clearHighlights();

    if (!content) {
        showStatusMessage('Please enter YAML to validate', 'error');
        return;
    }

    try {
        const yaml = getJsYaml();
        const parsed = yaml.load(content);
        const type = Array.isArray(parsed) ? 'Array' : typeof parsed;
        const keys = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0;

        let message = `Valid YAML - Type: ${type}`;
        if (type === 'object' || type === 'Array') {
            message += `, Keys/Items: ${keys}`;
        }
        message += `, Size: ${content.length.toLocaleString()} chars`;
        showStatusMessage(message, 'success');
    } catch (error) {
        showStatusMessage('Invalid YAML: ' + error.message, 'error');
        const line = getYamlErrorLine(error, content);
        if (line) highlightError(line);
    }
}

// ===== TREE VIEW =====
function buildTree(obj, key = null, level = 0) {
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
            html += `<span class="tree-line tree-closing-delimiter">${indent}<span class="tree-bracket">]</span></span>\n`;
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
            html += `<span class="tree-line tree-closing-delimiter">${indent}<span class="tree-bracket">}</span></span>\n`;
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
    const sampleYAML = `name: DevTools
version: 1.0.0
description: Free developer utilities
features:
  - JSON formatting
  - XML tools
  - YAML tools
  - Tree view
author:
  name: Developer
  email: dev@example.com
settings:
  theme: light
  autoFormat: true
  indentSize: 2
stats:
  users: 10000
  rating: 4.8
  isActive: true
  lastUpdate: null
`;

    document.getElementById('yaml-editor').value = sampleYAML;
    updateCharCount();
    showTextMode();
    showStatusMessage('Sample YAML loaded');
}

// ===== CLEAR =====
function clearEditor() {
    clearHighlights();
    document.getElementById('yaml-editor').value = '';
    document.getElementById('tree-view').innerHTML = '';
    updateCharCount();
    showTextMode();
    showStatusMessage('Editor cleared');
}

// ===== IMPORT/EXPORT =====
function importFile() {
    document.getElementById('file-input').click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        clearHighlights();
        document.getElementById('yaml-editor').value = e.target.result;
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

function exportYAML() {
    const content = document.getElementById('yaml-editor').value;
    if (!content.trim()) {
        showStatusMessage('Nothing to export', 'error');
        return;
    }

    const blob = new Blob([content], { type: 'application/x-yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatusMessage('YAML exported successfully');
}

// ===== COPY =====
function copyContent() {
    const editor = document.getElementById('yaml-editor');
    const overlay = document.getElementById('fullscreen-overlay');
    const isFullscreen = overlay && !overlay.hidden;

    let content;
    if (isFullscreen) {
        // In fullscreen, get content from fullscreen area
        const fsTreeView = document.querySelector('#fullscreen-content .tree-view');
        const fsEditor = document.getElementById('yaml-editor-fs');
        if (fsTreeView) {
            content = editor.value; // Copy the actual YAML, not tree text
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
    const editor = document.getElementById('yaml-editor');

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
    } else {
        exitFullscreen();
    }
}

function createFullscreenTextarea(value) {
    const content = document.getElementById('fullscreen-content');
    const editor = document.getElementById('yaml-editor');

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
    textarea.id = 'yaml-editor-fs';
    textarea.value = value;
    textarea.addEventListener('input', function() {
        editor.value = this.value;
        updateCharCount();
    });
    
    inputContainer.appendChild(textarea);
    content.appendChild(inputContainer);
    
    initHighlightSync('yaml-editor-fs');
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
    }
}

function showTreeModeFullscreen() {
    if (!isFullscreenActive()) return;

    const editor = document.getElementById('yaml-editor');
    const content = editor.value.trim();
    clearHighlights();

    if (!content) {
        showStatusMessage('Please enter YAML to view as tree', 'error');
        return;
    }

    try {
        const yaml = getJsYaml();
        const parsed = yaml.load(content);
        const fsContent = document.getElementById('fullscreen-content');

        // Create tree view in fullscreen
        const treeClone = document.createElement('div');
        treeClone.className = 'tree-view active';
        treeClone.innerHTML = buildTree(parsed);

        fsContent.innerHTML = '';
        fsContent.appendChild(treeClone);
        addTreeHandlersToContainer(treeClone);

        currentMode = 'tree';
        showStatusMessage('Tree view generated');
    } catch (error) {
        showStatusMessage('Invalid YAML: ' + error.message, 'error');
        const line = getYamlErrorLine(error);
        if (line) highlightError(line);
    }
}

function updateFullscreenContent() {
    if (!isFullscreenActive()) return;

    const editor = document.getElementById('yaml-editor');
    const content = document.getElementById('fullscreen-content');
    const fsEditor = document.getElementById('yaml-editor-fs');

    // If there's a textarea in fullscreen, update it
    if (fsEditor) {
        fsEditor.value = editor.value;
    } else {
        // If tree view was showing, switch to textarea with new content
        createFullscreenTextarea(editor.value);
    }
}

function getYamlErrorLine(error, content) {
    if (error && error.mark && typeof error.mark.line === 'number') {
        return error.mark.line + 1; // js-yaml is 0-based
    }
    return null;
}