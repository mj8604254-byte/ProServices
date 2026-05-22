import React from 'react';
import { Star, MapPin, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

interface CardProps {
  id: string;
  name: string;
  imageUrl: string;
  price: string | number;
  rating: number;
  provider: string;
  category: string;
  type: 'product' | 'service' | 'food';
}

export const ItemCard: React.FC<CardProps> = ({ id, name, imageUrl, price, rating, provider, category, type }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl overflow-hidden shadow-soft border border-slate-100 group cursor-pointer"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur text-[10px] font-bold uppercase tracking-wider rounded-lg text-navy">
          {category}
        </div>
        {type === 'food' && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-navy/90 backdrop-blur rounded-lg text-[10px] text-white">
            <Star className="w-3 h-3 fill-orange text-orange" />
            {rating}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-slate-900 group-hover:text-orange transition-colors truncate flex-1">
            {name}
          </h3>
          {type !== 'food' && (
            <div className="flex items-center gap-0.5 text-xs font-semibold text-slate-500">
              <Star className="w-3 h-3 fill-orange text-orange" />
              {rating}
            </div>
          )}
        </div>
        
        <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {provider}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <p className="font-extrabold text-navy text-lg">
            {typeof price === 'number' ? `MT ${price.toLocaleString()}` : price}
          </p>
          <button className="bg-slate-100 hover:bg-orange hover:text-white p-2 rounded-xl transition-all">
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
