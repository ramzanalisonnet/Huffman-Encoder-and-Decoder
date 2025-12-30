/**
 * Huffman Coder - Web Application with C++ Backend
 * Main application logic and UI interactions
 */

// Tab switching function
function switchTab(tabName) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    if (tabName === 'encoded') {
        document.getElementById('encodedTab').classList.add('active');
        document.getElementById('encodedContent').classList.add('active');
    } else if (tabName === 'decoded') {
        document.getElementById('decodedTab').classList.add('active');
        document.getElementById('decodedContent').classList.add('active');
    }
}

// Simple global function for txt file upload (called from HTML onclick)
function loadTxtFile(input) {
    try {
        const file = input.files[0];
        if (!file) {
            console.log('No file selected');
            return;
        }
        
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            alert(`File is too large (${formatBytes(file.size)}). Maximum size is 10MB.`);
            input.value = '';
            return;
        }
        
        console.log('Loading txt file:', file.name, 'Size:', file.size);
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                console.log('File read successfully, length:', content.length);
                
                const textarea = document.getElementById('inputText');
                if (!textarea) {
                    console.error('Textarea #inputText not found!');
                    alert('Error: Input textarea not found');
                    return;
                }
                
                textarea.value = content;
                console.log('Content set to textarea');
                
                // Call updateInputStats if it exists
                if (typeof updateInputStats === 'function') {
                    updateInputStats();
                } else {
                    // Manual update if function doesn't exist yet
                    const charCount = document.getElementById('charCount');
                    const byteCount = document.getElementById('byteCount');
                    if (charCount) charCount.textContent = content.length.toLocaleString();
                    if (byteCount) byteCount.textContent = new TextEncoder().encode(content).length.toLocaleString();
                }
                
                // Show toast if function exists
                if (typeof showToast === 'function') {
                    showToast('File loaded: ' + file.name, 'success');
                } else {
                    console.log('File loaded successfully:', file.name);
                    alert('File loaded: ' + file.name);
                }
                
                input.value = ''; // Reset for next upload
            } catch (err) {
                console.error('Error in onload:', err);
                alert('Error processing file: ' + err.message);
            }
        };
        
        reader.onerror = function(e) {
            console.error('FileReader error:', e);
            alert('Error reading file');
            input.value = '';
        };
        
        console.log('Starting to read file...');
        reader.readAsText(file);
        
    } catch (err) {
        console.error('Error in loadTxtFile:', err);
        alert('Error loading file: ' + err.message);
    }
}

// Simple global function for bin/huff file upload (called from HTML onclick)
function loadBinFile(input) {
    const file = input.files[0];
    if (!file) return;
    
    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        showToast(`File is too large (${formatBytes(file.size)}). Maximum size is 50MB.`, 'error');
        input.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const arrayBuffer = e.target.result;
            const bytes = new Uint8Array(arrayBuffer);
            
            console.log('Loading bin file:', file.name, 'Size:', bytes.length);
            
            // Check for HUFF magic header
            if (bytes.length >= 8 && 
                bytes[0] === 0x48 && bytes[1] === 0x55 && 
                bytes[2] === 0x46 && bytes[3] === 0x46) {
                // Parse HUFF file format (little endian)
                const codesLength = bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24);
                const codesJson = new TextDecoder().decode(bytes.slice(8, 8 + codesLength));
                
                console.log('Codes JSON length:', codesLength);
                console.log('Codes JSON:', codesJson);
                
                // Convert remaining bytes to binary string
                let binaryData = '';
                const binaryStartPos = 8 + codesLength;
                for (let i = binaryStartPos; i < bytes.length; i++) {
                    binaryData += bytes[i].toString(2).padStart(8, '0');
                }
                
                console.log('Binary data length:', binaryData.length, 'bits');
                console.log('Binary start position:', binaryStartPos);
                console.log('Total bytes:', bytes.length);
                
                try {
                    const parsedCodes = JSON.parse(codesJson);
                    currentCodes = parsedCodes;
                    currentEncodedData = binaryData;
                    
                    console.log('Parsed codes:', currentCodes);
                    console.log('Number of codes:', Object.keys(currentCodes).length);
                    
                    // Display the codes table
                    displayCodesTable(currentCodes);
                    
                    // Display the encoded binary
                    displayEncodedBinary(binaryData);
                    
                    showToast('Loaded .huff file with ' + Object.keys(currentCodes).length + ' codes - ready to decode!', 'success');
                } catch (err) {
                    console.error('Error parsing .huff file:', err);
                    showToast('Error parsing .huff file: ' + err.message, 'error');
                }
            } else {
                // Plain binary file - convert bytes to binary string
                let binaryString = '';
                for (let i = 0; i < bytes.length; i++) {
                    binaryString += bytes[i].toString(2).padStart(8, '0');
                }
                currentEncodedData = binaryString;
                displayEncodedBinary(binaryString);
                showToast('Loaded binary file (no codes - encode text first before decoding)', 'warning');
            }
            input.value = ''; // Reset for next upload
        } catch (err) {
            console.error('Error in loadBinFile:', err);
            showToast('Error loading file: ' + err.message, 'error');
            input.value = '';
        }
    };
    
    reader.onerror = function(e) {
        console.error('FileReader error:', e);
        showToast('Error reading file', 'error');
        input.value = '';
    };
    
    reader.readAsArrayBuffer(file);
}

// Global state
let currentEncodedData = '';
let currentCodes = {};
let sortOrder = 'frequency';
let treeZoom = 1;
let cppTreeData = null;     // Store tree data from C++ backend

// API Configuration
const API_BASE = window.location.origin;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    initBinaryRain();
    initInputListeners();
    await checkBackendStatus();
});

// ============================================
// Backend Detection
// ============================================

async function checkBackendStatus() {
    try {
        const response = await fetch(`${API_BASE}/api/status`, {
            method: 'GET',
            timeout: 2000
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.backend === 'C++') {
                showToast('🚀 Connected to C++ Backend Server!', 'success');
                updateBackendIndicator(true);
                console.log('Using C++ backend');
                return;
            }
        }
        throw new Error('Backend not available');
    } catch (error) {
        updateBackendIndicator(false);
        showToast('❌ C++ Backend Server is required!', 'error');
        console.error('C++ backend not available');
    }
}

function updateBackendIndicator(cppActive) {
    let indicator = document.getElementById('backendIndicator');
    
    if (!indicator) {
        // Create indicator if it doesn't exist
        indicator = document.createElement('div');
        indicator.id = 'backendIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
            cursor: pointer;
        `;
        indicator.onclick = () => showBackendInfo();
        document.body.appendChild(indicator);
    }
    
    if (cppActive) {
        indicator.style.background = 'linear-gradient(135deg, #00ff88, #00cc66)';
        indicator.style.color = '#000';
        indicator.style.boxShadow = '0 4px 15px rgba(0, 255, 136, 0.4)';
        indicator.innerHTML = `
            <span style="width: 10px; height: 10px; background: #000; border-radius: 50%; animation: pulse 1s infinite;"></span>
            C++ Backend Active
        `;
    } else {
        indicator.style.background = 'linear-gradient(135deg, #ff4444, #cc0000)';
        indicator.style.color = '#fff';
        indicator.style.boxShadow = '0 4px 15px rgba(255, 68, 68, 0.4)';
        indicator.innerHTML = `
            <span style="width: 10px; height: 10px; background: #fff; border-radius: 50%;"></span>
            Backend Offline
        `;
    }
}

function showBackendInfo() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (!modalOverlay) return;
    
    document.getElementById('modalTitle').textContent = 'Huffman Coding Algorithm';
    document.getElementById('modalBody').innerHTML = `
        <div class="algorithm-step">
            <div class="step-number">1</div>
            <div class="step-content">
                <h4>Calculate Frequencies</h4>
                <p>Count the occurrence of each character in the input text.</p>
            </div>
        </div>
        <div class="algorithm-step">
            <div class="step-number">2</div>
            <div class="step-content">
                <h4>Build Priority Queue</h4>
                <p>Create a min-heap with nodes for each character, ordered by frequency.</p>
            </div>
        </div>
        <div class="algorithm-step">
            <div class="step-number">3</div>
            <div class="step-content">
                <h4>Construct Huffman Tree</h4>
                <p>Repeatedly extract the two nodes with lowest frequencies, create a parent node with their combined frequency, and insert it back into the queue.</p>
            </div>
        </div>
        <div class="algorithm-step">
            <div class="step-number">4</div>
            <div class="step-content">
                <h4>Generate Codes</h4>
                <p>Traverse the tree from root to each leaf, assigning '0' for left branches and '1' for right branches. Each path forms the code for that character.</p>
            </div>
        </div>
        <div class="algorithm-step">
            <div class="step-number">5</div>
            <div class="step-content">
                <h4>Encode & Decode</h4>
                <p>Replace each character with its code for encoding. For decoding, traverse the tree using the bits until reaching a leaf node.</p>
            </div>
        </div>
    `;
    modalOverlay.classList.add('active');
}

function showBackendInfo_old() {
    const modalOverlay = document.getElementById('modalOverlay');
    document.getElementById('modalTitle').textContent = 'Backend Information';
    const content = document.getElementById('modalBody');
    
    content.innerHTML = `
        <div class="algorithm-step">
            <div class="step-number">✓</div>
            <div class="step-content">
                <h4>C++ Backend Server</h4>
                <p>The encoding and decoding is processed by the high-performance C++ server using optimized Huffman algorithms.</p>
            </div>
        </div>
        <div class="algorithm-step">
            <div class="step-number">⚡</div>
            <div class="step-content">
                <h4>How It Works</h4>
                <p>Your text is sent to the C++ backend via REST API. The server performs Huffman encoding and returns the compressed binary along with statistics and visualization data.</p>
            </div>
        </div>
        <div class="algorithm-step">
            <div class="step-number">🔗</div>
            <div class="step-content">
                <h4>API Endpoints</h4>
                <code>POST /api/encode</code> - Encode text<br>
                <code>POST /api/decode</code> - Decode binary<br>
                <code>GET /api/status</code> - Server status
            </div>
        </div>
    `;
    
    modalOverlay.classList.add('active');
}

// ============================================
// Binary Rain Animation
// ============================================

function initBinaryRain() {
    const container = document.getElementById('binaryRain');
    const columns = Math.floor(window.innerWidth / 30);
    
    for (let i = 0; i < columns; i++) {
        const column = document.createElement('div');
        column.className = 'binary-column';
        column.style.left = `${i * 30}px`;
        column.style.animationDelay = `${Math.random() * 15}s`;
        column.style.animationDuration = `${15 + Math.random() * 10}s`;
        
        let content = '';
        for (let j = 0; j < 50; j++) {
            content += Math.random() > 0.5 ? '1' : '0';
            content += '<br>';
        }
        column.innerHTML = content;
        container.appendChild(column);
    }
}

// ============================================
// Input Handling
// ============================================

function initInputListeners() {
    const input = document.getElementById('inputText');
    if (input) {
        input.addEventListener('input', updateInputStats);
        input.addEventListener('paste', () => setTimeout(updateInputStats, 0));
    }
    // File upload is handled via inline onclick handlers in HTML
}

function updateInputStats() {
    const text = document.getElementById('inputText').value;
    document.getElementById('charCount').textContent = text.length.toLocaleString();
    document.getElementById('byteCount').textContent = new TextEncoder().encode(text).length.toLocaleString();
}

function loadSampleText() {
    const sampleText = `The quick brown fox jumps over the lazy dog.
Huffman coding is a lossless data compression algorithm.
It assigns variable-length codes to input characters,
with shorter codes assigned to more frequent characters.
This makes the average code length smaller,
resulting in significant space savings for typical text.
The algorithm was developed by David A. Huffman in 1952.`;

    document.getElementById('inputText').value = sampleText;
    updateInputStats();
    showToast('Sample text loaded!');
}

function clearInput() {
    document.getElementById('inputText').value = '';
    updateInputStats();
    resetResults();
    showToast('Input cleared');
}

// ============================================
// File Upload Handlers (called from inline HTML handlers)
// ============================================

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function resetResults() {
    document.getElementById('frequencyTableContainer').innerHTML = 
        '<p class="placeholder-text">Encode text to see frequency analysis</p>';
    document.getElementById('codesTableContainer').innerHTML = 
        '<p class="placeholder-text">Encode text to see Huffman codes</p>';
    document.getElementById('encodedOutput').innerHTML = 
        '<p class="placeholder-text">Encoded binary will appear here</p>';
    document.getElementById('decodedOutput').innerHTML = 
        '<p class="placeholder-text">Decoded text will appear here</p>';
    document.getElementById('treeContainer').innerHTML = `
        <div class="tree-placeholder">
            <i class="fas fa-tree"></i>
            <p>Huffman tree visualization will appear here</p>
        </div>`;
    
    document.getElementById('originalSize').textContent = '-';
    document.getElementById('compressedSize').textContent = '-';
    document.getElementById('compressionRatio').textContent = '-';
    document.getElementById('spaceSaved').textContent = '-';
    document.getElementById('compressionBar').style.width = '0%';
}

// ============================================
// Encoding (with C++ Backend Support)
// ============================================

async function encode() {
    const text = document.getElementById('inputText').value;
    
    if (!text) {
        showToast('Please enter some text to encode', 'warning');
        return;
    }

    try {
        // Show loading indicator
        showLoading(true);
        
        // Use C++ backend
        const result = await encodeWithCppBackend(text);
        
        currentEncodedData = result.encoded;
        currentCodes = result.codes;

        // Update frequency table
        displayFrequencyTable(result.frequencies);

        // Update codes table
        displayCodesTable(result.codes);

        // Update encoded output
        displayEncodedBinary(result.encoded);

        // Update statistics
        displayStats(result.stats);

        // Display tree
        if (result.tree) {
            displayTreeFromJson(result.tree);
        }

        // Switch to encoded tab
        switchTab('encoded');

        showToast('Text encoded successfully with C++ Backend!', 'success');
        
        // Scroll to results
        document.querySelector('.output-tabs-section').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Encoding error:', error);
        showToast('Error encoding text: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function encodeWithCppBackend(text) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
        const response = await fetch(`${API_BASE}/api/encode`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: text,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Backend encoding failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validate response
        if (!data.encoded || !data.codes) {
            throw new Error('Invalid response from backend - missing encoded data or codes');
        }
        
        // Convert backend response to our format
        return {
            encoded: data.encoded,
            codes: data.codes,
            frequencies: data.frequencies || {},
            tree: data.tree || null,
            stats: {
                originalBits: data.stats?.originalBits || 0,
                encodedBits: data.stats?.encodedBits || 0,
                compressionRatio: data.stats?.compressionRatio || 0,
                spaceSaved: (data.stats?.originalBits || 0) - (data.stats?.encodedBits || 0)
            }
        };
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - server took too long to respond');
        }
        throw error;
    }
}

function showLoading(show) {
    let loader = document.getElementById('loadingOverlay');
    
    if (!loader && show) {
        loader = document.createElement('div');
        loader.id = 'loadingOverlay';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        loader.innerHTML = `
            <div style="text-align: center; color: white;">
                <div style="font-size: 48px; animation: spin 1s linear infinite;">⚙️</div>
                <p style="margin-top: 20px; font-size: 18px;">Processing with C++ Backend...</p>
            </div>
            <style>
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loader);
    }
    
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

function displayFrequencyTable(frequencies) {
    // From C++ backend
    if (!frequencies || Object.keys(frequencies).length === 0) {
        document.getElementById('frequencyTableContainer').innerHTML = 
            '<p class="placeholder-text">No frequency data available</p>';
        return;
    }
    
    let entries = Object.entries(frequencies);
    if (sortOrder === 'frequency') {
        entries.sort((a, b) => b[1] - a[1]);
    } else {
        entries.sort((a, b) => a[0].localeCompare(b[0]));
    }
    
    const total = entries.reduce((sum, [_, freq]) => sum + freq, 0);

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Character</th>
                    <th>Frequency</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
    `;

    for (const [char, freq] of entries) {
        const percentage = ((freq / total) * 100).toFixed(1);
        const displayChar = getDisplayChar(char);
        
        html += `
            <tr>
                <td class="char-cell">${escapeHtml(displayChar)}</td>
                <td class="number-cell">${freq.toLocaleString()}</td>
                <td class="number-cell">${percentage}%</td>
            </tr>
        `;
    }

    html += '</tbody></table>';
    document.getElementById('frequencyTableContainer').innerHTML = html;
}

function displayCodesTable(codes) {
    // From C++ backend
    if (!codes || Object.keys(codes).length === 0) {
        document.getElementById('codesTableContainer').innerHTML = 
            '<p class="placeholder-text">No codes data available</p>';
        return;
    }
    
    let entries = Object.entries(codes);
    entries.sort((a, b) => a[1].length - b[1].length);

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Character</th>
                    <th>Code</th>
                    <th>Bits</th>
                </tr>
            </thead>
            <tbody>
    `;

    for (const [char, code] of entries) {
        const displayChar = getDisplayChar(char);
        const coloredCode = code.split('').map(bit => 
            `<span class="bit-${bit}">${bit}</span>`
        ).join('');
        
        html += `
            <tr>
                <td class="char-cell">${escapeHtml(displayChar)}</td>
                <td class="code-cell">${coloredCode}</td>
                <td class="number-cell">${code.length}</td>
            </tr>
        `;
    }

    html += '</tbody></table>';
    document.getElementById('codesTableContainer').innerHTML = html;
}

function displayEncodedBinary(encoded) {
    // Group bits for readability
    const grouped = encoded.match(/.{1,8}/g) || [];
    
    let html = '<div class="binary-output">';
    grouped.forEach((byte, index) => {
        html += `<span class="byte" title="Byte ${index + 1}">${byte}</span>`;
        if ((index + 1) % 8 === 0) {
            html += '<br>';
        }
    });
    html += '</div>';
    
    document.getElementById('encodedOutput').innerHTML = html;
}

function displayStats(stats) {
    if (!stats) return;
    
    document.getElementById('originalSize').textContent = 
        `${(stats.originalBits || 0).toLocaleString()} bits`;
    document.getElementById('compressedSize').textContent = 
        `${(stats.encodedBits || 0).toLocaleString()} bits`;
    
    // Handle compressionRatio as either string or number, prevent NaN
    let ratio = typeof stats.compressionRatio === 'string' ? 
        parseFloat(stats.compressionRatio) : stats.compressionRatio;
    
    // Validate ratio is a valid number
    if (isNaN(ratio) || !isFinite(ratio)) {
        ratio = 0;
    }
    
    document.getElementById('compressionRatio').textContent = 
        `${ratio.toFixed(1)}%`;
    document.getElementById('spaceSaved').textContent = 
        `${(stats.spaceSaved || 0).toLocaleString()} bits`;
    
    // Animate compression bar
    setTimeout(() => {
        document.getElementById('compressionBar').style.width = 
            `${Math.min(Math.max(ratio, 0), 100)}%`;
    }, 100);
}

// ============================================
// SVG Tree Visualization
// ============================================

function displayTreeFromJson(treeData) {
    if (!treeData) {
        document.getElementById('treeContainer').innerHTML = `
            <div class="tree-placeholder">
                <i class="fas fa-tree"></i>
                <p>No tree data available</p>
            </div>
        `;
        return;
    }
    
    // Calculate tree dimensions
    const nodeWidth = 60;
    const nodeHeight = 50;
    const levelHeight = 80;
    const minNodeSpacing = 20;
    
    // First pass: calculate the width needed for each subtree
    function calculateWidths(node) {
        if (!node) return 0;
        
        if (node.char !== undefined) {
            // Leaf node
            node._width = nodeWidth;
            return nodeWidth;
        }
        
        // Internal node
        const leftWidth = calculateWidths(node.left);
        const rightWidth = calculateWidths(node.right);
        node._leftWidth = leftWidth;
        node._rightWidth = rightWidth;
        node._width = leftWidth + rightWidth + minNodeSpacing;
        return node._width;
    }
    
    // Calculate tree depth
    function getTreeDepth(node) {
        if (!node) return 0;
        if (node.char !== undefined) return 1;
        return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right));
    }
    
    const totalWidth = calculateWidths(treeData);
    const treeDepth = getTreeDepth(treeData);
    
    const svgWidth = Math.max(totalWidth + 100, 400);
    const svgHeight = treeDepth * levelHeight + 100;
    
    let svgContent = '';
    let edgesContent = '';
    let nodesContent = '';
    
    // Recursive function to draw the tree
    function drawNode(node, x, y, availableWidth) {
        if (!node) return;
        
        const isLeaf = node.char !== undefined;
        
        if (isLeaf) {
            // Draw leaf node (rounded rectangle)
            const rectWidth = 50;
            const rectHeight = 40;
            const displayChar = getDisplayChar(node.char);
            
            nodesContent += `
                <g class="tree-node-group" transform="translate(${x}, ${y})">
                    <rect class="tree-leaf-node" 
                          x="${-rectWidth/2}" y="${-rectHeight/2}" 
                          width="${rectWidth}" height="${rectHeight}" 
                          rx="8" ry="8"
                          fill="url(#leafGradient)"/>
                    <text class="tree-leaf-char" y="-5">${escapeHtml(displayChar)}</text>
                    <text class="tree-leaf-freq" y="12">freq: ${node.freq}</text>
                </g>
            `;
        } else {
            // Draw internal node (circle)
            const radius = 25;
            
            nodesContent += `
                <g class="tree-node-group" transform="translate(${x}, ${y})">
                    <circle class="tree-internal-node" r="${radius}" cx="0" cy="0"/>
                    <text class="tree-internal-text" y="0">${node.freq}</text>
                </g>
            `;
            
            // Calculate child positions
            const leftWidth = node._leftWidth || 0;
            const rightWidth = node._rightWidth || 0;
            
            const childY = y + levelHeight;
            
            // Position children based on their subtree widths
            const leftX = x - rightWidth/2 - minNodeSpacing/2;
            const rightX = x + leftWidth/2 + minNodeSpacing/2;
            
            // Draw edges to children
            if (node.left) {
                // Draw curved edge to left child
                const startY = y + 25;
                const endY = childY - (node.left.char !== undefined ? 20 : 25);
                const midY = (startY + endY) / 2;
                
                edgesContent += `
                    <path class="tree-edge" 
                          d="M ${x} ${startY} 
                             C ${x} ${midY}, ${leftX} ${midY}, ${leftX} ${endY}"
                          stroke="#0ea5e9"/>
                    <rect class="tree-edge-label-bg" 
                          x="${(x + leftX)/2 - 10}" y="${midY - 10}" 
                          width="20" height="20"/>
                    <text class="tree-edge-label" 
                          x="${(x + leftX)/2}" y="${midY + 4}"
                          fill="#0ea5e9">0</text>
                `;
                
                drawNode(node.left, leftX, childY, leftWidth);
            }
            
            if (node.right) {
                // Draw curved edge to right child
                const startY = y + 25;
                const endY = childY - (node.right.char !== undefined ? 20 : 25);
                const midY = (startY + endY) / 2;
                
                edgesContent += `
                    <path class="tree-edge" 
                          d="M ${x} ${startY} 
                             C ${x} ${midY}, ${rightX} ${midY}, ${rightX} ${endY}"
                          stroke="#22c55e"/>
                    <rect class="tree-edge-label-bg" 
                          x="${(x + rightX)/2 - 10}" y="${midY - 10}" 
                          width="20" height="20"/>
                    <text class="tree-edge-label" 
                          x="${(x + rightX)/2}" y="${midY + 4}"
                          fill="#22c55e">1</text>
                `;
                
                drawNode(node.right, rightX, childY, rightWidth);
            }
        }
    }
    
    // Helper function to get display character
    function getDisplayChar(char) {
        if (char === ' ' || char === '[space]') return '␣';
        if (char === '\\n') return '↵';
        if (char === '\\t') return '⇥';
        if (char === '\\r') return '⏎';
        if (char === '\n') return '↵';
        if (char === '\t') return '⇥';
        if (char === '\r') return '⏎';
        return char;
    }
    
    // Start drawing from the root
    const rootX = svgWidth / 2;
    const rootY = 50;
    drawNode(treeData, rootX, rootY, totalWidth);
    
    // Create the complete SVG
    const svg = `
        <div class="tree-wrapper">
            <div class="tree-controls">
                <button class="tree-control-btn" onclick="zoomTree(0.1)" title="Zoom In">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="tree-control-btn" onclick="zoomTree(-0.1)" title="Zoom Out">
                    <i class="fas fa-minus"></i>
                </button>
                <button class="tree-control-btn" onclick="resetTreeZoom()" title="Reset Zoom">
                    <i class="fas fa-expand"></i>
                </button>
            </div>
            <div class="tree-svg-container" id="treeSvgContainer">
                <svg class="tree-svg" 
                     width="${svgWidth}" height="${svgHeight}" 
                     viewBox="0 0 ${svgWidth} ${svgHeight}"
                     style="transform: scale(${treeZoom}); transform-origin: top center;">
                    <defs>
                        <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:rgba(99, 102, 241, 0.3)"/>
                            <stop offset="100%" style="stop-color:rgba(99, 102, 241, 0.1)"/>
                        </linearGradient>
                    </defs>
                    <!-- Edges (drawn first, behind nodes) -->
                    <g class="tree-edges">
                        ${edgesContent}
                    </g>
                    <!-- Nodes (drawn on top) -->
                    <g class="tree-nodes">
                        ${nodesContent}
                    </g>
                </svg>
            </div>
        </div>
        <div class="tree-legend">
            <div class="tree-legend-item">
                <div class="legend-node internal"></div>
                <span>Internal Node (frequency)</span>
            </div>
            <div class="tree-legend-item">
                <div class="legend-node leaf"></div>
                <span>Leaf Node (character)</span>
            </div>
            <div class="tree-legend-item">
                <div class="legend-edge zero"></div>
                <span>0 (left)</span>
            </div>
            <div class="tree-legend-item">
                <div class="legend-edge one"></div>
                <span>1 (right)</span>
            </div>
        </div>
    `;
    
    document.getElementById('treeContainer').innerHTML = svg;
}

// Tree zoom functions
function zoomTree(delta) {
    treeZoom = Math.max(0.3, Math.min(2, treeZoom + delta));
    const svg = document.querySelector('.tree-svg');
    if (svg) {
        svg.style.transform = `scale(${treeZoom})`;
    }
}

function resetTreeZoom() {
    treeZoom = 1;
    const svg = document.querySelector('.tree-svg');
    if (svg) {
        svg.style.transform = 'scale(1)';
    }
}

// ============================================
// Decoding (with C++ Backend Support)
// ============================================

async function decode() {
    if (!currentEncodedData) {
        showToast('Please encode some text first or upload a .bin file', 'warning');
        return;
    }

    try {
        showLoading(true);
        
        // Check if we have codes (from file upload with header or from encoding)
        if (Object.keys(currentCodes).length === 0) {
            showToast('No Huffman codes available. Please encode text first or upload a .huff file with codes.', 'error');
            showLoading(false);
            return;
        }
        
        console.log('=== Starting Decode ===');
        console.log('Encoded data length:', currentEncodedData.length, 'bits');
        console.log('Number of codes:', Object.keys(currentCodes).length);
        
        // Check if we have the original text (meaning we just encoded and haven't uploaded a file)
        const originalText = document.getElementById('inputText').value;
        const hasOriginalText = originalText && originalText.length > 0;
        
        // If we have original text, try backend first (it can use the tree from encoding)
        // If we uploaded a file (no original text), use client-side decoding with the codes
        if (hasOriginalText) {
            console.log('Has original text - trying backend decode with tree');
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
                
                const response = await fetch(`${API_BASE}/api/decode`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        encoded: currentEncodedData,
                        codes: currentCodes
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`Backend decoding failed: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (!data.decoded && data.decoded !== '') {
                    throw new Error('Invalid response from backend - missing decoded data');
                }
                
                const decoded = data.decoded;
                
                console.log('Backend decode successful, length:', decoded.length);
                displayDecodedResult(decoded);
            } catch (backendError) {
                console.log('Backend decode failed, trying client-side:', backendError.message);
                // Fall back to client-side decoding
                const decoded = decodeWithClientCodes(currentEncodedData, currentCodes);
                displayDecodedResult(decoded);
                showToast('Decoded using embedded codes (client-side)', 'info');
            }
        } else {
            // No original text - this is an uploaded file, use client-side decoding
            console.log('No original text - using client-side decode with codes from file');
            const decoded = decodeWithClientCodes(currentEncodedData, currentCodes);
            displayDecodedResult(decoded);
            showToast('Decoded using codes from uploaded file', 'success');
        }

    } catch (error) {
        console.error('Decoding error:', error);
        showToast('Error decoding: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function displayDecodedResult(decoded) {
    // Display decoded text
    document.getElementById('decodedOutput').innerHTML = `<div class="decoded-text">${escapeHtml(decoded)}</div>`;

    // Switch to decoded tab
    switchTab('decoded');

    // Verify against input if available
    const original = document.getElementById('inputText').value;
    if (original) {
        const isMatch = original === decoded;
        
        console.log('=== Decode Verification ===');
        console.log('Original length:', original.length);
        console.log('Decoded length:', decoded.length);
        console.log('Match:', isMatch);
        
        if (!isMatch) {
            for (let i = 0; i < Math.max(original.length, decoded.length); i++) {
                if (original[i] !== decoded[i]) {
                    console.log(`Difference at position ${i}:`);
                    console.log(`  Original: "${original[i]}" (code: ${original.charCodeAt(i)})`);
                    console.log(`  Decoded: "${decoded[i]}" (code: ${decoded.charCodeAt(i)})`);
                    break;
                }
            }
        }
        
        if (isMatch) {
            showToast('Decoded successfully - Perfect match! ✓', 'success');
        } else {
            showToast('Decoded! (Cannot verify - input may differ)', 'info');
        }
    } else {
        showToast('Decoded successfully!', 'success');
    }
}

function decodeWithClientCodes(encoded, codes) {
    console.log('=== Client-side Decoding ===');
    console.log('Encoded length:', encoded.length, 'bits');
    console.log('Number of codes:', Object.keys(codes).length);
    console.log('Codes:', codes);
    
    // Build reverse lookup table (code -> character)
    const reverseCodes = {};
    for (const [char, code] of Object.entries(codes)) {
        // Handle special characters - the backend might store them as actual chars or escaped
        let actualChar = char;
        if (char === '\\n') actualChar = '\n';
        else if (char === '\\t') actualChar = '\t';
        else if (char === '\\r') actualChar = '\r';
        else if (char === '[space]') actualChar = ' ';
        
        reverseCodes[code] = actualChar;
    }
    
    console.log('Reverse codes built:', Object.keys(reverseCodes).length, 'mappings');
    console.log('Sample reverse codes:', Object.entries(reverseCodes).slice(0, 5));
    
    let decoded = '';
    let currentCode = '';
    let unmatchedBits = 0;
    
    for (let i = 0; i < encoded.length; i++) {
        currentCode += encoded[i];
        if (reverseCodes[currentCode] !== undefined) {
            decoded += reverseCodes[currentCode];
            currentCode = '';
        }
    }
    
    // Check for unmatched bits at the end (padding)
    if (currentCode.length > 0) {
        unmatchedBits = currentCode.length;
        console.log('Warning: Unmatched bits at end (padding):', currentCode, 'length:', unmatchedBits);
    }
    
    console.log('Decoded length:', decoded.length, 'characters');
    console.log('Unmatched bits (padding):', unmatchedBits);
    
    return decoded;
}

// ============================================
// Utility Functions
// ============================================

function getDisplayChar(char) {
    // Convert special characters to visual symbols for tree display
    const specialChars = {
        ' ': '␣ (space)',
        '\n': '↵ (newline)',
        '\t': '⇥ (tab)',
        '\r': '⏎ (return)'
    };
    
    // Check if it's a special character
    if (specialChars[char]) {
        return specialChars[char];
    }
    
    // Check if character code is less than 32 (control character)
    if (char && char.charCodeAt(0) < 32) {
        return `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
    }
    
    // Return the character itself
    return char;
}

function getDisplayChar_old(char) {
    const specialChars = {
        ' ': '␣',
        '\n': '↵',
        '\t': '→',
        '\r': '↲',
        '\\n': '↵',
        '\\t': '→',
        '\\r': '↲',
        '[space]': '␣'
    };
    return specialChars[char] || char;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// Table Sorting
// ============================================

function toggleSort() {
    sortOrder = sortOrder === 'frequency' ? 'character' : 'frequency';
    // Get current frequencies from the table
    const container = document.getElementById('frequencyTableContainer');
    if (container.querySelector('.data-table')) {
        // Re-display with current data (will be sorted based on sortOrder)
        showToast(`Sorted by ${sortOrder}`);
        // Note: This requires the frequencies to be stored globally or re-fetched
        showToast('Please re-encode to apply new sort order', 'info');
    } else {
        showToast('No data to sort', 'warning');
    }
}

// ============================================
// Tree Controls
// ============================================

// Tree zoom functions
function zoomTreeIn() {
    zoomTree(0.1);
}

function zoomTreeOut() {
    zoomTree(-0.1);
}

function zoomTree(delta) {
    treeZoom = Math.max(0.3, Math.min(2, treeZoom + delta));
    const svg = document.querySelector('.tree-svg');
    if (svg) {
        svg.style.transform = `scale(${treeZoom})`;
    }
}

function resetTreeZoom() {
    treeZoom = 1;
    const svg = document.querySelector('.tree-svg');
    if (svg) {
        svg.style.transform = 'scale(1)';
    }
}

// ============================================
// Copy & Download Functions
// ============================================

function copyEncoded() {
    if (!currentEncodedData) {
        showToast('Nothing to copy', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(currentEncodedData).then(() => {
        showToast('Binary copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

function downloadEncoded() {
    if (!currentEncodedData) {
        showToast('Nothing to download', 'warning');
        return;
    }
    
    // Create a binary file with Huffman header
    // Format: HUFF (4 bytes) + codes_length (4 bytes) + codes_json + binary_data
    const codesJson = JSON.stringify(currentCodes);
    const codesBytes = new TextEncoder().encode(codesJson);
    
    // Convert binary string to actual bytes
    const binaryBytes = [];
    for (let i = 0; i < currentEncodedData.length; i += 8) {
        const byte = currentEncodedData.slice(i, i + 8).padEnd(8, '0');
        binaryBytes.push(parseInt(byte, 2));
    }
    
    // Create header: HUFF magic + codes length (4 bytes little endian) + codes + binary
    const header = new Uint8Array([
        0x48, 0x55, 0x46, 0x46,  // 'HUFF' magic bytes
        codesBytes.length & 0xFF,
        (codesBytes.length >> 8) & 0xFF,
        (codesBytes.length >> 16) & 0xFF,
        (codesBytes.length >> 24) & 0xFF
    ]);
    
    // Combine all parts
    const totalLength = header.length + codesBytes.length + binaryBytes.length;
    const fileData = new Uint8Array(totalLength);
    fileData.set(header, 0);
    fileData.set(codesBytes, header.length);
    fileData.set(new Uint8Array(binaryBytes), header.length + codesBytes.length);
    
    const blob = new Blob([fileData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'huffman_encoded.huff';
    a.click();
    URL.revokeObjectURL(url);
    
    showToast(`File downloaded! (${formatBytes(fileData.length)})`);
}

function downloadCodes() {
    if (Object.keys(currentCodes).length === 0) {
        showToast('No codes to download', 'warning');
        return;
    }
    
    const json = JSON.stringify(currentCodes, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'huffman_codes.json';
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Codes downloaded!');
}

function copyCodesTable() {
    if (Object.keys(currentCodes).length === 0) {
        showToast('No codes to copy', 'warning');
        return;
    }
    
    const json = JSON.stringify(currentCodes, null, 2);
    navigator.clipboard.writeText(json).then(() => {
        showToast('Codes table copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

function copyDecoded() {
    const decodedOutput = document.getElementById('decodedOutput');
    const text = decodedOutput.textContent;
    
    if (!text || text.includes('Decoded text will appear here')) {
        showToast('Nothing to copy', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('Decoded text copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

function downloadDecoded() {
    const decodedOutput = document.getElementById('decodedOutput');
    const text = decodedOutput.textContent;
    
    if (!text || text.includes('Decoded text will appear here')) {
        showToast('Nothing to download', 'warning');
        return;
    }
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'decoded_text.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Decoded text downloaded!');
}

// ============================================
// Modal Functions
// ============================================

function showHowItWorks() {
    showBackendInfo();
}

function showAbout() {
    const modalOverlay = document.getElementById('modalOverlay');
    document.getElementById('modalTitle').textContent = 'About Huffman Coder';
    document.getElementById('modalBody').innerHTML = `
        <div class="algorithm-step">
            <div class="step-number">ℹ️</div>
            <div class="step-content">
                <h4>Huffman Coding System</h4>
                <p>A lossless data compression algorithm that assigns variable-length codes to characters based on their frequency. More frequent characters get shorter codes, resulting in optimal compression.</p>
            </div>
        </div>
        <div class="algorithm-step">
            <div class="step-number">🎯</div>
            <div class="step-content">
                <h4>Features</h4>
                <ul style="list-style: none; padding: 0;">
                    <li>✓ Real-time encoding/decoding</li>
                    <li>✓ Visual frequency analysis</li>
                    <li>✓ Interactive Huffman tree visualization</li>
                    <li>✓ Compression statistics</li>
                    <li>✓ C++ backend for high performance</li>
                </ul>
            </div>
        </div>
        <div class="algorithm-step">
            <div class="step-number">📚</div>
            <div class="step-content">
                <h4>Algorithm</h4>
                <p>Developed by David A. Huffman in 1952, this algorithm is widely used in file compression formats like ZIP, GZIP, and JPEG.</p>
            </div>
        </div>
    `;
    modalOverlay.classList.add('active');
}

function showHelp() {
    const modalOverlay = document.getElementById('modalOverlay');
    document.getElementById('modalTitle').textContent = 'Help & Instructions';
    document.getElementById('modalBody').innerHTML = `
        <div class="algorithm-step">
            <div class="step-number">1</div>
            <div class="step-content">
                <h4>Enter Text</h4>
                <p>Type or paste text into the input area, or drag and drop a text file.</p>
            </div>
        </div>
        <div class="algorithm-step">
            <div class="step-number">2</div>
            <div class="step-content">
                <h4>Encode</h4>
                <p>Click the <strong>Encode</strong> button to compress your text using Huffman coding. The system will display frequency analysis, generated codes, binary output, and statistics.</p>
            </div>
        </div>
        <div class="algorithm-step">
            <div class="step-number">3</div>
            <div class="step-content">
                <h4>Decode</h4>
                <p>After encoding, click <strong>Decode</strong> to verify the compression. The original text will be reconstructed perfectly.</p>
            </div>
        </div>
        <div class="algorithm-step">
            <div class="step-number">⌨️</div>
            <div class="step-content">
                <h4>Keyboard Shortcuts</h4>
                <ul style="list-style: none; padding: 0;">
                    <li><kbd>Ctrl+Enter</kbd> - Encode</li>
                    <li><kbd>Ctrl+D</kbd> - Decode</li>
                    <li><kbd>Ctrl+S</kbd> - Download encoded file</li>
                    <li><kbd>Esc</kbd> - Close modals</li>
                </ul>
            </div>
        </div>
    `;
    modalOverlay.classList.add('active');
}

function closeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
    }
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeModal();
    }
});

// ============================================
// Keyboard Shortcuts
// ============================================

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                encode();
                break;
            case 'd':
                e.preventDefault();
                decode();
                break;
            case 's':
                e.preventDefault();
                downloadEncoded();
                break;
        }
    }
    
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

// ============================================
// Drag and Drop
// ============================================

const dropZone = document.getElementById('inputText');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('text/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            dropZone.value = event.target.result;
            updateInputStats();
            showToast(`Loaded: ${file.name}`);
        };
        reader.readAsText(file);
    } else {
        showToast('Please drop a text file', 'warning');
    }
});


