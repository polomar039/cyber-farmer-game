import React from 'react';
import { UserState } from '../types';
import { Zap, Coins, Cpu } from 'lucide-react';

interface HeaderProps {
  user: UserState;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const energyPercent = (user.energy / user.maxEnergy) * 100;

  return (
    <div className="bg-cyber-black/70 backdrop-blur-lg p-4 sticky top-0 z-50 border-b border-cyber-primary/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-3">
          {/* Balance Display */}
          <div className="flex items-center space-x-2 bg-black/40 px-3 py-1.5 rounded-full border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
            <div className="p-1.5 bg-yellow-500/20 rounded-full animate-pulse-fast">
              <Coins size={16} className="text-yellow-400" />
            </div>
            <span className="text-xl font-mono font-bold text-yellow-100 tracking-wider shadow-black drop-shadow-md">
              {Math.floor(user.balance)}
            </span>
          </div>

          {/* Title / Version */}
          <div className="flex items-center text-[10px] text-cyber-neonBlue font-mono tracking-widest uppercase opacity-80">
            <Cpu size={12} className="mr-1" />
            SYS.V.1.0
          </div>
        </div>

        {/* Energy Bar HUD */}
        <div className="relative w-full h-3 bg-slate-900/80 rounded-sm overflow-hidden border border-slate-700/50 skew-x-[-10deg]">
          {/* Background Grid inside bar */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          
          <div 
            className="h-full bg-gradient-to-r from-cyber-primary/60 via-cyber-primary to-cyber-neonBlue transition-all duration-300 ease-out relative"
            style={{ width: `${energyPercent}%` }}
          >
             {/* Glare effect */}
             <div className="absolute top-0 right-0 w-1 h-full bg-white/50 blur-[1px]"></div>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow-md tracking-widest z-10 skew-x-[10deg]">
            <Zap size={8} className="mr-1 inline fill-cyan-300 text-cyan-300" />
            {Math.floor(user.energy)} / {user.maxEnergy}
          </div>
        </div>
      </div>
    </div>
  );
};