import React, { useEffect, useState } from 'react';
import { InventoryItem } from '../types';
import { CROPS } from '../constants';
import { Package, AlertTriangle, Clock, Info } from 'lucide-react';

interface InventoryListProps {
  items: InventoryItem[];
}

export const InventoryList: React.FC<InventoryListProps> = ({ items }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 animate-pulse">
        <div className="p-6 bg-slate-900/50 rounded-full mb-4 border border-slate-800">
           <Package size={48} className="opacity-50 text-cyber-neonBlue" />
        </div>
        <p className="text-lg font-mono text-cyber-muted">СКЛАД ПУСТ</p>
        <p className="text-xs mt-2 text-slate-600">Система ожидает поступления ресурсов...</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      <h2 className="text-xl font-bold mb-4 flex items-center text-cyber-neonBlue drop-shadow-md">
        <Package className="mr-2" /> Крио-Склад
      </h2>
      
      {items.map((item) => {
        const crop = CROPS[item.cropId];
        const timeLeftMs = item.expiresAt - now;
        const timeLeftSec = Math.max(0, Math.floor(timeLeftMs / 1000));
        
        const isUrgent = timeLeftSec < 60; 
        const urgencyColor = isUrgent ? 'text-red-400' : 'text-cyan-400';
        const progressPercent = Math.max(0, Math.min(100, (timeLeftMs / crop.shelfLifeMs) * 100));

        const formatTime = (sec: number) => {
          if (sec > 3600) return `${Math.floor(sec / 3600)}ч`;
          if (sec > 60) return `${Math.floor(sec / 60)}м`;
          return `${sec}с`;
        };

        return (
          <div key={item.id} className="bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg relative overflow-hidden group hover:border-cyber-primary/40 transition-colors">
            {/* Status Indicator Stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isUrgent ? 'bg-red-500 animate-pulse' : 'bg-cyan-500'}`}></div>

            <div className="p-4 pl-5 flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-4">
                <div className="text-3xl bg-black/40 p-2 rounded-lg border border-slate-700/50 shadow-inner">
                  {crop.icon}
                </div>
                <div>
                  <div className="font-bold text-gray-200 text-lg">{crop.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest flex items-center">
                    ID: {item.id.slice(0,6)}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-2xl font-bold text-white font-mono tracking-tight">x{item.amount}</span>
                <div className={`flex items-center text-xs font-mono mt-1 ${urgencyColor} bg-black/30 px-2 py-0.5 rounded-md`}>
                  {isUrgent ? <AlertTriangle size={10} className="mr-1 animate-bounce" /> : <Clock size={10} className="mr-1" />}
                  {formatTime(timeLeftSec)}
                </div>
              </div>
            </div>

            {/* Decay Progress Bar Background */}
            <div className="absolute bottom-0 left-1 right-0 h-1 bg-slate-800">
              <div 
                className={`h-full transition-all duration-1000 ${isUrgent ? 'bg-red-600' : 'bg-cyan-600'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};