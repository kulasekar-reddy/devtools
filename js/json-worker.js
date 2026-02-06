// JSON Worker - Handles heavy JSON operations off the main thread

let parsedData = null;

self.onmessage = function(e) {
    const { type, id, data } = e.data;

    try {
        switch (type) {
            case 'parse':
                handleParse(id, data);
                break;
            case 'format':
                handleFormat(id, data);
                break;
            case 'minify':
                handleMinify(id, data);
                break;
            case 'validate':
                handleValidate(id, data);
                break;
            case 'getValueAtPath':
                handleGetValueAtPath(id, data);
                break;
            default:
                self.postMessage({ type, id, success: false, error: { message: 'Unknown command' } });
        }
    } catch (error) {
        self.postMessage({ type, id, success: false, error: { message: error.message } });
    }
};

function handleParse(id, jsonString) {
    try {
        const startTime = performance.now();
        parsedData = JSON.parse(jsonString);
        const parseTime = performance.now() - startTime;

        // Get stats
        const stats = getJsonStats(parsedData);

        self.postMessage({
            type: 'parse',
            id,
            success: true,
            result: parsedData,
            stats: {
                ...stats,
                parseTime: Math.round(parseTime)
            }
        });
    } catch (error) {
        const errorInfo = parseJsonError(error.message, jsonString);
        self.postMessage({
            type: 'parse',
            id,
            success: false,
            error: errorInfo
        });
    }
}

function handleFormat(id, jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        const formatted = JSON.stringify(parsed, null, 2);
        self.postMessage({ type: 'format', id, success: true, result: formatted });
    } catch (error) {
        const errorInfo = parseJsonError(error.message, jsonString);
        self.postMessage({ type: 'format', id, success: false, error: errorInfo });
    }
}

function handleMinify(id, jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        const minified = JSON.stringify(parsed);
        self.postMessage({ type: 'minify', id, success: true, result: minified });
    } catch (error) {
        const errorInfo = parseJsonError(error.message, jsonString);
        self.postMessage({ type: 'minify', id, success: false, error: errorInfo });
    }
}

function handleValidate(id, jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        const stats = getJsonStats(parsed);
        self.postMessage({
            type: 'validate',
            id,
            success: true,
            result: {
                valid: true,
                ...stats
            }
        });
    } catch (error) {
        const errorInfo = parseJsonError(error.message, jsonString);
        self.postMessage({
            type: 'validate',
            id,
            success: false,
            error: errorInfo
        });
    }
}

function handleGetValueAtPath(id, { path }) {
    if (!parsedData) {
        self.postMessage({
            type: 'getValueAtPath',
            id,
            success: false,
            error: { message: 'No JSON parsed yet' }
        });
        return;
    }

    try {
        const value = getValueAtPath(parsedData, path);
        self.postMessage({
            type: 'getValueAtPath',
            id,
            success: true,
            result: value
        });
    } catch (error) {
        self.postMessage({
            type: 'getValueAtPath',
            id,
            success: false,
            error: { message: error.message }
        });
    }
}

// Get value at a path like "data.users[0].name"
function getValueAtPath(obj, path) {
    const segments = parsePath(path);
    let current = obj;

    for (const segment of segments) {
        if (current === null || current === undefined) {
            throw new Error(`Path not found: ${path}`);
        }
        current = current[segment];
    }

    return current;
}

// Parse path "data.users[0].name" -> ["data", "users", "0", "name"]
function parsePath(path) {
    const segments = [];
    let current = '';
    let inBracket = false;

    for (let i = 0; i < path.length; i++) {
        const char = path[i];

        if (char === '[') {
            if (current) {
                segments.push(current);
                current = '';
            }
            inBracket = true;
        } else if (char === ']') {
            if (current) {
                segments.push(current);
                current = '';
            }
            inBracket = false;
        } else if (char === '.' && !inBracket) {
            if (current) {
                segments.push(current);
                current = '';
            }
        } else {
            current += char;
        }
    }

    if (current) {
        segments.push(current);
    }

    return segments;
}

// Get JSON statistics
function getJsonStats(obj) {
    let objectCount = 0;
    let arrayCount = 0;
    let stringCount = 0;
    let numberCount = 0;
    let booleanCount = 0;
    let nullCount = 0;
    let maxDepth = 0;

    function traverse(value, depth) {
        maxDepth = Math.max(maxDepth, depth);

        if (value === null) {
            nullCount++;
        } else if (Array.isArray(value)) {
            arrayCount++;
            value.forEach(item => traverse(item, depth + 1));
        } else if (typeof value === 'object') {
            objectCount++;
            Object.values(value).forEach(v => traverse(v, depth + 1));
        } else if (typeof value === 'string') {
            stringCount++;
        } else if (typeof value === 'number') {
            numberCount++;
        } else if (typeof value === 'boolean') {
            booleanCount++;
        }
    }

    traverse(obj, 0);

    return {
        type: Array.isArray(obj) ? 'array' : typeof obj,
        topLevelKeys: typeof obj === 'object' && obj !== null ? Object.keys(obj).length : 0,
        objectCount,
        arrayCount,
        stringCount,
        numberCount,
        booleanCount,
        nullCount,
        maxDepth,
        totalNodes: objectCount + arrayCount + stringCount + numberCount + booleanCount + nullCount
    };
}

// Parse JSON error to extract line number and position
function parseJsonError(errorMessage, jsonContent) {
    const result = { message: errorMessage, line: null, position: null, column: null };

    // Try to parse "at position N" (Chrome/V8/Node)
    const positionMatch = errorMessage.match(/position (\d+)/);
    if (positionMatch) {
        const position = parseInt(positionMatch[1], 10);
        result.position = position;

        // Calculate line and column
        const substring = jsonContent.substring(0, position);
        const lines = substring.split('\n');
        result.line = lines.length;
        result.column = lines[lines.length - 1].length + 1;
    }

    // Try to parse "line N" (Firefox style)
    const lineMatch = errorMessage.match(/line (\d+)/);
    if (lineMatch) {
        result.line = parseInt(lineMatch[1], 10);
    }

    return result;
}
