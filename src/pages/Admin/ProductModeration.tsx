import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Search,
  MessageSquare,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { supabase, handleSupabaseError } from '../../lib/supabase';
import { Product } from '../../types';

export function ProductModeration() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    fetchProducts();
  }, [statusFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('moderation_status', statusFilter)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedDocs = data.map(p => ({
        ...p,
        id: p.id,
        imageUrl: p.image_url,
        sellerId: p.seller_id,
        moderationStatus: p.moderation_status,
        createdAt: p.created_at
      })) as Product[];
      
      setProducts(mappedDocs);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModeration = async (productId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          moderation_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);
        
      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Error moderating product:', err);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-navy uppercase tracking-tight">Moderação de Produtos</h1>
        <p className="text-slate-500 font-medium">Aprovação e monitoramento do marketplace.</p>
      </header>

      <div className="flex gap-4">
        {['pending', 'approved', 'rejected', 'suspended'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
              statusFilter === s ? 'bg-orange text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50 shadow-soft'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white aspect-[4/5] rounded-[40px] animate-pulse shadow-soft" />
          ))
        ) : products.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white rounded-[40px] shadow-soft border border-dashed border-slate-200">
            <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest">Sem produtos nesta categoria</p>
          </div>
        ) : (
          products.map(product => (
            <div key={product.id} className="bg-white rounded-[40px] shadow-soft border border-slate-100 overflow-hidden flex flex-col group">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[9px] font-black text-navy uppercase tracking-widest shadow-sm">
                    {product.category}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="font-black text-navy text-lg leading-tight mb-1">{product.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID do Vendedor: {product.sellerId}</p>
                </div>

                <p className="text-slate-500 text-sm line-clamp-2 mb-6">{product.description}</p>

                <div className="mt-auto flex items-center justify-between">
                  <span className="text-xl font-black text-orange">{product.price.toLocaleString()} MT</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleModeration(product.id, 'rejected')}
                      className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all"
                      title="Rejeitar"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleModeration(product.id, 'approved')}
                      className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-100 transition-all"
                      title="Aprovar"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
