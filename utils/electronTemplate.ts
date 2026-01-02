
export const PACKAGE_JSON = `{
  "name": "winerylan-client",
  "version": "1.0.0",
  "description": "WineryLAN Desktop Client",
  "main": "src/main.js",
  "scripts": {
    "start": "electron .",
    "package": "electron-forge package",
    "make": "electron-forge make"
  },
  "keywords": [],
  "author": "WineryLAN",
  "license": "MIT",
  "devDependencies": {
    "electron": "^28.0.0",
    "@electron-forge/cli": "^7.2.0",
    "@electron-forge/maker-squirrel": "^7.2.0",
    "@electron-forge/maker-zip": "^7.2.0",
    "@electron-forge/maker-deb": "^7.2.0",
    "@electron-forge/maker-rpm": "^7.2.0"
  },
  "dependencies": {
    "socket.io-client": "^4.7.2"
  },
  "config": {
    "forge": {
      "packagerConfig": {},
      "makers": [
        {
          "name": "@electron-forge/maker-squirrel",
          "config": {
            "name": "winerylan_client"
          }
        },
        {
          "name": "@electron-forge/maker-zip",
          "platforms": [
            "darwin"
          ]
        },
        {
          "name": "@electron-forge/maker-deb",
          "config": {}
        },
        {
          "name": "@electron-forge/maker-rpm",
          "config": {}
        }
      ]
    }
  }
}`;

export const MAIN_JS = `const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const io = require('socket.io-client');
const os = require('os');

// Config
const SERVER_URL = 'http://8.140.222.24:3000';
let socket = null;
let mainWindow = null;
let tray = null;
let isConnected = false;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#f8fafc'
    },
    backgroundColor: '#0f172a',
    icon: path.join(__dirname, '../assets/icon.png') // Ensure you add an icon
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Close to tray
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
};

const createTray = () => {
  // Create tray icon (placeholder path)
  tray = new Tray(path.join(__dirname, 'icon_small.png')); 
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => mainWindow.show() },
    { label: 'Quit', click: () => {
      app.isQuitting = true;
      app.quit();
    }}
  ]);
  tray.setToolTip('WineryLAN Client');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
};

// --- IPC Handlers ---

ipcMain.handle('connect-network', async (event, username) => {
  if (isConnected) return 'Already connected';

  const agentName = username || \`Desktop-\${os.hostname()}\`;

  socket = io(SERVER_URL, {
    reconnection: true,
    query: {
      type: 'desktop-client'
    }
  });

  socket.on('connect', () => {
    isConnected = true;
    socket.emit('join-network', { username: agentName });
    mainWindow.webContents.send('status-update', { status: 'connected', id: socket.id });
    mainWindow.webContents.send('log', { type: 'success', msg: 'Connected to WineryLAN Server' });
  });

  socket.on('disconnect', () => {
    isConnected = false;
    mainWindow.webContents.send('status-update', { status: 'disconnected' });
    mainWindow.webContents.send('log', { type: 'warn', msg: 'Disconnected from server' });
  });

  socket.on('peer-list', (peers) => {
    mainWindow.webContents.send('peers-update', peers);
  });

  socket.on('peer-joined', (peer) => {
    mainWindow.webContents.send('log', { type: 'info', msg: \`Peer joined: \${peer.name}\` });
    // In real app: signal WebRTC start here
  });

  socket.on('peer-left', (data) => {
    mainWindow.webContents.send('log', { type: 'info', msg: \`Peer left: \${data.id}\` });
  });

  return 'Connecting...';
});

ipcMain.handle('disconnect-network', () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  isConnected = false;
  mainWindow.webContents.send('status-update', { status: 'disconnected' });
  return 'Disconnected';
});

app.whenReady().then(() => {
  createWindow();
  // createTray(); // Uncomment if you have an icon image
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
`;

export const PRELOAD_JS = `const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  connect: (username) => ipcRenderer.invoke('connect-network', username),
  disconnect: () => ipcRenderer.invoke('disconnect-network'),
  onStatusUpdate: (callback) => ipcRenderer.on('status-update', (_event, value) => callback(value)),
  onPeersUpdate: (callback) => ipcRenderer.on('peers-update', (_event, value) => callback(value)),
  onLog: (callback) => ipcRenderer.on('log', (_event, value) => callback(value))
});
`;

export const INDEX_HTML = `<!DOCTYPE html>
<html class="dark">
<head>
  <title>WineryLAN</title>
  <!-- Using Tailwind via CDN for simplicity in this generated bundle -->
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* Electron Draggable Header */
    .draggable { -webkit-app-region: drag; }
    .no-drag { -webkit-app-region: no-drag; }
    body { font-family: system-ui, -apple-system, sans-serif; user-select: none; }
    
    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #1e293b; }
    ::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
  </style>
</head>
<body class="bg-slate-900 text-slate-100 h-screen flex flex-col overflow-hidden border border-slate-700">
  
  <!-- Title Bar -->
  <div class="h-8 bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 draggable border-b border-slate-700">
    WINERY LAN CLIENT
  </div>

  <!-- Main Content -->
  <div class="flex-1 p-6 flex flex-col items-center space-y-6 overflow-y-auto">
    
    <!-- Status Indicator -->
    <div class="text-center space-y-2">
      <div id="status-ring" class="w-20 h-20 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center transition-all duration-500">
        <svg id="status-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg>
      </div>
      <h2 id="status-text" class="text-xl font-bold text-slate-400">Disconnected</h2>
      <p class="text-xs text-slate-500 font-mono">ID: <span id="my-id">---</span></p>
    </div>

    <!-- Controls -->
    <div class="w-full space-y-3">
      <input type="text" id="username" placeholder="Device Name" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
      
      <button id="btn-connect" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded shadow-lg shadow-blue-500/20 transition-all active:scale-95">
        Connect to Mesh
      </button>
    </div>

    <!-- Peer List -->
    <div class="w-full flex-1 min-h-[150px] bg-slate-800/50 rounded-lg border border-slate-700 p-3 flex flex-col">
      <h3 class="text-xs font-semibold text-slate-400 uppercase mb-2 flex justify-between">
        <span>Active Peers</span>
        <span id="peer-count" class="bg-slate-700 px-1.5 rounded text-white">0</span>
      </h3>
      <div id="peer-list" class="flex-1 overflow-y-auto space-y-2">
        <!-- Peers injected here -->
        <div class="text-xs text-slate-600 text-center mt-4">No peers nearby</div>
      </div>
    </div>
  </div>

  <!-- Logs Footer -->
  <div class="h-24 bg-black/30 border-t border-slate-800 p-2 font-mono text-[10px] overflow-y-auto" id="logs">
    <div class="text-slate-500">> Ready.</div>
  </div>

  <script src="./renderer.js"></script>
</body>
</html>`;

export const RENDERER_JS = `
const btnConnect = document.getElementById('btn-connect');
const inpUsername = document.getElementById('username');
const statusText = document.getElementById('status-text');
const statusRing = document.getElementById('status-ring');
const statusIcon = document.getElementById('status-icon');
const logsDiv = document.getElementById('logs');
const peerListDiv = document.getElementById('peer-list');
const peerCountSpan = document.getElementById('peer-count');
const myIdSpan = document.getElementById('my-id');

let isConnected = false;

// --- UI Logic ---

const log = (msg, type = 'info') => {
  const div = document.createElement('div');
  const color = type === 'error' ? 'text-red-400' : type === 'success' ? 'text-green-400' : 'text-slate-400';
  div.className = \`\${color} mb-0.5\`;
  div.textContent = \`> \${msg}\`;
  logsDiv.appendChild(div);
  logsDiv.scrollTop = logsDiv.scrollHeight;
};

btnConnect.addEventListener('click', async () => {
  if (isConnected) {
    await window.api.disconnect();
  } else {
    const name = inpUsername.value.trim();
    statusText.innerText = 'Connecting...';
    btnConnect.disabled = true;
    await window.api.connect(name);
    btnConnect.disabled = false;
  }
});

// --- IPC Listeners ---

window.api.onStatusUpdate((data) => {
  if (data.status === 'connected') {
    isConnected = true;
    statusText.innerText = 'Securely Connected';
    statusText.className = 'text-xl font-bold text-green-400';
    statusRing.className = 'w-20 h-20 rounded-full bg-green-500/10 border-4 border-green-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]';
    statusIcon.classList.remove('text-slate-500');
    statusIcon.classList.add('text-green-500');
    btnConnect.innerText = 'Disconnect';
    btnConnect.classList.replace('bg-blue-600', 'bg-red-600');
    btnConnect.classList.replace('hover:bg-blue-500', 'hover:bg-red-500');
    if(data.id) myIdSpan.innerText = data.id;
  } else {
    isConnected = false;
    statusText.innerText = 'Disconnected';
    statusText.className = 'text-xl font-bold text-slate-400';
    statusRing.className = 'w-20 h-20 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center';
    statusIcon.classList.remove('text-green-500');
    statusIcon.classList.add('text-slate-500');
    btnConnect.innerText = 'Connect to Mesh';
    btnConnect.classList.replace('bg-red-600', 'bg-blue-600');
    btnConnect.classList.replace('hover:bg-red-500', 'hover:bg-blue-500');
    myIdSpan.innerText = '---';
    peerListDiv.innerHTML = '<div class="text-xs text-slate-600 text-center mt-4">No peers nearby</div>';
    peerCountSpan.innerText = '0';
  }
});

window.api.onPeersUpdate((peers) => {
  peerCountSpan.innerText = peers.length;
  peerListDiv.innerHTML = '';
  
  if (peers.length === 0) {
    peerListDiv.innerHTML = '<div class="text-xs text-slate-600 text-center mt-4">No peers nearby</div>';
    return;
  }

  peers.forEach(peer => {
    const el = document.createElement('div');
    el.className = 'flex items-center justify-between bg-slate-900/50 p-2 rounded border border-slate-700/50';
    el.innerHTML = \`
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 rounded-full bg-green-500"></div>
        <span class="text-xs font-bold">\${peer.name}</span>
      </div>
      <span class="text-[10px] font-mono text-slate-500">\${peer.ip}</span>
    \`;
    peerListDiv.appendChild(el);
  });
});

window.api.onLog((data) => {
  log(data.msg, data.type);
});
`;

export const ELECTRON_README = `# WineryLAN Electron Client

This is the source code for the Desktop GUI client.

## How to Build (.exe / .dmg)

1. **Install Node.js** (If you haven't already)
2. Open this folder in a terminal.
3. Install dependencies:
   \`npm install\`
4. Run in development mode:
   \`npm start\`
5. **Build Executable**:
   \`npm run make\`

The output files (installers and executables) will be in the \`out/\` folder.
`;

export const BUILD_BAT = `@echo off
echo Building WineryLAN Client...
echo.

IF NOT EXIST "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Packaging application...
call npm run make

echo.
echo Build complete! Check the 'out' folder for your executable.
pause
`;
