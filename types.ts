
export type RoleType = 'admin' | 'moderator' | 'user';

export interface User {
  id: string;
  username: string;
  token: string;
  role: RoleType;
  permissions: string[]; // List of permission strings e.g. 'manage_users', 'view_logs'
  lastLogin: string;
  ipAddress?: string;
  location?: string; // New: Geo location
  deviceSummary?: string; // New: Brief device info
  avatar?: string; // New: Base64 or URL
  bio?: string; // New: User status/bio
  email?: string; // New: Contact info
}

export interface DeviceInfo {
  userAgent: string;
  screenResolution: string;
  language: string;
  platform: string;
  connectionType?: string;
  rtt?: number;
}

export enum PeerStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  FAILED = 'FAILED',
}

export interface Peer {
  id: string;
  name: string;
  ip: string;
  latency: number;
  status: PeerStatus;
  type: 'browser' | 'agent';
  trafficIn: number;
  trafficOut: number;
}

export interface NetworkLog {
  id: string;
  timestamp: string;
  event: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface TrafficPoint {
  time: string;
  upload: number;
  download: number;
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file';

export interface Attachment {
  name: string;
  url: string; // In real app: URL, in mock: base64
  size: number;
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string; // New: Snapshot of avatar at time of sending
  type: MessageType;
  content?: string; // Text content or caption
  attachment?: Attachment;
  timestamp: string;
  isSystem?: boolean;
}
