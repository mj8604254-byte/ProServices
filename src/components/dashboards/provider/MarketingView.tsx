import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Tag, 
  Sparkles, 
  Percent, 
  Play, 
  Trash, 
  TrendingUp, 
  MousePointerClick, 
  Share2,
  BookmarkCheck,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';

interface MarketingViewProps {
  profile: any;
  onBack: () => void;
}

export function MarketingView({ profile, onBack }: MarketingViewProps) {
  const uid = profile?.uid || 'guest';

  // State metrics
  const [reach, setReach] = useState(5420);
  const [clicks, setClicks] = useState(1150);
  const [conversions, setConversions] = useState(245);

  // Active coupons list
  const [coupons, setCoupons] = useState<Array<{ code: string, discount: number, service: string, expiry: string }>>([
    { code: 'BENVINDO15', discount: 15, service: 'Todos os Serviços', expiry: '2026-07-31' },
    { code: 'CLIMAFRIO', discount: 10, service: 'Manutenção de AC', expiry: '2026-06-30' }
  ]);

  // Creator state
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState<number>(10);
  const [newService, setNewService] = useState('Todos os Serviços');
  const [newExpiry, setNewExpiry] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(`moz_marketing_${uid}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.coupons) setCoupons(parsed.coupons);
        if (parsed.reach) setReach(parsed.reach);
        if (parsed.clicks) setClicks(parsed.clicks);
        if (parsed.conversions) setConversions(parsed.conversions);
      } catch (e) {}
    }
  }, [uid]);

  const handleCreateCoupon = () => {
    if (!newCode || !newExpiry) return;
    const cleanCode = newCode.toUpperCase().replace(/\s+/g, '');
    const item = {
      code: cleanCode,
      discount: newDiscount,
      service: newService,
      expiry: newExpiry
    };
    const updated = [...coupons, item];
    setCoupons(updated);
    localStorage.setItem(`moz_marketing_${uid}`, JSON.stringify({ coupons: updated, reach, clicks, conversions }));
    setNewCode('');
    setNewExpiry('');
    alert(`Cupão de campanha ${cleanCode} criado com sucesso!`);
  };

  const handleDeleteCoupon = (idx: number) => {
    const updated = coupons.filter((_, i) => i !== idx);
    setCoupons(updated);
    localStorage.setItem(`moz_marketing_${uid}`, JSON.stringify({ coupons: updated, reach, clicks, conversions }));
  };

  const getConversionRate = () => {
    if (clicks === 0) return 0;
    return ((conversions / clicks) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6 text-left" id="marketing-view-root">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-navy transition-all cursor-pointer shadow-soft"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase text-orange tracking-[0.2em]">Crescimento & Conversões</span>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Marketing & Campanhas</h2>
          </div>
        </div>
      </div>

      {/* Stats indicators representing raw marketing funnel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Share2 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Alcance Orgânico</span>
            <h3 className="text-2xl font-black text-navy">{reach.toLocaleString()} <span className="text-xs text-slate-400">views</span></h3>
            <p className="text-[9px] text-green-550 font-black uppercase tracking-widest mt-0.5">▲ +12% esta semana</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft flex items-center gap-4">
          <div className="w-14 h-14 bg-orange/10 text-orange rounded-2xl flex items-center justify-center shrink-0">
            <MousePointerClick className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cliques no Perfil</span>
            <h3 className="text-2xl font-black text-navy">{clicks.toLocaleString()} <span className="text-xs text-slate-400">cliques</span></h3>
            <p className="text-[9px] text-green-550 font-black uppercase tracking-widest mt-0.5">▲ +5% conversão directa</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <BookmarkCheck className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pedidos Reais</span>
            <h3 className="text-2xl font-black text-navy">{conversions.toLocaleString()} <span className="text-xs text-slate-400">conversões</span></h3>
            <p className="text-[9px] font-black text-navy uppercase tracking-widest mt-0.5">Taxa Média: {getConversionRate()}%</p>
          </div>
        </div>

      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Create discount coupons */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
          <h3 className="text-md font-black text-navy uppercase tracking-widest flex items-center gap-2">
            <Tag className="w-5 h-5 text-orange" />
            Promoções e Códigos de Desconto
          </h3>

          <div className="space-y-4">
            
            {/* Input Row */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end p-4 bg-slate-50 rounded-2xl border border-slate-150">
              <div>
                <label className="block text-[9px] uppercase font-black text-slate-405 mb-1">Código Único</label>
                <input 
                  type="text" 
                  placeholder="Ex: PROMO20"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-250 text-xs text-navy bg-white focus:outline-none focus:border-orange font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-black text-slate-450 mb-1">Desconto (%)</label>
                <select
                  value={newDiscount}
                  onChange={(e) => setNewDiscount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-250 text-xs text-navy bg-white focus:outline-none focus:border-orange font-bold"
                >
                  <option value={5}>5% de Desconto</option>
                  <option value={10}>10% de Desconto</option>
                  <option value={15}>15% de Desconto</option>
                  <option value={20}>20% de Desconto</option>
                  <option value={25}>25% de Desconto</option>
                  <option value={50}>50% de Desconto</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-black text-slate-450 mb-1">Serviço Válido</label>
                <input 
                  type="text" 
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-250 text-xs text-navy bg-white focus:outline-none focus:border-orange font-bold text-left"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-black text-slate-450 mb-1">Validade Limite</label>
                <div className="flex gap-2">
                  <input 
                    type="date" 
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-250 text-xs text-navy bg-white focus:outline-none focus:border-orange font-bold text-left"
                  />
                  <button
                    onClick={handleCreateCoupon}
                    className="p-2.5 bg-navy hover:bg-orange text-white rounded-xl cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Active lists */}
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {coupons.map((coupon, i) => (
                <div key={i} className="py-3.5 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange/5 text-orange rounded-xl flex items-center justify-center font-bold">
                      <Percent className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-mono font-black text-navy tracking-wider text-sm">{coupon.code}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{coupon.service} • Abatimento de {coupon.discount}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 font-bold text-xs text-slate-500">
                    <span>Expira em: {new Date(coupon.expiry).toLocaleDateString('pt-MZ')}</span>
                    <button 
                      onClick={() => handleDeleteCoupon(i)}
                      className="p-1 text-slate-350 hover:text-rose-600 cursor-pointer border-none"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Campaign design strategy tips and recommendations */}
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
            <div>
              <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange" />
                Dicas de Conversão
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">Como atrair mais contratos em Maputo</p>
            </div>

            <div className="space-y-4 font-semibold text-xs leading-relaxed text-slate-650">
              <div className="p-4 bg-slate-50 rounded-2xl text-left border border-slate-100">
                <p className="font-extrabold text-navy uppercase text-[10px] text-orange tracking-widest mb-1">Campanhas na Sexta</p>
                Ofereça códigos promocionais específicos de 10% de desconto para agendamentos efetuados nas sextas-feiras de menor procura.
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl text-left border border-slate-100">
                <p className="font-extrabold text-navy uppercase text-[10px] text-orange tracking-widest mb-1">B2B Corporativo</p>
                Destaque serviços na sua galeria que demonstrem manutenções corporativas complexas para atrair o interesse de gerentes locais.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
