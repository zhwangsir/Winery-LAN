import { Peer, PeerStatus } from '../types';
import { mockBackend } from './mockBackend';

type PeerUpdateCallback = (peers: Peer[]) => void;

// In a real application, this would interface with a WebSocket signaling server
// and create RTCPeerConnection objects.
export class WebRTCManager {
  private peers: Peer[] = [];
  private listeners: PeerUpdateCallback[] = [];
  private intervalId: number | null = null;
  private isConnected = false;

  constructor() {
    // Initialize with some "discovered" but disconnected peers
    this.peers = [
      { id: 'p1', name: 'GameHost-PC (Agent)', ip: '10.24.0.5', latency: 0, status: PeerStatus.DISCONNECTED, type: 'agent', trafficIn: 0, trafficOut: 0 },
      { id: 'p2', name: 'Mobile-User-NY', ip: '10.24.0.6', latency: 0, status: PeerStatus.DISCONNECTED, type: 'browser', trafficIn: 0, trafficOut: 0 },
      { id: 'p3', name: 'Backup-Server', ip: '10.24.0.2', latency: 0, status: PeerStatus.DISCONNECTED, type: 'agent', trafficIn: 0, trafficOut: 0 },
    ];
  }

  subscribe(callback: PeerUpdateCallback) {
    this.listeners.push(callback);
    callback([...this.peers]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb([...this.peers]));
  }

  async connectToMesh() {
    if (this.isConnected) return;
    
    mockBackend.addLog('Initiating WebRTC Mesh Connection...', 'info');
    
    // Simulate STUN/TURN gathering
    this.peers = this.peers.map(p => ({ ...p, status: PeerStatus.CONNECTING }));
    this.notify();

    // Simulate async connection process
    await new Promise(resolve => setTimeout(resolve, 1500));

    this.isConnected = true;
    this.peers = this.peers.map(p => ({
      ...p,
      status: PeerStatus.CONNECTED,
      latency: Math.floor(Math.random() * 40) + 10, // Simulated latency < 50ms
    }));
    
    mockBackend.addLog('Joined Virtual LAN (10.24.0.x). Mesh established.', 'success');
    this.startHeartbeat();
    this.notify();
  }

  disconnectFromMesh() {
    this.isConnected = false;
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.peers = this.peers.map(p => ({ 
      ...p, 
      status: PeerStatus.DISCONNECTED, 
      latency: 0,
      trafficIn: 0,
      trafficOut: 0
    }));
    mockBackend.addLog('Disconnected from Virtual Network.', 'warning');
    this.notify();
  }

  private startHeartbeat() {
    if (this.intervalId) window.clearInterval(this.intervalId);
    
    this.intervalId = window.setInterval(() => {
      if (!this.isConnected) return;

      // Update latencies and traffic simulation
      this.peers = this.peers.map(p => ({
        ...p,
        latency: Math.max(5, p.latency + (Math.random() * 10 - 5)), // Jitter
        trafficIn: Math.floor(Math.random() * 500),
        trafficOut: Math.floor(Math.random() * 200),
      }));
      this.notify();
    }, 2000);
  }
}

export const webrtcManager = new WebRTCManager();