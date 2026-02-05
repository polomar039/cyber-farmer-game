import React from 'react';
import { Button } from './Button';
import { ShoppingBag, Battery, Grid, Snowflake, Lock } from 'lucide-react';

export const Shop: React.FC = () => {
  const items = [
    { id: 1, name: 'Расширение Участка', desc: 'Добавляет 1 слот для посадки.', cost: 500, icon: <Grid />, purchased: false },
    { id: 2, name: 'Крио-Камера v2', desc: '+50% к сроку хранения.', cost: 1200, icon: <Snowflake />, purchased: false },
    { id: 3, name: 'Ядерная Батарея', desc: '+500 Макс. Энергии.', cost: 2000, icon: <Battery />, purchased: false },
  ];

  return (
    <div className="p-4 pb-24">
      <h2 className="text-xl font-bold mb-6 flex items-center text-yellow-500 drop-shadow-md">
        <ShoppingBag className="mr-2" /> Апгрейды Чёрного Рынка
      </h2>

      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden">
            {/* Background shimmer */}
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/5 to-transparent skew-x-[-20deg]"></div>

            <div className="flex items-center space-x-4 relative z-10">
              <div className="p-3 bg-slate-800 rounded-lg text-cyber-accent border border-slate-700 shadow-inner">
                {item.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-100">{item.name}</h3>
                <p className="text-xs text-slate-400 max-w-[150px]">{item.desc}</p>
              </div>
            </div>
            <div className="flex flex-col items-end relative z-10">
              <span className="text-lg font-mono font-bold text-yellow-400 mb-2">{item.cost} 💰</span>
              <Button disabled variant="secondary" className="text-[10px] py-1 px-3 h-8 border-dashed opacity-70">
                <Lock size={12} className="mr-1" /> Скоро
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};