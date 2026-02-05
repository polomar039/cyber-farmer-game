import { CropConfig, CropType, NpcBuyer } from './types';
import { Sprout, Apple, Activity } from 'lucide-react';

export const ENERGY_REGEN_RATE_MS = 3000; // +1 energy every 3s
export const MARKET_REFRESH_RATE_MS = 60000; // Market changes every 60s
export const INITIAL_PLOTS = 6;
export const MAX_ENERGY = 1000;

export const CROPS: Record<CropType, CropConfig> = {
  POTATO: {
    id: 'POTATO',
    name: 'Кибер-Картофель',
    growthTimeMs: 10 * 1000, // Reduced to 10s for demo (Real: 60s)
    shelfLifeMs: 24 * 60 * 60 * 1000, // 24 hours
    basePrice: 5,
    energyCost: 10,
    seedPrice: 0,
    icon: '🥔',
    color: 'text-yellow-600',
  },
  TOMATO: {
    id: 'TOMATO',
    name: 'Неоновый Томат',
    growthTimeMs: 30 * 1000, // Reduced to 30s for demo (Real: 10 mins)
    shelfLifeMs: 2 * 60 * 60 * 1000, // 2 hours
    basePrice: 15,
    energyCost: 20,
    seedPrice: 2,
    icon: '🍅',
    color: 'text-red-500',
  },
  PUMPKIN: {
    id: 'PUMPKIN',
    name: 'Квантовая Тыква',
    growthTimeMs: 60 * 1000, // Reduced to 60s for demo (Real: 1 hour)
    shelfLifeMs: 12 * 60 * 60 * 1000, // 12 hours
    basePrice: 50,
    energyCost: 50,
    seedPrice: 10,
    icon: '🎃',
    color: 'text-orange-500',
  },
};

export const NPCS: NpcBuyer[] = [
  { id: '1', name: 'Шеф G0rdon', description: 'Ценит свежие био-продукты.', multiplier: 1.0 },
  { id: '2', name: 'Сталкер X', description: 'Скупает всё за копейки.', multiplier: 0.8 },
  { id: '3', name: 'Элитный Корпо', description: 'Платит премиум за качество.', multiplier: 1.2 },
];