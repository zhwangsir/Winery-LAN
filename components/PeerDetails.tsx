
import React from 'react';
import { User } from '../types';
import { ArrowLeft, UserIcon, Mail, MapPin, Calendar, Server } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface PeerDetailsProps {
  peer: User;
  onBack: () => void;
}

const PeerDetails: React.FC<PeerDetailsProps> = ({ peer, onBack }) => {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <button 
        onClick={onBack}
        className="flex items-center text-gray-500 hover:text-brand-500 transition-colors font-medium mb-4 group"
      >
        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Chat
      </button>

      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Banner/Header */}
        <div className="h-32 bg-gradient-to-r from-brand-500 to-purple-600"></div>
        
        <div className="px-8 pb-8">
           <div className="relative flex justify-between items-end -mt-12 mb-6">
              <div className="relative">
                 <div className="w-24 h-24 rounded-full border-4 border-white dark:border-dark-card bg-gray-200 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
                    {peer.avatar ? (
                        <img src={peer.avatar} alt={peer.username} className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon size={40} className="text-gray-400" />
                    )}
                 </div>
                 <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-dark-card rounded-full" title="Online"></div>
              </div>
           </div>

           <div className="space-y-6">
              <div>
                 <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                   {peer.username}
                   <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full font-normal text-gray-500 uppercase border border-gray-200 dark:border-gray-700">
                     {peer.role}
                   </span>
                 </h1>
                 <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl">
                    {peer.bio || "No bio available."}
                 </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                      <Mail size={18} className="mr-3 text-brand-500" />
                      <div className="flex flex-col">
                         <span className="text-[10px] text-gray-400 uppercase font-bold">{t('email')}</span>
                         <span>{peer.email || 'Hidden'}</span>
                      </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                      <MapPin size={18} className="mr-3 text-brand-500" />
                      <div className="flex flex-col">
                         <span className="text-[10px] text-gray-400 uppercase font-bold">{t('location')}</span>
                         <span>{peer.location || 'Unknown'}</span>
                      </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                      <Calendar size={18} className="mr-3 text-brand-500" />
                      <div className="flex flex-col">
                         <span className="text-[10px] text-gray-400 uppercase font-bold">{t('joined')}</span>
                         <span>{new Date().toLocaleDateString()}</span>
                      </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                      <Server size={18} className="mr-3 text-brand-500" />
                      <div className="flex flex-col">
                         <span className="text-[10px] text-gray-400 uppercase font-bold">Virtual IP</span>
                         <span className="font-mono">{peer.ipAddress || '10.24.0.xxx'}</span>
                      </div>
                  </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PeerDetails;
