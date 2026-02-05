import React from 'react';
import { Tab } from '../types';
import { Sprout, Package, TrendingUp, ShoppingCart } from 'lucide-react';
import { soundManager } from '../utils/SoundManager';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  inventoryCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, inventoryCount }) => {
  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'FARM', label: 'Ферма', icon: <Sprout size={20} /> },
    { id: 'INVENTORY', label: 'Склад', icon: <Package size={20} /> },
    { id: 'MARKET', label: 'Рынок', icon: <TrendingUp size={20} /> },
    { id: 'SHOP', label: 'Шоп', icon: <ShoppingCart size={20} /> },
  ];

  const handleTabClick = (tab: Tab) => {
    soundManager.play('tab');
    onTabChange(tab);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-cyber-dark/95 backdrop-blur border-t border-slate-700 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full relative transition-colors ${
                isActive ? 'text-cyber-primary' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {item.id === 'INVENTORY' && inventoryCount > 0 && (
                 <span className="absolute top-2 right-6 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                   {Math.min(99, inventoryCount)}
                 </span>
              )}
              <div className={`mb-1 transition-transform ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};