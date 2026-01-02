
import React, { useEffect, useState, useRef } from 'react';
import { User, ChatMessage, MessageType } from '../types';
import { mockBackend } from '../services/mockBackend';
import { Send, MessageSquare, Mic, ImageIcon, Paperclip, Video, StopCircle, File, Download, UserIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface ChatRoomProps {
  user: User;
  onUserClick?: (userId: string) => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ user, onUserClick }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = mockBackend.subscribeToChat((msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Sending Logic ---

  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    await mockBackend.sendChatMessage(user.id, inputText, 'text');
    setInputText('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: MessageType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB Limit for mock
      alert(t('fileTooLarge'));
      return;
    }

    setIsUploading(true);

    try {
      // Convert to Base64 to simulate storage for the mock
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        await mockBackend.sendChatMessage(user.id, type === 'file' ? file.name : '', type, {
          name: file.name,
          url: base64,
          size: file.size,
          mimeType: file.type
        });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
    
    // Reset Input
    e.target.value = '';
  };

  // --- Voice Recording Logic ---

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            await mockBackend.sendChatMessage(user.id, '', 'audio', {
                name: 'voice_message.webm',
                url: base64,
                size: audioBlob.size,
                mimeType: 'audio/webm'
            });
            setIsUploading(false);
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsUploading(true); // Show loading while processing audio
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- Rendering Helpers ---

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.type === 'image' && msg.attachment) {
      return (
        <div className="space-y-1">
          <img 
            src={msg.attachment.url} 
            alt="Shared" 
            className="max-w-full rounded-lg max-h-[200px] object-cover border border-gray-200 dark:border-gray-600" 
          />
        </div>
      );
    }
    
    if (msg.type === 'video' && msg.attachment) {
        return (
            <div className="space-y-1">
                <video controls className="max-w-full rounded-lg max-h-[200px] bg-black">
                    <source src={msg.attachment.url} type={msg.attachment.mimeType} />
                    Your browser does not support video tag.
                </video>
            </div>
        );
    }

    if (msg.type === 'audio' && msg.attachment) {
        return (
            <div className="min-w-[200px]">
                <audio controls src={msg.attachment.url} className="w-full h-8" />
            </div>
        );
    }

    if (msg.type === 'file' && msg.attachment) {
        return (
            <a 
                href={msg.attachment.url} 
                download={msg.attachment.name}
                className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
            >
                <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded text-brand-600 dark:text-brand-400">
                    <File size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-gray-700 dark:text-gray-200">{msg.attachment.name}</p>
                    <p className="text-[10px] text-gray-500">{(msg.attachment.size / 1024).toFixed(1)} KB</p>
                </div>
                <Download size={16} className="text-gray-400 group-hover:text-brand-500" />
            </a>
        );
    }

    return <p className="text-sm break-words">{msg.content}</p>;
  };

  const Avatar = ({ url, username, onClick }: { url?: string, username: string, onClick?: () => void }) => (
    <div 
        onClick={onClick}
        className={`w-8 h-8 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-700 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-brand-500 transition-all border border-gray-200 dark:border-gray-600 flex items-center justify-center`}
    >
        {url ? (
            <img src={url} alt={username} className="w-full h-full object-cover" />
        ) : (
            <UserIcon size={16} className="text-gray-500 dark:text-gray-400" />
        )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col h-[500px]">
      {/* Hidden Inputs */}
      <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
      <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
      <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} />

      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-dark-card rounded-t-xl z-10">
        <div className="flex items-center space-x-2">
          <MessageSquare className="text-brand-500" size={20} />
          <h3 className="font-bold text-gray-800 dark:text-gray-100">{t('chatRoom')}</h3>
        </div>
        <div className="text-xs text-gray-400 flex items-center space-x-1">
           {isUploading && <span className="text-brand-500 animate-pulse mr-2">{t('uploading')}</span>}
           <span>{t('chatEncrypted')}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
        {messages.map((msg) => {
          const isMe = msg.userId === user.id;
          const isSystem = msg.isSystem;

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <span className="text-[10px] bg-gray-200 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded-full border border-gray-300 dark:border-gray-700">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
              
              {/* Other's Avatar (Left) */}
              {!isMe && (
                  <Avatar 
                    url={msg.userAvatar} 
                    username={msg.username} 
                    onClick={() => onUserClick && onUserClick(msg.userId)} 
                  />
              )}

              <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm ${
                isMe 
                  ? 'bg-brand-500 text-white rounded-br-none' 
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-none'
              }`}>
                {!isMe && (
                  <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 mb-1">
                    {msg.username}
                  </p>
                )}
                
                {renderMessageContent(msg)}

                <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-brand-100' : 'text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

               {/* My Avatar (Right) - Optional, but nice for symmetry */}
               {isMe && (
                   <Avatar 
                    url={user.avatar} 
                    username={user.username} 
                    // No click action for self in this context, or navigate to own profile
                   />
               )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input & Toolbar Area */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card rounded-b-xl">
        {/* Toolbar */}
        <div className="flex items-center space-x-1 mb-2 px-2">
            <button onClick={() => imageInputRef.current?.click()} className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="Send Image">
                <ImageIcon size={18} />
            </button>
            <button onClick={() => videoInputRef.current?.click()} className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="Send Video">
                <Video size={18} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="Send File">
                <Paperclip size={18} />
            </button>
        </div>

        {/* Text Input Row */}
        <div className="flex items-center space-x-2">
            {isRecording ? (
                <div className="flex-1 flex items-center justify-between bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg border border-red-200 dark:border-red-900/50">
                    <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">{t('recording')}</span>
                    </div>
                    <button 
                        onClick={stopRecording}
                        className="text-xs bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 px-3 py-1 rounded shadow-sm hover:shadow"
                    >
                        {t('releaseToSend')}
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSendText} className="flex-1 flex space-x-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={t('chatPlaceholder')}
                        disabled={isUploading}
                        className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white transition-all"
                    />
                </form>
            )}

            {!isRecording && !inputText.trim() && !isUploading ? (
                 <button 
                    onClick={startRecording}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 dark:hover:text-red-400 rounded-full transition-colors"
                    title="Record Voice"
                 >
                     <Mic size={20} />
                 </button>
            ) : (
                <button 
                    onClick={(e) => handleSendText(e as any)} 
                    disabled={!inputText.trim() || isUploading || isRecording}
                    className="bg-brand-500 hover:bg-brand-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand-500/20"
                >
                    <Send size={18} />
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
