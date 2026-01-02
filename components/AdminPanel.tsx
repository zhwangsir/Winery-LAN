import React, { useEffect, useState, useRef } from 'react';
import { User, RoleType, ChatMessage } from '../types';
import { mockBackend } from '../services/mockBackend';
import { ShieldCheck, Users, MessageSquare, Trash2, Edit2, X, Check, Eye, Key, File, Terminal, Maximize2, Minimize2 } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

type Tab = 'users' | 'chat';

const AVAILABLE_PERMISSIONS = [
  'manage_users', 
  'delete_users',
  'view_admin_logs', 
  'build_client', 
  'kick_peer',
  'view_sensitive_data',
  'manage_chat',
  'manage_files'
];

interface ShellCommand {
  cmd: string;
  output: string;
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [chatLogs, setChatLogs] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [tempPermissions, setTempPermissions] = useState<string[]>([]);
  
  // Password Reset State
  const [resettingPasswordUser, setResettingPasswordUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  // View Activity State
  const [viewingActivityUser, setViewingActivityUser] = useState<User | null>(null);
  
  // Remote Shell State
  const [shellUser, setShellUser] = useState<User | null>(null);
  const [shellHistory, setShellHistory] = useState<ShellCommand[]>([]);
  const [commandBuffer, setCommandBuffer] = useState<string[]>([]); // For Up/Down arrow history
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isExecutingCmd, setIsExecutingCmd] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const shellEndRef = useRef<HTMLDivElement>(null);
  const shellInputRef = useRef<HTMLInputElement>(null);

  const { t } = useLanguage();

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users' || viewingActivityUser) {
        const data = await mockBackend.getAllUsers();
        setUsers(data);
      }
      
      // Always load chat logs to filter for specific user activity if needed
      const logs = await mockBackend.getAllChatLogs();
      setChatLogs(logs);
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    shellEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [shellHistory, currentCommand]);

  // Focus input when shell opens or user clicks anywhere in terminal
  useEffect(() => {
    if (shellUser) {
        setTimeout(() => shellInputRef.current?.focus(), 100);
    }
  }, [shellUser, isMaximized]);

  // --- User Management Handlers ---

  const handleRoleChange = async (username: string, newRole: RoleType) => {
    await mockBackend.updateUserRole(username, newRole);
    loadData();
  };

  const handleEditPermissions = (user: User) => {
    setEditingUser(user.username);
    setTempPermissions([...user.permissions]);
  };

  const togglePermission = (perm: string) => {
    if (tempPermissions.includes(perm)) {
      setTempPermissions(tempPermissions.filter(p => p !== perm));
    } else {
      setTempPermissions([...tempPermissions, perm]);
    }
  };

  const savePermissions = async () => {
    if (editingUser) {
      await mockBackend.updateUserPermissions(editingUser, tempPermissions);
      setEditingUser(null);
      loadData();
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (confirm(t('confirmDeleteUser', { user: username }))) {
      await mockBackend.deleteUser(username);
      loadData();
    }
  };

  const handlePasswordResetClick = (username: string) => {
      setResettingPasswordUser(username);
      setNewPassword('');
  };

  const saveNewPassword = async () => {
      if (resettingPasswordUser && newPassword) {
          await mockBackend.adminUpdatePassword(resettingPasswordUser, newPassword);
          alert(t('passwordUpdated'));
          setResettingPasswordUser(null);
          setNewPassword('');
      }
  };
  
  const handleViewActivity = (user: User) => {
    setViewingActivityUser(user);
    // Ensure we have latest logs
    mockBackend.getAllChatLogs().then(setChatLogs);
  };
  
  // --- Remote Shell Handlers ---
  
  const handleOpenShell = (user: User) => {
    setShellUser(user);
    setShellHistory([]);
    setCommandBuffer([]);
    setHistoryPointer(-1);
    setCurrentCommand('');
    setIsMaximized(false);
    
    // Simulate connection message
    setTimeout(() => {
        setShellHistory([{ cmd: '', output: `${t('shellConnected')} Target: ${user.ipAddress || 'Unknown'}\nType 'help' for available commands.` }]);
    }, 400);
  };

  const handleShellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandBuffer.length > 0) {
            const newPointer = historyPointer + 1;
            if (newPointer < commandBuffer.length) {
                setHistoryPointer(newPointer);
                setCurrentCommand(commandBuffer[commandBuffer.length - 1 - newPointer]);
            }
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyPointer > 0) {
            const newPointer = historyPointer - 1;
            setHistoryPointer(newPointer);
            setCurrentCommand(commandBuffer[commandBuffer.length - 1 - newPointer]);
        } else if (historyPointer === 0) {
            setHistoryPointer(-1);
            setCurrentCommand('');
        }
    }
  };

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shellUser) return;
    
    // Allow empty enter to just show new line
    const cmd = currentCommand;
    
    // Handle 'clear' command locally
    if (cmd.trim().toLowerCase() === 'clear') {
        setShellHistory([]);
        setCurrentCommand('');
        return;
    }

    // Add to buffer for arrow keys
    if (cmd.trim()) {
        setCommandBuffer(prev => [...prev, cmd]);
    }
    setHistoryPointer(-1); // Reset pointer
    setCurrentCommand('');
    setIsExecutingCmd(true);
    
    // Optimistic UI update
    setShellHistory(prev => [...prev, { cmd, output: '' }]);

    try {
        let output = '';
        if (cmd.trim()) {
            output = await mockBackend.executeShellCommand(shellUser.id, cmd);
        }
        
        // Update the last entry with the actual output
        setShellHistory(prev => {
            const newHist = [...prev];
            newHist[newHist.length - 1].output = output;
            return newHist;
        });
    } catch (err) {
        setShellHistory(prev => {
            const newHist = [...prev];
            newHist[newHist.length - 1].output = 'Error: Connection lost or timeout.';
            return newHist;
        });
    } finally {
        setIsExecutingCmd(false);
        // Keep focus
        setTimeout(() => shellInputRef.current?.focus(), 50);
    }
  };

  // --- Chat Management Handlers ---

  const handleDeleteMessage = async (id: string) => {
    await mockBackend.deleteChatMessage(id);
    loadData();
  };

  // --- Renderers ---

  const renderUsersTab = () => (
    <div className="overflow-x-auto min-h-[400px]">
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead>
          <tr className="text-gray-400 border-b border-gray-200 dark:border-gray-700 text-sm">
            <th className="py-3 font-medium pl-2">{t('username')}</th>
            <th className="py-3 font-medium">{t('role')}</th>
            <th className="py-3 font-medium w-64">{t('permissions')}</th>
            {/* Extended Columns */}
            <th className="py-3 font-medium text-brand-500">{t('ipAddress')}</th>
            <th className="py-3 font-medium text-brand-500">{t('location')}</th>
            <th className="py-3 font-medium text-brand-500">{t('deviceInfo')}</th>
            <th className="py-3 font-medium text-right pr-2">{t('actions')}</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {users.map((u) => (
            <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative">
              <td className="py-3 font-medium pl-2">
                <div className="flex flex-col">
                  <span>{u.username}</span>
                  <span className="text-[10px] text-gray-400">ID: {u.id}</span>
                </div>
              </td>
              <td className="py-3">
                <select 
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.username, e.target.value as RoleType)}
                  className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs"
                  disabled={u.username === 'admin'} 
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td className="py-3 align-top">
                {editingUser === u.username ? (
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2 rounded shadow-lg absolute z-10 w-64">
                    <h4 className="text-xs font-bold mb-2 text-gray-500 uppercase">{t('editPermissions')}</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {AVAILABLE_PERMISSIONS.map(p => (
                        <label key={p} className="flex items-center space-x-2 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded">
                          <input 
                            type="checkbox" 
                            checked={tempPermissions.includes(p)}
                            onChange={() => togglePermission(p)}
                            className="rounded text-brand-500"
                          />
                          <span>{p}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex justify-end space-x-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <button onClick={() => setEditingUser(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={14}/></button>
                      <button onClick={savePermissions} className="p-1 text-green-500 hover:text-green-600"><Check size={14}/></button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1 max-w-xs cursor-pointer group" onClick={() => handleEditPermissions(u)}>
                    {u.permissions.slice(0, 3).map(p => (
                      <span key={p} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                        {p.replace('_', ' ')}
                      </span>
                    ))}
                    {u.permissions.length > 3 && (
                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] text-gray-500">
                        +{u.permissions.length - 3}
                      </span>
                    )}
                    <Edit2 size={10} className="opacity-0 group-hover:opacity-100 ml-1 text-brand-500" />
                  </div>
                )}
              </td>
              
              {/* Extended Info Columns */}
              <td className="py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                {u.ipAddress || '-'}
              </td>
              <td className="py-3 text-xs text-gray-600 dark:text-gray-300">
                {u.location || '-'}
              </td>
              <td className="py-3 text-[10px] text-gray-500 dark:text-gray-400 max-w-[150px] truncate" title={u.deviceSummary}>
                {u.deviceSummary || '-'}
              </td>

              <td className="py-3 text-right pr-2">
                <div className="flex justify-end space-x-1">
                    {/* Password Reset Input */}
                    {resettingPasswordUser === u.username ? (
                        <div className="absolute right-10 top-2 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2 rounded shadow-lg flex items-center space-x-2">
                            <input 
                                type="text" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder={t('newPasswordPlaceholder')}
                                className="text-xs p-1 border rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-600"
                                autoFocus
                            />
                            <button onClick={saveNewPassword} className="text-green-500"><Check size={14}/></button>
                            <button onClick={() => setResettingPasswordUser(null)} className="text-red-500"><X size={14}/></button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => handlePasswordResetClick(u.username)}
                            className="p-1.5 text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition-colors"
                            title={t('changePassword')}
                        >
                            <Key size={16} />
                        </button>
                    )}

                    {/* Remote Shell Button */}
                    <button 
                        onClick={() => handleOpenShell(u)}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                        title={t('openShell')}
                    >
                        <Terminal size={16} />
                    </button>

                    {/* View User Activity (Chat & Files) */}
                    <button 
                        onClick={() => handleViewActivity(u)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title={t('viewActivity')}
                    >
                        <Eye size={16} />
                    </button>

                    <button 
                    onClick={() => handleDeleteUser(u.username)}
                    disabled={u.username === 'admin'}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={t('deleteUser')}
                    >
                    <Trash2 size={16} />
                    </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderChatTab = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-gray-400 border-b border-gray-200 dark:border-gray-700 text-sm">
            <th className="py-3 font-medium pl-2 w-32">{t('time')}</th>
            <th className="py-3 font-medium w-32">{t('sender')}</th>
            <th className="py-3 font-medium">{t('content')}</th>
            <th className="py-3 font-medium text-right pr-2">{t('actions')}</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {chatLogs.map((msg) => (
            <tr key={msg.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td className="py-3 pl-2 text-xs text-gray-500 font-mono">
                {new Date(msg.timestamp).toLocaleString()}
              </td>
              <td className="py-3 font-medium text-brand-600 dark:text-brand-400">
                {msg.username}
              </td>
              <td className="py-3">
                <div className="flex flex-col">
                   {msg.type !== 'text' && (
                     <span className="text-[10px] uppercase font-bold text-gray-400 mb-1 border border-gray-200 dark:border-gray-700 px-1 rounded w-fit">
                       {msg.type}
                     </span>
                   )}
                   <span className="text-gray-700 dark:text-gray-200">{msg.content}</span>
                   {msg.attachment && (
                     <a href={msg.attachment.url} download={msg.attachment.name} className="text-xs text-blue-500 underline mt-1 truncate max-w-xs block">
                       📎 {msg.attachment.name} ({(msg.attachment.size/1024).toFixed(1)} KB)
                     </a>
                   )}
                </div>
              </td>
              <td className="py-3 text-right pr-2">
                <button 
                  onClick={() => handleDeleteMessage(msg.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title={t('deleteMsg')}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
          {chatLogs.length === 0 && (
            <tr><td colSpan={4} className="text-center py-8 text-gray-400">No logs found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderActivityModal = () => {
    if (!viewingActivityUser) return null;

    const userChats = chatLogs.filter(c => c.userId === viewingActivityUser.id);
    const userFiles = userChats.filter(c => c.attachment);

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-dark-card w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          {/* Modal Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
             <div className="flex items-center space-x-3">
               <div className="bg-brand-100 dark:bg-brand-900/30 p-2 rounded-full text-brand-600 dark:text-brand-400">
                 <Users size={20} />
               </div>
               <div>
                 <h3 className="text-lg font-bold">{t('userDetails')}: {viewingActivityUser.username}</h3>
                 <div className="flex space-x-3 text-xs text-gray-500">
                   <span className="font-mono">{viewingActivityUser.ipAddress || 'No IP'}</span>
                   <span>•</span>
                   <span>{viewingActivityUser.location || 'Unknown Location'}</span>
                 </div>
               </div>
             </div>
             <button onClick={() => setViewingActivityUser(null)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
               <X size={24} />
             </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            
            {/* Detailed Device Info Section */}
            <div>
               <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{t('deviceInfo')}</h4>
               <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                  {viewingActivityUser.deviceSummary || 'No detailed device info collected.'}
               </div>
            </div>

            {/* Uploaded Files Section */}
            <div>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                 <File size={14} className="mr-1"/> {t('uploadedFiles')} ({userFiles.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {userFiles.length > 0 ? userFiles.map(fileMsg => (
                  <div key={fileMsg.id} className="flex items-center p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                     <div className="mr-3 bg-blue-100 dark:bg-blue-900/20 p-2 rounded text-blue-600 dark:text-blue-400">
                        <File size={18} />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fileMsg.attachment?.name}</p>
                        <p className="text-[10px] text-gray-400">
                            {new Date(fileMsg.timestamp).toLocaleDateString()} • {((fileMsg.attachment?.size || 0)/1024).toFixed(1)} KB
                        </p>
                     </div>
                     <button 
                        onClick={() => handleDeleteMessage(fileMsg.id)} 
                        className="text-red-400 hover:text-red-600 p-1"
                        title={t('deleteMsg')}
                     >
                        <Trash2 size={14} />
                     </button>
                  </div>
                )) : (
                  <p className="text-sm text-gray-400 italic">{t('noFiles')}</p>
                )}
              </div>
            </div>

            {/* Recent Chats Section */}
            <div>
               <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                 <MessageSquare size={14} className="mr-1"/> {t('recentChats')}
               </h4>
               <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-[200px] overflow-y-auto">
                 {userChats.length > 0 ? (
                    <table className="w-full text-left text-xs">
                       <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                          <tr>
                             <th className="p-2 font-medium">{t('time')}</th>
                             <th className="p-2 font-medium">{t('content')}</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                         {userChats.slice().reverse().slice(0, 50).map(msg => (
                            <tr key={msg.id}>
                               <td className="p-2 text-gray-400 whitespace-nowrap">{new Date(msg.timestamp).toLocaleString()}</td>
                               <td className="p-2 truncate max-w-[300px]">{msg.content || (msg.attachment ? `[${msg.type}]` : '')}</td>
                            </tr>
                         ))}
                       </tbody>
                    </table>
                 ) : (
                    <div className="p-4 text-center text-gray-400 italic">{t('noChats')}</div>
                 )}
               </div>
            </div>

          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
             <button 
               onClick={() => setViewingActivityUser(null)}
               className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
             >
               {t('close')}
             </button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderShellModal = () => {
    if (!shellUser) return null;

    return (
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div 
            className={`${isMaximized ? 'w-full h-full' : 'w-full max-w-4xl h-[600px]'} transition-all duration-300 ease-in-out bg-[#0c0c0c]/95 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-700/50 font-mono`}
            onClick={() => shellInputRef.current?.focus()} // Focus input when clicking anywhere
        >
           {/* macOS-style Header */}
           <div className="bg-[#1e1e1e]/90 px-4 py-3 flex justify-between items-center border-b border-gray-800 select-none">
              <div className="flex items-center space-x-2 group">
                 <button onClick={() => setShellUser(null)} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors">
                     <X size={8} className="text-red-900 opacity-0 group-hover:opacity-100" />
                 </button>
                 <button className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors">
                    <Minimize2 size={8} className="text-yellow-900 opacity-0 group-hover:opacity-100" />
                 </button>
                 <button onClick={() => setIsMaximized(!isMaximized)} className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors">
                    <Maximize2 size={8} className="text-green-900 opacity-0 group-hover:opacity-100" />
                 </button>
              </div>
              
              <div className="flex items-center space-x-2 opacity-60">
                 <Terminal size={12} className="text-gray-400" />
                 <span className="text-gray-300 text-xs font-medium tracking-wide">root@{shellUser.username} — ssh</span>
              </div>

              <div className="w-14"></div> {/* Spacer for centering */}
           </div>

           {/* Terminal Output Area */}
           <div className="flex-1 p-4 overflow-y-auto font-mono text-sm leading-relaxed custom-scrollbar bg-opacity-50">
              <div className="text-gray-500 mb-2 select-none">{t('shellDisclaimer')}</div>
              
              {shellHistory.map((entry, idx) => (
                  <div key={idx} className="mb-1">
                     {entry.cmd && (
                         <div className="flex items-center">
                             <span className="text-green-400 mr-2">➜</span>
                             <span className="text-blue-400 mr-2">root@{shellUser.username}:~#</span> 
                             <span className="text-gray-100 font-bold">{entry.cmd}</span>
                         </div>
                     )}
                     <div className="whitespace-pre-wrap text-gray-300 pl-4 border-l-2 border-transparent hover:border-gray-700 transition-colors">
                        {entry.output}
                     </div>
                  </div>
              ))}

              {/* Input Line */}
              <div className="flex items-center mt-2">
                  <span className="text-green-400 mr-2">➜</span>
                  <span className="text-blue-400 mr-2">root@{shellUser.username}:~#</span>
                  <form onSubmit={handleSendCommand} className="flex-1 relative">
                     <input 
                        ref={shellInputRef}
                        type="text" 
                        value={currentCommand}
                        onChange={(e) => setCurrentCommand(e.target.value)}
                        onKeyDown={handleShellKeyDown}
                        className="w-full bg-transparent border-none outline-none text-gray-100 font-bold p-0 m-0 focus:ring-0 cursor-text"
                        autoComplete="off"
                        spellCheck="false"
                        disabled={isExecutingCmd}
                     />
                     {/* Custom Blinking Cursor Block */}
                     {!isExecutingCmd && (
                         <span 
                            className="absolute pointer-events-none bg-gray-400/50 animate-pulse h-5 w-2.5 top-0" 
                            style={{ left: `${currentCommand.length * 8.5}px` }} // Approx char width
                         ></span>
                     )}
                  </form>
              </div>
              <div ref={shellEndRef} />
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden h-full">
      {/* Header & Tabs */}
      <div className="p-6 pb-0 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
        <div className="flex items-center mb-6">
          <ShieldCheck className="text-brand-500 mr-2" size={24} />
          <h2 className="text-xl font-bold">{t('adminPanel')}</h2>
        </div>
        
        <div className="flex space-x-6">
          <button 
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center ${
              activeTab === 'users' 
              ? 'border-brand-500 text-brand-600 dark:text-brand-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Users size={16} className="mr-2" />
            {t('tabUsers')}
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center ${
              activeTab === 'chat' 
              ? 'border-brand-500 text-brand-600 dark:text-brand-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <MessageSquare size={16} className="mr-2" />
            {t('tabChatLogs')}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-0">
        {activeTab === 'users' ? renderUsersTab() : renderChatTab()}
      </div>
      
      {/* Modals */}
      {renderActivityModal()}
      {renderShellModal()}

      {loading && (
        <div className="p-4 text-center text-gray-400 text-sm">Loading data...</div>
      )}
    </div>
  );
};

export default AdminPanel;
