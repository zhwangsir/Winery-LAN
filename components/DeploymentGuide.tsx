
import React, { useState } from 'react';
import { Terminal, Server, ShieldCheck, FileText, Lock, Copy, CheckCircle, ChevronRight, Check, Globe, Settings, AlertTriangle } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

const CodeBlock: React.FC<{ code: string; label?: string; highlight?: boolean }> = ({ code, label, highlight }) => {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative mt-2 mb-4 group ${highlight ? 'ring-2 ring-brand-500 rounded-lg' : ''}`}>
      {label && <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1 flex justify-between">
          <span>{label}</span>
          {highlight && <span className="text-brand-500 text-[10px] animate-pulse">Modified Config Required</span>}
      </div>}
      <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-lg">
        <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
           <div className="flex space-x-1.5">
             <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
           </div>
           <button 
             onClick={handleCopy}
             className="text-gray-400 hover:text-white transition-colors flex items-center space-x-1 text-xs"
           >
             {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
             <span>{copied ? t('copied') : t('copy')}</span>
           </button>
        </div>
        <div className="p-4 overflow-x-auto">
          <pre className="text-sm font-mono text-gray-300 leading-relaxed whitespace-pre">
            {code}
          </pre>
        </div>
      </div>
    </div>
  );
};

const StepCard: React.FC<{ 
  number: number; 
  title: string; 
  description: string; 
  icon: any; 
  children: React.ReactNode 
}> = ({ number, title, description, icon: Icon, children }) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-lg shadow-sm border border-brand-200 dark:border-brand-800 shrink-0">
        {number}
      </div>
      <div className="w-0.5 bg-gray-200 dark:bg-gray-700 h-full mt-2"></div>
    </div>
    <div className="pb-12 flex-1 min-w-0">
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Icon size={20} className="text-brand-500" />
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  </div>
);

const DeploymentGuide: React.FC = () => {
  // Assuming this is the server IP, but in the guide text we ask users to replace it.
  const PLACEHOLDER_IP = "8.140.222.24"; 
  const { t } = useLanguage();

  const STEPS = {
    config: `// file: config.ts
export const SERVER_CONFIG = {
  // Replace ${PLACEHOLDER_IP} with your actual Public IP
  API_URL: 'http://${PLACEHOLDER_IP}:3000',
  SOCKET_URL: 'http://${PLACEHOLDER_IP}:3000',
  TURN_SERVER: 'turn:${PLACEHOLDER_IP}:3478',
  TURN_USER: 'winery',
  TURN_PASS: 'winery_secret_password'
};`,
    backend: `# 1. Upload the 'server' folder to /www/wwwroot/winerylan-backend
cd /www/wwwroot/winerylan-backend

# 2. Install Dependencies
npm install

# 3. Start with PM2
npm install -g pm2
pm2 start index.js --name winery-server
pm2 save
pm2 startup`,
    coturn: `# Replace ${PLACEHOLDER_IP} with your Public IP
docker run -d --network=host --name=coturn instrumentisto/coturn \\
  -n --log-file=stdout \\
  --min-port=49152 --max-port=65535 \\
  --realm=${PLACEHOLDER_IP} --listening-port=3478 \\
  --external-ip=${PLACEHOLDER_IP} \\
  --user=winery:winery_secret_password \\
  --lt-cred-mech`,
    build: `# On your LOCAL machine:
npm run build

# Then upload the 'dist' folder content to:
# /www/wwwroot/winerylan-frontend`,
    nginx: `server {
    listen 80;
    server_name ${PLACEHOLDER_IP} _; # Or your domain

    # Frontend Static Files
    location / {
        root /www/wwwroot/winerylan-frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Socket.io WebSocket Proxy (Critical)
    location /socket.io {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}`
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{t('guideTitle')}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('guideSubtitle')}
        </p>
      </div>

      {/* Prerequisites */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex items-start space-x-3">
              <Server className="text-blue-500 shrink-0" size={20} />
              <div>
                  <h4 className="font-bold text-sm text-blue-900 dark:text-blue-200">Server</h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">{t('prereq1')}</p>
              </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800 flex items-start space-x-3">
              <Settings className="text-green-500 shrink-0" size={20} />
              <div>
                  <h4 className="font-bold text-sm text-green-900 dark:text-green-200">Panel</h4>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">{t('prereq2')}</p>
              </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800 flex items-start space-x-3">
              <Terminal className="text-purple-500 shrink-0" size={20} />
              <div>
                  <h4 className="font-bold text-sm text-purple-900 dark:text-purple-200">Software</h4>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">{t('prereq3')}</p>
              </div>
          </div>
      </div>

      <div className="mt-8">
        {/* Step 1: Config */}
        <StepCard 
          number={1} 
          title={t('stepConfigTitle')} 
          description={t('stepConfigDesc')}
          icon={Settings}
        >
           <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
             Before you build the frontend, you <strong>must</strong> update the API and TURN server addresses to match your new server IP.
           </p>
           <CodeBlock code={STEPS.config} label="src/config.ts" highlight={true} />
        </StepCard>

        {/* Step 2: Backend */}
        <StepCard 
          number={2} 
          title={t('stepBackendTitle')} 
          description={t('stepBackendDesc')}
          icon={Server}
        >
           <CodeBlock code={STEPS.backend} label="Baota Terminal (SSH)" />
        </StepCard>

        {/* Step 3: Coturn */}
        <StepCard 
          number={3} 
          title={t('stepCoturnTitle')} 
          description={t('stepCoturnDesc')}
          icon={Globe}
        >
          <div className="flex items-start space-x-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg mb-3">
             <AlertTriangle size={18} className="shrink-0" />
             <p>Make sure to replace <strong>{PLACEHOLDER_IP}</strong> with your actual server IP in the command below!</p>
          </div>
          <CodeBlock code={STEPS.coturn} label="Docker Command" />
        </StepCard>

        {/* Step 4: Frontend & Nginx */}
        <StepCard 
          number={4} 
          title={t('stepFrontendTitle')} 
          description={t('stepFrontendDesc')}
          icon={FileText}
        >
          <div className="space-y-4">
             <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Part A: Local Build</span>
                <CodeBlock code={STEPS.build} label="Local Terminal" />
             </div>
             
             <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Part B: Nginx Config (Baota Site Config)</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                   Paste this into your site's Configuration file in Baota Panel.
                </p>
                <CodeBlock code={STEPS.nginx} label="Nginx Config" />
             </div>
          </div>
        </StepCard>

        {/* Step 5: Firewall */}
        <StepCard 
          number={5} 
          title={t('stepFirewallTitle')} 
          description={t('stepFirewallDesc')}
          icon={ShieldCheck}
        >
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-sm mb-2">{t('portsDesc')}</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded font-mono border border-green-200 dark:border-green-800">
                  TCP 80 / 443 (Web)
              </span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded font-mono border border-blue-200 dark:border-blue-800">
                  TCP 3000 (API Internal/External)
              </span>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded font-mono border border-purple-200 dark:border-purple-800">
                  TCP/UDP 3478 (TURN)
              </span>
              <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded font-mono border border-orange-200 dark:border-orange-800">
                  UDP 49152-65535 (Media Stream)
              </span>
            </div>
          </div>
          
          <div className="mt-4 flex items-start space-x-3 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
             <div className="mt-0.5"><Lock size={16} className="text-blue-500" /></div>
             <p>{t('safetyNote')}</p>
          </div>
        </StepCard>
      </div>
    </div>
  );
};

export default DeploymentGuide;
