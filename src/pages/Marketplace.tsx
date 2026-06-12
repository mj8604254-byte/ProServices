import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { ItemCard } from '../components/ItemCard';
import { Filter, Search } from 'lucide-react';
import { MOCK_PRODUCTS } from '../constants';

export function Marketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('moderation_status', 'approved')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        
        // Map snake_case to camelCase if needed, but for now assuming direct mapping or adapting types
        const mappedData = data.map(item => ({
          ...item,
          imageUrl: item.image_url,
          sellerId: item.seller_id,
          moderationStatus: item.moderation_status,
          reviewsCount: item.reviews_count,
          createdAt: item.created_at
        })) as Product[];
        
        setProducts(mappedData);
      } catch (error) {
        console.warn('Failed to fetch real marketplace products, falling back to mock products:', error);
        setProducts(MOCK_PRODUCTS as any);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-navy">Marketplace</h1>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Pesquisar produtos..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange/20"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-[4/5] bg-slate-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map(product => (
            <ItemCard
              key={product.id}
              id={product.id}
              name={product.name}
              imageUrl={product.imageUrl}
              price={product.price}
              rating={product.rating}
              provider="Loja Verificada"
              category={product.category}
              type="product"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-400">Nenhum produto encontrado.</p>
        </div>
      )}
    </div>
  );
}
