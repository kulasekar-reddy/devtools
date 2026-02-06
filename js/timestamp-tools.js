// Timestamp Converter - DevTools
// Converts between Unix epoch timestamps and human-readable dates

document.addEventListener('DOMContentLoaded', function() {
    // Set active navigation
    setActiveNav('timestamp-tools.html');

    // Start live clock
    updateLiveClock();
    setInterval(updateLiveClock, 1000);

    // Check for URL parameters (permalink)
    loadFromURL();

    // Add input listeners for date fields
    const dateFields = ['date-year', 'date-month', 'date-day', 'date-hour', 'date-minute', 'date-second'];
    dateFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    convertDateToEpoch();
                }
            });
        }
    });

    // Epoch input enter key
    const epochInput = document.getElementById('epoch-input');
    if (epochInput) {
        epochInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                convertEpochToHuman();
            }
        });
    }
});

// Update live clock display
function updateLiveClock() {
    const clockEl = document.getElementById('live-clock');
    if (clockEl) {
        clockEl.textContent = Math.floor(Date.now() / 1000);
    }
}

// Convert epoch timestamp to human-readable formats
function convertEpochToHuman() {
    const input = document.getElementById('epoch-input').value.trim();
    const timezone = document.getElementById('timezone-select').value;

    if (!input) {
        clearResults();
        return;
    }

    let timestamp = parseInt(input, 10);

    if (isNaN(timestamp)) {
        showStatusMessage('Invalid timestamp. Please enter a valid number.', 'error');
        clearResults();
        return;
    }

    // Detect if milliseconds (13+ digits) or seconds (10 digits)
    let isMilliseconds = input.length >= 13;
    let milliseconds = isMilliseconds ? timestamp : timestamp * 1000;
    let seconds = isMilliseconds ? Math.floor(timestamp / 1000) : timestamp;

    // Validate reasonable date range (1970 to 2100)
    const minMs = 0;
    const maxMs = 4102444800000; // 2100-01-01

    if (milliseconds < minMs || milliseconds > maxMs) {
        showStatusMessage('Timestamp out of range. Please enter a value between 1970 and 2100.', 'error');
        clearResults();
        return;
    }

    const date = new Date(milliseconds);

    // Format results
    document.getElementById('result-human').textContent = formatHumanReadable(date, timezone);
    document.getElementById('result-iso').textContent = formatISO8601(date, timezone);
    document.getElementById('result-rfc').textContent = formatRFC2822(date, timezone);
    document.getElementById('result-relative').textContent = getRelativeTime(milliseconds);
    document.getElementById('result-seconds').textContent = seconds;
    document.getElementById('result-milliseconds').textContent = milliseconds;

    showStatusMessage('Converted successfully', 'success');
}

// Format as human-readable string
function formatHumanReadable(date, timezone) {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: timezone,
        timeZoneName: 'short'
    };
    return date.toLocaleString('en-US', options);
}

// Format as ISO 8601
function formatISO8601(date, timezone) {
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: timezone,
        hour12: false
    };

    const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(date);
    const values = {};
    parts.forEach(part => {
        values[part.type] = part.value;
    });

    // Get timezone offset
    const tzOffset = getTimezoneOffset(date, timezone);

    return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}${tzOffset}`;
}

// Get timezone offset string
function getTimezoneOffset(date, timezone) {
    if (timezone === 'UTC') return 'Z';

    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const diff = (tzDate - utcDate) / 60000; // difference in minutes

    const hours = Math.floor(Math.abs(diff) / 60);
    const minutes = Math.abs(diff) % 60;
    const sign = diff >= 0 ? '+' : '-';

    return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Format as RFC 2822
function formatRFC2822(date, timezone) {
    const options = {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: timezone,
        hour12: false
    };

    const formatted = date.toLocaleString('en-US', options);
    const tzOffset = getTimezoneOffset(date, timezone).replace(':', '');

    // Parse and reformat
    const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
    const values = {};
    parts.forEach(part => {
        values[part.type] = part.value;
    });

    return `${values.weekday}, ${values.day} ${values.month} ${values.year} ${values.hour}:${values.minute}:${values.second} ${tzOffset}`;
}

// Get relative time string
function getRelativeTime(milliseconds) {
    const now = Date.now();
    const diff = now - milliseconds;
    const absDiff = Math.abs(diff);

    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    let result;

    if (seconds < 60) {
        result = seconds === 1 ? '1 second' : `${seconds} seconds`;
    } else if (minutes < 60) {
        result = minutes === 1 ? '1 minute' : `${minutes} minutes`;
    } else if (hours < 24) {
        result = hours === 1 ? '1 hour' : `${hours} hours`;
    } else if (days < 30) {
        result = days === 1 ? '1 day' : `${days} days`;
    } else if (months < 12) {
        result = months === 1 ? '1 month' : `${months} months`;
    } else {
        result = years === 1 ? '1 year' : `${years} years`;
    }

    if (diff > 0) {
        return `${result} ago`;
    } else if (diff < 0) {
        return `in ${result}`;
    } else {
        return 'now';
    }
}

// Convert date inputs to epoch
function convertDateToEpoch() {
    const year = parseInt(document.getElementById('date-year').value) || new Date().getFullYear();
    const month = parseInt(document.getElementById('date-month').value) || 1;
    const day = parseInt(document.getElementById('date-day').value) || 1;
    const hour = parseInt(document.getElementById('date-hour').value) || 0;
    const minute = parseInt(document.getElementById('date-minute').value) || 0;
    const second = parseInt(document.getElementById('date-second').value) || 0;

    const timezone = document.getElementById('timezone-select').value;

    // Validate inputs
    if (month < 1 || month > 12) {
        showStatusMessage('Invalid month. Please enter a value between 1 and 12.', 'error');
        return;
    }
    if (day < 1 || day > 31) {
        showStatusMessage('Invalid day. Please enter a value between 1 and 31.', 'error');
        return;
    }
    if (hour < 0 || hour > 23) {
        showStatusMessage('Invalid hour. Please enter a value between 0 and 23.', 'error');
        return;
    }
    if (minute < 0 || minute > 59) {
        showStatusMessage('Invalid minute. Please enter a value between 0 and 59.', 'error');
        return;
    }
    if (second < 0 || second > 59) {
        showStatusMessage('Invalid second. Please enter a value between 0 and 59.', 'error');
        return;
    }

    // Create date string and convert based on timezone
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

    // Use Intl to get the correct timestamp for the timezone
    let timestamp;
    try {
        // Create a date in the specified timezone
        const options = { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

        // Parse the date as if it were in the specified timezone
        const date = new Date(dateStr);

        // Calculate offset difference
        const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
        const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
        const offset = tzDate - utcDate;

        // Adjust timestamp
        timestamp = date.getTime() - offset;
    } catch (e) {
        timestamp = new Date(dateStr).getTime();
    }

    const seconds = Math.floor(timestamp / 1000);

    // Update epoch input and trigger conversion
    document.getElementById('epoch-input').value = seconds;
    convertEpochToHuman();

    showStatusMessage('Date converted to timestamp', 'success');
}

// Load current time
function loadCurrentTime() {
    const now = Math.floor(Date.now() / 1000);
    document.getElementById('epoch-input').value = now;
    convertEpochToHuman();
    showStatusMessage('Current timestamp loaded', 'success');
}

// Load sample data
function loadSample() {
    // Use a memorable timestamp: Jan 1, 2024 00:00:00 UTC
    document.getElementById('epoch-input').value = '1704067200';
    convertEpochToHuman();
    showStatusMessage('Sample timestamp loaded (Jan 1, 2024 UTC)', 'success');
}

// Clear all inputs and results
function clearAll() {
    document.getElementById('epoch-input').value = '';
    document.getElementById('date-year').value = '';
    document.getElementById('date-month').value = '';
    document.getElementById('date-day').value = '';
    document.getElementById('date-hour').value = '';
    document.getElementById('date-minute').value = '';
    document.getElementById('date-second').value = '';
    clearResults();
    showStatusMessage('All cleared', 'success');
}

// Clear results display
function clearResults() {
    document.getElementById('result-human').textContent = '-';
    document.getElementById('result-iso').textContent = '-';
    document.getElementById('result-rfc').textContent = '-';
    document.getElementById('result-relative').textContent = '-';
    document.getElementById('result-seconds').textContent = '-';
    document.getElementById('result-milliseconds').textContent = '-';
}

// Copy individual result
function copyResult(elementId) {
    const el = document.getElementById(elementId);
    const text = el.textContent;

    if (!text || text === '-') {
        showStatusMessage('Nothing to copy', 'error');
        return;
    }

    copyToClipboard(text).then(() => {
        showStatusMessage('Copied to clipboard', 'success');
    }).catch(() => {
        showStatusMessage('Failed to copy', 'error');
    });
}

// Copy all results
function copyAllResults() {
    const human = document.getElementById('result-human').textContent;
    const iso = document.getElementById('result-iso').textContent;
    const rfc = document.getElementById('result-rfc').textContent;
    const relative = document.getElementById('result-relative').textContent;
    const seconds = document.getElementById('result-seconds').textContent;
    const milliseconds = document.getElementById('result-milliseconds').textContent;

    if (human === '-') {
        showStatusMessage('No results to copy. Enter a timestamp first.', 'error');
        return;
    }

    const text = `Human Readable: ${human}
ISO 8601: ${iso}
RFC 2822: ${rfc}
Relative: ${relative}
Seconds: ${seconds}
Milliseconds: ${milliseconds}`;

    copyToClipboard(text).then(() => {
        showStatusMessage('All results copied to clipboard', 'success');
    }).catch(() => {
        showStatusMessage('Failed to copy', 'error');
    });
}

// Copy permalink
function copyPermalink() {
    const timestamp = document.getElementById('epoch-input').value.trim();
    const timezone = document.getElementById('timezone-select').value;

    if (!timestamp) {
        showStatusMessage('Enter a timestamp first', 'error');
        return;
    }

    const baseUrl = 'https://timestamp.formatting.tech/';
    const permalink = `${baseUrl}?t=${encodeURIComponent(timestamp)}&tz=${encodeURIComponent(timezone)}`;

    copyToClipboard(permalink).then(() => {
        showStatusMessage('Permalink copied to clipboard', 'success');
    }).catch(() => {
        showStatusMessage('Failed to copy permalink', 'error');
    });
}

// Load from URL parameters
function loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const timestamp = urlParams.get('t');
    const timezone = urlParams.get('tz');

    if (timestamp) {
        document.getElementById('epoch-input').value = timestamp;

        if (timezone) {
            const select = document.getElementById('timezone-select');
            const option = Array.from(select.options).find(opt => opt.value === timezone);
            if (option) {
                select.value = timezone;
            }
        }

        convertEpochToHuman();
    }
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
