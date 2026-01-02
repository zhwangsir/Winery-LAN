
import { User, DeviceInfo, NetworkLog, RoleType, ChatMessage, MessageType, Attachment } from '../types';

// Simulate Database Tables
interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  role: RoleType;
  permissions: string[]; // Custom permissions per user
  lastLogin: string;
  avatar?: string;
  bio?: string;
  email?: string;
}

interface StoredLoginLog {
  id: string;
  userId: string;
  username: string;
  ip: string;
  location: string;
  deviceInfo: DeviceInfo;
  timestamp: string;
}

// Default Role Permissions
const DEFAULT_ROLE_PERMISSIONS: Record<RoleType, string[]> = {
  admin: [
    'manage_users', 'delete_users', 'edit_permissions', 
    'view_admin_logs', 'build_client', 
    'view_sensitive_data', // IP, Location, Device
    'manage_chat', 'manage_files', // Delete messages/files
    'kick_peer'
  ],
  moderator: ['manage_users', 'view_admin_logs', 'kick_peer', 'manage_chat'],
  user: []
};

class MockBackendService {
  private users: Map<string, StoredUser> = new Map();
  private logs: NetworkLog[] = [];
  
  // New: Chat & Info Collection Storage
  private loginLogs: StoredLoginLog[] = [];
  private chatMessages: ChatMessage[] = [];
  private chatListeners: ((msgs: ChatMessage[]) => void)[] = [];

  constructor() {
    this.logs.push({
      id: 'init',
      timestamp: new Date().toISOString(),
      event: 'System Initialized',
      severity: 'info',
    });
    
    // Create default users
    // Updated admin password to 'wangzhenyu123'
    this.register('admin', 'wangzhenyu123', 'admin').catch(() => {}); 
    this.register('mod', 'mod', 'moderator').catch(() => {});
    this.register('user', 'user', 'user').then(u => {
      // Add a dummy file upload for the default user to test Admin Panel view
      this.chatMessages.push({
        id: 'msg-demo-file',
        userId: u.id,
        username: u.username,
        userAvatar: u.avatar,
        type: 'file',
        content: 'config_backup.json',
        timestamp: new Date().toISOString(),
        attachment: {
          name: 'config_backup.json',
          url: '#',
          size: 1024 * 2.5,
          mimeType: 'application/json'
        }
      });
    }).catch(() => {});

    // Initial Chat Message
    this.chatMessages.push({
      id: 'msg-0',
      userId: 'system',
      username: 'System',
      type: 'text',
      content: 'Welcome to the secure channel.',
      timestamp: new Date().toISOString(),
      isSystem: true
    });
  }

  // --- Auth & Data Collection ---

  async register(username: string, password: string, role: RoleType = 'user'): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (this.users.has(username)) {
      throw new Error('Username already exists');
    }

    const newUser: StoredUser = {
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      username,
      passwordHash: password, // In real DB: bcrypt.hashSync(password, 10)
      role, 
      permissions: [...DEFAULT_ROLE_PERMISSIONS[role]],
      lastLogin: new Date().toISOString(),
      avatar: undefined,
      bio: 'New member of the mesh.',
      email: `${username}@nexuslan.local`
    };

    this.users.set(username, newUser);
    this.addLog(`New user registered: ${username} (${role})`, 'success');
    
    return this.toPublicUser(newUser);
  }

  async login(username: string, password?: string): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const user = this.users.get(username);
    
    if (!user || (password && user.passwordHash !== password)) {
      this.addLog(`Failed login attempt for ${username}`, 'warning');
      throw new Error('Invalid username or password');
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    this.users.set(username, user);
    
    this.addLog(`User logged in: ${username}`, 'info');

    return this.toPublicUser(user);
  }

  async updateUserProfile(username: string, updates: Partial<StoredUser>): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const user = this.users.get(username);
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, ...updates };
    this.users.set(username, updatedUser);
    
    this.addLog(`User profile updated: ${username}`, 'info');
    return this.toPublicUser(updatedUser);
  }

  async getUserById(userId: string): Promise<User | null> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    // In Map, we store by username, so iterate
    const user = Array.from(this.users.values()).find(u => u.id === userId);
    
    if (!user) return null;

    // Enrich with location data if available in logs
    const lastLog = this.loginLogs
        .filter(l => l.userId === user.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    const publicUser = this.toPublicUser(user);
    if (lastLog) {
        publicUser.ipAddress = lastLog.ip;
        publicUser.location = lastLog.location;
        publicUser.deviceSummary = lastLog.deviceInfo.platform;
    }
    return publicUser;
  }

  // Collects IP and Device Info and stores it in "Database"
  async collectDeviceInfo(userId: string, info: DeviceInfo): Promise<void> {
    const user = Array.from(this.users.values()).find(u => u.id === userId);
    if (!user) return;

    // Simulate IP & Location detection
    const mockIp = `192.168.1.${Math.floor(Math.random() * 255)}`;
    const mockLocations = ["New York, US", "London, UK", "Tokyo, JP", "Berlin, DE", "Shanghai, CN"];
    const mockLocation = mockLocations[Math.floor(Math.random() * mockLocations.length)];

    const logEntry: StoredLoginLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      username: user.username,
      ip: mockIp,
      location: mockLocation,
      deviceInfo: info,
      timestamp: new Date().toISOString()
    };

    this.loginLogs.push(logEntry);
    this.addLog(`Info collected for ${user.username}`, 'info');
  }

  // --- Chat System ---

  subscribeToChat(callback: (msgs: ChatMessage[]) => void) {
    this.chatListeners.push(callback);
    callback([...this.chatMessages]);
    return () => {
      this.chatListeners = this.chatListeners.filter(cb => cb !== callback);
    };
  }

  async sendChatMessage(userId: string, content: string, type: MessageType = 'text', attachment?: Attachment) {
    const user = Array.from(this.users.values()).find(u => u.id === userId);
    if (!user) return;

    // Simulate Network Delay for larger files
    if (attachment) {
       await new Promise(resolve => setTimeout(resolve, 500)); 
    }

    const msg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      userAvatar: user.avatar, // Store snapshot of avatar
      type,
      content,
      attachment,
      timestamp: new Date().toISOString()
    };

    this.chatMessages.push(msg);
    this.notifyChat();

    // Auto-reply simulation (only for text)
    if (type === 'text' && content.includes('help')) {
      setTimeout(() => {
        this.chatMessages.push({
          id: 'sys-' + Date.now(),
          userId: 'system',
          username: 'System',
          type: 'text',
          content: 'An admin has been notified of your request.',
          timestamp: new Date().toISOString(),
          isSystem: true
        });
        this.notifyChat();
      }, 1000);
    }
  }

  private notifyChat() {
    this.chatListeners.forEach(cb => cb([...this.chatMessages]));
  }

  // --- Admin Methods ---

  // Admin: Get all users enriched with data
  async getAllUsers(): Promise<User[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    return Array.from(this.users.values()).map(u => {
      // Find latest login log for this user
      const lastLog = this.loginLogs
        .filter(l => l.userId === u.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      const publicUser = this.toPublicUser(u);
      
      if (lastLog) {
        publicUser.ipAddress = lastLog.ip;
        publicUser.location = lastLog.location;
        publicUser.deviceSummary = `${lastLog.deviceInfo.platform} - ${lastLog.deviceInfo.userAgent.substring(0, 20)}...`;
      }
      return publicUser;
    });
  }

  // Admin: Update Role
  async updateUserRole(targetUsername: string, newRole: RoleType): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const user = this.users.get(targetUsername);
    if (!user) throw new Error("User not found");
    
    user.role = newRole;
    // Reset permissions to default role permissions when role changes
    user.permissions = [...DEFAULT_ROLE_PERMISSIONS[newRole]];
    
    this.users.set(targetUsername, user);
    this.addLog(`Role updated for ${targetUsername} -> ${newRole}`, 'warning');
  }

  // Admin: Update Specific Permissions
  async updateUserPermissions(targetUsername: string, permissions: string[]): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const user = this.users.get(targetUsername);
    if (!user) throw new Error("User not found");
    
    user.permissions = permissions;
    this.users.set(targetUsername, user);
    this.addLog(`Permissions updated for ${targetUsername}`, 'warning');
  }
  
  // Admin: Update Password
  async adminUpdatePassword(targetUsername: string, newPass: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const user = this.users.get(targetUsername);
    if (!user) throw new Error("User not found");
    
    user.passwordHash = newPass; // In real app: hash it
    this.users.set(targetUsername, user);
    this.addLog(`Password reset for user: ${targetUsername}`, 'warning');
  }

  // Admin: Delete User
  async deleteUser(username: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (!this.users.has(username)) throw new Error("User not found");
    this.users.delete(username);
    this.addLog(`User deleted: ${username}`, 'error');
  }
  
  // Admin: Execute Remote Shell Command
  async executeShellCommand(targetUserId: string, command: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 400)); // Network Latency
    
    const cmd = command.trim().toLowerCase();
    
    // Simulate some outputs
    if (cmd === 'ls' || cmd === 'dir') {
        return "Desktop\nDocuments\nDownloads\nnexus_agent.exe\nconfig.json\nsecret_plans.txt";
    }
    if (cmd === 'whoami') {
        return "root";
    }
    if (cmd === 'ipconfig' || cmd === 'ifconfig') {
        return "eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n      inet 192.168.1.105  netmask 255.255.255.0  broadcast 192.168.1.255\n      ether 00:0c:29:4f:8e:3a  txqueuelen 1000  (Ethernet)\n\ntun0: flags=4305<UP,POINTOPOINT,RUNNING,NOARP,MULTICAST>  mtu 1500\n      inet 10.24.0.5  netmask 255.255.255.0  destination 10.24.0.5";
    }
    if (cmd === 'ps aux' || cmd === 'top') {
        return "PID  USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND\n1    root      20   0  168512  12844   9640 S   0.0  0.1   0:03.45 systemd\n104  nexus     20   0  982140  85200  42100 S   2.5  0.8   5:12.30 nexus_agent";
    }
    if (cmd === 'pwd') {
        return "/home/nexus/agent";
    }
    
    return `bash: ${command}: command not found`;
  }

  // Admin: Get all chat logs (raw)
  async getAllChatLogs(): Promise<ChatMessage[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return [...this.chatMessages];
  }

  // Admin: Delete chat message
  async deleteChatMessage(messageId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    this.chatMessages = this.chatMessages.filter(m => m.id !== messageId);
    this.notifyChat();
    this.addLog(`Message deleted: ${messageId}`, 'warning');
  }

  // --- Helpers ---

  private toPublicUser(user: StoredUser): User {
    return {
      id: user.id,
      username: user.username,
      token: `jwt-mock-${Date.now()}`,
      role: user.role,
      permissions: user.permissions,
      lastLogin: user.lastLogin,
      avatar: user.avatar,
      bio: user.bio,
      email: user.email
    };
  }

  addLog(event: string, severity: 'info' | 'warning' | 'error' | 'success') {
    const log: NetworkLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      event,
      severity,
    };
    this.logs.unshift(log);
    if (this.logs.length > 50) this.logs.pop();
    return log;
  }

  getLogs(): NetworkLog[] {
    return this.logs;
  }
}

export const mockBackend = new MockBackendService();
