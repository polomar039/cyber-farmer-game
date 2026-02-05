export type CropType = 'POTATO' | 'TOMATO' | 'PUMPKIN';

export interface CropConfig {
  id: CropType;
  name: string;
  growthTimeMs: number; // Time to grow in ms
  shelfLifeMs: number; // Time before spoiling in ms
  basePrice: number;
  energyCost: number;
  seedPrice: number; // Cost to plant if applicable (or free if logic dictates)
  icon: string;
  color: string;
}

export interface Plot {
  id: string;
  crop: CropType | null;
  plantedAt: number | null; // Timestamp
  isUnlocked: boolean;
}

export interface InventoryItem {
  id: string;
  cropId: CropType;
  amount: number;
  harvestedAt: number;
  expiresAt: number;
}

export interface NpcBuyer {
  id: string;
  name: string;
  description: string;
  multiplier: number; // Randomized multiplier
}

export interface MarketState {
  trends: Record<CropType, number>;
  lastUpdated: number;
}

export interface UserState {
  balance: number;
  energy: number;
  maxEnergy: number;
}

export type Tab = 'FARM' | 'INVENTORY' | 'MARKET' | 'SHOP';