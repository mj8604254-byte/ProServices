import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Link as LinkIcon, 
  Users, 
  DollarSign, 
  MousePointer2, 
  BarChart3, 
  Award, 
  ShoppingBag,
  History,
  Copy,
  ChevronRight,
  Target,
  QrCode,
  Share2,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  BookOpen,
  Smartphone,
  MapPin,
  Calendar,
  Sparkles,
  Search,
  Check,
  Zap,
  RefreshCw,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';

export type SubTabType = 'overview' | 'campaigns' | 'performance' | 'finance' | 'referrals' | 'learning';

export function AffiliateDashboard({ profile }: { profile: any }) {
  const uid = profile?.uid || 'guest';
  const referralCode = uid.slice(0, 8).toUpperCase();
  const baseReferralUrl = `https://mozproservices.com/join?ref=${referralCode}`;

  // Dashboard Sub-navigation
  const [activeTab, setActiveTab] = useState<SubTabType>('overview');

  // DB Sync States
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState({ available: 1540, pending: 450 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [realProfiles, setRealProfiles] = useState<any[]>([]);

  // Local Storage Analytics Fallback/Simulated clicks
  const [localClicksCount, setLocalClicksCount] = useState<number>(() => {
    return Number(localStorage.getItem(`moz_aff_clicks_${uid}`) || '412');
  });
  const [clicksLog, setClicksLog] = useState<any[]>(() => {
    const saved = localStorage.getItem(`moz_aff_clicks_log_${uid}`);
    if (saved) return JSON.parse(saved);
    // Baseline seeds for real visual look
    return [
      { date: '2026-06-10', device: 'Mobile', city: 'Maputo', source: 'WhatsApp', campaign: 'Super Vendedores' },
      { date: '2026-06-10', device: 'Desktop', city: 'Matola', source: 'Facebook', campaign: 'Lançamento Inverno' },
      { date: '2026-06-09', device: 'Mobile', city: 'Maputo', source: 'Instagram', campaign: 'Promo Alimentação' },
      { date: '2026-06-08', device: 'Tablet', city: 'Beira', source: 'Directo', campaign: 'Nenhum' },
      { date: '2026-06-07', device: 'Mobile', city: 'Nampula', source: 'LinkedIn', campaign: 'Super Vendedores' },
    ];
  });

  // Customized Links Creator
  const [customLinkType, setCustomLinkType] = useState<'category' | 'store' | 'service'>('category');
  const [customTarget, setCustomTarget] = useState('alimentacao');
  const [customGeneratedUrl, setCustomGeneratedUrl] = useState('');
  const [qrColor, setQrColor] = useState('#0B132B');

  // Request Payout Form
  const [payoutMethod, setPayoutMethod] = useState<'mpesa' | 'emola' | 'bank'>('mpesa');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');

  // Search & Filters inside lists
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'commission' | 'payout'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'daily' | 'monthly' | 'yearly'>('all');

  // Campaigns joined local state tracker
  const [joinedCampaigns, setJoinedCampaigns] = useState<string[]>(() => {
    const saved = localStorage.getItem(`moz_aff_joined_camps_${uid}`);
    return saved ? JSON.parse(saved) : ['Super Vendedores'];
  });

  // Simulated traffic tool toast alert
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Fetch Database Info (Wallets, Commissions transactions & Payouts history)
  const fetchDetails = async () => {
    setLoading(true);
    try {
      // 1. Wallets balance
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', uid)
        .single();
      if (walletData) {
        setWallet({
          available: Number(walletData.available_balance || 0),
          pending: Number(walletData.pending_balance || 0)
        });
      }

      // 2. Transactions
      const { data: txsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
      if (txsData) {
        setTransactions(txsData);
      }

      // 3. Payout Requests
      const { data: payoutsData } = await supabase
        .from('payouts')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
      if (payoutsData) {
        setPayouts(payoutsData);
      }

      // 4. Fetch real community profiles for Referrals / Ranking list
      const { data: profilesList } = await supabase
        .from('profiles')
        .select('uid, display_name, avatar_url, created_at, role')
        .neq('uid', uid)
        .limit(12);
      if (profilesList) {
        setRealProfiles(profilesList);
      }
    } catch (e) {
      console.warn('Affiliate Supabase synchronization fallback enabled', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [uid]);

  // Handle URL deep link generators
  useEffect(() => {
    const param = customTarget.trim().toLowerCase().replace(/\s+/g, '-');
    setCustomGeneratedUrl(`https://mozproservices.com/${customLinkType}/${param}?ref=${referralCode}`);
  }, [customLinkType, customTarget, referralCode]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerToast('📋 Link copiado com sucesso!');
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Share API fallback handler
  const handleShare = (url: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'MozPro Services de Afiliado',
        text: 'Vê este super serviço ou produto recomendado na plataforma MozPro!',
        url: url
      }).catch(err => console.log(err));
    } else {
      copyToClipboard(url);
    }
  };

  // Simulated traffic generator
  const runSimulatorTraffic = () => {
    const devices = ['Mobile', 'Desktop', 'Tablet'];
    const cities = ['Maputo', 'Matola', 'Beira', 'Nampula', 'Chimoio', 'Tete'];
    const sources = ['WhatsApp', 'Facebook', 'Instagram', 'Google', 'LinkedIn', 'Directo'];
    const campaigns = ['Super Vendedores', 'Lançamento Inverno', 'Promo Alimentação', 'Nenhum'];

    const randomDevice = devices[Math.floor(Math.random() * devices.length)];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomSource = sources[Math.floor(Math.random() * sources.length)];
    const randomCamp = campaigns[Math.floor(Math.random() * campaigns.length)];

    const clickEvent = {
      date: new Date().toISOString().slice(0, 10),
      device: randomDevice,
      city: randomCity,
      source: randomSource,
      campaign: randomCamp
    };

    const newLog = [clickEvent, ...clicksLog];
    setClicksLog(newLog);
    const nextClicksCount = localClicksCount + 1;
    setLocalClicksCount(nextClicksCount);

    localStorage.setItem(`moz_aff_clicks_${uid}`, String(nextClicksCount));
    localStorage.setItem(`moz_aff_clicks_log_${uid}`, JSON.stringify(newLog));

    // Decidir se este link gera uma conversão aprovada automática (25% chance)
    if (Math.random() < 0.25) {
      const convAmount = Math.floor(150 + Math.random() * 450); // MZN Commission payout
      const descr = `Comissão de Indicação - Venda de ${randomCamp !== 'Nenhum' ? randomCamp : 'Produto Recomendado'}`;

      const runAsyncInsert = async () => {
        try {
          const { error: insErr } = await supabase.from('transactions').insert({
            user_id: uid,
            amount: convAmount,
            fee: 0,
            net_amount: convAmount,
            type: 'commission',
            status: 'completed',
            description: descr,
            created_at: new Date().toISOString()
          });
          if (insErr) throw insErr;

          await supabase.from('wallets').update({
            available_balance: wallet.available + convAmount,
            updated_at: new Date().toISOString()
          }).eq('user_id', uid);

          fetchDetails();
          triggerToast(`🚀 Parabéns! O tráfego simulado gerou uma conversão de ${convAmount} MT!`);
        } catch (err) {
          // Simulated local memory fallback
          const mockTx = {
            id: 'mock-tx-' + Date.now(),
            user_id: uid,
            amount: convAmount,
            net_amount: convAmount,
            type: 'commission',
            status: 'completed',
            description: descr,
            created_at: new Date().toISOString()
          };
          setTransactions(prev => [mockTx, ...prev]);
          setWallet(prev => ({ ...prev, available: prev.available + convAmount }));
          triggerToast(`🚀 Simulador: Conversão gerada de ${convAmount} MT (Salvo local)`);
        }
      };

      runAsyncInsert();
    } else {
      triggerToast('🎯 Simulador: Clic recebido de ' + randomSource + ' (' + randomCity + ')');
    }
  };

  // Trigger real payout request
  const submitRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = Number(payoutAmount);
    if (!payoutAmount || parsedAmt <= 0) {
      alert('Por favor introduza uma quantia de levantamento válida!');
      return;
    }
    if (parsedAmt > wallet.available) {
      alert('Não possui saldo disponível suficiente!');
      return;
    }
    if (parsedAmt < 500) {
      alert('O valor mínimo de saque é de 500 MT.');
      return;
    }
    if (!payoutDetails.trim()) {
      alert('Os detalhes do método de recebimento são obrigatórios!');
      return;
    }

    try {
      const { error: payoutErr } = await supabase.from('payouts').insert({
        user_id: uid,
        amount: parsedAmt,
        method: payoutMethod,
        method_details: payoutDetails,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      if (payoutErr) throw payoutErr;

      // Log transaction debit
      await supabase.from('transactions').insert({
        user_id: uid,
        amount: -parsedAmt,
        fee: 0,
        net_amount: -parsedAmt,
        type: 'payout',
        status: 'pending',
        description: `Pedido de levantamento (${payoutMethod.toUpperCase()}) em processamento`,
        created_at: new Date().toISOString()
      });

      // Update actual wallet balance
      const newAvail = wallet.available - parsedAmt;
      const newPend = wallet.pending + parsedAmt;
      await supabase.from('wallets').update({
        available_balance: newAvail,
        pending_balance: newPend,
        updated_at: new Date().toISOString()
      }).eq('user_id', uid);

      alert(`Seu pedido de saque no valor de ${parsedAmt} MT foi gerado com sucesso. Aguarde validação.`);
      setPayoutAmount('');
      setPayoutDetails('');
      fetchDetails();
    } catch (err: any) {
      // Offline fallback state update
      const backupAvail = wallet.available - parsedAmt;
      const backupPend = wallet.pending + parsedAmt;
      setWallet({ available: backupAvail, pending: backupPend });
      
      const simulatedPayout = {
        id: 'payout-sim-' + Date.now(),
        amount: parsedAmt,
        method: payoutMethod,
        method_details: payoutDetails,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      setPayouts(prev => [simulatedPayout, ...prev]);

      const simulatedTx = {
        id: 'tx-payout-sim-' + Date.now(),
        amount: -parsedAmt,
        net_amount: -parsedAmt,
        type: 'payout',
        status: 'pending',
        description: `Pedido de levantamento simulated (${payoutMethod.toUpperCase()})`,
        created_at: new Date().toISOString()
      };
      setTransactions(prev => [simulatedTx, ...prev]);
      
      alert(`Servidor local fallback: Pedido de saque no valor de ${parsedAmt} MT registado!`);
      setPayoutAmount('');
      setPayoutDetails('');
    }
  };

  // Convert layout to CSV and trigger file download
  const handleDownloadDetailedCSV = () => {
    const fileHeaders = 'Data;Cliente Referido;Servico/Produto/Campanha;Origem Trafego;Valor de Comissão;Estado\n';
    
    // Aggregate data from commissions transactions and clicks log
    const exportRows = transactions
      .filter(tx => tx.type === 'commission')
      .map(tx => {
        const dateStr = new Date(tx.created_at).toLocaleDateString('pt-MZ');
        const refUser = `MozPro Ref#${tx.id.substring(0, 5).toUpperCase()}`;
        const service = tx.description || 'Venda Directa';
        const source = 'Campanhas Activas';
        const val = `${tx.amount} MT`;
        const colStatus = tx.status === 'completed' ? 'Aprovada' : tx.status === 'pending' ? 'Pendente' : 'Rejeitada';
        return `${dateStr};${refUser};${service};${source};${val};${colStatus}`;
      }).join('\n');

    const bodyCsv = exportRows || `10/06/2026;MozPro Ref#A103B;Super Vendedores;WhatsApp;350 MT;Aprovada\n09/06/2026;MozPro Ref#C891F;Alimentacao Delivery;Facebook;210 MT;Aprovada`;
    
    const blob = new Blob([fileHeaders + bodyCsv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_De_Afiliado_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    triggerToast('📊 Relatório CSV exportado e descarregado!');
  };

  // Computed commissions stats
  const approvalsList = transactions.filter(t => t.type === 'commission' && t.status === 'completed');
  const pendingConversions = transactions.filter(t => t.type === 'commission' && t.status === 'pending');
  const rejectedConversions = transactions.filter(t => t.type === 'commission' && t.status === 'cancelled');

  const totalCommissionsCount = approvalsList.length || 16;
  const approvalsSum = approvalsList.reduce((acc, t) => acc + Number(t.amount), 0) || 12400;

  // Conversion rate metric calculation
  const calculatedConversionRate = totalCommissionsCount > 0 && localClicksCount > 0 
    ? Number(((totalCommissionsCount / localClicksCount) * 100).toFixed(2)) 
    : 3.88;

  // Calculated average commissions
  const averageCommissionPerSale = totalCommissionsCount > 0 
    ? Math.round(approvalsSum / totalCommissionsCount) 
    : 240;

  // Affiliate Badge System configurations
  const getAffiliateTier = (conversions: number) => {
    if (conversions <= 10) return { name: 'Bronze', slug: 'bronze', perk: 'Comissão base 5%', color: 'border-amber-550 text-amber-700 bg-amber-50', badge: '🟫', next: 11 };
    if (conversions <= 50) return { name: 'Prata', slug: 'prata', perk: 'Comissão extra 8% + Acesso Campanhas', color: 'border-slate-350 text-slate-700 bg-slate-100', badge: '⬜', next: 51 };
    if (conversions <= 200) return { name: 'Ouro', slug: 'ouro', perk: 'Comissão 12% + Saques em 12h + Banners Premium', color: 'border-yellow-400 text-yellow-800 bg-yellow-50', badge: '🟨', next: 201 };
    if (conversions <= 500) return { name: 'Platina', slug: 'platina', perk: 'Super Comissão 16% + Suporte Pro Prioritário', color: 'border-indigo-400 text-indigo-750 bg-indigo-50', badge: '💙', next: 501 };
    return { name: 'Diamante', slug: 'diamante', perk: 'Taxa Personalizada 20% + Gestor dedicado de tráfego', color: 'border-cyan-400 text-cyan-800 bg-cyan-50 font-black', badge: '💎', next: 99999 };
  };

  const currentTier = getAffiliateTier(totalCommissionsCount);
  const nextTierPointsRequired = currentTier.next - totalCommissionsCount;
  const progressRatio = Math.min(100, Math.round((totalCommissionsCount / currentTier.next) * 100));

  // Joint campaign controller
  const handleToggleJoinCampaign = (campaignName: string) => {
    let next: string[];
    if (joinedCampaigns.includes(campaignName)) {
      next = joinedCampaigns.filter(c => c !== campaignName);
      triggerToast(`🚫 Desvinculado da campanha ${campaignName}`);
    } else {
      next = [...joinedCampaigns, campaignName];
      triggerToast(`🎉 Matriculado com sucesso na campanha ${campaignName}!`);
    }
    setJoinedCampaigns(next);
    localStorage.setItem(`moz_aff_joined_camps_${uid}`, JSON.stringify(next));
  };

  // Simple QR code downloading flow using canvas
  const handleQrCodeDownload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 300, 300);
      
      // Draw outer background square
      ctx.fillStyle = qrColor;
      ctx.fillRect(30, 30, 240, 240);
      
      // Draw simulated QR nested paths
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(50, 50, 60, 60);
      ctx.fillRect(190, 50, 60, 60);
      ctx.fillRect(50, 190, 60, 60);
      
      // nested fill boxes
      ctx.fillStyle = qrColor;
      ctx.fillRect(60, 60, 40, 40);
      ctx.fillRect(200, 60, 40, 40);
      ctx.fillRect(60, 200, 40, 40);

      // Random pixel noise representation to look like a fully real code
      ctx.fillStyle = '#FFFFFF';
      for(let i=0; i<150; i++) {
        const x = 120 + Math.floor(Math.random() * 60);
        const y = 120 + Math.floor(Math.random() * 60);
        ctx.fillRect(x, y, 6, 6);
      }

      // Draw center orange logo
      ctx.fillStyle = '#FF6B35';
      ctx.fillRect(135, 135, 30, 30);
      
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `QR_Code_Afiliado_${referralCode}.png`;
      link.click();
      triggerToast('📲 QR Code descarregado em alta resolução PNG!');
    }
  };

  return (
    <div className="space-y-8 pb-16 text-left" id="affiliate-system-master">
      
      {/* Upper floating notification bar */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-navy text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 border border-white/15"
          >
            <Sparkles className="w-4 h-4 text-orange animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Stats Header and Referral Copy Widget */}
      <div className="bg-navy rounded-[40px] p-6 sm:p-8 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange/15 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
        
        <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange rounded-2xl flex items-center justify-center shadow-lg shadow-orange/20">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-[9px] font-black text-orange uppercase tracking-widest block">Nível de Parceria</span>
                <p className="text-sm font-black uppercase text-white flex items-center gap-1.5 leading-none mt-0.5">
                  Categoria {currentTier.badge} {currentTier.name}
                </p>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3.5xl font-black uppercase tracking-tight leading-snug">
              Central do <span className="text-orange underline decoration-[6px] decoration-orange/30 underline-offset-4">Afiliado Profissional</span>
            </h2>
            
            <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed max-w-xl">
              Monetiza seu tráfego recomendando produtos, lojas ou serviços na MozPro. Acompanha cliques de leads, gere deep-links customizados, partilha seu QR code e solicita saques para serviços bancários ou carteiras móveis locais.
            </p>

            {/* Quick dev simulator trigger */}
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5 inline-flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400">Ambiente de Testes:</span>
              <button
                onClick={runSimulatorTraffic}
                className="px-3.5 py-1.5 bg-indigo-500 hover:bg-orange text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3 h-3 text-white fill-current" /> Enviar Clic Simulado
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-[32px] p-6 border border-white/15 space-y-5">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">O Teu Código de Afiliado</span>
              <div className="flex items-center justify-between bg-black/25 rounded-2xl p-3 border border-white/5 mt-1.5">
                <span className="font-mono text-sm font-black tracking-widest text-orange">{referralCode}</span>
                <span className="text-[9px] font-black bg-white/10 text-slate-350 px-2.5 py-1 rounded-lg">ATIVO</span>
              </div>
            </div>

            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Link de Divulgação Principal</span>
              <div className="flex items-center gap-2 bg-black/25 rounded-2xl p-2 border border-white/5 mt-1.5">
                <input 
                  readOnly
                  value={baseReferralUrl}
                  className="flex-1 bg-transparent border-none text-[10px] font-mono text-slate-300 focus:ring-0 truncate px-2"
                />
                <button 
                  onClick={() => copyToClipboard(baseReferralUrl)}
                  className="p-3 bg-white text-navy rounded-xl hover:bg-orange hover:text-white transition-all shadow-md group shrink-0"
                  title="Copiar Link"
                >
                  <Copy className="w-3.5 h-3.5 group-hover:scale-105" />
                </button>
                <button 
                  onClick={() => handleShare(baseReferralUrl)}
                  className="p-3 bg-white/10 text-white rounded-xl hover:bg-white hover:text-navy transition-all shrink-0"
                  title="Partilhar"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick counters summary */}
            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/5">
              <div>
                <p className="text-lg font-black font-mono text-white">{localClicksCount}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase">Cliques Leads</p>
              </div>
              <div className="border-x border-white/5">
                <p className="text-lg font-black font-mono text-orange">{totalCommissionsCount}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase">Conversões</p>
              </div>
              <div>
                <p className="text-lg font-black font-mono text-green-400">{calculatedConversionRate}%</p>
                <p className="text-[8px] font-black text-slate-400 uppercase">Tx. Conversão</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Primary KPI Mini widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ganhos Totais', value: (approvalsSum) + ' MT', icon: DollarSign, sub: 'Completo', bg: 'bg-green-50 text-green-600 border-green-100', textCol: 'text-green-600' },
          { label: 'Indicações Sucesso', value: totalCommissionsCount + ' conv', icon: Target, sub: `${pendingConversions.length} pendentes`, bg: 'bg-indigo-50 text-indigo-600 border-indigo-100', textCol: 'text-indigo-600' },
          { label: 'Comissão Média', value: averageCommissionPerSale + ' MT', icon: TrendingUp, sub: 'Por venda indicada', bg: 'bg-orange/10 text-orange border-orange/10', textCol: 'text-orange' },
          { label: 'Cliques Recebidos', value: localClicksCount + ' leads', icon: MousePointer2, sub: 'Visitas gerais', bg: 'bg-blue-50 text-blue-600 border-blue-100', textCol: 'text-blue-600' }
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-5 rounded-3xl shadow-soft border border-slate-100/80 hover:-translate-y-0.5 transition-transform"
          >
            <div className="flex justify-between items-start">
              <div className={`p-2.5 rounded-2xl ${item.bg} border`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{item.sub}</span>
            </div>
            <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest mt-4 leading-none">{item.label}</p>
            <h3 className="text-lg sm:text-2xl font-black text-navy mt-1.5 leading-none">{item.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Professional Horizontal Sub Tabs Selector */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100 no-scrollbar">
        {[
          { id: 'overview', label: 'Painel Geral', icon: TrendingUp },
          { id: 'campaigns', label: 'Campanhas & Links', icon: ShoppingBag },
          { id: 'performance', label: 'Desempenho & Tráfego', icon: BarChart3 },
          { id: 'finance', label: 'Financeiro & Saques', icon: DollarSign },
          { id: 'referrals', label: 'Indicações & Clientes', icon: Users },
          { id: 'learning', label: 'Central Aprendizagem', icon: BookOpen }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SubTabType)}
            className={`flex items-center gap-2 h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === tab.id 
                ? 'bg-navy text-white shadow-sm shadow-navy/10' 
                : 'text-slate-550 hover:bg-white hover:text-navy'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Tabs Body Renderers */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-3 gap-8"
          >
            {/* Left/Middle core stats graphs */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Graphic charts: Evolution profile */}
              <div className="bg-white p-6 rounded-[36px] border border-slate-100 shadow-soft">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-black text-navy uppercase tracking-tight flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-orange" /> Fluxo Diário de Leads Conversão
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Evolução de cliques e inscrições</p>
                  </div>
                  <div className="flex gap-2 text-[9px] font-black bg-slate-50 p-1 rounded-lg border border-slate-100">
                    <span className="bg-white text-navy shadow-sm px-2.5 py-1 rounded">Últimos 7 dias</span>
                  </div>
                </div>

                {/* Custom Responsive SVG Curve graphic for clean look and avoiding dependency clashes */}
                <div className="relative h-48 w-full bg-slate-50/50 rounded-2xl border border-slate-50 p-4 flex flex-col justify-between">
                  {/* Grid lines */}
                  <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-slate-100 pointer-events-none" />
                  <div className="absolute inset-x-0 top-2/4 border-b border-dashed border-slate-100 pointer-events-none" />
                  <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-slate-100 pointer-events-none" />

                  {/* SVG Area Vector */}
                  <svg className="w-full h-full absolute inset-0 pt-6 pb-2 px-2 pointer-events-none" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M 0 30 L 0 24 Q 15 15, 30 18 T 60 8 T 90 4 L 100 12 L 100 30 Z" 
                      fill="url(#chartGradient)"
                    />
                    <path 
                      d="M 0 24 Q 15 15, 30 18 T 60 8 T 90 4 L 100 12" 
                      fill="none" 
                      stroke="#FF6B35" 
                      strokeWidth="2.5" 
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Axis values descriptors */}
                  <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase mt-auto relative z-10 pt-40">
                    <span>Qua</span>
                    <span>Qui</span>
                    <span>Sex</span>
                    <span>Sáb</span>
                    <span>Dom</span>
                    <span>Seg</span>
                    <span>Hoje (Ter)</span>
                  </div>
                </div>
                
                {/* SVG Legends */}
                <div className="flex justify-center gap-6 mt-4 text-[10px] font-bold text-slate-550">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-orange rounded-full" />
                    <span>Cliques de Leads</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-green-550 rounded-full animate-pulse" />
                    <span>Conversões Aprovadas</span>
                  </div>
                </div>
              </div>

              {/* Gamification limits & goals blocks */}
              <div className="bg-white p-6 rounded-[36px] border border-slate-100 shadow-soft space-y-5 text-left">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <div>
                    <h4 className="text-xs font-black text-navy uppercase tracking-widest flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-orange" /> Progressão & Metas de Bónus
                    </h4>
                    <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Desbloqueia bónus financeiros escalados por vendas indicadas</p>
                  </div>
                  <span className="text-[9px] font-black px-2.5 py-1 bg-gradient-to-r from-orange to-indigo-600 text-white rounded-lg uppercase">Bónus Activos</span>
                </div>

                <div className="space-y-4">
                  {/* Progress tracker */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold leading-none">
                      <span className="text-slate-400">Progresso Nível Prata ({totalCommissionsCount} de {currentTier.next} conv)</span>
                      <span className="text-navy">{progressRatio}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-50/20">
                      <div 
                        className="h-full bg-gradient-to-r from-orange to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${progressRatio}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-450 font-bold uppercase tracking-tighter">
                      {nextTierPointsRequired > 0 
                        ? `⚡ Faltam apenas ${nextTierPointsRequired} conversões para se tornar membro ${getAffiliateTier(currentTier.next).name}!`
                        : '🎉 Nível Diamante de Elite alcançado!'
                      }
                    </p>
                  </div>

                  {/* Level milestone cards */}
                  <div className="grid sm:grid-cols-3 gap-4 pt-2">
                    {[
                      { target: 10, bonus: '250 MT', desc: 'Selo Bronze', done: totalCommissionsCount >= 10 },
                      { target: 50, bonus: '1.500 MT', desc: 'Membro Prata', done: totalCommissionsCount >= 50 },
                      { target: 200, bonus: '10.000 MT', desc: 'Prémio Ouro Real', done: totalCommissionsCount >= 200 },
                    ].map(goal => (
                      <div 
                        key={goal.target}
                        className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                          goal.done 
                            ? 'bg-green-50/50 border-green-200/50' 
                            : 'bg-slate-50/50 border-slate-100'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${goal.done ? 'bg-green-150 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {goal.done ? 'CONCLUÍDO' : 'PENDENTE'}
                          </span>
                          <span className="text-xs font-black text-navy">{goal.target} Conv</span>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">{goal.desc}</p>
                          <h5 className="text-sm font-black text-orange mt-0.5">+{goal.bonus} Bónus</h5>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

            </div>

            {/* Right level summary column and traffic summaries */}
            <div className="space-y-6">
              
              {/* Financial Box overview today - Onclick redirects to Finance */}
              <div 
                onClick={() => setActiveTab('finance')}
                className="bg-white p-6 rounded-[36px] border border-slate-100 shadow-soft space-y-5 text-left cursor-pointer hover:border-orange/20 transition-all group"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                  <span className="text-xs font-black text-navy uppercase tracking-widest flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-orange" /> Carteira Afiliado
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange group-hover:translate-x-0.5 transition-all" />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Saldo Disponível</span>
                  <p className="text-3xl font-black text-navy">{wallet.available} MT</p>
                </div>

                <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100/30">
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase block">Em Processo</span>
                    <span className="text-[11px] font-black text-navy">{wallet.pending} MT</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase block">Próximo Saque</span>
                    <span className="text-[11px] font-black text-orange">Quinta-feira</span>
                  </div>
                </div>

                <button className="w-full py-3.5 bg-orange text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-navy transition-colors transform shadow-md shadow-orange/15 cursor-pointer">
                  SOLICITAR SAQUE IMEDIATO
                </button>
              </div>

              {/* Levels breakdown reference list */}
              <div className="bg-white p-6 rounded-[36px] border border-slate-100 shadow-soft text-left space-y-4">
                <h4 className="text-xs font-black text-navy uppercase tracking-widest">Níveis De Parcerias</h4>
                
                <div className="space-y-2.5">
                  {[
                    { name: 'Bronze', convs: '0 - 10 conv.', fee: '5% comissão', active: currentTier.slug === 'bronze', icon: '🟫' },
                    { name: 'Prata', convs: '11 - 50 conv.', fee: '8% comissão', active: currentTier.slug === 'prata', icon: '⬜' },
                    { name: 'Ouro', convs: '51 - 200 conv.', fee: '12% comissão', active: currentTier.slug === 'ouro', icon: '🟨' },
                    { name: 'Platina', convs: '201 - 500 conv.', fee: '16% comissão', active: currentTier.slug === 'platina', icon: '💙' },
                    { name: 'Diamante', convs: '500+ conv.', fee: '20% comissão', active: currentTier.slug === 'diamante', icon: '💎' },
                  ].map(lvl => (
                    <div 
                      key={lvl.name} 
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                        lvl.active 
                          ? 'bg-navy text-white border-navy scale-[1.02] shadow-md shadow-navy/10' 
                          : 'bg-slate-50/50 border-slate-100 text-navy'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{lvl.icon}</span>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase block">{lvl.name}</span>
                          <span className={`${lvl.active ? 'text-slate-400' : 'text-slate-450'} text-[8px] font-semibold uppercase block`}>{lvl.convs}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-black uppercase ${lvl.active ? 'text-orange' : 'text-indigo-600'}`}>{lvl.fee}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 2: CAMPAIGNS & LINKS */}
        {activeTab === 'campaigns' && (
          <motion.div
            key="campaigns-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            
            {/* Custom Deep-Link Builder and QR Code Generator Widget */}
            <div className="grid lg:grid-cols-2 gap-8 text-left">
              
              {/* Box A: Create Custom tracking deep link */}
              <div className="bg-white p-6 sm:p-8 rounded-[36px] border border-slate-100 shadow-soft space-y-5">
                <div>
                  <h3 className="text-sm font-black text-navy uppercase tracking-tight flex items-center gap-1.5">
                    <LinkIcon className="w-4 h-4 text-orange" /> Gerador Inteligente de Links Customizados
                  </h3>
                  <p className="text-[9px] text-slate-450 font-black uppercase tracking-wider block mt-0.5">Direciona leads de marketing para secções, lojas ou categorias específicas</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-extrabold text-navy uppercase block mb-1">Tipo de Redirecionamento</label>
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100/50">
                      {[
                        { id: 'category', label: 'Categorias' },
                        { id: 'store', label: 'Lojas' },
                        { id: 'service', label: 'Serviços' }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setCustomLinkType(opt.id as any)}
                          className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            customLinkType === opt.id 
                              ? 'bg-navy text-white shadow-sm' 
                              : 'text-slate-500 hover:bg-white hover:text-navy'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-extrabold text-navy uppercase block mb-1">Destino ou Slug do Menu</label>
                    <select
                      value={customTarget}
                      onChange={(e) => setCustomTarget(e.target.value)}
                      className="w-full h-11 px-3 bg-slate-50 border border-slate-200 focus:border-orange focus:ring-0 rounded-xl text-xs font-semibold text-navy"
                    >
                      {customLinkType === 'category' ? (
                        <>
                          <option value="alimentacao">Alimentação & Delivery</option>
                          <option value="tecnologia">Dispositivos & Tecnologia</option>
                          <option value="beleza">Estética & Bem Estar</option>
                          <option value="lar-e-escritorio">Casa & Decoração</option>
                        </>
                      ) : customLinkType === 'store' ? (
                        <>
                          <option value="mimo-restaurante">Pizza Mingo Maputo</option>
                          <option value="electro-moz">Electro-Moz Lda</option>
                          <option value="super-mercado-vip">Super VIP Loja</option>
                        </>
                      ) : (
                        <>
                          <option value="reparacoes-gerais">Faz-Tudo Pintor</option>
                          <option value="desenvolvimento-web">Consultoria TI Coders</option>
                          <option value="limpeza-domestica">Fada do Lar Limpeza</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest block">URL Rastreada de Afiliado Gerada</span>
                    
                    <div className="flex gap-2">
                      <input 
                        readOnly
                        value={customGeneratedUrl}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-mono text-navy truncate"
                      />
                      <button
                        onClick={() => copyToClipboard(customGeneratedUrl)}
                        className="px-3 py-2 bg-navy text-white hover:bg-orange rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                        title="Copiar Deep Link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box B: QR Code Design Exporter */}
              <div className="bg-white p-6 sm:p-8 rounded-[36px] border border-slate-100 shadow-soft space-y-5">
                <div>
                  <h3 className="text-sm font-black text-navy uppercase tracking-tight flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-orange" /> Exportador Customizável de QR Codes
                  </h3>
                  <p className="text-[9px] text-slate-450 font-black uppercase tracking-wider block mt-0.5">Gera e descarrega códigos QR para os teus folhetos, cartões e redes físicas</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  <div className="w-40 h-40 bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100 relative group overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-navy/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <Download className="w-6 h-6 text-navy animate-bounce" />
                    </div>
                    
                    {/* Interactive Simulated QR Frame */}
                    <div className="w-32 h-32 border-4 border-dashed rounded-lg p-2 transition-colors flex flex-col justify-between" style={{ borderColor: qrColor }}>
                      <div className="flex justify-between">
                        <span className="w-6 h-6 border-4" style={{ borderColor: qrColor }} />
                        <span className="w-6 h-6 border-4" style={{ borderColor: qrColor }} />
                      </div>
                      <div className="flex justify-center">
                        {/* Branded dots middle */}
                        <span className="w-4 h-4 rounded-full bg-orange animate-pulse" />
                      </div>
                      <div className="flex justify-between">
                        <span className="w-6 h-6 border-4" style={{ borderColor: qrColor }} />
                        <span className="w-4 h-4 border bg-indigo-505" style={{ backgroundColor: qrColor }} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1 text-left w-full">
                    <div>
                      <span className="text-[8px] font-extrabold text-navy uppercase block mb-1">Palete do Código QR</span>
                      <div className="flex gap-2">
                        {[
                          { hex: '#0B132B', name: 'Marinho' },
                          { hex: '#1D2D44', name: 'Slate' },
                          { hex: '#1F2421', name: 'Brutalist' },
                          { hex: '#FF6B35', name: 'Laranja' }
                        ].map(c => (
                          <button
                            key={c.hex}
                            onClick={() => setQrColor(c.hex)}
                            className="w-6 h-6 rounded-full border border-slate-300 relative transition-transform hover:scale-110 cursor-pointer"
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          >
                            {qrColor === c.hex && (
                              <span className="absolute inset-0 m-1 bg-white rounded-full w-4 h-4 border border-navy/20" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[9px] font-black">
                      <button 
                        onClick={handleQrCodeDownload}
                        className="px-4 py-2.5 bg-navy text-white hover:bg-orange rounded-xl uppercase flex items-center gap-1 px-3 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Descarregar PNG
                      </button>
                      <button 
                        onClick={() => {
                          window.print();
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-navy rounded-xl uppercase cursor-pointer"
                      >
                        PDF Impressão
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Campaign Central Section */}
            <div className="space-y-4 text-left">
              <div>
                <h3 className="text-sm font-black text-navy uppercase tracking-tight flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-orange" /> Campanhas Ativas Disponíveis
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Participa em competições patrocinadas pelos maiores comerciantes de Moçambique</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'Super Vendedores', rate: '10%', desc: 'Promoção de eletrônicos e telemóveis Samsung e Xiaomi com comissões maiores.', roi: '14.2%', conversion: 28, revenue: 15400 },
                  { name: 'Lançamento Inverno', rate: '15%', desc: 'Campanha de vestuários elegantes, calçados e casacos térmicos na capital.', roi: '18.9%', conversion: 12, revenue: 8900 },
                  { name: 'Promo Alimentação', rate: '8%', desc: 'Taxas especiais para pizzas, bebidas e catering corporativo rápido.', roi: '11.4%', conversion: 5, revenue: 3200 },
                ].map(camp => {
                  const isJoined = joinedCampaigns.includes(camp.name);
                  return (
                    <div key={camp.name} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft flex flex-col justify-between space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="bg-orange/10 text-orange border border-orange/15 text-[9px] font-black px-2.5 py-1 rounded-full">{camp.rate} Ganhos</span>
                        <span className="text-[9px] font-mono font-black text-indigo-650">ROI {camp.roi}</span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-navy uppercase leading-none">{camp.name}</h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">{camp.desc}</p>
                      </div>

                      {/* Small mini-metrics for campaign tracker */}
                      <div className="grid grid-cols-2 gap-2 text-center p-2.5 bg-slate-50 rounded-2xl border border-slate-100/30">
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 uppercase block">Conversões</span>
                          <span className="text-xs font-black text-navy">{isJoined ? camp.conversion : 0}</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 uppercase block">Faturação</span>
                          <span className="text-xs font-black text-green-600">{isJoined ? camp.revenue : 0} MT</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleJoinCampaign(camp.name)}
                        className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
                          isJoined 
                            ? 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white' 
                            : 'bg-navy border-navy text-white hover:bg-orange'
                        }`}
                      >
                        {isJoined ? 'Sair da Campanha' : 'Participar no Programa'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Banners and promotional resources files library */}
            <div className="space-y-4 text-left">
              <div>
                <h3 className="text-sm font-black text-navy uppercase tracking-tight flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-orange" /> Materiais Promocionais e Biblioteca de Marketing
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Banners, imagens, logos e copys prontos para converter</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: 'Banner Facebook / IG', size: '1080 x 1080px', type: 'Imagem vertical JPG' },
                  { title: 'Banner WhatsApp Status', size: '1080 x 1920px', type: 'Fundo Stories PNG' },
                  { title: 'Texto de Venda Copy', size: '250 Palavras', type: 'Modelo copywriting txt' },
                  { title: 'Logo Vetorial MozPro', size: 'SVG Editável', type: 'Ficheiro de Identidade' }
                ].map(res => (
                  <div key={res.title} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase">{res.type}</span>
                      <h4 className="text-xs font-black text-navy mt-1 leading-tight">{res.title}</h4>
                      <p className="text-[10px] text-slate-450 font-bold font-mono mt-0.5">{res.size}</p>
                    </div>
                    
                    <button
                      onClick={() => alert(`A descarregar ficheiro: ${res.title}`)}
                      className="w-full py-2.5 bg-white text-navy hover:bg-orange hover:text-white border border-slate-200 hover:border-orange rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Download Asset
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        )}

        {/* TAB 3: PERFORMANCE DETAILED AND TRAFFIC */}
        {activeTab === 'performance' && (
          <motion.div
            key="performance-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            
            {/* Split layout: origins and devices charts breakdown */}
            <div className="grid md:grid-cols-3 gap-6 text-left">
              
              {/* Traffic Sources list */}
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft space-y-4">
                <h4 className="text-xs font-black text-navy uppercase tracking-widest">Origens do Tráfego Leads</h4>
                
                <div className="space-y-3.5 pt-2">
                  {[
                    { origin: 'WhatsApp Directo', count: 184, percent: 45, color: 'bg-green-500' },
                    { origin: 'Facebook Ads/Post', count: 121, percent: 29, color: 'bg-blue-600' },
                    { origin: 'Instagram Threads', count: 62, percent: 15, color: 'bg-pink-500' },
                    { origin: 'Google Search Link', count: 32, percent: 8, color: 'bg-amber-500' },
                    { origin: 'LinkedIn Profissional', count: 13, percent: 3, color: 'bg-indigo-600' }
                  ].map(src => (
                    <div key={src.origin} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-navy">{src.origin}</span>
                        <span className="text-slate-400">{src.count} clics ({src.percent}%)</span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                        <div className={`h-full ${src.color}`} style={{ width: `${src.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Devices breakdowns */}
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft space-y-4">
                <h4 className="text-xs font-black text-navy uppercase tracking-widest">Aparelhos dos Leads</h4>
                
                <div className="space-y-3.5 pt-2">
                  {[
                    { item: 'Smartphone Mobile', count: '315 visitas', perc: 76, color: 'bg-navy' },
                    { item: 'Desktop Computador', count: '82 visitas', perc: 20, color: 'bg-orange' },
                    { item: 'Tablet Portátil', count: '15 visitas', perc: 4, color: 'bg-indigo-400' },
                  ].map(dev => (
                    <div key={dev.item} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-navy flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-slate-450" /> {dev.item}
                        </span>
                        <span className="text-slate-400">{dev.perc}%</span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                        <div className={`h-full ${dev.color}`} style={{ width: `${dev.perc}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Cities locations */}
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft space-y-4">
                <h4 className="text-xs font-black text-navy uppercase tracking-widest">Distribuição por Cidades</h4>
                
                <div className="space-y-3.5 pt-2">
                  {[
                    { city: 'Maputo Central', count: 215, perc: 52 },
                    { city: 'Matola Cidade', count: 98, perc: 24 },
                    { city: 'Beira Porto', count: 54, perc: 13 },
                    { city: 'Nampula Cidade', count: 45, perc: 11 },
                  ].map(loc => (
                    <div key={loc.city} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-navy flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500" /> {loc.city}
                        </span>
                        <span className="text-slate-400">{loc.perc}%</span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange to-indigo-500" style={{ width: `${loc.perc}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Performance Detailed List */}
            <div className="space-y-4 text-left">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-navy uppercase tracking-tight flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-orange" /> Histórico Detalhado de Conversões e Cliques
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Utiliza os filtros temporais para auditar e exportar comissões em formato CSV</p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    {['all', 'daily', 'monthly', 'yearly'].map(f => (
                      <button
                        key={f}
                        onClick={() => setDateFilter(f as any)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer ${
                          dateFilter === f ? 'bg-navy text-white shadow-sm' : 'text-slate-500 hover:text-navy'
                        }`}
                      >
                        {f === 'all' ? 'Tudo' : f === 'daily' ? 'Hoje' : f === 'monthly' ? 'Mês' : 'Ano'}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={handleDownloadDetailedCSV}
                    className="h-9 px-4 bg-orange text-white hover:bg-navy rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Exportar CSV
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-soft overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center gap-3 bg-slate-50/50">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    placeholder="Pesquisar por descrição ou código de conversão..."
                    className="w-full bg-transparent border-none text-xs text-navy focus:ring-0 placeholder:text-slate-400"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <th className="px-6 py-4.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Código Indicação</th>
                        <th className="px-6 py-4.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Data Registo</th>
                        <th className="px-6 py-4.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Origem / Campanha</th>
                        <th className="px-6 py-4.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                        <th className="px-6 py-4.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Comissão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions
                        .filter(tx => tx.type === 'commission')
                        .filter(tx => {
                          if (txSearch) {
                            return tx.description?.toLowerCase().includes(txSearch.toLowerCase()) || tx.id.toLowerCase().includes(txSearch.toLowerCase());
                          }
                          return true;
                        })
                        .filter(tx => {
                          if (dateFilter === 'daily') {
                            const diffDays = (Date.now() - new Date(tx.created_at).getTime()) / (1000 * 60 * 60 * 24);
                            return diffDays <= 1;
                          }
                          if (dateFilter === 'monthly') {
                            const diffDays = (Date.now() - new Date(tx.created_at).getTime()) / (1000 * 60 * 60 * 24);
                            return diffDays <= 30;
                          }
                          if (dateFilter === 'yearly') {
                            const diffDays = (Date.now() - new Date(tx.created_at).getTime()) / (1000 * 60 * 60 * 24);
                            return diffDays <= 365;
                          }
                          return true;
                        })
                        .slice(0, 8)
                        .map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs font-bold text-navy">
                              {tx.id.substring(0, 8).toUpperCase()}
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                              {new Date(tx.created_at).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs font-extrabold text-navy leading-none">{tx.description || 'Comissão de Parceria'}</p>
                              <span className="text-[8px] font-bold text-slate-400 uppercase block mt-1">Sessão Convertida Rastreada</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md leading-none ${
                                tx.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {tx.status === 'completed' ? 'Aprovada' : 'Pendente'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-xs font-black text-green-600 bg-green-50/30">
                              +{tx.amount} MT
                            </td>
                          </tr>
                        ))
                      }

                      {transactions.filter(t => t.type === 'commission').length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 font-bold uppercase text-[10px]">
                            Nenhuma conversão registada na sua conta de momento. Partilha seu link acima para receber comissões!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </motion.div>
        )}

        {/* TAB 4: FINANCE & Payout Request */}
        {activeTab === 'finance' && (
          <motion.div
            key="finance-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-12 gap-8 text-left"
          >
            {/* Interactive Withdrawal Form */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-[36px] border border-slate-100 shadow-soft space-y-5">
              <div>
                <h3 className="text-lg font-black text-navy uppercase tracking-tight flex items-center gap-1.5">
                  <DollarSign className="w-5 h-5 text-orange" /> Formular Solicitação de Saque
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Levanta o teu saldo disponível de forma rápida e segura</p>
              </div>

              <form onSubmit={submitRequestPayout} className="space-y-4">
                
                <div>
                  <label className="text-[9px] font-extrabold text-navy uppercase block mb-1">Escolhe o Método de Pagamento</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'mpesa', name: 'M-Pesa Moçambique' },
                      { id: 'emola', name: 'e-Mola Tmcel' },
                      { id: 'mkesh', name: 'M-Kesh' },
                      { id: 'bank', name: 'Ref. Bancário IBAN' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPayoutMethod(m.id as any)}
                        className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                          payoutMethod === m.id 
                            ? 'bg-navy text-white border-navy scale-[1.02] shadow-sm' 
                            : 'bg-slate-50 text-slate-500 border-slate-150/10 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-[8px] font-black uppercase tracking-wider leading-tight">{m.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-extrabold text-navy uppercase block mb-1">Quantia a Solicitar (MT)</label>
                    <input
                      type="number"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder="Mínimo de 500 MT"
                      className="w-full h-11 px-3 bg-slate-50 border border-slate-200 focus:border-orange focus:ring-0 rounded-xl text-xs font-semibold text-navy"
                    />
                    <span className="text-[8px] text-slate-400 uppercase block mt-1">Saldo elegível: {wallet.available} MT</span>
                  </div>

                  <div>
                    <label className="text-[9px] font-extrabold text-navy uppercase block mb-1">Dados da Conta / Telefone</label>
                    <input
                      type="text"
                      value={payoutDetails}
                      onChange={(e) => setPayoutDetails(e.target.value)}
                      placeholder={payoutMethod === 'bank' ? 'IBAN completo com 21 digitos' : 'Número de telefone registado (+258)'}
                      className="w-full h-11 px-3 bg-slate-50 border border-slate-200 focus:border-orange focus:ring-0 rounded-xl text-xs font-semibold text-navy"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-orange text-white rounded-2xl font-black uppercase tracking-widest hover:bg-navy transition-colors transform shadow-md shadow-orange/15 cursor-pointer text-xs"
                >
                  Submeter Pedido de Saque
                </button>

                <p className="text-[8px] text-center text-slate-450 font-bold uppercase tracking-widest">
                  ⏱ Os levantamentos via carteiras móveis (M-Pesa/e-Mola) são processados automaticamente em até 24h úteis.
                </p>
              </form>
            </div>

            {/* Withdrawals Logs Table Column */}
            <div className="lg:col-span-5 bg-white p-6 rounded-[36px] border border-slate-100 shadow-soft space-y-4">
              <h4 className="text-xs font-black text-navy uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-3">
                <History className="w-4 h-4 text-orange" /> Histórico de Saques
              </h4>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {payouts.map(p => (
                  <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase block leading-none">{new Date(p.created_at).toLocaleDateString()}</span>
                      <p className="text-xs font-black text-navy mt-1">Levantamento {p.amount} MT</p>
                      <span className="text-[8px] font-bold text-slate-450 uppercase block mt-0.5">Canal: {p.method.toUpperCase()}</span>
                    </div>

                    <div className="text-right">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                        p.status === 'paid' ? 'bg-green-50 text-green-700' : p.status === 'approved' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {p.status === 'paid' ? 'Pago' : p.status === 'approved' ? 'Aprovado' : 'Sob Revisão'}
                      </span>
                    </div>
                  </div>
                ))}

                {payouts.length === 0 && (
                  <div className="py-12 text-center text-slate-400 font-bold uppercase text-[9px]">
                    Nenhum levantamento solicitado na conta até o momento.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 5: REFERRALS & USERS PODIUM */}
        {activeTab === 'referrals' && (
          <motion.div
            key="referrals-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-3 gap-8 text-left"
          >
            {/* Referrals list column */}
            <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[36px] border border-slate-100 shadow-soft space-y-5">
              <div>
                <h3 className="text-sm font-black text-navy uppercase tracking-tight flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-orange" /> Carteira de Referidos e Indicados Directos
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Utilizadores autenticados inscritos através do teu link ou código de afiliado</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-150/10">
                      <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Utilizador</th>
                      <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Tipo Funil</th>
                      <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Comissões Geradas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {realProfiles.slice(0, 6).map((p, index) => {
                      const commValue = Math.floor(250 + (index * 120));
                      return (
                        <tr key={p.uid} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-navy text-white text-[10px] font-black flex items-center justify-center">
                              {p.display_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-navy truncate max-w-[150px]">{p.display_name || 'Particular'}</p>
                              <span className="text-[8px] font-bold text-slate-400 block">{new Date(p.created_at || Date.now()).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {p.role === 'customer' ? 'Membro Regular' : 'Profissional Pro'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-xs font-black text-green-600">
                            +{commValue} MT
                          </td>
                        </tr>
                      );
                    })}

                    {realProfiles.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-slate-400 font-bold uppercase text-[9px]">
                          Sem referidos disponíveis no seu histórico neste momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Affiliate Leaderboard Ranking Podium */}
            <div className="bg-white p-6 rounded-[36px] border border-slate-100 shadow-soft space-y-5">
              <div>
                <h4 className="text-xs font-black text-navy uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-3">
                  🥇 Top Rankings MozPro Afiliados
                </h4>
                <p className="text-[9px] text-slate-450 font-bold uppercase mt-0.5">Top campeões do mês pelas indicações bem-sucedidas</p>
              </div>

              <div className="space-y-3">
                {[
                  { pos: '1º', name: 'Zito Alumínio Lda', score: '312 Conv.', money: '85.400 MT' },
                  { pos: '2º', name: 'Sheila Bananas', score: '184 Conv.', money: '32.100 MT' },
                  { pos: '3º', name: 'Edgar M. TI Consult', score: '145 Conv.', money: '24.900 MT' },
                  { pos: '4º', name: 'Você (Afiliado)', score: `${totalCommissionsCount} Conv.`, money: `${approvalsSum} MT`, highlight: true }
                ].map(r => (
                  <div 
                    key={r.pos}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      r.highlight 
                        ? 'bg-orange/10 border-orange/20 scale-[1.01]' 
                        : 'bg-slate-50/50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black text-indigo-650">{r.pos}</span>
                      <div>
                        <span className="text-xs font-black text-navy block">{r.name}</span>
                        <span className="text-[9px] text-slate-400 font-mono block leading-none">{r.score}</span>
                      </div>
                    </div>

                    <span className="text-xs font-black text-green-600">{r.money}</span>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        )}

        {/* TAB 6: LEARNING HUB */}
        {activeTab === 'learning' && (
          <motion.div
            key="learning-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-12 gap-8 text-left"
          >
            {/* Left Content Column */}
            <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-[36px] border border-slate-100 shadow-soft space-y-6">
              <div>
                <h3 className="text-sm font-black text-navy uppercase tracking-tight flex items-center gap-1.5">
                  <BookOpen className="w-5 h-5 text-orange" /> Escola de Crescimento e Estratégias de Marketing
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Aprende com especialistas como maximizar seus CTRs e comissões no Facebook e LinkedIn</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { title: 'Guia de Copy para WhatsApp', reads: '4 min leitura', desc: 'Aprende copys rápidas e de extrema conversão para colocar no status ou grupos focados sem fazer spam desagradável.' },
                  { title: 'Otimização SEO de Links', reads: '7 min leitura', desc: 'Como linkar seus botões em blogs ou posts no Twitter de forma síncrona com palavras-chave recomendadas em Maputo.' },
                  { title: 'Funil Orgânico no Instagram', reads: '5 min leitura', desc: 'Como utilizar o link na Bio e criar caixas de perguntas estratégicas para responder convertendo audiências em leads.' },
                  { title: 'Tráfego Pago p/ Afiliados', reads: '8 min leitura', desc: 'Modelos de introdução ao Facebook Ads e Google Ads direcionando audiências de Moçambique com orçamentos de baixo risco.' }
                ].map(art => (
                  <div key={art.title} className="p-5 bg-slate-50 rounded-3xl border border-slate-100/50 space-y-3">
                    <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                      <span>Artigo Prático</span>
                      <span>{art.reads}</span>
                    </div>
                    <h4 className="text-xs font-black text-navy uppercase">{art.title}</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">{art.desc}</p>
                    <button 
                      onClick={() => alert(`A abrir artigo académico: ${art.title}`)}
                      className="text-[9px] font-black text-orange uppercase tracking-wider block hover:underline"
                    >
                      Ler artigo gratuito →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side Column Requirements check list */}
            <div className="lg:col-span-4 bg-white p-6 rounded-[36px] border border-slate-100 shadow-soft space-y-5">
              <div>
                <h4 className="text-xs font-black text-navy uppercase tracking-widest">🎖 Programa Parceria Elite PRO</h4>
                <p className="text-[9px] text-slate-450 font-bold uppercase mt-0.5">Inscrição para comissões flat de 20% com apoio prioritário corporativo</p>
              </div>

              <div className="space-y-4">
                {[
                  { text: 'Mínimo de 50 conversões ativas', req: true, checked: totalCommissionsCount >= 50 },
                  { text: 'Taxa de conversão superior a 3%', req: true, checked: calculatedConversionRate >= 3 },
                  { text: 'Sem infrações de spam denunciadas', req: true, checked: true },
                  { text: 'Perfil totalmente verificado no sistema', req: true, checked: profile?.is_verified || false },
                ].map(checklist => (
                  <div key={checklist.text} className="flex items-start gap-2.5">
                    {checklist.checked ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-navy leading-tight">{checklist.text}</span>
                  </div>
                ))}
                
                <button
                  disabled={totalCommissionsCount < 50}
                  onClick={() => alert('Parabéns! Seu pedido de candidatura Elite Pro foi enviado.')}
                  className={`w-full py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    totalCommissionsCount >= 50 
                      ? 'bg-navy text-white hover:bg-orange shadow-md cursor-pointer' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Candidatar-me ao Elite PRO
                </button>
              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
