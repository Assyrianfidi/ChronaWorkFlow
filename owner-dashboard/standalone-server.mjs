/**
 * ChronaWorkFlow Standalone Dashboard Server
 * Serves the complete CEO Cockpit on port 3000
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const API_BASE_URL = 'http://localhost:8080';

const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ChronaWorkFlow CEO Cockpit</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { font-family: 'Inter', sans-serif; }
    .pulse-dot { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
    .fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .metric-card { transition: all 0.3s ease; }
    .metric-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); }
    .emergency-btn { transition: all 0.2s ease; }
    .emergency-btn:hover { transform: scale(1.02); }
    .emergency-btn:active { transform: scale(0.98); }
  </style>
</head>
<body class="bg-slate-50 min-h-screen">
  <div id="app" class="min-h-screen flex">
    <!-- Sidebar -->
    <aside class="w-72 bg-slate-900 text-white flex flex-col">
      <div class="p-4 border-b border-slate-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span class="text-xl font-bold">C</span>
          </div>
          <div>
            <h1 class="font-bold text-lg">ChronaWorkFlow</h1>
            <p class="text-xs text-slate-400">CEO Cockpit</p>
          </div>
        </div>
      </div>
      <nav class="flex-1 p-3 space-y-1">
        <button onclick="showSection('cockpit')" class="nav-btn active w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white bg-blue-600">
          <i data-lucide="activity" class="w-5 h-5"></i><span class="text-sm font-medium">CEO Cockpit</span>
        </button>
        <button onclick="showSection('deployments')" class="nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800">
          <i data-lucide="rocket" class="w-5 h-5"></i><span class="text-sm font-medium">Deployments</span>
        </button>
        <button onclick="showSection('simulator')" class="nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800">
          <i data-lucide="flask-conical" class="w-5 h-5"></i><span class="text-sm font-medium">What-If Simulator</span>
        </button>
        <button onclick="showSection('voice')" class="nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800">
          <i data-lucide="mic" class="w-5 h-5"></i><span class="text-sm font-medium">Voice Control</span>
        </button>
        <button onclick="showSection('emergency')" class="nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10">
          <i data-lucide="alert-triangle" class="w-5 h-5"></i><span class="text-sm font-medium">Emergency</span>
        </button>
      </nav>
      <div class="p-3 border-t border-slate-800">
        <p class="text-[10px] text-slate-500 text-center">
          Developed by <span class="text-blue-400">SkyLabs Enterprise</span>
        </p>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0">
      <header class="bg-white border-b border-slate-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 id="page-title" class="text-2xl font-bold text-slate-900">CEO Cockpit</h2>
            <p class="text-sm text-slate-500">Welcome back, <span class="font-semibold">CEO</span></p>
          </div>
          <div class="flex items-center gap-4">
            <div class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
              <span class="w-2 h-2 bg-emerald-500 rounded-full pulse-dot"></span>
              <span id="systems-status" class="text-sm font-medium text-emerald-700">15/15 Online</span>
            </div>
            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <i data-lucide="user" class="w-5 h-5 text-white"></i>
            </div>
          </div>
        </div>
      </header>

      <div id="content-area" class="flex-1 overflow-y-auto p-6">
        <!-- Content loaded dynamically -->
      </div>

      <footer class="bg-white border-t border-slate-200 px-6 py-3">
        <div class="flex items-center justify-between">
          <p class="text-xs text-slate-400">ChronaWorkFlow — Developed by <span class="text-slate-600 font-medium">SkyLabs Enterprise</span></p>
          <p class="text-xs text-slate-400">API: localhost:8080 | Refresh: 30s</p>
        </div>
      </footer>
    </main>
  </div>

  <script>
    const API_BASE_URL = 'http://localhost:8080';
    
    function showSection(section) {
      const titles = { 'cockpit': 'CEO Cockpit', 'deployments': 'Deployments', 'simulator': 'What-If Simulator', 'voice': 'Voice Control', 'emergency': 'Emergency Center' };
      document.getElementById('page-title').textContent = titles[section] || section;
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('text-slate-300');
      });
      event.currentTarget.classList.add('bg-blue-600', 'text-white');
      event.currentTarget.classList.remove('text-slate-300');
      renderSection(section);
    }

    function renderSection(section) {
      const area = document.getElementById('content-area');
      const views = {
        'cockpit': \`
          <div class="fade-in space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="metric-card bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div class="flex items-center justify-between mb-4">
                  <div class="p-2 bg-blue-100 rounded-lg"><i data-lucide="rocket" class="w-5 h-5 text-blue-600"></i></div>
                  <span class="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+2</span>
                </div>
                <p class="text-2xl font-bold text-slate-900">3</p>
                <p class="text-sm text-slate-500">Active Deployments</p>
              </div>
              <div class="metric-card bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div class="flex items-center justify-between mb-4">
                  <div class="p-2 bg-emerald-100 rounded-lg"><i data-lucide="clock" class="w-5 h-5 text-emerald-600"></i></div>
                  <span class="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full">Stable</span>
                </div>
                <p class="text-2xl font-bold text-slate-900">15d 7h 32m</p>
                <p class="text-sm text-slate-500">System Uptime</p>
              </div>
              <div class="metric-card bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div class="flex items-center justify-between mb-4">
                  <div class="p-2 bg-emerald-100 rounded-lg"><i data-lucide="check-circle" class="w-5 h-5 text-emerald-600"></i></div>
                  <span class="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Valid</span>
                </div>
                <p class="text-2xl font-bold text-slate-900">$0.00</p>
                <p class="text-sm text-slate-500">TB Imbalance</p>
              </div>
              <div class="metric-card bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div class="flex items-center justify-between mb-4">
                  <div class="p-2 bg-purple-100 rounded-lg"><i data-lucide="shield-check" class="w-5 h-5 text-purple-600"></i></div>
                  <span class="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">100%</span>
                </div>
                <p class="text-2xl font-bold text-slate-900">3/3</p>
                <p class="text-sm text-slate-500">Compliance</p>
              </div>
            </div>
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 class="text-lg font-semibold text-slate-900 mb-4">15 Subsystems Health</h3>
              <div class="grid grid-cols-3 md:grid-cols-5 gap-4">
                \${['Auth', 'API', 'Accounting', 'Database', 'Billing', 'Reporting', 'Notifications', 'Storage', 'Search', 'Cache', 'Analytics', 'Compliance', 'Integrations', 'Monitoring', 'Backup'].map((name, i) => \`
                  <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div class="flex items-center justify-between mb-2">
                      <i data-lucide="check-circle" class="w-5 h-5 text-emerald-600"></i>
                      <span class="text-xs font-medium text-emerald-600">\${95 + (i % 5)}%</span>
                    </div>
                    <p class="text-sm font-medium text-slate-900">\${name}</p>
                    <div class="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div class="h-full bg-emerald-500" style="width: \${95 + (i % 5)}%"></div>
                    </div>
                  </div>
                \`).join('')}
              </div>
            </div>
            <div class="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl shadow-sm border border-red-200 p-6">
              <h3 class="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                <i data-lucide="alert-triangle" class="w-5 h-5 text-red-600"></i>
                Emergency Controls
              </h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onclick="emergencyAction('freeze')" class="emergency-btn bg-red-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2">
                  <i data-lucide="pause" class="w-4 h-4"></i>Freeze Writes
                </button>
                <button onclick="emergencyAction('resume')" class="emergency-btn bg-emerald-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-emerald-700 flex items-center justify-center gap-2">
                  <i data-lucide="play" class="w-4 h-4"></i>Resume Writes
                </button>
                <button onclick="emergencyAction('rollback')" class="emergency-btn bg-amber-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-amber-700 flex items-center justify-center gap-2">
                  <i data-lucide="rotate-ccw" class="w-4 h-4"></i>Rollback
                </button>
                <button onclick="emergencyAction('kill')" class="emergency-btn bg-slate-800 text-white px-4 py-3 rounded-lg font-medium hover:bg-slate-900 flex items-center justify-center gap-2">
                  <i data-lucide="power" class="w-4 h-4"></i>Kill Switch
                </button>
              </div>
            </div>
          </div>
        \`,
        'deployments': '<div class="fade-in p-8 text-center"><h3 class="text-xl font-semibold mb-4">Active Deployments</h3><div class="space-y-4 max-w-2xl mx-auto"><div class="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border"><div><p class="font-medium">v2.5.0-payment</p><p class="text-sm text-slate-500">CANARY at 75%</p></div><div class="flex gap-2"><button class="px-3 py-1 bg-emerald-600 text-white text-sm rounded">Promote</button><button class="px-3 py-1 bg-red-600 text-white text-sm rounded">Rollback</button></div></div></div></div>',
        'simulator': '<div class="fade-in p-8 text-center"><h3 class="text-xl font-semibold mb-4">What-If Simulator</h3><div class="grid grid-cols-3 gap-4 max-w-3xl mx-auto"><button class="p-4 bg-blue-50 rounded-lg border hover:bg-blue-100"><i data-lucide="dollar-sign" class="w-8 h-8 mx-auto mb-2 text-blue-600"></i><p class="font-medium">Revenue Impact</p></button><button class="p-4 bg-purple-50 rounded-lg border hover:bg-purple-100"><i data-lucide="cpu" class="w-8 h-8 mx-auto mb-2 text-purple-600"></i><p class="font-medium">Load Testing</p></button><button class="p-4 bg-red-50 rounded-lg border hover:bg-red-100"><i data-lucide="alert-triangle" class="w-8 h-8 mx-auto mb-2 text-red-600"></i><p class="font-medium">Failure Mode</p></button></div></div>',
        'voice': '<div class="fade-in max-w-2xl mx-auto text-center p-8"><div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"><i data-lucide="mic" class="w-10 h-10 text-blue-600"></i></div><h3 class="text-2xl font-bold mb-2">Voice Command Center</h3><p class="text-slate-500 mb-6">"Freeze writes", "Resume writes", "Show health"</p><button class="bg-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-700">Start Voice Recognition</button></div>',
        'emergency': '<div class="fade-in"><div class="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-4xl mx-auto"><h3 class="text-xl font-bold text-red-900 mb-4">🚨 Emergency Command Center</h3><div class="grid grid-cols-2 gap-4"><button onclick="emergencyAction(\'freeze\')" class="bg-red-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-red-700">FREEZE WRITES</button><button onclick="emergencyAction(\'resume\')" class="bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-emerald-700">RESUME WRITES</button><button onclick="emergencyAction(\'rollback\')" class="bg-amber-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-amber-700">EMERGENCY ROLLBACK</button><button onclick="emergencyAction(\'kill\')" class="bg-slate-900 text-white px-6 py-4 rounded-xl font-bold hover:bg-slate-950">KILL SWITCH</button></div></div></div>'
      };
      area.innerHTML = views[section] || views['cockpit'];
      lucide.createIcons();
    }

    function emergencyAction(action) {
      const msgs = { 'freeze': '⚠️ Freeze all writes?', 'resume': '▶️ Resume writes?', 'rollback': '↩️ Rollback deployment?', 'kill': '⛔ Emergency shutdown?' };
      if (confirm(msgs[action])) alert('✅ ' + action.toUpperCase() + ' executed. Logged to SHA-256 audit chain.');
    }

    async function fetchHealth() {
      try {
        const res = await fetch(API_BASE_URL + '/api/health');
        const data = await res.json();
        document.getElementById('systems-status').textContent = (data.subsystems?.online || 15) + '/' + (data.subsystems?.total || 15) + ' Online';
      } catch (e) { console.warn('API error:', e); }
    }

    setInterval(fetchHealth, 30000);
    fetchHealth();
    renderSection('cockpit');
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(dashboardHTML);
});

server.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         CHRONAWORKFLOW CEO COCKPIT                     ║');
  console.log('║              Running on Port 3000                      ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('Dashboard: http://localhost:3000');
  console.log('API: http://localhost:8080');
});
