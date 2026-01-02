
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

// Configuration
const PORT = 3000;
const JWT_SECRET = 'your-secure-secret-key-change-this';

// App Setup
const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity in P2P context
    methods: ["GET", "POST"]
  }
});

// --- In-Memory Database (Replace with MySQL/MongoDB logic for production persistence) ---
const users = new Map(); // Store users: { username, passwordHash, ... }
const activePeers = new Map(); // Store socket connections: { socketId, username, ip }

// --- Auth Routes ---
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  if (users.has(username)) return res.status(409).json({ error: 'User exists' });

  // In production, use bcrypt.hashSync(password, 10)
  const newUser = { id: Date.now().toString(), username, password, role: 'user' };
  users.set(username, newUser);

  console.log(`[AUTH] Registered: ${username}`);
  res.json({ message: 'User registered successfully' });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.get(username);

  // In production, use bcrypt.compareSync
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
  
  // Log login info
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`[AUTH] Login: ${username} from ${ip}`);

  res.json({ 
    user: { id: user.id, username: user.username, role: user.role, lastLogin: new Date() },
    token 
  });
});

app.post('/api/metrics', (req, res) => {
  const { userId, info } = req.body;
  console.log(`[METRICS] Device info for ${userId}:`, info);
  res.json({ status: 'ok' });
});

// --- WebRTC Signaling (Socket.io) ---
io.on('connection', (socket) => {
  console.log(`[SOCKET] New connection: ${socket.id}`);

  // User joins the virtual network
  socket.on('join-network', ({ username }) => {
    activePeers.set(socket.id, { id: socket.id, name: username, ip: socket.handshake.address });
    socket.join('winery-lan');
    
    // Broadcast list of peers to the new user
    const peersList = Array.from(activePeers.values()).filter(p => p.id !== socket.id);
    socket.emit('peer-list', peersList);
    
    // Notify others
    socket.to('winery-lan').emit('peer-joined', { id: socket.id, name: username });
    console.log(`[NET] ${username} joined the mesh.`);
  });

  // Signaling Data Relay
  socket.on('offer', (payload) => {
    io.to(payload.target).emit('offer', payload);
  });

  socket.on('answer', (payload) => {
    io.to(payload.target).emit('answer', payload);
  });

  socket.on('ice-candidate', (payload) => {
    io.to(payload.target).emit('ice-candidate', payload);
  });

  socket.on('disconnect', () => {
    const peer = activePeers.get(socket.id);
    if (peer) {
      console.log(`[NET] ${peer.name} disconnected.`);
      socket.to('winery-lan').emit('peer-left', { id: socket.id });
      activePeers.delete(socket.id);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`WineryLAN Backend running on port ${PORT}`);
});
