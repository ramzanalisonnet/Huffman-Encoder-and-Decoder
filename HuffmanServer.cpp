/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                     HUFFMAN CODER - C++ BACKEND SERVER                       ║
 * ║                  Full-Duplex Communication Channel Support                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Simple HTTP server using Windows Sockets (no external dependencies)
 * Single-threaded version for maximum compatibility
 * 
 * Compile: g++ -o HuffmanServer HuffmanServer.cpp -std=c++11 -lws2_32
 * Run: ./HuffmanServer
 */

#ifdef _WIN32
    #define _WIN32_WINNT 0x0601
    #include <winsock2.h>
    #include <ws2tcpip.h>
    #pragma comment(lib, "ws2_32.lib")
#else
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <arpa/inet.h>
    #include <unistd.h>
    #define closesocket close
    #define SOCKET int
    #define INVALID_SOCKET -1
    #define SOCKET_ERROR -1
#endif

#include <iostream>
#include <string>
#include <sstream>
#include <fstream>
#include <unordered_map>
#include <queue>
#include <vector>
#include <iomanip>
#include <ctime>
#include <algorithm>
#include <cstdlib>
#include <cstring>

using namespace std;

// ═══════════════════════════════════════════════════════════════════════════════
//                              HUFFMAN NODE STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════════

struct HuffmanNode {
    char ch;
    int freq;
    HuffmanNode* left;
    HuffmanNode* right;
    
    HuffmanNode(char c, int f) : ch(c), freq(f), left(nullptr), right(nullptr) {}
    
    ~HuffmanNode() {
        delete left;
        delete right;
    }
};

struct CompareNode {
    bool operator()(HuffmanNode* a, HuffmanNode* b) {
        return a->freq > b->freq;
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
//                              HUFFMAN CODER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class HuffmanCoder {
private:
    HuffmanNode* root;
    unordered_map<char, string> huffmanCodes;
    unordered_map<char, int> frequencies;
    string lastEncodedText;  // Store original text for verification
    
    void buildCodes(HuffmanNode* node, const string& code) {
        if (!node) return;
        
        if (!node->left && !node->right) {
            huffmanCodes[node->ch] = code.empty() ? "0" : code;
        }
        
        buildCodes(node->left, code + "0");
        buildCodes(node->right, code + "1");
    }
    
    void buildTreeJson(HuffmanNode* node, stringstream& ss, int depth = 0) {
        if (!node) {
            ss << "null";
            return;
        }
        
        ss << "{";
        ss << "\"freq\":" << node->freq << ",";
        
        if (!node->left && !node->right) {
            ss << "\"char\":";
            if (node->ch == '"') {
                ss << "\"\\\"\"";
            } else if (node->ch == '\\') {
                ss << "\"\\\\\"";
            } else if (node->ch == '\n') {
                ss << "\"\\\\n\"";
            } else if (node->ch == '\t') {
                ss << "\"\\\\t\"";
            } else if (node->ch == '\r') {
                ss << "\"\\\\r\"";
            } else if (node->ch == '\b') {
                ss << "\"\\\\b\"";
            } else if (node->ch == '\f') {
                ss << "\"\\\\f\"";
            } else if (node->ch == ' ') {
                ss << "\"[space]\"";
            } else if ((unsigned char)node->ch < 32) {
                ss << "\"\\\\u" << hex << setfill('0') << setw(4) << (int)(unsigned char)node->ch << dec << "\"";
            } else {
                ss << "\"" << node->ch << "\"";
            }
        } else {
            ss << "\"left\":";
            buildTreeJson(node->left, ss, depth + 1);
            ss << ",\"right\":";
            buildTreeJson(node->right, ss, depth + 1);
        }
        
        ss << "}";
    }
    
public:
    HuffmanCoder() : root(nullptr) {}
    
    ~HuffmanCoder() {
        if (root) {
            delete root;
            root = nullptr;
        }
    }
    
    void reset() {
        if (root) {
            delete root;
            root = nullptr;
        }
        huffmanCodes.clear();
        frequencies.clear();
        lastEncodedText.clear();
    }
    
    void calculateFrequencies(const string& text) {
        frequencies.clear();
        lastEncodedText = text;  // Store for verification
        for (size_t i = 0; i < text.length(); i++) {
            frequencies[text[i]]++;
        }
    }
    
    void buildTree() {
        priority_queue<HuffmanNode*, vector<HuffmanNode*>, CompareNode> pq;
        
        for (unordered_map<char, int>::iterator it = frequencies.begin(); 
             it != frequencies.end(); ++it) {
            pq.push(new HuffmanNode(it->first, it->second));
        }
        
        if (pq.size() == 1) {
            HuffmanNode* node = pq.top();
            pq.pop();
            if (root) delete root;
            root = new HuffmanNode('\0', node->freq);
            root->left = node;
        } else {
            while (pq.size() > 1) {
                HuffmanNode* left = pq.top(); pq.pop();
                HuffmanNode* right = pq.top(); pq.pop();
                
                HuffmanNode* parent = new HuffmanNode('\0', left->freq + right->freq);
                parent->left = left;
                parent->right = right;
                
                pq.push(parent);
            }
            
            if (root) delete root;
            if (!pq.empty()) {
                root = pq.top();
                pq.pop();
            } else {
                root = nullptr;
            }
        }
        
        huffmanCodes.clear();
        buildCodes(root, "");
    }
    
    string encode(const string& text) {
        if (text.empty() || huffmanCodes.empty()) {
            return "";
        }
        
        string encoded;
        for (size_t i = 0; i < text.length(); i++) {
            if (huffmanCodes.find(text[i]) != huffmanCodes.end()) {
                encoded += huffmanCodes[text[i]];
            }
        }
        return encoded;
    }
    
    string decode(const string& encoded) {
        if (!root || encoded.empty()) return "";
        
        string decoded;
        HuffmanNode* current = root;
        
        for (size_t i = 0; i < encoded.length(); i++) {
            if (!current) {
                // Invalid state, restart from root
                current = root;
                continue;
            }
            
            if (encoded[i] == '0') {
                if (current->left) {
                    current = current->left;
                } else {
                    // Invalid path, skip
                    current = root;
                    continue;
                }
            } else if (encoded[i] == '1') {
                if (current->right) {
                    current = current->right;
                } else {
                    // Invalid path, skip
                    current = root;
                    continue;
                }
            }
            
            if (current && !current->left && !current->right) {
                decoded += current->ch;
                current = root;
            }
        }
        
        return decoded;
    }
    
    string getLastEncodedText() const {
        return lastEncodedText;
    }
    
    string getFrequenciesJson() {
        stringstream ss;
        ss << "{";
        bool first = true;
        for (unordered_map<char, int>::iterator it = frequencies.begin(); 
             it != frequencies.end(); ++it) {
            if (!first) ss << ",";
            first = false;
            
            string key;
            if (it->first == '"') key = "\\\"";
            else if (it->first == '\\') key = "\\\\";
            else if (it->first == '\n') key = "\\n";
            else if (it->first == '\t') key = "\\t";
            else if (it->first == '\r') key = "\\r";
            else if (it->first == '\b') key = "\\b";
            else if (it->first == '\f') key = "\\f";
            else if ((unsigned char)it->first < 32) {
                char buf[8];
                sprintf(buf, "\\u%04x", (unsigned char)it->first);
                key = string(buf);
            }
            else key = string(1, it->first);
            
            ss << "\"" << key << "\":" << it->second;
        }
        ss << "}";
        return ss.str();
    }
    
    string getCodesJson() {
        stringstream ss;
        ss << "{";
        bool first = true;
        for (unordered_map<char, string>::iterator it = huffmanCodes.begin(); 
             it != huffmanCodes.end(); ++it) {
            if (!first) ss << ",";
            first = false;
            
            string key;
            if (it->first == '"') key = "\\\"";
            else if (it->first == '\\') key = "\\\\";
            else if (it->first == '\n') key = "\\n";
            else if (it->first == '\t') key = "\\t";
            else if (it->first == '\r') key = "\\r";
            else if (it->first == '\b') key = "\\b";
            else if (it->first == '\f') key = "\\f";
            else if ((unsigned char)it->first < 32) {
                char buf[8];
                sprintf(buf, "\\u%04x", (unsigned char)it->first);
                key = string(buf);
            }
            else key = string(1, it->first);
            
            ss << "\"" << key << "\":\"" << it->second << "\"";
        }
        ss << "}";
        return ss.str();
    }
    
    string getTreeJson() {
        stringstream ss;
        buildTreeJson(root, ss);
        return ss.str();
    }
    
    int getOriginalBits(const string& text) {
        return text.length() * 8;
    }
    
    int getEncodedBits(const string& encoded) {
        return encoded.length();
    }
    
    double getCompressionRatio(const string& text, const string& encoded) {
        if (text.empty()) return 0;
        int original = getOriginalBits(text);
        int compressed = getEncodedBits(encoded);
        return ((double)(original - compressed) / original) * 100;
    }
    
    int getUniqueChars() {
        return frequencies.size();
    }
};

// Global coder instance
HuffmanCoder coder;

// ═══════════════════════════════════════════════════════════════════════════════
//                              HTTP SERVER
// ═══════════════════════════════════════════════════════════════════════════════

string getContentType(const string& path) {
    if (path.find(".html") != string::npos) return "text/html; charset=utf-8";
    if (path.find(".css") != string::npos) return "text/css; charset=utf-8";
    if (path.find(".js") != string::npos) return "application/javascript; charset=utf-8";
    if (path.find(".json") != string::npos) return "application/json; charset=utf-8";
    if (path.find(".png") != string::npos) return "image/png";
    if (path.find(".ico") != string::npos) return "image/x-icon";
    return "text/plain; charset=utf-8";
}

string readFile(const string& path) {
    ifstream file(path.c_str(), ios::binary);
    if (!file.is_open()) return "";
    
    stringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}

struct HttpRequest {
    string method;
    string path;
    string body;
    unordered_map<string, string> headers;
    int contentLength;
};

HttpRequest parseRequest(const string& rawRequest) {
    HttpRequest req;
    req.contentLength = 0;
    istringstream stream(rawRequest);
    string line;
    
    // Parse request line
    if (getline(stream, line)) {
        // Remove trailing \r
        if (!line.empty() && line[line.length()-1] == '\r') {
            line = line.substr(0, line.length()-1);
        }
        istringstream lineStream(line);
        lineStream >> req.method >> req.path;
        
        // Strip query string from path
        size_t queryPos = req.path.find('?');
        if (queryPos != string::npos) {
            req.path = req.path.substr(0, queryPos);
        }
    }
    
    // Parse headers
    while (getline(stream, line)) {
        // Remove trailing \r
        if (!line.empty() && line[line.length()-1] == '\r') {
            line = line.substr(0, line.length()-1);
        }
        if (line.empty()) break;
        
        size_t colonPos = line.find(':');
        if (colonPos != string::npos) {
            string key = line.substr(0, colonPos);
            string value = line.substr(colonPos + 1);
            // Trim leading whitespace from value
            while (!value.empty() && (value[0] == ' ' || value[0] == '\t')) {
                value = value.substr(1);
            }
            req.headers[key] = value;
            
            // Parse Content-Length
            if (key == "Content-Length") {
                req.contentLength = atoi(value.c_str());
            }
        }
    }
    
    // Parse body - respect Content-Length
    size_t bodyStart = rawRequest.find("\r\n\r\n");
    if (bodyStart != string::npos) {
        string fullBody = rawRequest.substr(bodyStart + 4);
        if (req.contentLength > 0 && req.contentLength <= (int)fullBody.length()) {
            req.body = fullBody.substr(0, req.contentLength);
        } else {
            req.body = fullBody;
        }
    }
    
    return req;
}

string createResponse(int status, const string& contentType, const string& body) {
    stringstream response;
    response << "HTTP/1.1 " << status << " ";
    
    switch (status) {
        case 200: response << "OK"; break;
        case 204: response << "No Content"; break;
        case 400: response << "Bad Request"; break;
        case 404: response << "Not Found"; break;
        case 500: response << "Internal Server Error"; break;
        default: response << "Unknown"; break;
    }
    
    response << "\r\n";
    response << "Content-Type: " << contentType << "\r\n";
    response << "Content-Length: " << body.length() << "\r\n";
    response << "Access-Control-Allow-Origin: *\r\n";
    response << "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n";
    response << "Access-Control-Allow-Headers: Content-Type\r\n";
    response << "Connection: close\r\n";
    response << "\r\n";
    response << body;
    
    return response.str();
}

string getTimestamp() {
    time_t now = time(0);
    tm* ltm = localtime(&now);
    char buffer[32];
    strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", ltm);
    return string(buffer);
}

// Helper function to escape string for JSON
string escapeJsonString(const string& input) {
    stringstream ss;
    for (size_t i = 0; i < input.length(); i++) {
        char c = input[i];
        switch (c) {
            case '"':  ss << "\\\""; break;
            case '\\': ss << "\\\\"; break;
            case '\n': ss << "\\n"; break;
            case '\r': ss << "\\r"; break;
            case '\t': ss << "\\t"; break;
            case '\b': ss << "\\b"; break;
            case '\f': ss << "\\f"; break;
            default:
                if ((unsigned char)c < 32) {
                    char buf[8];
                    sprintf(buf, "\\u%04x", (unsigned char)c);
                    ss << buf;
                } else {
                    ss << c;
                }
        }
    }
    return ss.str();
}

void handleClient(SOCKET clientSocket) {
    string rawRequest;
    char buffer[4096];
    int totalReceived = 0;
    bool headersComplete = false;
    int contentLength = 0;
    size_t bodyStartPos = 0;
    
    // Read data until we have all of it
    while (totalReceived < 1048576) { // Max 1MB
        int bytesReceived = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
        if (bytesReceived <= 0) break;
        
        buffer[bytesReceived] = '\0';
        rawRequest.append(buffer, bytesReceived);
        totalReceived += bytesReceived;
        
        // Check if headers are complete
        if (!headersComplete) {
            size_t headerEnd = rawRequest.find("\r\n\r\n");
            if (headerEnd != string::npos) {
                headersComplete = true;
                bodyStartPos = headerEnd + 4;
                
                // Extract Content-Length
                size_t clPos = rawRequest.find("Content-Length:");
                if (clPos == string::npos) clPos = rawRequest.find("content-length:");
                if (clPos != string::npos) {
                    size_t clEnd = rawRequest.find("\r\n", clPos);
                    if (clEnd != string::npos) {
                        string clValue = rawRequest.substr(clPos + 15, clEnd - clPos - 15);
                        while (!clValue.empty() && (clValue[0] == ' ' || clValue[0] == '\t')) {
                            clValue = clValue.substr(1);
                        }
                        contentLength = atoi(clValue.c_str());
                    }
                }
            }
        }
        
        // Check if we have all the body data
        if (headersComplete) {
            size_t currentBodySize = rawRequest.length() - bodyStartPos;
            if (contentLength <= 0 || (int)currentBodySize >= contentLength) {
                break; // Got all data
            }
        }
    }
    
    if (!headersComplete || rawRequest.empty()) {
        closesocket(clientSocket);
        return;
    }
    
    HttpRequest req = parseRequest(rawRequest);

    cout << "[" << getTimestamp() << "] " << req.method << " " << req.path;
    if (req.contentLength > 0) {
        cout << " (Content-Length: " << req.contentLength << ", received: " << req.body.length() << ")";
    }
    cout << endl;

    string response;
    
    // Handle OPTIONS (CORS preflight)
    if (req.method == "OPTIONS") {
        response = createResponse(204, "text/plain", "");
    }
    // API Endpoints
    else if (req.path == "/api/status" && req.method == "GET") {
        response = createResponse(200, "application/json", 
            "{\"status\":\"running\",\"backend\":\"C++\",\"version\":\"1.0\"}");
    }
    else if (req.path == "/api/encode" && req.method == "POST") {
        string text = req.body;
        
        cout << "  [ENCODE] Input length: " << text.length() << " chars" << endl;
        
        if (text.empty()) {
            response = createResponse(400, "application/json", 
                "{\"error\":\"No text provided\"}");
        } else {
            coder.reset();
            coder.calculateFrequencies(text);
            coder.buildTree();
            
            string encoded = coder.encode(text);
            
            cout << "  [ENCODE] Output length: " << encoded.length() << " bits" << endl;
            
            stringstream jsonResponse;
            jsonResponse << "{";
            jsonResponse << "\"encoded\":\"" << encoded << "\",";
            jsonResponse << "\"frequencies\":" << coder.getFrequenciesJson() << ",";
            jsonResponse << "\"codes\":" << coder.getCodesJson() << ",";
            jsonResponse << "\"tree\":" << coder.getTreeJson() << ",";
            jsonResponse << "\"stats\":{";
            jsonResponse << "\"originalBits\":" << coder.getOriginalBits(text) << ",";
            jsonResponse << "\"encodedBits\":" << coder.getEncodedBits(encoded) << ",";
            jsonResponse << "\"compressionRatio\":" << fixed << setprecision(2) 
                        << coder.getCompressionRatio(text, encoded) << ",";
            jsonResponse << "\"uniqueChars\":" << coder.getUniqueChars();
            jsonResponse << "}";
            jsonResponse << "}";
            
            response = createResponse(200, "application/json", jsonResponse.str());
        }
    }
    else if (req.path == "/api/decode" && req.method == "POST") {
        // Extract encoded from JSON body
        size_t encodedStart = req.body.find("\"encoded\":\"");
        if (encodedStart == string::npos) {
            cout << "  [DECODE] ERROR: 'encoded' field not found in body" << endl;
            response = createResponse(400, "application/json", 
                "{\"error\":\"Invalid request format - 'encoded' field not found\"}");
        } else {
            encodedStart += 11;
            size_t encodedEnd = req.body.find("\"", encodedStart);
            if (encodedEnd == string::npos) {
                cout << "  [DECODE] ERROR: Malformed JSON" << endl;
                response = createResponse(400, "application/json", 
                    "{\"error\":\"Invalid request format - malformed JSON\"}");
            } else {
                string encoded = req.body.substr(encodedStart, encodedEnd - encodedStart);
                
                cout << "  [DECODE] Input length: " << encoded.length() << " bits" << endl;
                
                string decoded = coder.decode(encoded);
                
                cout << "  [DECODE] Output length: " << decoded.length() << " chars" << endl;
                
                // Verify against original
                string original = coder.getLastEncodedText();
                bool match = (decoded == original);
                cout << "  [DECODE] Match with original: " << (match ? "YES" : "NO") << endl;
                
                stringstream jsonResponse;
                jsonResponse << "{\"decoded\":\"" << escapeJsonString(decoded) << "\"}";
                
                response = createResponse(200, "application/json", jsonResponse.str());
            }
        }
    }
    // Serve static files
    else {
        string path = req.path;
        if (path == "/") path = "/index.html";
        
        string filePath = "./web" + path;
        string content = readFile(filePath);
        
        if (!content.empty()) {
            response = createResponse(200, getContentType(path), content);
        } else {
            response = createResponse(404, "text/html", 
                "<h1>404 Not Found</h1><p>The requested file was not found.</p>");
        }
    }
    
    send(clientSocket, response.c_str(), response.length(), 0);
    closesocket(clientSocket);
}

int main() {
#ifdef _WIN32
    SetConsoleOutputCP(CP_UTF8);
#endif

    cout << R"(
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ██╗  ██╗██╗   ██╗███████╗███████╗███╗   ███╗ █████╗ ███╗   ██╗             ║
║   ██║  ██║██║   ██║██╔════╝██╔════╝████╗ ████║██╔══██╗████╗  ██║             ║
║   ███████║██║   ██║█████╗  █████╗  ██╔████╔██║███████║██╔██╗ ██║             ║
║   ██╔══██║██║   ██║██╔══╝  ██╔══╝  ██║╚██╔╝██║██╔══██║██║╚██╗██║             ║
║   ██║  ██║╚██████╔╝██║     ██║     ██║ ╚═╝ ██║██║  ██║██║ ╚████║             ║
║   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝     ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝             ║
║                                                                              ║
║                    ╔═══════════════════════════════════╗                     ║
║                    ║     C++ BACKEND SERVER v1.0       ║                     ║
║                    ╚═══════════════════════════════════╝                     ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   Server running at: http://localhost:8080                                   ║
║                                                                              ║
║   API Endpoints:                                                             ║
║     POST /api/encode  - Encode text using Huffman coding                     ║
║     POST /api/decode  - Decode binary back to text                           ║
║     GET  /api/status  - Check server status                                  ║
║                                                                              ║
║   Frontend: http://localhost:8080                                            ║
║                                                                              ║
║   Press Ctrl+C to stop the server                                            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
)" << endl;

#ifdef _WIN32
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        cerr << "WSAStartup failed" << endl;
        return 1;
    }
#endif

    SOCKET serverSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (serverSocket == INVALID_SOCKET) {
        cerr << "Failed to create socket" << endl;
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }

    int opt = 1;
    setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));

    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = INADDR_ANY;
    serverAddr.sin_port = htons(8080);

    if (bind(serverSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        cerr << "Bind failed. Port 8080 may be in use." << endl;
        closesocket(serverSocket);
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }

    if (listen(serverSocket, SOMAXCONN) == SOCKET_ERROR) {
        cerr << "Listen failed" << endl;
        closesocket(serverSocket);
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }

    cout << "[" << getTimestamp() << "] Server listening on http://localhost:8080" << endl;
    cout << "[" << getTimestamp() << "] Serving static files from ./web/" << endl;
    cout << endl;

    while (true) {
        sockaddr_in clientAddr;
        int clientAddrLen = sizeof(clientAddr);
        
        SOCKET clientSocket = accept(serverSocket, (sockaddr*)&clientAddr, &clientAddrLen);
        
        if (clientSocket == INVALID_SOCKET) {
            continue;
        }

        try {
            handleClient(clientSocket);
        } catch (const exception& e) {
            cerr << "[ERROR] Exception in handleClient: " << e.what() << endl;
            cerr.flush();
            try { closesocket(clientSocket); } catch (...) {}
        } catch (...) {
            cerr << "[ERROR] Unknown exception in handleClient" << endl;
            cerr.flush();
            try { closesocket(clientSocket); } catch (...) {}
        }
    }

    closesocket(serverSocket);
#ifdef _WIN32
    WSACleanup();
#endif

    return 0;
}
