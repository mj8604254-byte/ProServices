import React, { useState, useEffect } from 'react';
import { 
  Search as SearchIcon, 
  Settings2, 
  Mic, 
  ArrowLeft, 
  History, 
  TrendingUp, 
  X, 
  ChevronRight,
  Filter,
  MapPin,
  DollarSign,
  Percent,
  LayoutGrid,
  Utensils,
  BookOpen,
  Briefcase,
  Star,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SUGGESTIONS = [
  'Samsung Galaxy S23',
  'Pizza Margherita Moz',
  'Serviços de Limpeza',
  'Curso de Marketing Digital',
  'iPhone 15 Pro Max',
  'Hambúrguer Gourmet',
];

const CATEGORIES = [
  { id: 'product', label: 'Produtos', icon: LayoutGrid, color: 'bg-blue-500' },
  { id: 'service', label: 'Serviços', icon: Briefcase, color: 'bg-purple-500' },
  { id: 'food', label: 'iFood', icon: Utensils, color: 'bg-orange' },
  { id: 'infoproduct', label: 'Cursos', icon: BookOpen, color: 'bg-emerald-500' },
];

export function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [isListening, setIsListening] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (query.trim().length > 1) {
      const filtered = SUGGESTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase()));
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleVoiceSearch = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      setQuery('Samsung Galaxy');
    }, 2000);
  };

  const toggleFilter = (id: string) => {
    setActiveFilters(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Search Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-navy transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange transition-colors">
                <SearchIcon className="w-5 h-5" />
              </div>
              <input 
                autoFocus
                type="text"
                placeholder="Procura produtos, comida, serviços..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-[20px] pl-12 pr-12 py-3.5 font-bold text-navy placeholder:text-slate-400 focus:ring-4 focus:ring-orange/10 transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {query && (
                  <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-navy">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={handleVoiceSearch}
                  className={`p-2 rounded-xl transition-all ${isListening ? 'bg-orange text-white animate-pulse' : 'text-slate-400 hover:text-orange'}`}
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>
            </div>
            <button 
              onClick={() => setShowFilters(true)}
              className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all ${activeFilters.length > 0 ? 'border-orange bg-orange/5 text-orange' : 'border-slate-200 text-slate-400'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {query.length === 0 ? (
            <motion.div 
              key="initial"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              {/* Categories */}
              <section>
                <h3 className="text-sm font-black text-navy uppercase tracking-widest mb-6">Categorias Populares</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {CATEGORIES.map((cat) => (
                    <button key={cat.id} className="bg-slate-50 p-6 rounded-[32px] flex flex-col items-center gap-3 hover:bg-orange/5 hover:scale-105 transition-all group">
                      <div className={`w-12 h-12 ${cat.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform`}>
                        <cat.icon className="w-6 h-6" />
                      </div>
                      <span className="font-black text-navy text-[10px] uppercase tracking-widest">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* History */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-400" />
                    Histórico de Pesquisa
                  </h3>
                  <button className="text-[10px] font-black text-slate-300 uppercase hover:text-orange transition-colors">Limpar</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Pizza', 'Logística em Maputo', 'Mecânico', 'iPhone'].map(item => (
                    <button key={item} className="px-5 py-2.5 bg-slate-50 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                      {item}
                    </button>
                  ))}
                </div>
              </section>

              {/* Trending */}
              <section>
                <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-orange" />
                  Em Alta Agora
                </h3>
                <div className="space-y-4">
                  {SUGGESTIONS.slice(0, 4).map((s, idx) => (
                    <button key={s} className="w-full flex items-center gap-4 p-2 hover:translate-x-2 transition-transform group">
                      <span className="text-xl font-black text-slate-100 group-hover:text-orange transition-colors">0{idx + 1}</span>
                      <span className="text-sm font-bold text-navy truncate">{s}</span>
                      <ChevronRight className="w-4 h-4 ml-auto text-slate-200 group-hover:text-orange" />
                    </button>
                  ))}
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {suggestions.length > 0 && (
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-soft overflow-hidden">
                  {suggestions.map((s) => (
                    <button 
                      key={s} 
                      onClick={() => setQuery(s)}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 text-left border-b border-slate-50 last:border-none"
                    >
                      <SearchIcon className="w-4 h-4 text-slate-300" />
                      <span className="text-sm font-bold text-navy">{s}</span>
                      {s.toLowerCase() === query.toLowerCase() && <Check className="w-4 h-4 ml-auto text-orange" />}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6">
                  <SearchIcon className="w-10 h-10 text-slate-200" />
                </div>
                <h4 className="text-xl font-black text-navy uppercase tracking-tight">Resultados para "{query}"</h4>
                <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">Estamos a processar o seu pedido inteligente para encontrar as melhores ofertas.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Voice Search Overlay */}
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-navy/95 backdrop-blur-xl flex flex-col items-center justify-center text-white"
          >
            <div className="relative">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-32 h-32 bg-orange rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(255,100,0,0.4)]"
              >
                <Mic className="w-12 h-12" />
              </motion.div>
              <div className="absolute inset-0 w-full h-full border-4 border-white/20 rounded-full animate-ping" />
            </div>
            <h2 className="text-3xl font-black mt-12 uppercase tracking-tighter">Estou a ouvir...</h2>
            <p className="text-slate-400 mt-4 font-bold uppercase tracking-widest text-[10px]">Podes dizer "Pizza de Pepperoni" ou "Mecânico perto de mim"</p>
            
            <button 
              onClick={() => setIsListening(false)}
              className="mt-20 w-16 h-16 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <X className="w-8 h-8" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Responsive Filter Drawer */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[48px] z-[101] p-8 max-h-[85vh] overflow-y-auto shadow-[0_-20px_60px_rgba(0,0,0,0.1)]"
            >
              <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mb-10" />
              
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-navy uppercase tracking-tight">Filtros Avançados</h3>
                <button onClick={() => setActiveFilters([])} className="text-xs font-black text-orange uppercase tracking-widest">Remover todos</button>
              </div>

              <div className="space-y-10 pb-10">
                <FilterSection title="Localização" icon={MapPin}>
                  <div className="grid grid-cols-2 gap-3">
                    {['Perto de mim', 'Maputo Cidade', 'Matola', 'Beira'].map(f => (
                      <FilterButton key={f} active={activeFilters.includes(f)} onClick={() => toggleFilter(f)}>{f}</FilterButton>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="Preço" icon={DollarSign}>
                   <div className="grid grid-cols-2 gap-3">
                    {['Até 500 MT', '500 - 2000 MT', '2000 - 5000 MT', 'Acima de 5k'].map(f => (
                      <FilterButton key={f} active={activeFilters.includes(f)} onClick={() => toggleFilter(f)}>{f}</FilterButton>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="Desconto" icon={Percent}>
                  <div className="grid grid-cols-2 gap-3">
                    {['10%+', '25%+', '50%+', '70%+'].map(f => (
                      <FilterButton key={f} active={activeFilters.includes(f)} onClick={() => toggleFilter(f)}>{f}</FilterButton>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="Tipo de Oferta" icon={Star}>
                  <div className="grid grid-cols-2 gap-4">
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat.id} 
                        onClick={() => toggleFilter(cat.id)}
                        className={`flex items-center gap-3 p-4 rounded-3xl border-2 transition-all ${activeFilters.includes(cat.id) ? 'border-orange bg-orange/5 text-orange' : 'border-slate-100 text-slate-400'}`}
                      >
                        <cat.icon className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </FilterSection>
              </div>

              <div className="sticky bottom-0 bg-white pt-4 border-t border-slate-50 flex gap-4">
                <button 
                  onClick={() => setShowFilters(false)}
                  className="flex-1 py-5 bg-navy text-white rounded-3xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                >
                  Ver Resultados
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterSection({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-navy">
          <Icon className="w-4 h-4" />
        </div>
        <h4 className="text-xs font-black text-navy uppercase tracking-widest">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode, key?: any }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-orange text-white shadow-lg shadow-orange/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
    >
      {children}
    </button>
  );
}
