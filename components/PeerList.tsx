import React, { useEffect, useState } from 'react';
import { Peer, PeerStatus } from '../types';
import { webrtcManager } from '../services/webrtcManager';
import { Server } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

const PeerList: React.FC = () => {
  const [peers, setPeers] = useState<Peer[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    const unsub = webrtcManager.subscribe((updatedPeers) => {
      setPeers(updatedPeers);
    });
    return () => unsub();
  }, []);

  return (
    <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center">
            <Server className="mr-2 w-5 h-5 text-brand-500" />
            {t('connectedPeers')}
            </h3>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="text-gray-400 border-b border-gray-200 dark:border-gray-700 text-sm">
                <th className="py-3 font-medium">{t('deviceName')}</th>
                <th className="py-3 font-medium">{t('type')}</th>
                <th className="py-3 font-medium">{t('virtualIp')}</th>
                <th className="py-3 font-medium">{t('latency')}</th>
                <th className="py-3 font-medium">{t('status')}</th>
                </tr>
            </thead>
            <tbody className="text-sm">
                {peers.map((peer) => (
                <tr key={peer.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 font-medium">{peer.name}</td>
                    <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs ${peer.type === 'agent' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                        {peer.type === 'agent' ? t('agent') : t('browser')}
                    </span>
                    </td>
                    <td className="py-3 font-mono text-gray-500 dark:text-gray-400">{peer.ip}</td>
                    <td className="py-3">
                    {peer.status === PeerStatus.CONNECTED ? (
                        <span className={`${peer.latency < 50 ? 'text-green-500' : 'text-yellow-500'}`}>
                        {peer.latency}ms
                        </span>
                    ) : '-'}
                    </td>
                    <td className="py-3">
                    <span className={`flex items-center space-x-1 ${
                        peer.status === PeerStatus.CONNECTED ? 'text-green-500' : 
                        peer.status === PeerStatus.CONNECTING ? 'text-yellow-500' : 'text-gray-400'
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${
                        peer.status === PeerStatus.CONNECTED ? 'bg-green-500' : 
                        peer.status === PeerStatus.CONNECTING ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'
                        }`}></span>
                        <span>{peer.status}</span>
                    </span>
                    </td>
                </tr>
                ))}
                {peers.length === 0 && (
                <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                    {t('noPeers')}
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
    </div>
  );
};

export default PeerList;
