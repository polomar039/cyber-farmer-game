import React, { useState, useEffect } from 'react';
import { Plot, CropType } from '../types';
import { CROPS } from '../constants';
import { Button } from './Button';
import { Sprout, CheckCircle, Lock, Zap } from 'lucide-react';
import { soundManager } from '../utils/SoundManager';

interface FarmGridProps {
  plots: Plot[];
  onPlant: (plotId: string, crop: CropType) => void;
  onHarvest: (plotId: string) => void;
  onBuyPlot: (plotId: string) => void;
}

const getGlowColor = (crop: CropType) => {
  switch (crop) {
    case 'TOMATO': return '#ef4444'; // Red-500
    case 'POTATO': return '#eab308'; // Yellow-500
    case 'PUMPKIN': return '#f97316'; // Orange-500
    default: return '#10b981'; // Primary
  }
};

export const FarmGrid: React.FC<FarmGridProps> = ({ plots, onPlant, onHarvest, onBuyPlot }) => {
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 50); // Faster update for smooth animation (50ms)
    return () => clearInterval(interval);
  }, []);

  const handlePlotClick = (plot: Plot) => {
    if (!plot.isUnlocked) {
      soundManager.play('error');
      return; 
    }

    if (plot.crop) {
      const cropConfig = CROPS[plot.crop];
      const isReady = plot.plantedAt && (now - plot.plantedAt >= cropConfig.growthTimeMs);
      if (isReady) {
        soundManager.play('harvest');
        onHarvest(plot.id);
      } else {
        // Optional: Play a "growing" sound
      }
    } else {
      soundManager.play('click');
      setSelectedPlotId(plot.id);
    }
  };

  const handlePlantConfirm = (cropKey: CropType) => {
    soundManager.play('plant');
    onPlant(selectedPlotId!, cropKey);
    setSelectedPlotId(null);
  }

  const renderPlotContent = (plot: Plot) => {
    if (!plot.isUnlocked) {
      return (
        <div className="flex flex-col items-center opacity-40">
          <Lock className="text-red-500 mb-1" size={20} />
          <span className="text-[10px] font-mono text-red-500">LOCKED</span>
        </div>
      );
    }

    if (!plot.crop) {
      return (
        <div className="group-hover:scale-110 transition-transform duration-300">
           <div className="w-10 h-10 rounded-full border-2 border-dashed border-cyber-primary/30 flex items-center justify-center text-cyber-primary/50 group-hover:border-cyber-primary group-hover:text-cyber-primary bg-slate-900/50">
             <span className="text-xl font-bold">+</span>
           </div>
        </div>
      );
    }

    const config = CROPS[plot.crop];
    const elapsed = now - (plot.plantedAt || 0);
    const progressPercent = Math.min(100, (elapsed / config.growthTimeMs) * 100);
    const isReady = progressPercent >= 100;
    const glowColor = getGlowColor(plot.crop);

    // Dynamic styles for growth animation
    const growthStyle = {
      transform: `scale(${isReady ? 1.1 : 0.4 + (0.7 * progressPercent / 100)}) translateY(${isReady ? 0 : (100 - progressPercent) * 0.1}px)`,
      opacity: isReady ? 1 : 0.3 + (0.7 * progressPercent / 100),
      filter: isReady 
        ? `drop-shadow(0 0 15px ${glowColor})` 
        : `grayscale(${100 - progressPercent}%) opacity(${50 + progressPercent/2}%) drop-shadow(0 0 ${progressPercent/8}px ${glowColor})`,
      transition: 'all 0.3s ease-out'
    };

    return (
      <div className="flex flex-col items-center justify-center w-full h-full relative z-10 overflow-hidden">
        
        {/* Holographic Grid Floor */}
        <div className="absolute bottom-0 w-full h-1/3 bg-[linear-gradient(transparent_0%,rgba(6,182,212,0.1)_100%)] pointer-events-none"></div>

        {/* Cyberpunk Aura (Behind crop) */}
        {!isReady && (
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none mix-blend-screen"
            style={{
              width: `${50 + (progressPercent * 0.5)}%`,
              height: `${50 + (progressPercent * 0.5)}%`,
              background: `radial-gradient(circle, ${glowColor}40 0%, transparent 70%)`,
              opacity: 0.3 + (Math.sin(now / 300) * 0.2), // Fast pulse
              filter: 'blur(8px)',
              zIndex: 5
            }}
          />
        )}

        {/* Holographic Beam */}
        {!isReady && (
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent pointer-events-none"
            style={{ opacity: 0.3 + Math.sin(now / 200) * 0.1 }} 
          ></div>
        )}
        
        {/* Scanning Laser Line with Cyber Particles */}
        {!isReady && (
           <div 
             className="absolute left-0 w-full flex items-center justify-center pointer-events-none transition-all duration-75 z-20"
             style={{ 
               // Map progress directly to height (0% -> 100%) to match timer
               bottom: `${progressPercent}%`, 
               height: '2px', 
               transform: 'translateY(50%)' 
             }}
           >
             {/* The horizontal line base */}
             <div 
                className="absolute w-full h-full shadow-[0_0_8px_currentColor,0_0_4px_#fff]"
                style={{ backgroundColor: glowColor, color: glowColor }}
             ></div>

             {/* Cyber Glitch Particles */}
             <div className="absolute top-1/2 left-0 w-full h-24 overflow-hidden pointer-events-none -translate-y-[1px]">
                 {[...Array(8)].map((_, i) => {
                   const left = (i * 137.5) % 90 + 5; 
                   const delay = (i * 0.15) % 1.5; 
                   const duration = 0.8 + ((i * 0.2) % 0.5);
                   const width = i % 2 === 0 ? '2px' : '1px';
                   const height = i % 2 === 0 ? '6px' : '4px';
                   
                   return (
                     <div 
                       key={i}
                       className="absolute opacity-0 animate-fall rounded-none"
                       style={{ 
                         backgroundColor: glowColor,
                         left: `${left}%`,
                         width: width, 
                         height: height,
                         animationDelay: `${delay}s`,
                         animationDuration: `${duration}s`,
                         boxShadow: `0 0 4px ${glowColor}`
                       }}
                     ></div>
                   )
                 })}
             </div>
           </div>
        )}

        {/* The Crop Icon */}
        <div 
          className={`text-4xl mb-2 select-none relative z-10 ${isReady ? 'animate-bounce' : ''}`}
          style={growthStyle}
        >
          {config.icon}
        </div>
        
        {/* Ready Badge */}
        {isReady ? (
          <div className="absolute top-2 right-2 bg-cyber-black rounded-full p-0.5 animate-pulse border border-cyber-primary shadow-[0_0_10px_rgba(16,185,129,0.5)] z-20">
             <CheckCircle size={14} className="text-cyber-primary fill-green-900" />
          </div>
        ) : (
          /* Time remaining */
          <div className="mt-4 px-2 py-0.5 bg-black/60 rounded border border-cyan-500/30 backdrop-blur-sm relative z-20 shadow-lg">
            <span className="text-[10px] font-mono tracking-tighter text-cyan-300">
               {Math.ceil((config.growthTimeMs - elapsed) / 1000)}с
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 pb-24">
      <h2 className="text-xl font-bold mb-4 flex items-center text-cyber-primary drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">
        <Sprout className="mr-2" /> Сектор Поля 7
      </h2>

      <div className="grid grid-cols-3 gap-4">
        {plots.map((plot) => {
          const isReady = plot.crop && plot.plantedAt && (now - plot.plantedAt >= CROPS[plot.crop].growthTimeMs);
          const glowColor = plot.crop ? getGlowColor(plot.crop) : '#10b981';
          
          return (
            <button
              key={plot.id}
              onClick={() => handlePlotClick(plot)}
              className={`
                aspect-square rounded-xl flex items-center justify-center relative overflow-hidden transition-all duration-300 group
                ${!plot.isUnlocked 
                  ? 'bg-slate-900/30 border border-slate-800 border-dashed cursor-not-allowed' 
                  : 'bg-slate-900/60 backdrop-blur-sm border border-slate-700/80 hover:border-opacity-100 hover:shadow-lg active:scale-95'
                }
              `}
              style={{
                borderColor: isReady ? glowColor : undefined,
                boxShadow: isReady ? `0 0 15px ${glowColor}40` : undefined
              }}
            >
              {/* Plot Base Decoration */}
              {plot.isUnlocked && (
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>
              )}
              
              {renderPlotContent(plot)}
            </button>
          )
        })}
      </div>

      {/* Modern Glass Modal */}
      {selectedPlotId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-cyber-dark/90 border border-cyber-primary/30 rounded-2xl w-full max-w-sm p-6 shadow-[0_0_50px_rgba(16,185,129,0.2)] relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sprout size={100} />
            </div>

            <h3 className="text-xl font-bold mb-6 text-white flex items-center">
              <span className="w-1 h-6 bg-cyber-primary mr-3 rounded-full"></span>
              Протокол Посева
            </h3>
            
            <div className="space-y-3 relative z-10">
              {(Object.keys(CROPS) as CropType[]).map((cropKey) => {
                const crop = CROPS[cropKey];
                const glow = getGlowColor(cropKey);
                return (
                  <button
                    key={cropKey}
                    onClick={() => handlePlantConfirm(cropKey)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-white/5 border border-slate-700 transition-all group"
                    style={{ borderColor: 'transparent' }} // reset for hover effect below
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl group-hover:scale-110 transition-transform drop-shadow-md">{crop.icon}</span>
                      <div className="text-left">
                        <div className="font-bold text-sm text-gray-100 group-hover:text-white transition-colors">{crop.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{crop.growthTimeMs / 1000}с цикл</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-900/30 px-2 py-0.5 rounded flex items-center">
                        <Zap size={10} className="mr-1" /> {crop.energyCost}
                      </span>
                      {crop.seedPrice > 0 && (
                        <span className="text-xs font-mono text-yellow-500 bg-yellow-900/30 px-2 py-0.5 rounded">
                          -{crop.seedPrice} 💰
                        </span>
                      )}
                    </div>
                    
                    {/* Hover Border hack for dynamic color */}
                    <div 
                        className="absolute inset-0 rounded-xl border border-transparent group-hover:border-opacity-100 pointer-events-none transition-colors"
                        style={{ borderColor: glow, opacity: 0.5 }} 
                    ></div>
                  </button>
                );
              })}
            </div>
            
            <Button 
              variant="secondary" 
              fullWidth 
              className="mt-6 border-slate-600 hover:bg-slate-700"
              onClick={() => {
                soundManager.play('click');
                setSelectedPlotId(null);
              }}
            >
              Отмена
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};