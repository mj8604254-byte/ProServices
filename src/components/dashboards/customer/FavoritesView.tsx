import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  ArrowLeft, 
  Share2, 
  Trash2, 
  FolderPlus, 
  Plus, 
  ShoppingBag, 
  Users, 
  Store,
  Folder,
  Check,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface FavoritesViewProps {
  profile: any;
  onBack: () => void;
}

interface FavoriteItem {
  id: string;
  name: string;
  category: string;
  type: 'product' | 'provider' | 'store';
  price?: number;
  image?: string;
  details?: string;
  collection?: string;
}

export function FavoritesView({ profile, onBack }: FavoritesViewProps) {
  const uid = profile?.uid || 'guest';
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [collections, setCollections] = useState<string[]>(['Gerais', 'Desejos', 'Urgentes']);
  const [activeTab, setActiveTab] = useState<'product' | 'provider' | 'store'>('product');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showAddCollectionModal, setShowAddCollectionModal] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read favorites from localStorage for uid (syncing)
    const storedFavorites = localStorage.getItem(`moz_favs_${uid}`);
    const storedCollections = localStorage.getItem(`moz_fav_collections_${uid}`);

    if (storedCollections) {
      setCollections(JSON.parse(storedCollections));
    }

    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
      setLoading(false);
    } else {
      // Find database products to populate favorites initially
      const loadInitialProducts = async () => {
        try {
          const { data: dbProducts } = await supabase
            .from('products')
            .select('*')
            .limit(3);

          const defaultFavs: FavoriteItem[] = [];

          if (dbProducts && dbProducts.length > 0) {
            dbProducts.forEach((p, index) => {
              defaultFavs.push({
                id: p.id,
                name: p.name,
                category: p.category || 'Geral',
                type: 'product',
                price: Number(p.price),
                image: p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
                collection: 'Gerais'
              });
            });
          } else {
            // Static fallback but realistic items if db is completely empty
            defaultFavs.push({
              id: 'p-1',
              name: 'iPhone 15 Pro Max Titanium',
              category: 'Eletrónicos',
              type: 'product',
              price: 95000,
              image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=300',
              collection: 'Desejos'
            });
            defaultFavs.push({
              id: 'p-2',
              name: 'Saco de Arroz Tio Lucas 25kg',
              category: 'Mercearia',
              type: 'product',
              price: 1800,
              image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300',
              collection: 'Gerais'
            });
          }

          // Generate some mock service providers and shops
          defaultFavs.push({
            id: 'v-1',
            name: 'Artur Chichango (Electricista Geral)',
            category: 'Electricidade',
            type: 'provider',
            details: 'Mais de 11 restauros elétricos em Maputo',
            image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300',
            collection: 'Urgentes'
          });

          defaultFavs.push({
            id: 'v-2',
            name: 'Engenheiro Sérgio Nhassengo',
            category: 'Construção',
            type: 'provider',
            details: 'Especialista em estruturas e obras civis',
            image: 'https://images.unsplash.com/photo-1621243804936-775306a8f2e3?w=300',
            collection: 'Gerais'
          });

          defaultFavs.push({
            id: 's-1',
            name: 'Smart Solutions Moçambique',
            category: 'Tecnologia',
            type: 'store',
            details: 'Avenida 24 de Julho, Loja 15, Maputo',
            image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=300',
            collection: 'Desejos'
          });

          localStorage.setItem(`moz_favs_${uid}`, JSON.stringify(defaultFavs));
          setFavorites(defaultFavs);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      loadInitialProducts();
    }
  }, [uid]);

  const saveFavorites = (updatedList: FavoriteItem[]) => {
    localStorage.setItem(`moz_favs_${uid}`, JSON.stringify(updatedList));
    setFavorites(updatedList);
  };

  const handleRemoveFavorite = (id: string, name: string) => {
    const confirmed = window.confirm(`Deseja remover "${name}" dos seus favoritos?`);
    if (!confirmed) return;

    const filtered = favorites.filter(f => f.id !== id);
    saveFavorites(filtered);
  };

  const handleShareFavorite = (item: FavoriteItem) => {
    const text = `Olhe o favorito em Moz ProServices: ${item.name} (${item.category})`;
    navigator.clipboard.writeText(`${text}\nLink: https://moz.pro/marketplace/${item.type}/${item.id}`);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  };

  const handleShareList = () => {
    const text = `Meus favoritos em Moz ProServices (${selectedCollection === 'all' ? 'Todos' : `Coleção: ${selectedCollection}`})`;
    navigator.clipboard.writeText(text + '\nLink: https://moz.pro/customer/favorites/public');
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  };

  const handleAddCollection = () => {
    if (!newCollectionName.trim()) return;
    if (collections.includes(newCollectionName.trim())) {
      alert('Esta coleção já existe!');
      return;
    }

    const updatedCol = [...collections, newCollectionName.trim()];
    localStorage.setItem(`moz_fav_collections_${uid}`, JSON.stringify(updatedCol));
    setCollections(updatedCol);
    setNewCollectionName('');
    setShowAddCollectionModal(false);
  };

  const handleMoveToCollection = (itemId: string, collection: string) => {
    const updated = favorites.map(f => f.id === itemId ? { ...f, collection } : f);
    saveFavorites(updated);
  };

  // Counting for counters
  const totalProducts = favorites.filter(f => f.type === 'product').length;
  const totalProviders = favorites.filter(f => f.type === 'provider').length;
  const totalStores = favorites.filter(f => f.type === 'store').length;

  const filteredFavorites = favorites.filter(item => {
    const matchesTab = item.type === activeTab;
    const matchesCollection = selectedCollection === 'all' || item.collection === selectedCollection;
    return matchesTab && matchesCollection;
  });

  return (
    <div className="space-y-6 text-left animate-fade-in" id="customer-favorites-view">
      {/* Toast Box */}
      {shareToast && (
        <div className="fixed top-5 right-5 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4" /> Link copiado para a área de transferência!
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-navy transition-colors font-bold text-xs uppercase"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddCollectionModal(true)}
            className="px-4 py-2 text-navy hover:text-orange bg-slate-50 hover:bg-slate-100 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border-none"
          >
            <FolderPlus className="w-4 h-4" /> Nova Coleção
          </button>
          <button
            onClick={handleShareList}
            className="px-4 py-2 bg-orange text-white hover:bg-navy font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border-none"
          >
            <Share2 className="w-4 h-4" /> Partilhar Lista
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Marketplace', value: totalProducts, icon: ShoppingBag, type: 'product', color: 'text-blue-500 bg-blue-50' },
          { label: 'Prestadores', value: totalProviders, icon: Users, type: 'provider', color: 'text-purple-500 bg-purple-50' },
          { label: 'Lojas Seguidas', value: totalStores, icon: Store, type: 'store', color: 'text-emerald-500 bg-emerald-50' },
        ].map((counter) => (
          <div 
            key={counter.type}
            onClick={() => setActiveTab(counter.type as any)}
            className={`p-4 sm:p-5 rounded-2xl border text-left cursor-pointer transition-all ${
              activeTab === counter.type ? 'border-orange shadow-lg' : 'border-slate-100 bg-white hover:border-slate-350'
            }`}
          >
            <div className={`w-9 h-9 ${counter.color} rounded-xl flex items-center justify-center mb-3`}>
              <counter.icon className="w-4.5 h-4.5" />
            </div>
            <h4 className="text-[10px] font-black tracking-widest uppercase text-slate-400">{counter.label}</h4>
            <p className="text-xl font-black text-navy mt-1">{counter.value}</p>
          </div>
        ))}
      </div>

      {/* Main Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Collection Sidebar list */}
        <aside className="w-full lg:w-48 xl:w-56 shrink-0 bg-white p-5 rounded-[24px] border border-slate-100 shadow-soft h-fit">
          <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <Folder className="w-4 h-4 text-orange" /> Coleções
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCollection('all')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-between ${
                selectedCollection === 'all' ? 'bg-orange/10 text-orange' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <span>Mostrar Todas</span>
              <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold">{favorites.length}</span>
            </button>
            
            {collections.map((col) => {
              const count = favorites.filter(f => f.collection === col).length;
              return (
                <button
                  key={col}
                  onClick={() => setSelectedCollection(col)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-between ${
                    selectedCollection === col ? 'bg-orange/10 text-orange' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate pr-2">{col}</span>
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold">{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Favorites List Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange animate-spin" />
            </div>
          ) : filteredFavorites.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredFavorites.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white rounded-[24px] overflow-hidden border border-slate-100 hover:border-orange transition-all shadow-soft flex flex-col group"
                >
                  <div className="h-36 overflow-hidden relative bg-slate-50">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <button
                        onClick={() => handleShareFavorite(item)}
                        className="p-2 bg-white/90 hover:bg-white text-navy rounded-xl shadow-md transition-transform hover:scale-105 cursor-pointer border-none"
                        title="Partilhar Favorito"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveFavorite(item.id, item.name)}
                        className="p-2 bg-white/90 hover:bg-red-500 hover:text-white text-red-500 rounded-xl shadow-md transition-transform hover:scale-105 cursor-pointer border-none"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                      <h4 className="font-extrabold text-navy text-sm leading-tight mt-1 group-hover:text-orange transition-colors min-h-[40px] line-clamp-2">
                        {item.name}
                      </h4>
                      {item.price ? (
                        <p className="font-mono text-sm font-black text-orange mt-1">
                          {item.price.toLocaleString()} MT
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1 truncate italic">
                          {item.details}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-slate-50 mt-4 pt-3 flex items-center justify-between">
                      {/* Collection Selector */}
                      <select
                        value={item.collection || 'Gerais'}
                        onChange={(e) => handleMoveToCollection(item.id, e.target.value)}
                        className="text-[10px] font-extrabold text-slate-500 bg-slate-50 border-none outline-none focus:ring-1 focus:ring-orange rounded-lg p-1.5 cursor-pointer"
                      >
                        {collections.map(c => (
                          <option key={c} value={c}>Coleção: {c}</option>
                        ))}
                      </select>

                      <button
                        onClick={() => alert(`Direcionando para o Marketplace para ver o item: ${item.name}`)}
                        className="text-[10px] font-black text-orange hover:text-navy uppercase tracking-widest flex items-center gap-1.5 bg-transparent border-none cursor-pointer"
                      >
                        Aceder <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 py-16 text-center border border-dashed border-slate-200 rounded-[32px] space-y-3">
              <Heart className="w-10 h-10 text-slate-200 mx-auto animate-pulse" />
              <div>
                <h4 className="text-sm font-black text-navy uppercase tracking-tight">Sem favoritos nesta Coleção</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Adicione produtos do marketplace ou fornecedores à sua lista para organizar os seus interesses e poupar tempo!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Coleção Modal */}
      {showAddCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md p-6 rounded-[32px] shadow-2xl border border-slate-100 text-left">
            <h3 className="text-lg font-black text-navy uppercase tracking-tight flex items-center gap-2 mb-2">
              <FolderPlus className="w-5 h-5 text-orange" /> Criar Nova Coleção
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">Organize os seus produtos ou serviços favoritos em pastas personalizadas para facilitar o acesso.</p>

            <input 
              type="text" 
              placeholder="Ex: Presentes de Aniversário, Cozinha..." 
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="w-full h-11 border border-slate-200 rounded-xl px-4 text-xs outline-none focus:border-orange font-bold text-navy"
            />

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddCollectionModal(false)}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-navy font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors cursor-pointer border-none shadow-soft"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCollection}
                className="flex-1 py-3 bg-orange hover:bg-navy text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors cursor-pointer border-none shadow-md"
              >
                Salvar Coleção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
