import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrafficPoint } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const NetworkGraph: React.FC = () => {
  const [data, setData] = useState<TrafficPoint[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    // Initial data
    const initialData: TrafficPoint[] = Array.from({ length: 10 }).map((_, i) => ({
      time: `00:0${i}`,
      upload: 0,
      download: 0,
    }));
    setData(initialData);

    const interval = setInterval(() => {
      setData(prev => {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        const newPoint = {
          time: timeStr,
          upload: Math.floor(Math.random() * 300) + 50,
          download: Math.floor(Math.random() * 800) + 100,
        };
        return [...prev.slice(1), newPoint];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis dataKey="time" stroke="#94a3b8" tick={{fontSize: 12}} />
          <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
            itemStyle={{ color: '#f8fafc' }}
          />
          <Area 
            type="monotone" 
            dataKey="download" 
            stroke="#0ea5e9" 
            fillOpacity={1} 
            fill="url(#colorDown)" 
            name={`${t('download')} (KB/s)`}
          />
          <Area 
            type="monotone" 
            dataKey="upload" 
            stroke="#8b5cf6" 
            fillOpacity={1} 
            fill="url(#colorUp)" 
            name={`${t('upload')} (KB/s)`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NetworkGraph;