import React, { useState } from 'react';
import { ChevronLeft, Search, PlusCircle, AlertTriangle, Edit, Copy, Trash2, Power, Eye, RefreshCw, Save } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { CATEGORIES } from '../../../constants';
import { UserRole } from '../../../types';

interface InventoryManagementViewProps {
  products: any[];
  profile: any;
  onBack: () => void;
  onRefresh: () => Promise<void>;
  onEditProduct: (product: any) => void;
  onAddNewProduct: () => void;
}

export function InventoryManagementView({ 
  products, 
  profile, 
  onBack, 
  onRefresh, 
  onEditProduct,
  onAddNewProduct
}: InventoryManagementViewProps) {
  
  const isMacro = profile?.role === UserRole.SELLER_MACRO;
  const lowStockThreshold = isMacro ? 100 : 10;

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  const [editStockId, setEditStockId] = useState<string | null>(null);
  const [quickStockVal, setQuickStockVal] = useState<string>('');

  // Extract unique brands from current products to populate filter
  const uniqueBrands = Array.from(new Set(products.map(p => p.brand || 'Outro').filter(Boolean)));

  // Duplicate a product
  const handleDuplicateProduct = async (product: any) => {
    setLoadingProductId(product.id);
    try {
      // Create clone payload
      const clonePayload = {
        name: `${product.name} (Cópia)`,
        category: product.category || CATEGORIES.products[0],
        description: product.description || '',
        price: Number(product.price || 0),
        stock: Number(product.stock || 0),
        unit: product.unit || 'unidade',
        location: product.location || 'Maputo',
        availability: product.availability || 'imediato',
        seller_id: profile.uid,
        image_url: product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
        moderation_status: 'pending',
        rating: 5,
        reviews_count: 0,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('products')
        .insert(clonePayload);

      if (error) throw error;
      
      alert('Produto duplicado com sucesso! O rascunho aguarda aprovação ou finalização.');
      await onRefresh();
    } catch (err: any) {
      console.error('Failed to duplicate product:', err.message);
      alert('Erro ao duplicar produto: ' + err.message);
    } finally {
      setLoadingProductId(null);
    }
  };

  // Toggle activation (availability)
  const handleToggleActivation = async (product: any) => {
    setLoadingProductId(product.id);
    try {
      const nextAvailability = product.availability === 'imediato' ? 'indisponivel' : 'imediato';
      const { error } = await supabase
        .from('products')
        .update({ availability: nextAvailability })
        .eq('id', product.id);

      if (error) throw error;
      await onRefresh();
    } catch (err: any) {
      console.error('Failed to toggle activation:', err.message);
    } finally {
      setLoadingProductId(null);
    }
  };

  // Fast inline stock update
  const handleQuickStockUpdate = async (productId: string) => {
    const updatedQty = parseInt(quickStockVal);
    if (isNaN(updatedQty) || updatedQty < 0) return;
    
    setLoadingProductId(productId);
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: updatedQty })
        .eq('id', productId);

      if (error) throw error;
      setEditStockId(null);
      await onRefresh();
    } catch (err: any) {
      console.error('Failed to quick-save stock:', err.message);
    } finally {
      setLoadingProductId(null);
    }
  };

  // Delete product row (deactivate or hard delete)
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja desativar ou eliminar este produto do seu inventário?')) return;
    setLoadingProductId(productId);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      await onRefresh();
    } catch (err: any) {
      console.error('Failed to delete product:', err.message);
      alert('Erro ao eliminar produto: ' + err.message);
    } finally {
      setLoadingProductId(null);
    }
  };

  // Filtering Logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesBrand = brandFilter === 'all' || (p.brand || 'Outro') === brandFilter;
    
    // stock filter
    const stockQty = Number(p.stock || 0);
    let matchesStock = true;
    if (stockStatusFilter === 'in_stock') matchesStock = stockQty >= lowStockThreshold;
    else if (stockStatusFilter === 'low_stock') matchesStock = stockQty < lowStockThreshold && stockQty > 0;
    else if (stockStatusFilter === 'out_of_stock') matchesStock = stockQty === 0;

    return matchesSearch && matchesCategory && matchesBrand && matchesStock;
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in" id="inventory-view-container">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            id="back-from-inventory-btn"
            onClick={onBack} 
            className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-navy transition-all cursor-pointer shadow-soft"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase text-orange tracking-[0.2em]">Controlo Operacional</span>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Gestão de Inventário</h2>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            id="inv-button-add-new"
            onClick={onAddNewProduct}
            className="px-5 py-3 bg-orange hover:bg-orange/90 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-orange/15 cursor-pointer"
          >
            <PlusCircle className="w-4.5 h-4.5" /> Adicionar SKU
          </button>
          <button
            id="inv-refresh-btn"
            onClick={onRefresh}
            className="p-3 bg-white border border-slate-200 text-slate-500 hover:text-navy hover:bg-slate-50 rounded-2xl transition-all cursor-pointer"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Grid of filters */}
      <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-soft grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left">
        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Categoria</label>
          <select 
            id="inv-filter-category"
            className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-xs text-navy focus:outline-none focus:ring-2 focus:ring-orange/20"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Todas as Categorias</option>
            {CATEGORIES.products.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Estado Stock</label>
          <select 
            id="inv-filter-stock"
            className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-xs text-navy focus:outline-none focus:ring-2 focus:ring-orange/20"
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
          >
            <option value="all">Filtro: Todos Níveis</option>
            <option value="in_stock">Em Stock Adequado</option>
            <option value="low_stock">Stock Reduzido / Baixo</option>
            <option value="out_of_stock">Roturas / Esgotado</option>
          </select>
        </div>

        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Marcas catálogo</label>
          <select 
            id="inv-filter-brand"
            className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-xs text-navy focus:outline-none focus:ring-2 focus:ring-orange/20"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
          >
            <option value="all">Todas as Marcas</option>
            {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Pesquisa rápida</label>
          <div className="relative">
            <input 
              id="inv-search-term"
              type="text"
              placeholder="Pesquisar por nome..."
              className="w-full bg-slate-50 border-none rounded-2xl pl-10 pr-4 py-4 font-bold text-xs text-navy focus:outline-none focus:ring-2 focus:ring-orange/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Main Shelves table list */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/60 font-black text-slate-400 text-[10px] uppercase tracking-widest">
                <th className="px-6 py-4">Foto & Nome</th>
                <th className="px-6 py-4">Categoria / Marca</th>
                <th className="px-6 py-4">Preço (MT)</th>
                <th className="px-6 py-4">SKU / Stock</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold text-xs">
                    Nenhum SKU encontrado no inventário ativo.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockLevel = Number(product.stock || 0);
                  const isEsgotado = stockLevel === 0;
                  const isCritico = stockLevel > 0 && stockLevel < lowStockThreshold;
                  
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/45 transition-colors group">
                      {/* Photo + Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 object-cover rounded-xl border border-slate-100 cursor-pointer"
                            onClick={() => onEditProduct(product)}
                          />
                          <div>
                            <span className="block font-black text-navy text-[12px] hover:text-orange transition-colors cursor-pointer" onClick={() => onEditProduct(product)}>
                              {product.name}
                            </span>
                            <span className="text-[8px] font-black text-slate-350 tracking-widest block mt-0.5">ID: {product.id.slice(0, 8).toUpperCase()}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-bold text-navy block">{product.category}</span>
                        <span className="text-[9px] text-slate-400 font-bold block">{product.brand || 'Sem Marca'}</span>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4">
                        <span className="text-[12px] font-black text-navy block">
                          {Number(product.price || 0).toLocaleString()} MT
                        </span>
                        {product.promo_price && (
                          <span className="text-[9px] line-through text-slate-405 font-bold">
                            {Number(product.promo_price).toLocaleString()} MT
                          </span>
                        )}
                      </td>

                      {/* Dynamic Stock management */}
                      <td className="px-6 py-4">
                        {editStockId === product.id ? (
                          <div className="flex items-center gap-1.5 animate-fade-in">
                            <input
                              id={`quick-stock-edit-${product.id}`}
                              type="number"
                              className="w-16 bg-slate-55 border border-slate-200 rounded-lg p-1.5 text-xs text-navy font-black text-center focus:outline-none"
                              value={quickStockVal}
                              onChange={(e) => setQuickStockVal(e.target.value)}
                            />
                            <button
                              id={`quick-stock-save-${product.id}`}
                              onClick={() => handleQuickStockUpdate(product.id)}
                              className="p-1 px-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`quick-stock-cancel-${product.id}`}
                              onClick={() => setEditStockId(null)}
                              className="p-1 px-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg cursor-pointer"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-black text-slate-650 block">
                              {stockLevel} {product.unit || 'unid'}
                            </span>
                            <button 
                              onClick={() => {
                                setEditStockId(product.id);
                                setQuickStockVal(String(stockLevel));
                              }}
                              className="text-[9px] text-orange hover:underline font-extrabold cursor-pointer"
                            >
                              (Editar)
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Badge stock status */}
                      <td className="px-6 py-4">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          isEsgotado ? 'bg-red-50 text-red-650 border border-red-100' :
                          isCritico ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-green-50 text-green-700 border border-green-100'
                        }`}>
                          {isEsgotado ? 'Esgotado' : isCritico ? 'Stock Crítico' : 'Em Stock'}
                        </span>
                      </td>

                      {/* Control Panel buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active Switch */}
                          <button
                            id={`toggle-active-${product.id}`}
                            onClick={() => handleToggleActivation(product)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              product.availability === 'imediato' 
                                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                            title={product.availability === 'imediato' ? 'Disponível: Clique para desativar' : 'Indisponível: Clique para ativar'}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Edit Item Card */}
                          <button
                            id={`edit-product-${product.id}`}
                            onClick={() => onEditProduct(product)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-550 hover:text-navy rounded-lg transition-colors cursor-pointer"
                            title="Editar Dados Completos"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Duplicate Item Record */}
                          <button
                            id={`duplicate-product-${product.id}`}
                            disabled={loadingProductId === product.id}
                            onClick={() => handleDuplicateProduct(product)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-550 hover:text-navy rounded-lg transition-colors cursor-pointer"
                            title="Duplicar Item"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Trash / Delete record */}
                          <button
                            id={`delete-product-${product.id}`}
                            disabled={loadingProductId === product.id}
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-550 rounded-lg transition-all cursor-pointer"
                            title="Eliminar SKU"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
