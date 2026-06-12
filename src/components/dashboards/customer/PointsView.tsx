import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  Gift, 
  ArrowLeft, 
  Check, 
  HelpCircle, 
  Copy, 
  Share2, 
  Clock, 
  ArrowUpRight,
  TrendingUp,
  Flame,
  UserPlus
} from 'lucide-react';

interface PointsViewProps {
  profile: any;
  onBack: () => void;
}

interface PointTransaction {
  id: string;
  description: string;
  points: number;
  type: 'earn' | 'spend';
  date: string;
}

interface RewardCoupon {
  id: string;
  code: string;
  title: string;
  description: string;
  pointsCost: number;
  discountValue: string;
}

export function PointsView({ profile, onBack }: PointsViewProps) {
  const uid = profile?.uid || 'guest';
  const referralCode = profile?.referralLink || `https://moz.pro/invite/${uid.slice(0, 6)}`;

  const [points, setPoints] = useState<number>(850);
  const [copied, setCopied] = useState(false);
  const [pointsHistory, setPointsHistory] = useState<PointTransaction[]>([]);
  const [coupons, setCoupons] = useState<RewardCoupon[]>([]);
  const [myCoupons, setMyCoupons] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'my-coupons' | 'rules'>('catalog');

  // Load points and history from localStorage tied to this user
  useEffect(() => {
    const storedPoints = localStorage.getItem(`moz_points_${uid}`);
    const storedPointsHistory = localStorage.getItem(`moz_points_history_${uid}`);
    const storedMyCoupons = localStorage.getItem(`moz_my_coupons_${uid}`);

    if (storedPoints) {
      setPoints(Number(storedPoints));
    } else {
      localStorage.setItem(`moz_points_${uid}`, '850');
      setPoints(850);
    }

    if (storedPointsHistory) {
      setPointsHistory(JSON.parse(storedPointsHistory));
    } else {
      const initialHistory: PointTransaction[] = [
        { id: '1', description: 'Bónus de ativação de conta', points: 500, type: 'earn', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString() },
        { id: '2', description: 'Compra de produto #A612', points: 85, type: 'earn', date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toLocaleDateString() },
        { id: '3', description: 'Avaliação de serviço profissional', points: 50, type: 'earn', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString() },
        { id: '4', description: 'Convite de utilizador aceite', points: 215, type: 'earn', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString() },
      ];
      localStorage.setItem(`moz_points_history_${uid}`, JSON.stringify(initialHistory));
      setPointsHistory(initialHistory);
    }

    if (storedMyCoupons) {
      setMyCoupons(JSON.parse(storedMyCoupons));
    } else {
      setMyCoupons([]);
    }

    // Default Coupons Catalogue
    setCoupons([
      { id: 'c1', code: 'PROMO100MT', title: 'Desconto de 100 MT', description: 'Válido para qualquer compra ou serviço de valor mínimo de 500 MT', pointsCost: 150, discountValue: '100 MT' },
      { id: 'c2', code: 'ENTREGA_GRA_MZ', title: 'Entrega Grátis Maputo/Matola', description: 'Garante entrega 100% gratuita em todos os produtos do Marketplace', pointsCost: 250, discountValue: 'Grátis' },
      { id: 'c3', code: 'PROMO500MT', title: 'Cupão Especial 500 MT', description: 'Abatimento direto em serviços domésticos ou de tecnologia comercial', pointsCost: 600, discountValue: '500 MT' },
      { id: 'c4', code: 'MOZPRO15', title: '15% Off no Carrinho', description: 'Desconto geral de 15% em qualquer categoria selecionada', pointsCost: 400, discountValue: '15% Off' },
    ]);
  }, [uid]);

  const savePointsData = (currentPoints: number, history: PointTransaction[], savedCoupons: string[]) => {
    localStorage.setItem(`moz_points_${uid}`, String(currentPoints));
    localStorage.setItem(`moz_points_history_${uid}`, JSON.stringify(history));
    localStorage.setItem(`moz_my_coupons_${uid}`, JSON.stringify(savedCoupons));
    setPoints(currentPoints);
    setPointsHistory(history);
    setMyCoupons(savedCoupons);
  };

  const getTier = (pts: number) => {
    if (pts >= 3000) return { name: 'Platina', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30', nextName: 'Nível Máximo', nextPts: null, progress: 100 };
    if (pts >= 1500) return { name: 'Ouro', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30', nextName: 'Platina', nextPts: 3000, progress: ((pts - 1500) / 1500) * 100 };
    if (pts >= 500) return { name: 'Prata', color: 'text-slate-400 bg-slate-450/10 border-slate-400/30', nextName: 'Ouro', nextPts: 1500, progress: ((pts - 500) / 1000) * 100 };
    return { name: 'Bronze', color: 'text-orange bg-orange/10 border-orange/30', nextName: 'Prata', nextPts: 500, progress: (pts / 500) * 100 };
  };

  const tier = getTier(points);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaimCoupon = (coupon: RewardCoupon) => {
    if (points < coupon.pointsCost) {
      alert('Pontos insuficientes para adquirir este cupão!');
      return;
    }

    const confirmExchange = window.confirm(`Deseja trocar ${coupon.pointsCost} Pontos Moz pelo cupão de ${coupon.title}?`);
    if (!confirmExchange) return;

    const newPoints = points - coupon.pointsCost;
    const newTx: PointTransaction = {
      id: Math.random().toString(36).substring(2, 9),
      description: `Resgate do cupão ${coupon.code}`,
      points: coupon.pointsCost,
      type: 'spend',
      date: new Date().toLocaleDateString()
    };
    const updatedHistory = [newTx, ...pointsHistory];
    const updatedMyCoupons = [...myCoupons, coupon.code];

    savePointsData(newPoints, updatedHistory, updatedMyCoupons);
    alert(`Cupão resgatado com sucesso! Utilize o código ${coupon.code} no encerramento da sua encomenda.`);
  };

  // Safe action: Simulate friend referral to increase points for demo/test purposes
  const simulateFriendReferral = () => {
    const friendNames = ['Carlos Chirindza', 'Amélia Mondlane', 'José Macuácua', 'Albertina Tembe'];
    const randomFriend = friendNames[Math.floor(Math.random() * friendNames.length)];
    const bonusPoints = 150;

    const newPoints = points + bonusPoints;
    const newTx: PointTransaction = {
      id: Math.random().toString(36).substring(2, 9),
      description: `Indicação aceite: ${randomFriend}`,
      points: bonusPoints,
      type: 'earn',
      date: new Date().toLocaleDateString()
    };
    const updatedHistory = [newTx, ...pointsHistory];
    
    savePointsData(newPoints, updatedHistory, myCoupons);
    alert(`Sucesso! Simulamos uma indicação de "${randomFriend}". Recebeu +${bonusPoints} pontos Moz na sua conta.`);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in" id="customer-points-view">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-navy transition-colors font-bold text-xs uppercase"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-orange bg-orange/10 px-3 py-1.5 rounded-full">
          Fidelidade Moz ProServices
        </span>
      </div>

      {/* Main Points Card */}
      <section className="bg-navy rounded-[32px] p-6 lg:p-8 text-white relative overflow-hidden">
        {/* Decorative blur */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange/20 rounded-full blur-3xl -mr-12 -mt-12" />
        <div className="absolute -bottom-10 left-1/4 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-orange" />
              <span className={`text-[9px] font-black uppercase tracking-widest border px-2.5 py-0.5 rounded-full ${tier.color}`}>
                Nível {tier.name}
              </span>
            </div>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo de Fidelização</h2>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl lg:text-5xl font-black text-white">{points.toLocaleString()}</span>
              <span className="text-orange font-black text-lg tracking-wider uppercase">Pontos Moz</span>
            </div>

            {tier.nextPts ? (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-semibold">Próximo Nível: <strong>{tier.nextName}</strong></span>
                  <span className="font-extrabold text-orange">{points} / {tier.nextPts} pts</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-orange" style={{ width: `${Math.min(100, tier.progress)}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Faltam {tier.nextPts - points} pontos para obter vantagens premium!</p>
              </div>
            ) : (
              <p className="text-xs text-indigo-300 font-extrabold mt-4 flex items-center gap-1">
                <Flame className="w-4 h-4" /> Parabéns, atingiu o patamar de excelência Platina!
              </p>
            )}
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
            <h3 className="text-xs font-black uppercase text-orange tracking-wider flex items-center gap-1.5 mb-2">
              <UserPlus className="w-4 h-4" /> Convide Amigos, Ganhe Pontos
            </h3>
            <p className="text-slate-300 text-[11px] leading-relaxed mb-4">
              Partilhe o seu código único Moçambique. Receba 150 pontos por cada amigo que concluir a primeira encomenda ou serviço na nossa app!
            </p>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={referralCode}
                className="flex-1 bg-black/20 border border-white/15 h-9 rounded-xl px-3 text-xs text-slate-200 outline-none select-all font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="h-9 w-9 bg-orange hover:bg-orange/95 text-white rounded-xl flex items-center justify-center transition-transform shrink-0 active:scale-95 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="mt-3 flex justify-end">
              <button 
                onClick={simulateFriendReferral}
                className="text-[9px] font-black text-orange uppercase tracking-wider hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
              >
                Simular Indicação (+150 pts) <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Selector Tabs */}
      <div className="flex border-b border-slate-100 gap-6">
        {[
          { id: 'catalog', label: 'Comprar Cupões', icon: Gift },
          { id: 'my-coupons', label: `Meus Cupões (${myCoupons.length})`, icon: Check },
          { id: 'rules', label: 'Vantagens & Regras', icon: HelpCircle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 font-black text-xs uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id ? 'border-orange text-navy' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'catalog' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid sm:grid-cols-2 gap-4"
          >
            {coupons.map((coupon) => (
              <div 
                key={coupon.id}
                className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-orange transition-all shadow-soft flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-black text-orange uppercase tracking-widest bg-orange/10 px-2 py-0.5 rounded">
                        {coupon.discountValue}
                      </span>
                      <h4 className="font-extrabold text-navy text-sm mt-1.5 leading-tight">{coupon.title}</h4>
                    </div>
                    <span className="font-mono text-xs font-black text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                      {coupon.pointsCost} PTS
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed">{coupon.description}</p>
                </div>

                <div className="mt-5 border-t border-slate-50 pt-4 flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono text-slate-405 uppercase tracking-wide">Código: {coupon.code}</span>
                  <button
                    onClick={() => handleClaimCoupon(coupon)}
                    disabled={points < coupon.pointsCost}
                    className="px-4 py-2 bg-orange hover:bg-navy disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors active:scale-95 cursor-pointer"
                  >
                    Trocar Pontos
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'my-coupons' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {myCoupons.length > 0 ? (
              myCoupons.map((code, idx) => {
                const cDetails = coupons.find(c => c.code === code) || { title: 'Cupão Moz ProServices', discountValue: 'Desconto' };
                return (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                        <Gift className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-navy text-xs uppercase tracking-wide">{cDetails.title}</h4>
                        <p className="text-[10px] font-bold text-orange mt-0.5">Disponível para Aplicação</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black bg-slate-100 border border-slate-150 border-dashed px-3 py-1.5 rounded-xl text-navy">
                        {code}
                      </span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(code);
                          alert('Código copiado com sucesso! Pode aplicar no encerramento de encomendas.');
                        }}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-navy transition-colors cursor-pointer"
                        title="Copiar Código"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 bg-white border border-dashed border-slate-200 rounded-2xl">
                <Gift className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-bold">Ainda não possui cupões trocados.</p>
                <button 
                  onClick={() => setActiveTab('catalog')}
                  className="text-[10px] font-black text-orange uppercase tracking-wider mt-2 hover:underline bg-transparent border-none cursor-pointer"
                >
                  Ver Catálogo de Recompensas
                </button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'rules' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-soft space-y-6"
          >
            <div>
              <h3 className="font-extrabold text-navy text-sm uppercase tracking-wider mb-2">Como Acumular Pontos Moz?</h3>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-orange rounded-full mt-1.5 shrink-0" />
                  <span><strong>Compras em Geral</strong>: Cada 10 MT gastos no marketplace valem 1 Ponto Moz acumulado instantaneamente.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-orange rounded-full mt-1.5 shrink-0" />
                  <span><strong>Avaliações Úteis</strong>: Obtenha 50 pontos Moz para cada classificação sincera com estrelas e texto de avaliação real.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-orange rounded-full mt-1.5 shrink-0" />
                  <span><strong>Indicações Amigo</strong>: Partilhe o seu link e, se o utilizador se registar e fechar transações, ambos ganham 150 pontos!</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-slate-50 pt-4">
              <h3 className="font-extrabold text-navy text-sm uppercase tracking-wider mb-2">Nível & Benefícios Estelares</h3>
              <div className="space-y-3">
                {[
                  { name: 'Bronze', range: '0 a 499 pts', advantage: 'Acumulação padrão de pontos Moz.' },
                  { name: 'Prata', range: '500 a 1499 pts', advantage: 'Selecção exclusiva de cupões Moz + 5% bónus de recomendação.' },
                  { name: 'Ouro', range: '1500 a 2999 pts', advantage: 'Suporte prioritário rápido + ofertas de entrega gratuita em Maputo.' },
                  { name: 'Platina', range: '3000+ pts', advantage: 'Acesso VIP a promoções exclusivas + Isenção total de taxas de processamento de levantamento.' }
                ].map((tierItem) => (
                  <div key={tierItem.name} className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="font-black text-navy text-xs w-16">{tierItem.name}</span>
                    <span className="font-semibold text-orange text-[10px] w-24 shrink-0 font-mono bg-orange/5 px-2 py-0.5 rounded text-center">{tierItem.range}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{tierItem.advantage}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Points History */}
      <section className="bg-white rounded-[28px] border border-slate-100 shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-black text-navy text-xs uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange" />
            Histórico Recente de Pontos
          </h3>
        </div>
        
        <div className="divide-y divide-slate-50 max-h-[250px] overflow-y-auto">
          {pointsHistory.map((tx) => (
            <div key={tx.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
              <div className="text-left">
                <p className="font-extrabold text-navy">{tx.description}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{tx.date}</p>
              </div>
              <span className={`font-mono font-black ${tx.type === 'earn' ? 'text-green-600' : 'text-red-500'}`}>
                {tx.type === 'earn' ? '+' : '-'}{tx.points} pts
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
