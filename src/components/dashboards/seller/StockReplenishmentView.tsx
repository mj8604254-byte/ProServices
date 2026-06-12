import React, { useState } from 'react';
import { ChevronLeft, Package, Sparkles, RefreshCw, AlertTriangle, Save, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { UserRole } from '../../../types';
import { CATEGORIES } from '../../../constants';

interface StockReplenishmentViewProps {
  products: any[];
  profile: any;
  onBack: () => void;
  onRefresh: () => Promise<void>;
}

export function StockReplenishmentView({ products, profile, onBack, onRefresh }: StockReplenishmentViewProps) {
  const isMacro = profile?.role === UserRole.SELLER_MACRO;
  const threshold = isMacro ? 100 : 10;
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [replenishQty, setReplenishQty] = useState<{ [key: string]: string }>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isAlertsEnabled, setIsAlertsEnabled] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter products matching low stock
  const lowStockProducts = products.filter(p => {
    const isCategoryMatch = selectedCategory === 'all' || p.category === selectedCategory;
    const isLowStock = Number(p.stock || 0) < threshold;
    return isCategoryMatch && isLowStock;
  });

  const handleUpdateStock = async (productId: string) => {
    const rawQty = replenishQty[productId];
    if (!rawQty || isNaN(Number(rawQty))) return;
    
    setUpdatingId(productId);
    try {
      const parsedStock = Number(rawQty);
      const { error } = await supabase
        .from('products')
        .update({ stock: parsedStock })
        .eq('id', productId);

      if (error) throw error;

      setSuccessMsg('Quantidade de stock reposta com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3000);
      
      // Refresh state
      await onRefresh();
      
      // Clear input
      setReplenishQty(prev => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    } catch (err: any) {
      console.error('Failed to update stock:', err.message);
      alert('Erro ao repor stock: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in" id="stock-replenishment-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            id="back-from-stock-btn"
            onClick={onBack} 
            className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-navy transition-all cursor-pointer shadow-soft"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase text-orange tracking-[0.2em]">Operações Logísticas</span>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Reposição de Stock</h2>
          </div>
        </div>

        {/* Categories selector */}
        <select
          id="stock-replenish-cat-select"
          className="bg-white border border-slate-200 py-3 px-5 rounded-2xl font-extrabold text-xs focus:ring-2 focus:ring-orange/20 focus:outline-none"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">Filtro: Todas Categoria</option>
          {CATEGORIES.products.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-250 p-4 rounded-2xl text-green-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Alertas Banner */}
      <div className="bg-amber-50/50 border border-amber-200/50 p-6 rounded-[28px] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h4 className="font-extrabold text-navy text-xs uppercase tracking-tight">Alertas de Stock Baixo ({threshold} Unid.)</h4>
            <p className="text-[10px] text-slate-500 font-medium">Assegure que os produtos marcados com stock crítico não fiquem esgotados na vitrine digital do seu portfólio.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Receber Alertas Ativo</span>
          <button
            id="toggle-alerts-btn"
            onClick={() => setIsAlertsEnabled(!isAlertsEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${isAlertsEnabled ? 'bg-orange' : 'bg-slate-200'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${isAlertsEnabled ? 'right-0.5' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-soft overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-black text-navy uppercase tracking-widest">Produtos em Nível Crítico ({lowStockProducts.length})</h3>
          <span className="text-[9px] text-red-500 font-black uppercase bg-red-50 px-3 py-1 rounded-full border border-red-100/50">
            Crítico abaixo de : {threshold} unidades
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {lowStockProducts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-bold text-xs space-y-2">
              <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p>Parabéns! Nenhum produto do seu portfólio está em nível de stock baixo.</p>
            </div>
          ) : (
            lowStockProducts.map((product) => {
              const currentStock = Number(product.stock || 0);
              const isUrgent = currentStock === 0;
              
              return (
                <div key={product.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                  <div className="flex items-center gap-4 text-left">
                    <img
                      src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 object-cover rounded-2xl border border-slate-100 shrink-0"
                    />
                    <div>
                      <h4 className="font-extrabold text-navy text-xs uppercase tracking-tight leading-snug">{product.name}</h4>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">{product.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isUrgent ? 'bg-red-50 text-red-650' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {isUrgent ? 'Esgotado ❌' : `${currentStock} Unidades restantes`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Inline Stock Input Action */}
                  <div className="flex items-center gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0">
                    <div className="flex-1 md:flex-none">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Repor Quantidade</label>
                      <input
                        id={`replenish-qty-input-${product.id}`}
                        type="number"
                        placeholder="Ex: 50"
                        className="w-full md:w-28 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-xs text-navy focus:ring-2 focus:ring-orange/20 focus:outline-none"
                        value={replenishQty[product.id] || ''}
                        onChange={(e) => setReplenishQty({ ...replenishQty, [product.id]: e.target.value })}
                      />
                    </div>
                    <button
                      id={`save-stock-btn-${product.id}`}
                      disabled={updatingId === product.id || !replenishQty[product.id]}
                      onClick={() => handleUpdateStock(product.id)}
                      className="px-5 py-3 bg-navy text-white hover:bg-orange disabled:bg-slate-200 disabled:text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all self-end cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Repor
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
