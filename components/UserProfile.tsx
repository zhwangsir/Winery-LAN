import React, { useState, useRef } from 'react';
import { User } from '../types';
import { mockBackend } from '../services/mockBackend';
import { Camera, Save, UserIcon, Mail, MapPin, Calendar, Lock } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface UserProfileProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [bio, setBio] = useState(user.bio || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { t } = useLanguage();

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image too large. Max 2MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        setLoading(true);
        const base64 = reader.result as string;
        try {
          // Simulate API call
          const updated = await mockBackend.updateUserProfile(user.username, { avatar: base64 });
          onUpdate(updated);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
       const updates: any = { bio };
       if (currentPassword && newPassword) {
           // In a real app, verify current password first
           updates.passwordHash = newPassword; // Mock logic
       }
       const updated = await mockBackend.updateUserProfile(user.username, updates);
       onUpdate(updated);
       setCurrentPassword('');
       setNewPassword('');
       alert("Profile saved successfully!");
    } catch (err) {
       console.error(err);
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold mb-2">{t('profileTitle')}</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">{t('profileSubtitle')}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar Card */}
        <div className="md:col-span-1">
           <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center text-center">
              <div className="relative group cursor-pointer mb-4" onClick={handleAvatarClick}>
                 <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700 bg-gray-200 dark:bg-gray-800">
                    {user.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <UserIcon size={64} />
                        </div>
                    )}
                 </div>
                 {/* Overlay */}
                 <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={24} />
                 </div>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   accept="image/png, image/jpeg, image/gif" 
                   onChange={handleFileChange} 
                 />
              </div>
              
              <h2 className="text-xl font-bold">{user.username}</h2>
              <span className="px-2 py-0.5 mt-2 text-xs font-semibold bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full uppercase">
                  {user.role}
              </span>
              
              <div className="mt-6 w-full space-y-3 text-left">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Mail size={16} className="mr-3 text-gray-400" />
                      <span className="truncate">{user.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MapPin size={16} className="mr-3 text-gray-400" />
                      <span>{user.location || 'Unknown Location'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar size={16} className="mr-3 text-gray-400" />
                      <span>Joined {new Date(user.id.includes('user-') ? Date.now() : 1700000000000).toLocaleDateString()}</span>
                  </div>
              </div>
           </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="md:col-span-2 space-y-6">
            <form onSubmit={handleSaveProfile} className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                    <UserIcon size={20} className="mr-2 text-brand-500" />
                    {t('personalInfo')}
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('username')}</label>
                        <input 
                           type="text" 
                           value={user.username} 
                           disabled 
                           className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bio')}</label>
                        <textarea 
                           rows={3}
                           value={bio}
                           onChange={(e) => setBio(e.target.value)}
                           className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none"
                        ></textarea>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-4 flex items-center">
                        <Lock size={20} className="mr-2 text-brand-500" />
                        {t('security')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('currentPassword')}</label>
                            <input 
                               type="password" 
                               value={currentPassword}
                               onChange={(e) => setCurrentPassword(e.target.value)}
                               className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('newPassword')}</label>
                            <input 
                               type="password" 
                               value={newPassword}
                               onChange={(e) => setNewPassword(e.target.value)}
                               className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-medium flex items-center transition-all shadow-lg shadow-brand-500/30"
                    >
                        {loading ? t('saving') : (
                            <>
                                <Save size={18} className="mr-2" />
                                {t('updateProfile')}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>

      </div>
    </div>
  );
};

export default UserProfile;