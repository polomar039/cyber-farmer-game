import React, { useState, useEffect } from 'react';
import { InventoryItem, MarketState, NpcBuyer, CropType } from '../types';
import { NPCS, CROPS } from '../constants';
import { Button } from './Button';
import { TrendingUp, DollarSign, RefreshCw, BarChart2 } from 'lucide-react';
import { soundManager } from '../utils/SoundManager';

interface MarketplaceProps {
  inventory: InventoryItem[];
  marketState: MarketState;
  onSell: (npcId: string, cropType: CropType, itemIds: string[]) => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ inventory, marketState, onSell }) => {
  const aggregatedInventory: Record<CropType, { count: number; itemIds: string[] }> = {
    POTATO: { count: 0, itemIds: [] },
    TOMATO: { count: 0, itemIds: [] },
    PUMPKIN: { count: 0, itemIds: [] },
  };

  inventory.forEach(item => {
    aggregatedInventory[item.cropId].count += item.amount;
    aggregatedInventory[item.cropId].itemIds.push(item.id);
  });

  const calculatePrice = (cropId: CropType, npc: NpcBuyer) => {
    const base = CROPS[cropId].basePrice;
    const trend = marketState.trends[cropId];
    return Math.floor(base * trend * npc.multiplier);
  };

  const handleSellClick = (npcId: string, cropId: CropType, itemIds: string[]) => {
    soundManager.play('sell');
    onSell(npcId, cropId, itemIds);
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-6 bg-slate-900/80 p-3 rounded-lg border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
        <h2 className="text-lg font-bold flex items-center text-purple-400">
          <TrendingUp className="mr-2" /> ТЕНЕВОЙ РЫНОК
        </h2>
        <div className="text-[10px] font-mono text-cyber-neonBlue flex items-center animate-pulse">
          <RefreshCw size={10} className="mr-1 animate-spin-slow" />
          СИНХРОНИЗАЦИЯ...
        </div>
      </div>

      <div className="space-y-6">
        {NPCS.map(npc => (
          <div key={npc.id} className="bg-slate-900/90 border border-slate-700 rounded-xl p-5 shadow-lg relative overflow-hidden group">
            {/* NPC Header */}
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-900 to-slate-800 flex items-center justify-center border border-slate-600">
                    <span className="text-xl font-bold text-purple-300">{npc.name.charAt(0)}</span>
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-100 text-lg leading-tight">{npc.name}</h3>
                    <p className="text-xs text-slate-400 italic">"{npc.description}"</p>
                 </div>
              </div>
              <div className={`px-2 py-1 rounded text-[10px] font-mono font-bold border ${npc.multiplier >= 1 ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-400 border-red-800'}`}>
                RATE: x{npc.multiplier}
              </div>
            </div>

            {/* Selling Options */}
            <div className="space-y-3 relative z-10">
              {(Object.keys(CROPS) as CropType[]).map(cropId => {
                const count = aggregatedInventory[cropId].count;
                if (count === 0) return null;

                const pricePerUnit = calculatePrice(cropId, npc);
                const totalValue = pricePerUnit * count;
                const trend = marketState.trends[cropId];
                const isTrendUp = trend >= 1;

                return (
                  <div key={cropId} className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-slate-700/50 hover:border-purple-500/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl drop-shadow-md">{CROPS[cropId].icon}</span>
                      <div className="flex flex-col">
                         <span className="text-sm font-medium text-slate-200">{CROPS[cropId].name}</span>
                         <span className={`text-[10px] flex items-center ${isTrendUp ? 'text-green-400' : 'text-red-400'}`}>
                           <BarChart2 size={8} className="mr-1" />
                           {(trend * 100).toFixed(0)}%
                         </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                       <div className="text-right">
                         <div className="text-sm font-mono font-bold text-yellow-400">{pricePerUnit} 💰</div>
                         <div className="text-[10px] text-slate-500">За всё: {totalValue}</div>
                       </div>
                       <Button 
                         variant="primary" 
                         className="py-1 px-3 text-xs uppercase tracking-wider bg-purple-600 hover:bg-purple-500 shadow-[0_0_10px_rgba(147,51,234,0.3)] text-white border-none"
                         onClick={() => handleSellClick(npc.id, cropId, aggregatedInventory[cropId].itemIds)}
                       >
                         Продать
                       </Button>
                    </div>
                  </div>
                );
              })}
              {inventory.length === 0 && (
                <div className="text-center text-xs text-slate-600 py-2 font-mono border-t border-slate-800 border-dashed mt-2">
                  НЕТ ТОВАРА
                </div>
              )}
            </div>
            
            {/* Decoration line */}
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-2xl -z-0"></div>
          </div>
        ))}
      </div>
    </div>
  );
};