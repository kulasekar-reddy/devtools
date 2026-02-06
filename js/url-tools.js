// URL Encoder / Decoder - DevTools
// Encode, decode URLs and build query strings

// Store builder parameters
let builderParams = [];

document.addEventListener('DOMContentLoaded', function() {
    // Set active navigation
    setActiveNav('url-tools.html');

    // Add enter key listener for builder inputs
    document.getElementById('builder-key').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addBuilderParam();
        }
    });
    document.getElementById('builder-value').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addBuilderParam();
        }
    });
});

// Encode full URL using encodeURI
function encodeURL() {
    const input = document.getElementById('url-input').value;

    if (!input.trim()) {
        showStatusMessage('Please enter text to encode', 'error');
        return;
    }

    try {
        const encoded = encodeURI(input);
        document.getElementById('url-output').value = encoded;
        showStatusMessage('URL encoded successfully (encodeURI)', 'success');
    } catch (e) {
        showStatusMessage('Error encoding URL: ' + e.message, 'error');
    }
}

// Decode full URL using decodeURI
function decodeURL() {
    const input = document.getElementById('url-input').value;

    if (!input.trim()) {
        showStatusMessage('Please enter text to decode', 'error');
        return;
    }

    try {
        const decoded = decodeURI(input);
        document.getElementById('url-output').value = decoded;
        showStatusMessage('URL decoded successfully (decodeURI)', 'success');
    } catch (e) {
        showStatusMessage('Error decoding URL: ' + e.message, 'error');
    }
}

// Encode component using encodeURIComponent
function encodeComponent() {
    const input = document.getElementById('url-input').value;

    if (!input.trim()) {
        showStatusMessage('Please enter text to encode', 'error');
        return;
    }

    try {
        const encoded = encodeURIComponent(input);
        document.getElementById('url-output').value = encoded;
        showStatusMessage('Component encoded successfully (encodeURIComponent)', 'success');
    } catch (e) {
        showStatusMessage('Error encoding component: ' + e.message, 'error');
    }
}

// Decode component using decodeURIComponent
function decodeComponent() {
    const input = document.getElementById('url-input').value;

    if (!input.trim()) {
        showStatusMessage('Please enter text to decode', 'error');
        return;
    }

    try {
        const decoded = decodeURIComponent(input);
        document.getElementById('url-output').value = decoded;
        showStatusMessage('Component decoded successfully (decodeURIComponent)', 'success');
    } catch (e) {
        showStatusMessage('Error decoding component: ' + e.message, 'error');
    }
}

// Parse URL into components
function parseURL() {
    const input = document.getElementById('url-input').value.trim();

    if (!input) {
        showStatusMessage('Please enter a URL to parse', 'error');
        return;
    }

    try {
        // Try to parse as URL
        let url;
        try {
            url = new URL(input);
        } catch (e) {
            // Try adding https:// if no protocol
            if (!input.includes('://')) {
                url = new URL('https://' + input);
            } else {
                throw e;
            }
        }

        // Fill in components
        document.getElementById('parsed-protocol').textContent = url.protocol.replace(':', '') || '-';
        document.getElementById('parsed-protocol').className = 'parsed-value' + (url.protocol ? '' : ' empty');

        document.getElementById('parsed-host').textContent = url.hostname || '-';
        document.getElementById('parsed-host').className = 'parsed-value' + (url.hostname ? '' : ' empty');

        document.getElementById('parsed-port').textContent = url.port || '(default)';
        document.getElementById('parsed-port').className = 'parsed-value' + (url.port ? '' : ' empty');

        document.getElementById('parsed-path').textContent = url.pathname || '/';
        document.getElementById('parsed-path').className = 'parsed-value';

        document.getElementById('parsed-query').textContent = url.search || '(none)';
        document.getElementById('parsed-query').className = 'parsed-value' + (url.search ? '' : ' empty');

        document.getElementById('parsed-hash').textContent = url.hash || '(none)';
        document.getElementById('parsed-hash').className = 'parsed-value' + (url.hash ? '' : ' empty');

        // Parse query parameters
        const paramsContainer = document.getElementById('parsed-params');
        paramsContainer.innerHTML = '';

        const params = new URLSearchParams(url.search);
        let hasParams = false;

        params.forEach((value, key) => {
            hasParams = true;
            const paramEl = document.createElement('div');
            paramEl.className = 'query-param-item';
            paramEl.innerHTML = `
                <span class="query-param-key">${escapeHtml(key)}</span>
                <span>=</span>
                <span class="query-param-value">${escapeHtml(value)}</span>
                <button class="copy-btn-small" onclick="copyToClipboard('${escapeHtml(value).replace(/'/g, "\\'")}').then(() => showStatusMessage('Value copied', 'success'))">Copy</button>
            `;
            paramsContainer.appendChild(paramEl);
        });

        if (!hasParams) {
            paramsContainer.innerHTML = '<span class="parsed-value empty">(no query parameters)</span>';
        }

        // Also show reconstructed URL in output
        document.getElementById('url-output').value = url.href;

        showStatusMessage('URL parsed successfully', 'success');
    } catch (e) {
        showStatusMessage('Invalid URL format: ' + e.message, 'error');
        // Reset parsed values on error
        resetParsedSection();
    }
}

// Add parameter to builder
function addBuilderParam() {
    const keyInput = document.getElementById('builder-key');
    const valueInput = document.getElementById('builder-value');

    const key = keyInput.value.trim();
    const value = valueInput.value;

    if (!key) {
        showStatusMessage('Please enter a parameter key', 'error');
        keyInput.focus();
        return;
    }

    builderParams.push({ key, value });
    updateBuilderParamsList();

    // Clear inputs
    keyInput.value = '';
    valueInput.value = '';
    keyInput.focus();

    showStatusMessage('Parameter added', 'success');
}

// Update builder params list display
function updateBuilderParamsList() {
    const container = document.getElementById('builder-params-list');

    if (builderParams.length === 0) {
        container.innerHTML = '<span style="color: var(--text-muted); font-size: 0.75rem;">No parameters yet</span>';
        return;
    }

    container.innerHTML = builderParams.map((param, index) => `
        <div class="builder-param-item">
            <span class="query-param-key">${escapeHtml(param.key)}</span>
            <span>=</span>
            <span class="query-param-value">${escapeHtml(param.value)}</span>
            <button class="query-builder-btn danger" style="padding: 2px 6px; font-size: 0.7rem;" onclick="removeBuilderParam(${index})">X</button>
        </div>
    `).join('');
}

// Remove parameter from builder
function removeBuilderParam(index) {
    builderParams.splice(index, 1);
    updateBuilderParamsList();
    showStatusMessage('Parameter removed', 'success');
}

// Clear all builder params
function clearBuilderParams() {
    builderParams = [];
    updateBuilderParamsList();
    document.getElementById('builder-output').style.display = 'none';
    showStatusMessage('All parameters cleared', 'success');
}

// Build query string from parameters
function buildQueryString() {
    if (builderParams.length === 0) {
        showStatusMessage('Please add at least one parameter', 'error');
        return;
    }

    const baseUrl = document.getElementById('builder-base-url').value.trim();

    // Build query string
    const queryParts = builderParams.map(param => {
        return `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`;
    });

    const queryString = queryParts.join('&');

    let result;
    if (baseUrl) {
        // Add query string to base URL
        const separator = baseUrl.includes('?') ? '&' : '?';
        result = baseUrl + separator + queryString;
    } else {
        result = '?' + queryString;
    }

    // Show result
    const outputEl = document.getElementById('builder-output');
    outputEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
            <span style="word-break: break-all;">${escapeHtml(result)}</span>
            <button class="copy-btn-small" onclick="copyBuilderResult()">Copy</button>
        </div>
    `;
    outputEl.style.display = 'block';

    // Also set in main output
    document.getElementById('url-output').value = result;

    showStatusMessage('Query string built successfully', 'success');
}

// Copy builder result
function copyBuilderResult() {
    const output = document.getElementById('url-output').value;
    if (output) {
        copyToClipboard(output).then(() => {
            showStatusMessage('Copied to clipboard', 'success');
        }).catch(() => {
            showStatusMessage('Failed to copy', 'error');
        });
    }
}

// Copy output
function copyOutput() {
    const output = document.getElementById('url-output').value;

    if (!output.trim()) {
        showStatusMessage('Nothing to copy', 'error');
        return;
    }

    copyToClipboard(output).then(() => {
        showStatusMessage('Copied to clipboard', 'success');
    }).catch(() => {
        showStatusMessage('Failed to copy', 'error');
    });
}

// Load sample data
function loadSample() {
    const sampleURL = 'https://api.example.com/search?query=hello world&category=books&price=10.99&in_stock=true&tags=fiction,bestseller#results';
    document.getElementById('url-input').value = sampleURL;
    parseURL();
    showStatusMessage('Sample URL loaded', 'success');
}

// Reset parsed section to default values
function resetParsedSection() {
    document.getElementById('parsed-protocol').textContent = '-';
    document.getElementById('parsed-protocol').className = 'parsed-value empty';
    document.getElementById('parsed-host').textContent = '-';
    document.getElementById('parsed-host').className = 'parsed-value empty';
    document.getElementById('parsed-port').textContent = '-';
    document.getElementById('parsed-port').className = 'parsed-value empty';
    document.getElementById('parsed-path').textContent = '-';
    document.getElementById('parsed-path').className = 'parsed-value empty';
    document.getElementById('parsed-query').textContent = '-';
    document.getElementById('parsed-query').className = 'parsed-value empty';
    document.getElementById('parsed-hash').textContent = '-';
    document.getElementById('parsed-hash').className = 'parsed-value empty';
    document.getElementById('parsed-params').innerHTML = '';
}

// Clear all
function clearAll() {
    document.getElementById('url-input').value = '';
    document.getElementById('url-output').value = '';
    resetParsedSection();
    document.getElementById('builder-key').value = '';
    document.getElementById('builder-value').value = '';
    document.getElementById('builder-base-url').value = '';
    builderParams = [];
    updateBuilderParamsList();
    document.getElementById('builder-output').style.display = 'none';
    showStatusMessage('All cleared', 'success');
}

// Show status message
function showStatusMessage(message, type = 'success') {
    const statusBar = document.getElementById('status-bar');
    if (statusBar) {
        statusBar.textContent = message;
        statusBar.className = 'status-bar ' + type;
        setTimeout(() => {
            statusBar.textContent = '';
            statusBar.className = 'status-bar';
        }, 3000);
    }
}
