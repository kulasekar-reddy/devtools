// Utility functions shared across all tools

// Show status message
function showStatus(statusId, message, type = 'success') {
    const statusBar = document.getElementById(statusId);
    if (statusBar) {
        statusBar.textContent = message;
        statusBar.className = `status-bar show ${type}`;
        setTimeout(() => {
            statusBar.classList.remove('show');
        }, 3000);
    }
}

// Character counter
function initCharCounter(inputId, countId) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(countId);
    
    if (!input || !counter) return;
    
    input.addEventListener('input', function() {
        const count = this.value.length;
        counter.textContent = `${count.toLocaleString()} characters`;
    });
}

// Copy to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return Promise.resolve();
    }
}

// Copy output directly from panel header button
function copyOutputDirect(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    let text = '';
    if (element.tagName === 'TEXTAREA') {
        text = element.value;
    } else {
        text = element.textContent || element.innerText;
    }

    if (!text.trim()) {
        return; // Nothing to copy
    }

    copyToClipboard(text).then(() => {
        // Visual feedback - briefly change button appearance
        const btn = document.querySelector(`[onclick="copyOutputDirect('${elementId}')"]`);
        if (btn) {
            btn.classList.add('copied');
            const icon = btn.querySelector('.copy-icon');
            if (icon) icon.textContent = '✓';
            setTimeout(() => {
                btn.classList.remove('copied');
                if (icon) icon.textContent = '📋';
            }, 1500);
        }
    });
}

// Escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Set active navigation
function setActiveNav(currentPage) {
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === 'index.html' && href === './')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Fullscreen functionality
let currentFullscreenTarget = null;

function toggleFullscreen(targetId) {
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    const overlay = document.getElementById('fullscreen-overlay');
    const contentContainer = document.getElementById('fullscreen-content');
    const titleElement = overlay.querySelector('.fullscreen-title');

    // Get the panel label for the title
    const panel = targetElement.closest('.editor-panel');
    const panelLabel = panel ? panel.querySelector('.panel-label').textContent : 'Output';

    // Clone the content
    const clone = targetElement.cloneNode(true);
    clone.id = targetId + '-fullscreen';

    // For textareas, copy the current value and keep readonly
    if (targetElement.tagName === 'TEXTAREA') {
        clone.value = targetElement.value;
        clone.setAttribute('readonly', 'readonly');
    }

    // Clear and set content
    contentContainer.innerHTML = '';
    contentContainer.appendChild(clone);

    // Set title
    titleElement.textContent = panelLabel;

    // Show overlay
    overlay.hidden = false;
    document.body.classList.add('fullscreen-active');
    currentFullscreenTarget = targetId;

    // Focus the content for accessibility
    clone.focus();
}

function exitFullscreen() {
    const overlay = document.getElementById('fullscreen-overlay');
    const contentContainer = document.getElementById('fullscreen-content');

    // Hide overlay
    overlay.hidden = true;
    document.body.classList.remove('fullscreen-active');

    // Clear content
    contentContainer.innerHTML = '';
    currentFullscreenTarget = null;
}

// Global ESC key handler for fullscreen
function initFullscreenKeyHandler() {
    document.addEventListener('keydown', function(e) {
        // ESC to exit fullscreen
        if (e.key === 'Escape' && currentFullscreenTarget) {
            e.preventDefault();
            exitFullscreen();
        }

        // F key to toggle fullscreen for active output (when not in input field)
        if (e.key === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const activeElement = document.activeElement;
            const isInInput = activeElement.tagName === 'TEXTAREA' ||
                             activeElement.tagName === 'INPUT';

            if (!isInInput && !currentFullscreenTarget) {
                // Find the active output panel
                const activeSection = document.querySelector('.tool-section.active');
                if (activeSection) {
                    const outputElement = activeSection.querySelector('textarea[readonly], .validation-result, .tree-view');
                    if (outputElement && outputElement.id) {
                        e.preventDefault();
                        toggleFullscreen(outputElement.id);
                    }
                }
            }
        }
    });
}

// Click outside to close fullscreen
function initFullscreenClickHandler() {
    const overlay = document.getElementById('fullscreen-overlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            // Close if clicking the overlay background (not the content)
            if (e.target === overlay) {
                exitFullscreen();
            }
        });
    }
}
