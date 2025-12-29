# Huffman Encoding/Decoding System

A complete full-stack implementation of Huffman coding for bidirectional (full-duplex) information transmission with **modern web interface** powered by **C++ backend**.

## 🌟 Features

- **🚀 High-Performance C++ Backend** - REST API server using Windows Sockets
- **🎨 Modern Web Interface** - Responsive dark-themed UI with real-time updates
- **📊 Interactive Visualizations** - Frequency tables, Huffman codes, and tree diagrams
- **📈 Real-Time Statistics** - Compression ratio, space saved, visual progress bars
- **⚡ Live Encoding/Decoding** - Process text directly in your browser
- **💾 Export Functionality** - Download encoded binary and code tables
- **⌨️ Keyboard Shortcuts** - Fast workflow with hotkeys
- **🎯 Drag & Drop Support** - Load text files by dragging

## 📁 File Structure

```
Huffman encoder and decoder/
├── HuffmanServer.cpp     # C++ HTTP server backend (REST API)
├── README.md             # This file
└── web/                  # Web frontend files
    ├── index.html        # Main HTML structure
    ├── styles.css        # Dark theme styling and animations
    └── app.js            # Frontend logic and API integration
```

## � How To Use This Project

### Step 1: Prerequisites
- **Windows OS** (for Windows Sockets)
- **C++ Compiler**: MinGW (g++) or Visual Studio
- **Web Browser**: Chrome, Firefox, or Edge (any modern browser)

### Step 2: Compilation

#### Using MinGW/g++:
```bash
g++ -o HuffmanServer HuffmanServer.cpp -std=c++11 -lws2_32
```

#### Using Visual Studio Developer Command Prompt:
```bash
cl /EHsc HuffmanServer.cpp ws2_32.lib
```

### Step 3: Start the Server

```bash
cd "Huffman encoder and decoder"
./HuffmanServer.exe
```

You should see:
```
╔══════════════════════════════════════════════════════════════╗
║                    HUFFMAN CODER                             ║
║              C++ BACKEND SERVER v1.0                         ║
╚══════════════════════════════════════════════════════════════╝

Server running at: http://localhost:8080
```

### Step 4: Access the Web Interface

1. Open your browser
2. Navigate to `http://localhost:8080`
3. Look for the green "C++ Backend Active" indicator in the top right

### Step 5: Encode Your First Message

#### Method 1: Type Text
1. Click in the input textarea
2. Type or paste your text
3. Watch the character/byte count update in real-time
4. Click the **"Encode"** button (or press `Ctrl+Enter`)

#### Method 2: Load a File
1. Drag and drop a `.txt` file into the input area
2. Or click **"Sample"** button to load example text
3. Click **"Encode"**

### Step 6: View Results

After encoding, you'll see:

**Frequency Analysis Table**
- Shows each character and how often it appears
- Click **"Sort"** to toggle between frequency/alphabetical order
- Displays percentage of total characters

**Huffman Codes Table**
- Binary codes assigned to each character
- Shorter codes = more frequent characters
- Click **"Copy"** to copy codes as JSON

**Encoded Binary**
- Your text converted to binary (0s and 1s)
- Grouped in bytes (8 bits) for readability
- Click **"Copy"** or **"Download"** to save

**Statistics**
- Original size vs Compressed size
- Compression ratio percentage
- Space saved in bits
- Visual progress bar

**Huffman Tree Visualization**
- Interactive tree diagram
- Use **zoom in/out** buttons
- Shows tree structure (0=left, 1=right)

### Step 7: Decode to Verify

1. After encoding, click the **"Decode"** button (or press `Ctrl+D`)
2. The system reconstructs your original text
3. Green checkmark = perfect match ✓
4. Click **"Copy"** to copy decoded text

### Step 8: Export Your Work

**Download Encoded Binary**
- Click the **"Download"** button in Encoded Binary section
- Saves as `huffman_encoded.bin`

**Download Code Table**
- Click **"Download Codes"** 
- Saves as `huffman_codes.json`
- Contains character-to-code mappings

### Advanced Features

#### Keyboard Shortcuts
- `Ctrl+Enter` - Quick encode
- `Ctrl+D` - Quick decode  
- `Ctrl+S` - Download encoded file
- `Esc` - Close any open modal

#### Help & Information
- Click **"Help"** in footer for detailed instructions
- Click **"About"** for algorithm information
- Click backend indicator for API details

### Common Use Cases

**1. Text Compression Analysis**
```
1. Load your text file
2. Encode to see compression ratio
3. Compare original vs compressed size
4. Download compressed binary
```

**2. Study Huffman Algorithm**
```
1. Use sample text
2. Examine frequency table (why some chars are common)
3. Study Huffman codes (variable-length encoding)
4. Visualize tree structure (binary tree)
```

**3. Full-Duplex Communication Simulation**
```
Station A:
1. Encode message
2. Download binary
3. Send to Station B

Station B:
1. Upload received binary
2. Use same code table
3. Decode to retrieve message
```

### Troubleshooting

**"Backend Offline" showing?**
- Refresh the page (F5)
- Check if server is running in terminal
- Verify no errors in server console
- Try `http://localhost:8080/api/status`

**Compilation errors?**
- Ensure you have MinGW or Visual Studio installed
- Check if `ws2_32.lib` is available
- Try running as Administrator

**Port 8080 already in use?**
- Close other applications using port 8080
- Or kill existing HuffmanServer process:
  ```bash
  Get-Process | Where-Object {$_.ProcessName -eq "HuffmanServer"} | Stop-Process -Force
  ```

**Can't access from other devices?**
- Server binds to localhost only by default
- For network access, modify `serverAddr.sin_addr.s_addr` in code

## 🚀 Quick Start (TL;DR)

1. Compile: `g++ -o HuffmanServer HuffmanServer.cpp -std=c++11 -lws2_32`
2. Run: `./HuffmanServer.exe`
3. Open: `http://localhost:8080`
4. Encode: Enter text and click "Encode"
5. View: Results, statistics, and tree visualization
6. Decode: Click "Decode" to verify

## 🎨 UI Features

- **Modern Dark Theme**: Eye-friendly interface with glass-morphism design
- **Animated Background**: Binary rain animation effect
- **Real-Time Updates**: Live character/byte counting
- **Interactive Tables**: Sortable frequency and code tables
- **Tree Visualization**: Zoomable interactive Huffman tree diagram
- **Progress Bars**: Visual compression ratio indicators
- **Toast Notifications**: Non-intrusive success/error messages
- **Responsive Design**: Works on desktop and tablet devices
- **Backend Indicator**: Shows C++ backend connection status

## 🌐 Web Application Architecture

### Backend (C++ Server)
- **Technology**: C++11 with Windows Sockets (no external dependencies)
- **Server Type**: Single-threaded HTTP server
- **Port**: 8080
- **API Endpoints**:
  - `GET /` - Serves web application files
  - `POST /api/encode` - Encodes text and returns binary + statistics
  - `POST /api/decode` - Decodes binary back to original text
  - `GET /api/status` - Returns server status
- **Features**:
  - CORS support for cross-origin requests
  - JSON API responses
  - Static file serving
  - Complete character escaping (including control characters)
  - Buffer overflow protection

### Frontend (Modern Web Stack)
- **HTML5**: Semantic structure with modals and cards
- **CSS3**: Custom dark theme with animations and glass-morphism
- **JavaScript (ES6+)**: 
  - Fetch API for backend communication
  - Dynamic DOM manipulation
  - Event-driven architecture
  - Clipboard API integration
  - File drag-and-drop support

## 📊 Example Output

## 📝 Binary File Format

The encoded binary file is self-contained:

| Section | Size | Description |
|---------|------|-------------|
| Header | 4 bytes | Number of unique characters |
| Code Table | Variable | For each character: char (1) + code length (1) + code string |
| Bit Count | 8 bytes | Total number of encoded bits |
| Data | Variable | Packed binary data |

## 🔬 Algorithm

### Encoding Process
1. Read input file and count character frequencies
2. Create leaf nodes for each unique character
3. Build Huffman tree using a min-heap (priority queue)
4. Generate codes by traversing tree (left=0, right=1)
5. Convert text to binary string using codes
6. Pack binary string into bytes and write to file

### Decoding Process
1. Read header and reconstruct code table
2. Read packed binary data
3. Traverse code table to decode each character
4. Write decoded characters to output file

## 📈 Compression Efficiency

Huffman coding typically achieves:
- **English Text**: 40-60% of original size
- **Source Code**: 50-70% of original size
- **Already Compressed Data**: Minimal improvement

## 🔌 Full-Duplex Communication

This system supports full-duplex (bidirectional) communication:
- **Station A**: Can encode messages and send to Station B
- **Station B**: Can decode received messages from Station A
- Both stations can simultaneously encode and decode

## 📋 Technical Details

- **Backend**: C++11 with Windows Sockets API
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Architecture**: REST API with JSON responses
- **Compression**: True bit-level encoding
- **Security**: Buffer overflow protection, input validation
- **Performance**: Optimized C++ algorithms for fast processing
- **Data Structures**: Priority Queue, Binary Tree, Hash Map
- **Time Complexity**: O(n log n) for encoding
- **Space Complexity**: O(n) for tree storage

## 🔒 Security Features

- Input validation on both frontend and backend
- Buffer overflow protection in server
- Complete character escaping for JSON safety
- Safe file handling with error checking
- CORS headers for controlled access

## 🐛 Bug Fixes (Recent Updates)

### Fixed Issues:
1. ✅ Missing modal functions (`showAbout`, `showHelp`)
2. ✅ Missing copy functions (`copyCodesTable`, `copyDecoded`)
3. ✅ Missing zoom functions (`zoomIn`, `zoomOut`, `resetZoom`)
4. ✅ Fixed modal reference to use correct ID
5. ✅ Fixed sort button function name mismatch
6. ✅ Fixed modal close functionality
7. ✅ Removed deprecated JavaScript fallback mode
8. ✅ Added complete character escaping in C++ backend
9. ✅ Added buffer overflow protection
10. ✅ Fixed compression ratio calculation
11. ✅ Removed unused console application
12. ✅ Removed unused `displayTree()` function
13. ✅ Fixed toast notification to work without container

## 📜 License

Educational use - Feel free to modify and extend.

---

**Version**: 2.0  
**Last Updated**: December 2025  
**Developed**: Full-stack Huffman Coding System with C++ Backend
#   H u f f m a n - E n c o d e r - a n d - D e c o d e r  
 