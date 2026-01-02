
import React, { createContext, useState, useContext, ReactNode } from 'react';

export type Language = 'en' | 'zh';

const translations = {
  en: {
    // Auth & App
    appTitle: "WineryLAN",
    tagline: "Secure P2P Virtual Network",
    loginTitle: "Secure Login",
    registerTitle: "Create Account",
    username: "Username",
    password: "Password",
    loginBtn: "Secure Login",
    registerBtn: "Create Account",
    haveAccount: "Already have an account? Login",
    noAccount: "Don't have an account? Register",
    agreementLogin: "By logging in, you agree to the WebRTC connection policy.",
    agreementRegister: "By registering, you agree to the WebRTC connection policy.",
    
    // Navigation Groups
    navGroupNetwork: "Network",
    navGroupSystem: "System",

    // Navigation Items
    navOverview: "Overview",
    navNetwork: "Network Peers",
    navChat: "Secure Chat",
    navAdmin: "Admin Console",
    navSetup: "Deployment Guide",
    navProfile: "My Profile",
    theme: "Theme",
    language: "Language",
    signOut: "Sign Out",
    welcome: "Welcome back",
    authFailed: "Authentication failed",
    missingFields: "Please enter both username and password.",
    
    // Dashboard / Overview
    dashboard: "Overview",
    status: "Status",
    online: "Online",
    offline: "Offline",
    virtualIp: "Virtual IP",
    latency: "Latency (Avg)",
    encryption: "Encryption",
    networkTraffic: "Network Traffic",
    connectedPeers: "Connected Peers",
    joinNet: "Join Virtual LAN",
    disconnectNet: "Disconnect Network",
    
    // Peer List
    deviceName: "Device Name",
    type: "Type",
    agent: "Agent",
    browser: "Browser",
    noPeers: "No peers discovered nearby. Connect to start scanning.",
    
    // Chat & Media
    chatRoom: "Secure Chat",
    chatPlaceholder: "Type a message...",
    chatEncrypted: "E2E Encrypted",
    recording: "Recording...",
    releaseToSend: "Stop & Send",
    uploading: "Processing...",
    fileTooLarge: "File too large (Max 5MB for demo)",
    
    // Admin & Roles
    adminPanel: "Admin Console",
    tabUsers: "User Management",
    tabChatLogs: "Chat & Content Monitor",
    role: "Role",
    permissions: "Permissions",
    actions: "Actions",
    ipAddress: "IP Address",
    location: "Location",
    deviceInfo: "Device Info",
    deleteUser: "Delete User",
    editPermissions: "Edit Permissions",
    changePassword: "Change Password",
    newPasswordPlaceholder: "Enter new password",
    passwordUpdated: "Password updated successfully",
    save: "Save",
    cancel: "Cancel",
    sender: "Sender",
    content: "Content",
    time: "Time",
    deleteMsg: "Delete Msg",
    confirmDeleteUser: "Are you sure you want to delete user {user}?",
    
    // Admin User Activity View
    viewActivity: "View Activity",
    userDetails: "User Details",
    recentChats: "Recent Chat History",
    uploadedFiles: "Uploaded Files",
    noFiles: "No files uploaded by this user.",
    noChats: "No chat history available.",
    close: "Close",

    // Remote Shell
    remoteShell: "Remote Shell",
    openShell: "Open Terminal",
    shellConnected: "Connected to remote shell session.",
    shellPlaceholder: "Enter command...",
    shellDisclaimer: "Warning: You have root access. Use with caution.",

    // User Profile
    profileTitle: "Profile Settings",
    profileSubtitle: "Manage your personal information and security.",
    bio: "Bio / Status",
    email: "Email Address",
    joined: "Joined",
    updateAvatar: "Change Avatar",
    personalInfo: "Personal Information",
    security: "Security",
    currentPassword: "Current Password",
    newPassword: "New Password",
    updateProfile: "Update Profile",
    saving: "Saving...",
    
    // Download Section
    downloadAgent: "Desktop Client",
    agentDescAdmin: "Authorized personnel only. Download Build Kit to generate client executables.",
    agentDescUser: "Download the official Windows client to connect to the mesh network.",
    downloadBtnAdmin: "Download Build Kit (.zip)",
    downloadBtnUser: "Download Client (.exe)",
    
    liveLogs: "Live Logs",
    upload: "Upload",
    download: "Download",
    serverSetup: "Server Setup",

    // Guide
    guideTitle: "Production Deployment Guide",
    guideSubtitle: "Step-by-step instructions for deploying to Alibaba Cloud (Ubuntu/CentOS) using Baota Panel.",
    
    prereqTitle: "Prerequisites",
    prereq1: "Server with Public IP (e.g., Alibaba Cloud ECS)",
    prereq2: "Baota Panel (aaPanel) installed",
    prereq3: "Software: Node.js 18+, Nginx, Docker Manager installed via Panel",

    stepConfigTitle: "1. Configuration",
    stepConfigDesc: "Update the config.ts file in your source code before building.",
    
    stepBackendTitle: "2. Backend Deployment",
    stepBackendDesc: "Upload and run the signaling server.",
    
    stepCoturnTitle: "3. STUN/TURN Service",
    stepCoturnDesc: "Deploy Coturn via Docker for NAT traversal (Critical for P2P).",
    
    stepFrontendTitle: "4. Frontend Build & Nginx",
    stepFrontendDesc: "Build the React app and configure Nginx reverse proxy.",
    
    stepFirewallTitle: "5. Firewall & Security Group",
    stepFirewallDesc: "Open ports in both Alibaba Cloud Console AND Baota Panel.",
    
    copy: "Copy",
    copied: "Copied!",
    
    portsDesc: "Required Ports",
    safetyNoteTitle: "Important Note",
    safetyNote: "Ensure you replace 'YOUR_SERVER_IP' with your actual public IP address. The TURN server ports (UDP 49152-65535) are mandatory for video calls to work across different networks."
  },
  zh: {
    // Auth & App
    appTitle: "WineryLAN",
    tagline: "安全的 P2P 虚拟网络",
    loginTitle: "安全登录",
    registerTitle: "创建账户",
    username: "用户名",
    password: "密码",
    loginBtn: "安全登录",
    registerBtn: "创建账户",
    haveAccount: "已有账号？去登录",
    noAccount: "还没有账号？去注册",
    agreementLogin: "登录即代表您同意 WebRTC 连接策略及数据收集协议。",
    agreementRegister: "注册即代表您同意 WebRTC 连接策略及数据收集协议。",
    
    // Navigation Groups
    navGroupNetwork: "网络",
    navGroupSystem: "系统管理",

    // Navigation Items
    navOverview: "概览",
    navNetwork: "网络节点",
    navChat: "聊天室",
    navAdmin: "管理员控制台",
    navSetup: "部署指南",
    navProfile: "个人资料",
    theme: "主题",
    language: "语言",
    signOut: "退出登录",
    welcome: "欢迎回来",
    authFailed: "认证失败",
    missingFields: "请输入用户名和密码。",

    // Dashboard
    dashboard: "概览",
    status: "状态",
    online: "在线",
    offline: "离线",
    virtualIp: "虚拟 IP",
    latency: "平均延迟",
    encryption: "加密",
    networkTraffic: "网络流量",
    connectedPeers: "已连接节点",
    joinNet: "加入虚拟局域网",
    disconnectNet: "断开网络",
    
    // Peer List
    deviceName: "设备名称",
    type: "类型",
    agent: "客户端代理",
    browser: "浏览器",
    noPeers: "附近未发现节点。请点击连接以开始扫描。",

    // Chat & Media
    chatRoom: "安全聊天室",
    chatPlaceholder: "输入消息...",
    chatEncrypted: "端到端加密",
    recording: "正在录音...",
    releaseToSend: "停止并发送",
    uploading: "处理中...",
    fileTooLarge: "文件过大 (演示版限 5MB)",

    // Admin & Roles
    adminPanel: "管理员控制台",
    tabUsers: "用户管理",
    tabChatLogs: "内容与聊天监控",
    role: "角色",
    permissions: "权限",
    actions: "操作",
    ipAddress: "IP 地址",
    location: "地理位置",
    deviceInfo: "设备信息",
    deleteUser: "删除用户",
    editPermissions: "编辑权限",
    changePassword: "修改密码",
    newPasswordPlaceholder: "输入新密码",
    passwordUpdated: "密码已更新",
    save: "保存",
    cancel: "取消",
    sender: "发送者",
    content: "内容",
    time: "时间",
    deleteMsg: "撤回/删除",
    confirmDeleteUser: "确定要删除用户 {user} 吗？",
    
    // Admin User Activity View
    viewActivity: "查看活动",
    userDetails: "用户详情",
    recentChats: "近期聊天记录",
    uploadedFiles: "已上传文件",
    noFiles: "该用户未上传文件。",
    noChats: "无聊天记录。",
    close: "关闭",

    // Remote Shell
    remoteShell: "远程 Shell",
    openShell: "打开终端",
    shellConnected: "已连接到远程 Shell 会话。",
    shellPlaceholder: "输入命令...",
    shellDisclaimer: "警告：您拥有 Root 权限。请谨慎操作。",

    // User Profile
    profileTitle: "个人资料设置",
    profileSubtitle: "管理您的个人信息和账户安全。",
    bio: "个人简介 / 状态",
    email: "电子邮箱",
    joined: "加入时间",
    updateAvatar: "更换头像",
    personalInfo: "基本信息",
    security: "安全设置",
    currentPassword: "当前密码",
    newPassword: "新密码",
    updateProfile: "更新资料",
    saving: "保存中...",

    // Download Section
    downloadAgent: "桌面客户端",
    agentDescAdmin: "仅限授权人员。下载构建工具包以生成客户端可执行文件。",
    agentDescUser: "下载官方 Windows 客户端。无需保持浏览器开启即可连接。",
    downloadBtnAdmin: "下载构建工具包 (.zip)",
    downloadBtnUser: "下载客户端 (.exe)",

    liveLogs: "实时日志",
    upload: "上传",
    download: "下载",
    serverSetup: "部署指南",

    // Guide
    guideTitle: "生产环境部署指南",
    guideSubtitle: "阿里云服务器 (Ubuntu/CentOS) + 宝塔面板部署全流程。",
    
    prereqTitle: "环境准备",
    prereq1: "一台拥有公网 IP 的服务器 (推荐阿里云 ECS)",
    prereq2: "已安装宝塔面板 (aaPanel)",
    prereq3: "面板软件：Node.js 18+, Nginx, Docker 管理器",

    stepConfigTitle: "1. 修改配置",
    stepConfigDesc: "在构建前，请修改源代码中的 config.ts 文件。",
    
    stepBackendTitle: "2. 部署后端",
    stepBackendDesc: "上传信令服务器代码并运行。",
    
    stepCoturnTitle: "3. 部署 Coturn (STUN/TURN)",
    stepCoturnDesc: "使用 Docker 部署中继服务器，这对 P2P 穿透至关重要。",
    
    stepFrontendTitle: "4. 前端构建与 Nginx",
    stepFrontendDesc: "本地构建 React 项目，配置 Nginx 反向代理。",
    
    stepFirewallTitle: "5. 防火墙与安全组",
    stepFirewallDesc: "务必在阿里云控制台和宝塔面板同时放行以下端口。",
    
    copy: "复制",
    copied: "已复制",

    portsDesc: "必需端口",
    safetyNoteTitle: "重要提示",
    safetyNote: "请确保将代码中的 'YOUR_SERVER_IP' 替换为您的真实公网 IP。TURN 服务器的 UDP 端口范围 (49152-65535) 必须开放，否则跨网络视频通话将无法建立。"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en'], params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh'); // Default to Chinese

  const t = (key: keyof typeof translations['en'], params?: Record<string, string>) => {
    let text = translations[language][key] || translations['en'][key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};
