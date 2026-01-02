export const AGENT_CODE = `/**
 * NexusLAN Node.js Client Agent (Optimized)
 * -----------------------------------------
 * 
 * Features:
 * - Auto-reconnection with exponential backoff
 * - Command line arguments support
 * - Robust error handling
 * - Ready for packaging into .exe
 */

const io = require('socket.io-client');
const os = require('os');
const path = require('path');

// --- Parse Command Line Arguments ---
const args = process.argv.slice(2);
const getArg = (flag, defaultVal) => {
  const index = args.indexOf(flag);
  return index > -1 && args[index + 1] ? args[index + 1] : defaultVal;
};

// Configuration
const CONFIG = {
  SERVER_URL: getArg('--server', 'http://8.140.222.24:3000'),
  AGENT_NAME: getArg('--name', \`Agent-\${os.hostname()}-\${Math.floor(Math.random() * 1000)}\`),
  RECONNECT_DELAY: 5000,
  DEBUG: args.includes('--debug')
};

// Logger
const log = (level, msg, ...rest) => {
  const ts = new Date().toISOString().split('T')[1].split('.')[0];
  const color = level === 'ERROR' ? '\\x1b[31m' : level === 'SUCCESS' ? '\\x1b[32m' : '\\x1b[36m';
  const reset = '\\x1b[0m';
  console.log(\`\${color}[\${ts}] [\${level}] \${msg}\${reset}\`, ...rest);
};

console.log('------------------------------------------------');
console.log('   NexusLAN Edge Agent v2.0');
console.log('------------------------------------------------');
console.log('   Server  :', CONFIG.SERVER_URL);
console.log('   Device  :', CONFIG.AGENT_NAME);
console.log('   OS      :', os.platform(), os.release());
console.log('------------------------------------------------');

// Connect to Signaling Server
const socket = io(CONFIG.SERVER_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  timeout: 20000,
});

// --- Event Handlers ---

socket.on('connect', () => {
  log('SUCCESS', 'Connected to Signaling Server! Socket ID:', socket.id);
  
  // Authenticate / Join Network
  socket.emit('join-network', { 
    username: CONFIG.AGENT_NAME,
    type: 'agent',
    os: os.platform()
  });
});

socket.on('disconnect', (reason) => {
  log('WARN', \`Disconnected: \${reason}\`);
  if (reason === 'io server disconnect') {
    // The disconnection was initiated by the server, you need to reconnect manually
    socket.connect();
  }
});

socket.on('connect_error', (err) => {
  log('ERROR', 'Connection failed:', err.message);
});

// --- P2P Signaling ---

socket.on('peer-list', (peers) => {
  log('INFO', \`Discovered \${peers.length} peers in mesh.\`);
  if (CONFIG.DEBUG) console.table(peers);
});

socket.on('peer-joined', (peer) => {
  log('INFO', \`Peer Joined: \${peer.name} (\${peer.ip})\`);
  // Trigger WebRTC initiation here
});

socket.on('peer-left', (data) => {
  log('INFO', \`Peer Left: \${data.id}\`);
});

// --- Keep Alive & Metrics ---
let packetsSent = 0;
setInterval(() => {
  if (socket.connected) {
    packetsSent++;
    // Simulate heartbeat / metric reporting
    if (packetsSent % 12 === 0) { // Every minute approx
       log('INFO', 'Heartbeat: Connection stable.');
    }
  }
}, 5000);

// Keep process alive
process.on('SIGINT', () => {
  log('WARN', 'Stopping agent...');
  socket.disconnect();
  process.exit(0);
});
`;

export const PACKAGE_JSON = `{
  "name": "nexuslan-agent",
  "version": "2.0.0",
  "description": "NexusLAN Edge Agent",
  "main": "nexus-agent.js",
  "bin": "nexus-agent.js",
  "scripts": {
    "start": "node nexus-agent.js",
    "build": "pkg . --targets node18-win-x64,node18-linux-x64,node18-macos-x64 --out-path dist"
  },
  "dependencies": {
    "socket.io-client": "^4.7.2"
  },
  "pkg": {
    "assets": [],
    "outputPath": "dist"
  }
}`;

export const README_MD = `# NexusLAN Client Agent

This bundle contains the source code for the NexusLAN Agent.
You can run it directly with Node.js or build it into a standalone executable (.exe).

## Option 1: Run with Node.js (Recommended for Dev)

1. Install Node.js (https://nodejs.org)
2. Open terminal in this folder
3. Install dependencies:
   \`npm install\`
4. Run the agent:
   \`node nexus-agent.js\`

## Option 2: Build Standalone Executable (.exe)

You can package this script into a single .exe file that runs on computers without Node.js installed.

1. Open terminal in this folder
2. Install dependencies:
   \`npm install\`
3. Install the packaging tool globally:
   \`npm install -g pkg\`
4. Build the executable:
   \`npm run build\`

The executable files will be created in the \`dist/\` folder:
- \`nexuslan-agent-win.exe\` (Windows)
- \`nexuslan-agent-linux\` (Linux)
- \`nexuslan-agent-macos\` (macOS)

## Usage

Run the executable normally, or with flags:

\`./nexuslan-agent-win.exe --server http://8.140.222.24:3000 --name MyGameServer\`
`;