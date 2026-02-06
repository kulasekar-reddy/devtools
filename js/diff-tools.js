// Diff Tools JavaScript

function showStatusMessage(message, type = 'success') {
    const statusBar = document.getElementById('status-bar');
    if (statusBar) {
        statusBar.textContent = message;
        statusBar.className = 'status-bar show ' + type;
        setTimeout(() => {
            statusBar.textContent = '';
            statusBar.className = 'status-bar';
        }, 5000);
    }
}

function clearAll() {
    document.getElementById('input-original').value = '';
    document.getElementById('input-modified').value = '';
    document.getElementById('diff-results').style.display = 'none';
    document.getElementById('diff-output').innerHTML = '';
    updateCharCounts();
    showStatusMessage('Cleared all fields', 'info');
}

function swapContent() {
    const original = document.getElementById('input-original');
    const modified = document.getElementById('input-modified');
    const temp = original.value;
    original.value = modified.value;
    modified.value = temp;
    updateCharCounts();
    showStatusMessage('Swapped content', 'info');
}

function updateCharCounts() {
    document.getElementById('input-original').dispatchEvent(new Event('input'));
    document.getElementById('input-modified').dispatchEvent(new Event('input'));
}

function formatBoth(type) {
    const original = document.getElementById('input-original');
    const modified = document.getElementById('input-modified');
    
    if (!original.value.trim() && !modified.value.trim()) {
        showStatusMessage('Nothing to format', 'error');
        return;
    }

    try {
        if (type === 'json') {
            if (original.value.trim()) original.value = JSON.stringify(JSON.parse(original.value), null, 2);
            if (modified.value.trim()) modified.value = JSON.stringify(JSON.parse(modified.value), null, 2);
        } else if (type === 'xml') {
            // Check if formatXML function exists (from xml-tools.js)
            if (typeof formatXML === 'function') {
                // formatXML usually takes the editor value and sets it, or returns it.
                // Looking at typical implementations in this project, we might need to adapt.
                // Since I can't see xml-tools.js right now, I'll implement a simple formatter or assume a shared util.
                // BUT, I included xml-tools.js in the HTML.
                // However, xml-tools.js usually manipulates the DOM elements specific to that page.
                // Let's implement a safe wrapper or a local formatter if needed.
                // Actually, let's implement a specific simple XML formatter here to be safe and dependency-free if possible,
                // OR try to use the one from xml-tools.js if it exposes a helper.
                
                // Let's rely on a local helper for safety as I am not sure of xml-tools.js exports.
                if (original.value.trim()) original.value = simpleFormatXML(original.value);
                if (modified.value.trim()) modified.value = simpleFormatXML(modified.value);
            } else {
                 if (original.value.trim()) original.value = simpleFormatXML(original.value);
                 if (modified.value.trim()) modified.value = simpleFormatXML(modified.value);
            }
        }
        updateCharCounts();
        showStatusMessage(`Formatted both inputs as ${type.toUpperCase()}`);
    } catch (e) {
        showStatusMessage(`Error formatting ${type.toUpperCase()}: ${e.message}`, 'error');
    }
}

// Simple XML Formatter for Diff Tool
function simpleFormatXML(xml) {
    let formatted = '';
    let reg = /(>)(<)(\/?)/g;
    xml = xml.replace(reg, '$1\r\n$2$3');
    let pad = 0;
    xml.split('\r\n').forEach(function(node) {
        let indent = 0;
        if (node.match(/.+<\/\w[^>]*>$/)) {
            indent = 0;
        } else if (node.match(/^<\/\w/)) {
            if (pad != 0) {
                pad -= 1;
            }
        } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
            indent = 1;
        } else {
            indent = 0;
        }

        let padding = '';
        for (let i = 0; i < pad; i++) {
            padding += '  ';
        }

        formatted += padding + node + '\r\n';
        pad += indent;
    });
    return formatted.trim();
}

function computeDiff() {
    const originalText = document.getElementById('input-original').value;
    const modifiedText = document.getElementById('input-modified').value;
    
    if (!originalText && !modifiedText) {
        showStatusMessage('Please enter text to compare', 'error');
        return;
    }

    const diff = diffLines(originalText, modifiedText);
    renderDiff(diff);
    document.getElementById('diff-results').style.display = 'block';
    
    // Scroll to results
    document.getElementById('diff-results').scrollIntoView({ behavior: 'smooth' });
}

// Basic Diff Algorithm (Myers Diff Algorithm simplified or LCS based)
// We will use a simplified approach: Split by lines and find LCS.
function diffLines(text1, text2) {
    const lines1 = text1.split(/\r?\n/);
    const lines2 = text2.split(/\r?\n/);
    
    // Matrix for LCS
    const matrix = Array(lines1.length + 1).fill(null).map(() => Array(lines2.length + 1).fill(0));
    
    for (let i = 1; i <= lines1.length; i++) {
        for (let j = 1; j <= lines2.length; j++) {
            if (lines1[i - 1] === lines2[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1] + 1;
            } else {
                matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
            }
        }
    }
    
    // Backtrack to find diff
    const diff = [];
    let i = lines1.length;
    let j = lines2.length;
    
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
            diff.unshift({ type: 'equal', content: lines1[i - 1] });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
            diff.unshift({ type: 'add', content: lines2[j - 1] });
            j--;
        } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
            diff.unshift({ type: 'remove', content: lines1[i - 1] });
            i--;
        }
    }
    
    return diff;
}

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

function renderDiff(diff) {
    const container = document.getElementById('diff-output');
    let html = '';
    let lineNum1 = 0;
    let lineNum2 = 0;
    
    diff.forEach(part => {
        let className = 'diff-equal';
        let num1 = '';
        let num2 = '';
        
        if (part.type === 'equal') {
            lineNum1++;
            lineNum2++;
            num1 = lineNum1;
            num2 = lineNum2;
        } else if (part.type === 'add') {
            className = 'diff-added';
            lineNum2++;
            num2 = lineNum2;
        } else if (part.type === 'remove') {
            className = 'diff-removed';
            lineNum1++;
            num1 = lineNum1;
        }
        
        html += `<div class="diff-line ${className}">
            <div class="diff-line-number">${num1}</div>
            <div class="diff-line-number">${num2}</div>
            <div class="diff-content">${escapeHtml(part.content)}</div>
        </div>`;
    });
    
    if (diff.length === 0) {
        html = '<div class="diff-header">No differences found (files are identical)</div>';
    }
    
    container.innerHTML = html;
}
