# Huffman Encoding/Decoding System

A complete full-stack implementation of Huffman coding for bidirectional (full-duplex) information transmission with **modern web interface** powered by **C++ backend**.

## 🌟 Features

- **🚀 High-Performance C++ Backend** - REST API server using Windows Sockets
- **🎨 Modern Web Interface** - Responsive dark-themed UI with real-time updates
- **📊 Interactive Visualizations** - Frequency tables, Huffman codes, and tree diagrams
- **📈 Real-Time Statistics** - Compression ratio, space saved, visual progress bars
- **⚡ Live Encoding/Decoding** - Process text directly in your browser
 # Huffman Encoder and Decoder

 A full-stack Huffman coding system with a C++ backend HTTP server and a modern web frontend.

 This repository demonstrates lossless data compression using Huffman coding, including encoding, decoding, interactive visualizations (frequency table, codes table, Huffman tree), and export/import of encoded data.

 ---

 ## Features

 - C++11 backend HTTP server using Windows Sockets
 - Web frontend (HTML/CSS/JS) with interactive UI
 - Encode and decode text with Huffman coding
 - Frequency analysis, codes table, and SVG tree visualization
 - Download/upload of encoded binary (`.huff`) and code tables
 - Keyboard shortcuts, drag-and-drop, and toast notifications

 ---

 ## Repository Layout

 ```
 Huffman encoder and decoder/
 ├── HuffmanServer.cpp     # C++ HTTP server and Huffman implementation
 ├── README.md             # This file
 └── web/                  # Frontend files
     ├── index.html        # Main HTML
     ├── styles.css        # Styling
     └── app.js            # Frontend logic
 ```

 ---

 ## Requirements

 - Windows 10/11 (project uses Winsock API)
 - A C++ compiler (MinGW/g++ or Visual Studio)
 - A modern web browser (Chrome, Edge, Firefox)

 ---

 ## Build & Run (Windows)

 Open PowerShell in the project folder (`Huffman encoder and decoder`) and run:

 ```powershell
 # Compile with MinGW (g++)
 g++ -o HuffmanServer HuffmanServer.cpp -std=c++11 -lws2_32

 # Run the server
 .\HuffmanServer.exe
 ```

 If using Visual Studio's Developer Command Prompt:

 ```powershell
 cl /EHsc HuffmanServer.cpp ws2_32.lib
 HuffmanServer.exe
 ```

 When the server starts it listens on port 8080 and serves the web UI and REST API.

 ---

 ## Web UI

 1. Open a browser and go to: `http://localhost:8080`
 2. Use the input textarea to type or paste text, or upload a `.txt` file.
 3. Click **Encode** (or press `Ctrl+Enter`) to generate Huffman codes and the encoded binary.
 4. Click **Decode** (or `Ctrl+D`) to verify decoding; the UI shows whether the decoded text matches the original.
 5. Use the UI controls to download the encoded `.huff` file and the codes JSON.

 Notes:
 - Upload `.huff` (binary) files via the Decoded tab to load encoded data and embedded codes for decoding.
 - The Encoded tab shows the binary output; the Decoded tab shows decoded text.

 ---

 ## API Endpoints

 The C++ server exposes the following endpoints (served at `http://localhost:8080`):

 - `GET /` - Serves the web UI
 - `GET /api/status` - Returns JSON status of server
 - `POST /api/encode` - Accepts plain text body, returns JSON containing `encoded`, `codes`, `frequencies`, `tree`, and `stats`
 - `POST /api/decode` - Accepts JSON `{ encoded: string, codes: object }`, returns `{ decoded: string }`

 Example:

 ```http
 POST /api/encode
 Content-Type: text/plain

 Hello world
 ```

 ---

 ## Binary `.huff` Format (frontend produced)

 The frontend uses a simple custom `.huff` format with this layout:

 - 4 bytes: ASCII header `HUFF`
 - 4 bytes: little-endian uint32 = length of the JSON codes section (bytes)
 - N bytes: JSON codes (UTF-8) — serialized mapping from character to Huffman code
 - Remaining bytes: raw data bytes (bits of encoded stream packed into bytes, last byte padded with zeros)

 When uploading a `.huff` file the frontend:
 - Parses the codes JSON
 - Converts the remaining bytes back to a bit string
 - Uses the codes to decode the bit string into text

 ---

 ## Troubleshooting

 - If the server fails to bind on port 8080, another application may be using that port.
 - If recompiling fails because `HuffmanServer.exe` is running, stop the process before re-compiling:

 ```powershell
 Get-Process | Where-Object { $_.ProcessName -eq 'HuffmanServer' } | Stop-Process -Force
 ```

 - For large files, the frontend imposes file-size limits (configured in `web/app.js`).

 ---

 ## Contribute

 Contributions and fixes are welcome. If you add features, please update this README with any new build or runtime steps.

 ---

 ## License

 This project is provided for educational purposes. Use and modify freely.

 ---

 **Version:** 2.0  
 **Last updated:** January 2026
