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
import { AlertTriangle, Terminal } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function App() {
  // --- Game State ---
  const [activeTab, setActiveTab] = useState<Tab>('FARM');
  const [tgUser, setTgUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
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

  // --- HELPER: Load User Data ---
  const loadUserData = async (telegramId: number, username: string, firstName: string) => {
    try {
      setErrorMsg(null);
      // Check if user exists
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (existingUser) {
        // Load progress including inventory
        setUser(prev => ({
          ...prev,
          balance: Number(existingUser.balance),
          energy: existingUser.energy
        }));
        
        if (existingUser.inventory) {
          setInventory(existingUser.inventory as InventoryItem[]);
        }
      } else {
        // Create new user
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            telegram_id: telegramId,
            username: username,
            first_name: firstName,
            balance: 100,
            energy: 500,
            inventory: []
          });
        
        if (insertError) throw insertError;
      }
      setTgUser({ id: telegramId, username, first_name: firstName });
    } catch (e: any) {
      console.error("Connection error:", e);
      setErrorMsg(`DB Error: ${e.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

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
         // @ts-ignore
         window.Telegram.WebApp.disableVerticalSwipes(); 
      }

      if (tg) {
        await loadUserData(tg.id, tg.username || 'Anon', tg.first_name || 'Michael');
      } else {
        // Not in Telegram (Browser Mode)
        setIsLoading(false);
      }
    };

    initGame();
  }, []);

  // --- DEV LOGIN ---
  const handleDevLogin = () => {
    setIsLoading(true);
    loadUserData(99999, 'DevUser', 'Tester');
  };

  // --- AUTO-SAVE (Includes Balance, Energy AND Inventory) ---
  const saveTimeoutRef = useRef<any>(null);
  
  useEffect(() => {
    if (!tgUser || isLoading) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      await supabase
        .from('users')
        .update({
          balance: user.balance,
          energy: user.energy,
          inventory: inventory // Теперь сохраняем и склад
        })
        .eq('telegram_id', tgUser.id);
    }, 2000);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [user.balance, user.energy, inventory, tgUser, isLoading]);


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
        // Only update state if something actually spoiled to avoid unnecessary DB writes
        if (fresh.length !== prev.length) return fresh;
        return prev;
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
          amount: 1, 
          harvestedAt: Date.now(),
          expiresAt: Date.now() + crop.shelfLifeMs
        };
        
        setInventory(inv => [...inv, newItem]);
        setUser(u => ({ ...u, energy: Math.max(0, u.energy - 5) })); 

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
  };

  const handleBuyPlot = (plotId: string) => {
    soundManager.play('error');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center text-cyber-primary font-mono">
        <div className="animate-pulse text-center">
          <div>ИНИЦИАЛИЗАЦИЯ КАНАЛА СВЯЗИ...</div>
          <div className="text-[10px] mt-2 opacity-50">SYNCING WITH SUPABASE_NODE_01</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-gray-200 font-sans pb-20 selection:bg-cyber-primary selection:text-black">
      <Header user={user} />
      
      {errorMsg && (
        <div className="bg-red-500/20 border-b border-red-500 p-2 flex items-center justify-center text-[10px] text-red-200 font-mono">
          <AlertTriangle size={12} className="mr-2" />
          {errorMsg}
        </div>
      )}

      {!tgUser && !isLoading && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-2 flex flex-col items-center justify-center gap-2">
          <span className="text-[10px] text-yellow-200 font-mono text-center">
            ⚠️ DEMO MODE (Browser)
          </span>
          <button 
            onClick={handleDevLogin}
            className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded text-xs text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30"
          >
            <Terminal size={12} />
            Войти как Тестер (Проверка БД)
          </button>
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