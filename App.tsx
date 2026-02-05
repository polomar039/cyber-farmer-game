import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { FarmGrid } from './components/FarmGrid';
import { InventoryList } from './components/InventoryList';
import { Marketplace } from './components/Marketplace';
import { Shop } from './components/Shop';
import { 
  Tab, UserState, Plot, InventoryItem, MarketState, CropType 
} from './types';
import { 
  INITIAL_PLOTS, MAX_ENERGY, ENERGY_REGEN_RATE_MS, MARKET_REFRESH_RATE_MS, CROPS 
} from './constants';
import { v4 as uuidv4 } from 'uuid';
import { soundManager } from './utils/SoundManager';
import { getTelegramUser, supabase } from './utils/supabase';

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function App() {
  // --- Game State ---
  const [activeTab, setActiveTab] = useState<Tab>('FARM');
  const [tgUser, setTgUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [user, setUser] = useState<UserState>({
    balance: 100,
    energy: 500,
    maxEnergy: MAX_ENERGY
  });

  const [plots, setPlots] = useState<Plot[]>(
    Array.from({ length: INITIAL_PLOTS }).map((_, i) => ({
      id: `plot-${i}`,
      crop: null,
      plantedAt: null,
      isUnlocked: i < 3 
    }))
  );

  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [marketState, setMarketState] = useState<MarketState>({
    trends: { POTATO: 1, TOMATO: 1, PUMPKIN: 1 },
    lastUpdated: Date.now()
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    const initGame = async () => {
      // 1. Setup Telegram
      const tg = getTelegramUser();
      // @ts-ignore
      if (window.Telegram?.WebApp) {
         // @ts-ignore
         window.Telegram.WebApp.expand();
         // @ts-ignore
         window.Telegram.WebApp.ready();
      }

      if (tg) {
        setTgUser(tg);
        
        // 2. Load/Create User in Supabase
        try {
          // Check if user exists
          const { data: existingUser, error } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', tg.id)
            .single();

          if (existingUser) {
            // Load progress
            setUser(prev => ({
              ...prev,
              balance: Number(existingUser.balance),
              energy: existingUser.energy
            }));
          } else {
            // Create new user
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                telegram_id: tg.id,
                username: tg.username,
                first_name: tg.first_name,
                balance: 100,
                energy: 500
              });
            
            if (insertError) console.error("Error creating user:", insertError);
          }
        } catch (e) {
          console.error("Connection error:", e);
        }
      }
      setIsLoading(false);
    };

    initGame();
  }, []);

  // --- AUTO-SAVE (Debounced) ---
  const saveTimeoutRef = useRef<any>(null);
  
  useEffect(() => {
    if (!tgUser) return;

    // Clear previous timeout to avoid spamming DB
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      await supabase
        .from('users')
        .update({
          balance: user.balance,
          energy: user.energy
        })
        .eq('telegram_id', tgUser.id);
    }, 2000); // Save 2 seconds after last change

    return () => clearTimeout(saveTimeoutRef.current);
  }, [user.balance, user.energy, tgUser]);


  // --- Logic Loops ---

  // Energy Regeneration
  useEffect(() => {
    const timer = setInterval(() => {
      setUser(u => ({
        ...u,
        energy: Math.min(u.energy + 1, u.maxEnergy)
      }));
    }, ENERGY_REGEN_RATE_MS);
    return () => clearInterval(timer);
  }, []);

  // Market Updates
  useEffect(() => {
    const updateMarket = () => {
      setMarketState({
        lastUpdated: Date.now(),
        trends: {
          POTATO: 0.8 + Math.random() * 0.4,
          TOMATO: 0.7 + Math.random() * 0.6,
          PUMPKIN: 0.9 + Math.random() * 0.5,
        }
      });
    };
    
    updateMarket();
    const timer = setInterval(updateMarket, MARKET_REFRESH_RATE_MS);
    return () => clearInterval(timer);
  }, []);

  // Spoilage Check
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setInventory(prev => {
        const fresh = prev.filter(item => item.expiresAt > now);
        return fresh;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // --- Interaction Setup ---
  useEffect(() => {
    const handleInteraction = () => {
      soundManager.init();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // --- Actions ---

  const handlePlant = (plotId: string, cropId: CropType) => {
    const crop = CROPS[cropId];
    
    if (user.energy < crop.energyCost) {
      soundManager.play('error');
      // @ts-ignore
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
      return;
    }
    if (user.balance < crop.seedPrice) {
      soundManager.play('error');
      return;
    }

    setUser(u => ({
      ...u,
      energy: u.energy - crop.energyCost,
      balance: u.balance - crop.seedPrice
    }));

    // @ts-ignore
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');

    setPlots(prev => prev.map(p => {
      if (p.id === plotId) {
        return { ...p, crop: cropId, plantedAt: Date.now() };
      }
      return p;
    }));
  };

  const handleHarvest = (plotId: string) => {
    setPlots(prev => prev.map(p => {
      if (p.id === plotId && p.crop) {
        const crop = CROPS[p.crop];
        const newItem: InventoryItem = {
          id: generateId(),
          cropId: p.crop,
          amount: 1 + Math.floor(Math.random()), 
          harvestedAt: Date.now(),
          expiresAt: Date.now() + crop.shelfLifeMs
        };
        
        setInventory(inv => [...inv, newItem]);
        setUser(u => ({ ...u, energy: Math.max(0, u.energy - 5) })); 
        
        // @ts-ignore
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');

        return { ...p, crop: null, plantedAt: null };
      }
      return p;
    }));
  };

  const handleSell = (npcId: string, cropType: CropType, itemIds: string[]) => {
    const cropConfig = CROPS[cropType];
    const trend = marketState.trends[cropType];
    const npcMultiplier = npcId === '1' ? 1 : npcId === '2' ? 0.8 : 1.2; 
    
    const pricePerUnit = Math.floor(cropConfig.basePrice * trend * npcMultiplier);
    const totalValue = pricePerUnit * itemIds.length;

    setInventory(prev => prev.filter(item => !itemIds.includes(item.id)));
    setUser(u => ({ ...u, balance: u.balance + totalValue }));
    
    // @ts-ignore
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
  };

  const handleBuyPlot = (plotId: string) => {
    soundManager.play('error');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center text-cyber-primary font-mono">
        <div className="animate-pulse">ЗАГРУЗКА НЕЙРОСЕТИ...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-gray-200 font-sans pb-20 selection:bg-cyber-primary selection:text-black">
      <Header user={user} />
      
      {!tgUser && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-2 text-[10px] text-yellow-200 text-center font-mono">
          ⚠️ DEMO MODE (Save disabled)
        </div>
      )}

      <main className="max-w-md mx-auto relative z-10">
        {activeTab === 'FARM' && (
          <FarmGrid 
            plots={plots} 
            onPlant={handlePlant}
            onHarvest={handleHarvest}
            onBuyPlot={handleBuyPlot}
          />
        )}
        
        {activeTab === 'INVENTORY' && (
          <InventoryList items={inventory} />
        )}
        
        {activeTab === 'MARKET' && (
          <Marketplace 
            inventory={inventory} 
            marketState={marketState}
            onSell={handleSell}
          />
        )}

        {activeTab === 'SHOP' && <Shop />}
      </main>

      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        inventoryCount={inventory.length}
      />
    </div>
  );
}