// JSON Tools JavaScript - Single Input UI

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set active navigation
    setActiveNav('json-tools.html');

    // Initialize character counter for input
    initCharCounter('json-input', 'input-count');

    // Initialize fullscreen handlers
    if (typeof initFullscreenKeyHandler === 'function') {
        initFullscreenKeyHandler();
    }
    if (typeof initFullscreenClickHandler === 'function') {
        initFullscreenClickHandler();
    }

    // Initialize close button handler
    const closeBtn = document.getElementById('fullscreen-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            exitFullscreen();
        });
    }
});

// Helper to show textarea output and hide tree view
function showTextOutput() {
    document.getElementById('json-output').style.display = 'block';
    document.getElementById('tree-output').style.display = 'none';
    // Hide tree-only buttons
    document.querySelectorAll('.tree-only-btn').forEach(btn => btn.style.display = 'none');
}

// Helper to show tree view and hide textarea output
function showTreeOutput() {
    document.getElementById('json-output').style.display = 'none';
    document.getElementById('tree-output').style.display = 'block';
    // Show tree-only buttons
    document.querySelectorAll('.tree-only-btn').forEach(btn => btn.style.display = 'flex');
}

// Update output character count
function updateOutputCount(length) {
    document.getElementById('output-count').textContent = `${length.toLocaleString()} characters`;
}

// JSON Stringify - Convert JSON to escaped string
function stringifyJSON() {
    const input = document.getElementById('json-input').value;
    const output = document.getElementById('json-output');

    if (!input.trim()) {
        showStatus('status-bar', 'Please enter JSON to stringify', 'error');
        return;
    }

    try {
        // Validate it's valid JSON first
        JSON.parse(input);
        // Then stringify the raw input string (this adds quotes and escapes)
        output.value = JSON.stringify(input);
        showTextOutput();
        showStatus('status-bar', '✓ JSON stringified successfully', 'success');
        updateOutputCount(output.value.length);
    } catch (error) {
        showStatus('status-bar', 'Error: Invalid JSON - ' + error.message, 'error');
    }
}

// JSON Parse - Parse stringified JSON back to formatted JSON
function parseJSON() {
    const input = document.getElementById('json-input').value;
    const output = document.getElementById('json-output');

    if (!input.trim()) {
        showStatus('status-bar', 'Please enter stringified JSON to parse', 'error');
        return;
    }

    try {
        // Parse the escaped string to get the original JSON string
        const jsonString = JSON.parse(input);
        // Then parse and format that JSON
        const parsed = JSON.parse(jsonString);
        output.value = JSON.stringify(parsed, null, 2);
        showTextOutput();
        showStatus('status-bar', '✓ JSON parsed successfully', 'success');
        updateOutputCount(output.value.length);
    } catch (error) {
        showStatus('status-bar', 'Error: ' + error.message, 'error');
    }
}

// Format JSON - Beautify with indentation
function formatJSON() {
    const input = document.getElementById('json-input').value;
    const output = document.getElementById('json-output');

    if (!input.trim()) {
        showStatus('status-bar', 'Please enter JSON to format', 'error');
        return;
    }

    try {
        const parsed = JSON.parse(input);
        output.value = JSON.stringify(parsed, null, 2);
        showTextOutput();
        showStatus('status-bar', '✓ JSON formatted successfully', 'success');
        updateOutputCount(output.value.length);
    } catch (error) {
        showStatus('status-bar', 'Error: Invalid JSON - ' + error.message, 'error');
    }
}

// Minify JSON - Remove whitespace
function minifyJSON() {
    const input = document.getElementById('json-input').value;
    const output = document.getElementById('json-output');

    if (!input.trim()) {
        showStatus('status-bar', 'Please enter JSON to minify', 'error');
        return;
    }

    try {
        const parsed = JSON.parse(input);
        output.value = JSON.stringify(parsed);
        showTextOutput();
        showStatus('status-bar', '✓ JSON minified successfully', 'success');
        updateOutputCount(output.value.length);
    } catch (error) {
        showStatus('status-bar', 'Error: Invalid JSON - ' + error.message, 'error');
    }
}

// Validate JSON
function validateJSON() {
    const input = document.getElementById('json-input').value;
    const output = document.getElementById('json-output');

    if (!input.trim()) {
        output.value = '⚠ Please enter JSON to validate';
        showTextOutput();
        showStatus('status-bar', 'Please enter JSON to validate', 'error');
        return;
    }

    try {
        const parsed = JSON.parse(input);
        const type = Array.isArray(parsed) ? 'Array' : typeof parsed;
        const keys = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0;

        let result = '✓ Valid JSON\n\n';
        result += `Type: ${type}\n`;
        if (type === 'object' || type === 'Array') {
            result += `Keys/Items: ${keys}\n`;
        }
        result += `Size: ${input.length.toLocaleString()} characters`;

        output.value = result;
        showTextOutput();
        showStatus('status-bar', '✓ JSON is valid', 'success');
        updateOutputCount(result.length);
    } catch (error) {
        let result = '✗ Invalid JSON\n\n';
        result += `Error: ${error.message}\n\n`;
        result += getErrorHint(error.message);

        output.value = result;
        showTextOutput();
        showStatus('status-bar', 'Invalid JSON', 'error');
        updateOutputCount(result.length);
    }
}

function getErrorHint(errorMessage) {
    if (errorMessage.includes('position')) {
        return 'Hint: Check for missing quotes, commas, or brackets near the error position.';
    } else if (errorMessage.includes('token')) {
        return 'Hint: Check for invalid characters or syntax errors.';
    } else if (errorMessage.includes('JSON')) {
        return 'Hint: Ensure your JSON follows proper format: {"key": "value"}';
    }
    return 'Hint: Check JSON syntax and structure.';
}

// Generate Tree View
function generateTreeView() {
    const input = document.getElementById('json-input').value;
    const treeOutput = document.getElementById('tree-output');

    if (!input.trim()) {
        showStatus('status-bar', 'Please enter JSON to visualize', 'error');
        treeOutput.innerHTML = '<div style="color: #718096; padding: 20px;">Enter JSON in the input panel to see the tree structure</div>';
        showTreeOutput();
        return;
    }

    try {
        const parsed = JSON.parse(input);
        treeOutput.innerHTML = buildTree(parsed);
        showTreeOutput();
        showStatus('status-bar', '✓ Tree view generated successfully', 'success');
        addTreeHandlers();
        document.getElementById('output-count').textContent = '';
    } catch (error) {
        showStatus('status-bar', 'Error: Invalid JSON - ' + error.message, 'error');
        treeOutput.innerHTML = `<div style="color: #e53e3e; padding: 20px;">Invalid JSON: ${error.message}</div>`;
        showTreeOutput();
    }
}

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
            html += `<span class="tree-line tree-expandable">${indent}${key ? `<span class="tree-key">${escapeHtml(key)}</span>: ` : ''}<span class="tree-toggle">▼</span> <span class="tree-bracket">[</span> <span style="color: #718096;">${obj.length} items</span></span>\n`;
            html += `<div class="tree-node">`;
            obj.forEach((item, index) => {
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
            html += `<span class="tree-line tree-expandable">${indent}${key ? `<span class="tree-key">${escapeHtml(key)}</span>: ` : ''}<span class="tree-toggle">▼</span> <span class="tree-bracket">{</span> <span style="color: #718096;">${keys.length} keys</span></span>\n`;
            html += `<div class="tree-node">`;
            keys.forEach((k, index) => {
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
            if (e.target.classList.contains('tree-toggle') || e.target.closest('.tree-expandable')) {
                const toggle = this.querySelector('.tree-toggle');
                const treeNode = this.nextElementSibling;

                if (treeNode && treeNode.classList.contains('tree-node')) {
                    treeNode.classList.toggle('tree-collapsed');
                    toggle.textContent = treeNode.classList.contains('tree-collapsed') ? '▶' : '▼';
                }
            }
        });
    });
}

// Copy output
function copyOutput() {
    const textOutput = document.getElementById('json-output');
    const treeOutput = document.getElementById('tree-output');

    let text = '';
    if (textOutput.style.display !== 'none') {
        text = textOutput.value;
    } else {
        text = treeOutput.textContent || treeOutput.innerText;
    }

    if (!text.trim()) {
        showStatus('status-bar', 'Nothing to copy', 'error');
        return;
    }

    copyToClipboard(text).then(() => {
        showStatus('status-bar', '✓ Copied to clipboard', 'success');
        // Visual feedback on button
        const btn = document.querySelector('.copy-btn');
        if (btn) {
            btn.classList.add('copied');
            const icon = btn.querySelector('.copy-icon');
            if (icon) icon.textContent = '✓';
            setTimeout(() => {
                btn.classList.remove('copied');
                if (icon) icon.textContent = '📋';
            }, 1500);
        }
    }).catch(() => {
        showStatus('status-bar', 'Failed to copy', 'error');
    });
}

// Toggle fullscreen for current output
function toggleOutputFullscreen() {
    const textOutput = document.getElementById('json-output');
    const treeOutput = document.getElementById('tree-output');

    if (textOutput.style.display !== 'none') {
        toggleFullscreen('json-output');
        // Hide tree buttons in fullscreen
        document.querySelectorAll('.tree-only-btn-fs').forEach(btn => btn.style.display = 'none');
    } else {
        toggleFullscreen('tree-output');
        // Show tree buttons in fullscreen
        document.querySelectorAll('.tree-only-btn-fs').forEach(btn => btn.style.display = 'flex');
        // Re-attach tree handlers to cloned content
        const fullscreenContent = document.getElementById('fullscreen-content');
        setTimeout(() => addTreeHandlersToContainer(fullscreenContent), 0);
    }
}

// Clear all
function clearAll() {
    document.getElementById('json-input').value = '';
    document.getElementById('json-output').value = '';
    document.getElementById('tree-output').innerHTML = '<div style="color: #718096; padding: 20px;">Click "Tree View" to visualize JSON structure</div>';

    showTextOutput();

    document.getElementById('input-count').textContent = '0 characters';
    document.getElementById('output-count').textContent = '0 characters';

    showStatus('status-bar', '✓ Cleared all fields', 'success');
}

// Clear output only
function clearOutput() {
    document.getElementById('json-output').value = '';
    document.getElementById('tree-output').innerHTML = '<div style="color: #718096; padding: 20px;">Click "Tree View" to visualize JSON structure</div>';
    showTextOutput();
    document.getElementById('output-count').textContent = '0 characters';
    showStatus('status-bar', '✓ Output cleared', 'success');
}

// Collapse all tree nodes
function collapseAll() {
    const treeOutput = document.getElementById('tree-output');
    const nodes = treeOutput.querySelectorAll('.tree-node');
    const toggles = treeOutput.querySelectorAll('.tree-toggle');

    nodes.forEach(node => node.classList.add('tree-collapsed'));
    toggles.forEach(toggle => toggle.textContent = '▶');

    showStatus('status-bar', '✓ All nodes collapsed', 'success');
}

// Expand all tree nodes
function expandAll() {
    const treeOutput = document.getElementById('tree-output');
    const nodes = treeOutput.querySelectorAll('.tree-node');
    const toggles = treeOutput.querySelectorAll('.tree-toggle');

    nodes.forEach(node => node.classList.remove('tree-collapsed'));
    toggles.forEach(toggle => toggle.textContent = '▼');

    showStatus('status-bar', '✓ All nodes expanded', 'success');
}

// Collapse all in fullscreen
function collapseAllFullscreen() {
    const fullscreenContent = document.getElementById('fullscreen-content');
    const nodes = fullscreenContent.querySelectorAll('.tree-node');
    const toggles = fullscreenContent.querySelectorAll('.tree-toggle');

    nodes.forEach(node => node.classList.add('tree-collapsed'));
    toggles.forEach(toggle => toggle.textContent = '▶');
}

// Expand all in fullscreen
function expandAllFullscreen() {
    const fullscreenContent = document.getElementById('fullscreen-content');
    const nodes = fullscreenContent.querySelectorAll('.tree-node');
    const toggles = fullscreenContent.querySelectorAll('.tree-toggle');

    nodes.forEach(node => node.classList.remove('tree-collapsed'));
    toggles.forEach(toggle => toggle.textContent = '▼');
}

// Add tree handlers to a container (used for fullscreen)
function addTreeHandlersToContainer(container) {
    container.querySelectorAll('.tree-expandable').forEach(node => {
        node.addEventListener('click', function(e) {
            if (e.target.classList.contains('tree-toggle') || e.target.closest('.tree-expandable')) {
                const toggle = this.querySelector('.tree-toggle');
                const treeNode = this.nextElementSibling;

                if (treeNode && treeNode.classList.contains('tree-node')) {
                    treeNode.classList.toggle('tree-collapsed');
                    toggle.textContent = treeNode.classList.contains('tree-collapsed') ? '▶' : '▼';
                }
            }
        });
    });
}
