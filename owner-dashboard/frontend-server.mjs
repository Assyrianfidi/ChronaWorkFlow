/**
 * ChronaWorkFlow Frontend Server
 * Serves the owner dashboard on port 3000
 * Connects to backend API on port 8080
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const API_BASE_URL = 'http://localhost:8080';

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Serve static files
const serveFile = (res, filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
    
    // Inject API base URL into HTML
    if (ext === '.html') {
      let htmlContent = content.toString();
      htmlContent = htmlContent.replace(
        '</head>',
        `<script>window.API_BASE_URL = '${API_BASE_URL}';</script></head>`
      );
      
      // Update branding to ChronaWorkFlow
      htmlContent = htmlContent.replace(/AccuBooks/g, 'ChronaWorkFlow');
      htmlContent = htmlContent.replace(
        'Owner Dashboard',
        'CEO Cockpit'
      );
      
      // Add SkyLabs Enterprise footer
      htmlContent = htmlContent.replace(
        '</body>',
        `<footer class="fixed bottom-0 w-full bg-slate-900 text-white py-2 px-4 text-center text-xs">
          <p>ChronaWorkFlow • Developed by <span class="text-blue-400">SkyLabs Enterprise</span> • © 2026</p>
        </footer></body>`
      );
      
      content = Buffer.from(htmlContent);
    }
    
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
  });
};

// Proxy API requests to backend
const proxyToBackend = async (req, res) => {
  const options = {
    hostname: 'localhost',
    port: 8080,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: 'localhost:8080'
    }
  };
  
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      ...proxyRes.headers,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Backend unavailable', message: err.message }));
  });
  
  req.pipe(proxyReq);
};

// Create server
const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }
  
  // Proxy API requests
  if (req.url.startsWith('/api/')) {
    proxyToBackend(req, res);
    return;
  }
  
  // Serve static files
  let filePath = path.join(__dirname, 'index.html');
  if (req.url !== '/' && req.url !== '/index.html') {
    filePath = path.join(__dirname, req.url);
  }
  
  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                          ║');
  console.log('║              CHRONAWORKFLOW FRONTEND DASHBOARD                           ║');
  console.log('║                                                                          ║');
  console.log('║                    🚀 Dashboard Running on Port 3000                      ║');
  console.log('║                                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('📊 Dashboard URL: http://localhost:3000');
  console.log('🔌 API Backend:  http://localhost:8080\n');
  console.log('✅ Ready for visual testing\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down frontend server...');
  server.close(() => {
    console.log('✅ Frontend server closed');
    process.exit(0);
  });
});
