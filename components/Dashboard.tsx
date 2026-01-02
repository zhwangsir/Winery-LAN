
import React, { useEffect, useState } from 'react';
import JSZip from 'jszip';
import { webrtcManager } from '../services/webrtcManager';
import { mockBackend } from '../services/mockBackend';
import { Peer, PeerStatus, NetworkLog, User } from '../types';
import NetworkGraph from './NetworkGraph';
import { Wifi, WifiOff, Activity, ShieldCheck, Download, Cpu, Globe, Server, Settings } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { PACKAGE_JSON, MAIN_JS, PRELOAD_JS, INDEX_HTML, RENDERER_JS, ELECTRON_README, BUILD_BAT } from '../utils/electronTemplate';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [logs, setLogs] = useState<NetworkLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [virtualIP, setVirtualIP] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const { t } = useLanguage();

  const canBuildClient = user.permissions.includes('build_client');
  const canViewAdminLogs = user.permissions.includes('view_admin_logs');

  useEffect(() => {
    const unsubPeers = webrtcManager.subscribe((updatedPeers) => {
      setPeers(updatedPeers);
      const connected = updatedPeers.some(p => p.status === PeerStatus.CONNECTED);
      setIsConnected(connected);
      if (connected && !virtualIP) {
        setVirtualIP(`10.24.0.${Math.floor(Math.random() * 200) + 10}`);
      } else if (!connected) {
        setVirtualIP(null);
      }
    });

    // Poll logs
    const logInterval = setInterval(() => {
      setLogs([...mockBackend.getLogs()]);
    }, 1000);

    return () => {
      unsubPeers();
      clearInterval(logInterval);
    };
  }, [virtualIP]);

  const handleToggleConnection = () => {
    if (isConnected) {
      webrtcManager.disconnectFromMesh();
    } else {
      webrtcManager.connectToMesh();
    }
  };

  const handleDownloadAdminKit = async () => {
    try {
      setIsZipping(true);
      mockBackend.addLog('Generating Builder Kit...', 'info');

      const zip = new JSZip();
      
      // Root files
      zip.file("package.json", PACKAGE_JSON);
      zip.file("README_BUILD_GUIDE.md", ELECTRON_README);
      zip.file("build.bat", BUILD_BAT); // The magic script
      
      // Source files
      const src = zip.folder("src");
      if (src) {
        src.file("main.js", MAIN_JS);
        src.file("preload.js", PRELOAD_JS);
        src.file("index.html", INDEX_HTML);
        src.file("renderer.js", RENDERER_JS);
      }
      
      zip.folder("assets");

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'winerylan-builder-kit.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      mockBackend.addLog('Builder kit downloaded. Run build.bat locally.', 'success');
    } catch (e) {
      console.error(e);
      mockBackend.addLog('Failed to generate kit.', 'error');
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadExe = () => {
     // In a real app, this points to the file uploaded by admin
     const link = document.createElement('a');
     link.href = '/download/winerylan.exe'; // The path we told admin to upload to
     link.download = 'winerylan.exe';
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     
     mockBackend.addLog('Attempting to download Client EXE...', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center space-x-4">
          <div className={`p-3 rounded-full ${isConnected ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {isConnected ? <Wifi size={24} /> : <WifiOff size={24} />}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('status')}</p>
            <p className="text-lg font-bold">{isConnected ? t('online') : t('offline')}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Globe size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('virtualIp')}</p>
            <p className="text-lg font-bold font-mono">{virtualIP || '---'}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('latency')}</p>
            <p className="text-lg font-bold">
              {isConnected 
                ? `${Math.round(peers.reduce((acc, p) => acc + p.latency, 0) / (peers.filter(p => p.latency > 0).length || 1))} ms` 
                : '--'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('encryption')}</p>
            <p className="text-lg font-bold">AES-256</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Network & Controls */}
        <div className="xl:col-span-2 space-y-6">
          {/* Traffic Graph */}
          <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="mr-2 w-5 h-5 text-brand-500" />
              {t('networkTraffic')}
            </h3>
            <NetworkGraph />
          </div>

          {/* Connection Control */}
          <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <div>
                  <h3 className="text-lg font-semibold">{t('joinNet')}</h3>
                  <p className="text-sm text-gray-500">Connect to the mesh to access peers and resources.</p>
              </div>
              <button 
                onClick={handleToggleConnection}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isConnected 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' 
                    : 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/30 animate-pulse-slow'
                }`}
              >
                {isConnected ? t('disconnectNet') : t('joinNet')}
              </button>
          </div>
        </div>

        {/* Right Column: Download & Logs */}
        <div className="space-y-6">
          
          {/* Smart Download Section */}
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-6 rounded-xl text-white shadow-lg relative overflow-hidden">
            {/* Permission Based Badge */}
            {canBuildClient && (
              <div className="absolute top-3 right-3 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded">
                ADMIN ACCESS
              </div>
            )}
            
            <div className="flex items-start justify-between relative z-10">
              <div>
                <h3 className="font-bold text-lg mb-1">{t('downloadAgent')}</h3>
                <p className="text-brand-100 text-sm mb-4">
                  {canBuildClient ? t('agentDescAdmin') : t('agentDescUser')}
                </p>
              </div>
              {!canBuildClient && <Cpu className="opacity-50" />}
              {canBuildClient && <Settings className="opacity-50 animate-spin-slow" />}
            </div>
            
            <button 
              onClick={canBuildClient ? handleDownloadAdminKit : handleDownloadExe}
              disabled={isZipping}
              className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors active:scale-95 transform disabled:opacity-70 disabled:cursor-not-allowed ${
                canBuildClient 
                ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300' 
                : 'bg-white text-brand-700 hover:bg-gray-100'
              }`}
            >
              {isZipping ? (
                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-700"></div>
              ) : (
                <>
                  {canBuildClient ? <Settings size={18} /> : <Download size={18} />}
                  <span>{canBuildClient ? t('downloadBtnAdmin') : t('downloadBtnUser')}</span>
                </>
              )}
            </button>
          </div>

          {/* System Logs */}
          <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 h-[250px] flex flex-col">
             <h3 className="text-md font-semibold mb-3 flex items-center text-gray-700 dark:text-gray-200">
              <Server className="mr-2 w-4 h-4" />
              {t('liveLogs')}
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs pr-2">
              {logs.map((log) => {
                 // Hide detailed admin logs for normal users
                 if (log.severity === 'warning' && !canViewAdminLogs) return null;
                 return (
                  <div key={log.id} className="flex space-x-2">
                    <span className="text-gray-400">[{log.timestamp.split('T')[1].split('.')[0]}]</span>
                    <span className={`${
                      log.severity === 'error' ? 'text-red-500' :
                      log.severity === 'success' ? 'text-green-500' :
                      log.severity === 'warning' ? 'text-yellow-500' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {log.event}
                    </span>
                  </div>
                 );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
