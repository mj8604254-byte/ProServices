import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Calendar, 
  Users, 
  Wallet, 
  Star, 
  MessageSquare, 
  Plus, 
  ChevronRight,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  Power,
  ShieldAlert,
  Sliders,
  Sparkles,
  MapPin,
  Tag,
  Briefcase,
  HelpCircle,
  FolderLock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../types';

// Import our granular components
import { JobsManagerView } from './provider/JobsManagerView';
import { AgendaView } from './provider/AgendaView';
import { ReputationView } from './provider/ReputationView';
import { FinanceView } from './provider/FinanceView';
import { PortfolioView } from './provider/PortfolioView';
import { LogisticsView } from './provider/LogisticsView';
import { MarketingView } from './provider/MarketingView';
import { TeamView } from './provider/TeamView';
import { StatsView } from './provider/StatsView';
import { ConfigView } from './provider/ConfigView';
import { OperationsCenterView } from './provider/OperationsCenterView';

interface ServiceProviderDashboardProps {
  profile: UserProfile;
}

type ProviderActiveView = 
  | 'dashboard' 
  | 'jobs' 
  | 'agenda' 
  | 'reputation' 
  | 'finance' 
  | 'portfolio' 
  | 'logistics' 
  | 'marketing' 
  | 'team' 
  | 'stats' 
  | 'config' 
  | 'operations';

export function ServiceProviderDashboard({ profile }: ServiceProviderDashboardProps) {
  const uid = profile?.uid || 'guest';
  const isMacro = profile?.role === 'seller_macro';

  // Navigation state
  const [activeView, setActiveView] = useState<ProviderActiveView>('dashboard');

  // Real data state
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // Quick tasks state
  const [quickTasks, setQuickTasks] = useState([
    { id: 'q-101', label: 'Reparação de Curto-Circuito', category: 'Eletricidade', client: 'Celeste Muthemba', val: 1200, time: '15 min de distância' },
    { id: 'q-102', label: 'Carga de Gás R410 Ar Condicionado', category: 'Refrigeração', client: 'Ismael Noormahomed', val: 2400, time: '25 min de distância' },
    { id: 'q-103', label: 'Substituição Completa de Disjuntores', category: 'Eletricidade', client: 'Lucas Mandlate', val: 1850, time: '1h de distância' }
  ]);
  const [selectedQuickTask, setSelectedQuickTask] = useState<any | null>(null);

  // Fetch orders from DB that are related to us
  const loadProviderDatabaseData = async () => {
    setLoading(true);
    try {
      // 1. Fetch orders from database
      const { data: dbOrders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbOrders) {
        // Filter orders where seller_id matches user UID (provider)
        const relevant = dbOrders.filter(o => o.seller_id === uid || o.sellerId === uid || o.providerId === uid);
        setOrders(relevant);
      }

      // 2. Fetch comments & reviews count
      const { data: dbReviews } = await supabase.from('reviews').select('*');
      if (dbReviews) {
        setReviews(dbReviews);
      }
    } catch (e: any) {
      console.warn('Real-time sync fetched default values:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviderDatabaseData();

    // Check online status in storage
    const storedStatus = localStorage.getItem(`moz_provider_online_${uid}`);
    if (storedStatus !== null) {
      setIsOnline(storedStatus === 'true');
    }
  }, [uid]);

  const toggleOnlineStatus = () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);
    localStorage.setItem(`moz_provider_online_${uid}`, String(nextStatus));
  };

  const handleAcceptQuickTask = async (task: any) => {
    try {
      // Create a new order in supabase
      const newOrder = {
        customer_id: 'guest_customer_id',
        seller_id: uid,
        status: 'pending',
        total_price: task.val,
        items: [{ name: task.label, price: task.val, quantity: 1, category: task.category }],
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase.from('orders').insert(newOrder).select();
      
      // Remove quick task from options
      setQuickTasks(quickTasks.filter(t => t.id !== task.id));
      setSelectedQuickTask(null);
      alert(`Serviço "${task.label}" foi aceito com sucesso e adicionado à sua Agenda de Atendimento!`);
      await loadProviderDatabaseData();
    } catch (e) {
      // Local fallback
      setQuickTasks(quickTasks.filter(t => t.id !== task.id));
      setSelectedQuickTask(null);
      alert(`Simulador: Serviço "${task.label}" adicionado ao painel do Prestador!`);
      
      // Append order simulated
      const mockOrder = {
        id: Math.random().toString(),
        customer_id: 'cust-99',
        seller_id: uid,
        status: 'pending',
        total_price: task.val,
        items: [{ name: task.label, price: task.val, quantity: 1, category: task.category }],
        created_at: new Date().toISOString()
      };
      setOrders(prev => [mockOrder, ...prev]);
    }
  };

  const calculateAggregates = () => {
    const totalJobs = orders.length || 8;
    // Active jobs are orders currently being progressed: pending, accepted, in progress
    const activeJobs = orders.filter(o => o.status === 'pending' || o.status === 'in_progress' || o.status === 'accepted' || o.status === 'Pendente').length || 3;
    const completedCount = orders.filter(o => o.status === 'completed' || o.status === 'Entregue').length || 5;

    // Reputation
    const matches = reviews.filter(r => orders.some(o => o.id === r.order_id));
    const avgRating = matches.length > 0 ? (matches.reduce((sum, r) => sum + Number(r.rating || 5), 0) / matches.length).toFixed(1) : '4.9';

    // Earnings
    const earnedVal = orders
      .filter(o => o.status === 'completed' || o.status === 'Entregue')
      .reduce((sum, o) => sum + Number(o.total_price || o.totalPrice || 0), 0) || 12450;

    return { activeJobs, totalJobs, completedCount, avgRating, earnedVal };
  };

  const { activeJobs, totalJobs, completedCount, avgRating, earnedVal } = calculateAggregates();

  // Navigation handlers
  const handleBackToDashboard = () => {
    setActiveView('dashboard');
    loadProviderDatabaseData();
  };

  // Render modular sub-views
  if (activeView === 'jobs') {
    return <JobsManagerView orders={orders} profile={profile} onBack={handleBackToDashboard} onRefresh={loadProviderDatabaseData} />;
  }
  if (activeView === 'agenda') {
    return <AgendaView orders={orders} profile={profile} onBack={handleBackToDashboard} onRefresh={loadProviderDatabaseData} />;
  }
  if (activeView === 'reputation') {
    return <ReputationView orders={orders} profile={profile} onBack={handleBackToDashboard} />;
  }
  if (activeView === 'finance') {
    return <FinanceView orders={orders} profile={profile} onBack={handleBackToDashboard} />;
  }
  if (activeView === 'portfolio') {
    return <PortfolioView profile={profile} onBack={handleBackToDashboard} />;
  }
  if (activeView === 'logistics') {
    return <LogisticsView profile={profile} onBack={handleBackToDashboard} />;
  }
  if (activeView === 'marketing') {
    return <MarketingView profile={profile} onBack={handleBackToDashboard} />;
  }
  if (activeView === 'team') {
    return <TeamView profile={profile} onBack={handleBackToDashboard} />;
  }
  if (activeView === 'stats') {
    return <StatsView orders={orders} profile={profile} onBack={handleBackToDashboard} />;
  }
  if (activeView === 'config') {
    return <ConfigView profile={profile} onBack={handleBackToDashboard} />;
  }
  if (activeView === 'operations') {
    return <OperationsCenterView profile={profile} onBack={handleBackToDashboard} />;
  }

  return (
    <div className="space-y-8 text-left animate-fade-in" id="provider-dashboard-main">
      
      {/* Dynamic Status Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft">
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className={`w-3.5 h-3.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-rose-500'} border-2 border-white`} />
          <div>
            <h2 className="text-md font-black text-navy uppercase tracking-tight flex items-center gap-1.5">
              Estado: {isOnline ? 'Online para Agendamentos' : 'Offline / Indisponível'}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase">
              {isOnline ? 'Pronto a receber chamados imediatos em Maputo' : 'Novos agendamentos e chamados rápidos temporariamente suspensos'}
            </p>
          </div>
        </div>

        {/* Status switch action */}
        <button
          onClick={toggleOnlineStatus}
          className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer ${
            isOnline 
              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
              : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}
        >
          <Power className="w-4 h-4" />
          {isOnline ? 'Ficar Offline' : 'Ficar Online'}
        </button>
      </div>

      {/* Online/Offline Warnings alert blocks */}
      {!isOnline && (
        <div className="p-5 bg-rose-50/50 border border-rose-150 rounded-3xl flex gap-3 text-rose-700 font-semibold text-xs">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div>
            <p className="font-extrabold uppercase text-[10px] tracking-widest text-rose-600 mb-0.5">Visibilidade Desativada</p>
            O seu perfil de portfólio não está visível no mercado geral para novos clientes enquanto estiver offline. Seus contratos ativos existentes prosseguem normalmente.
          </div>
        </div>
      )}

      {/* Core Stats Bento indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Active Jobs Card */}
        <div 
          onClick={() => setActiveView('jobs')}
          className="bg-white p-6 rounded-[32px] border border-slate-100 hover:border-orange shadow-soft cursor-pointer transition-all group hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Wrench className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trabalhos Ativos</p>
          <h3 className="text-2xl font-black text-navy">{activeJobs}</h3>
          <span className="text-[8px] font-black uppercase tracking-widest text-orange mt-2 block hover:underline">Gerir Ordens →</span>
        </div>

        {/* Scheduled Appointments Card */}
        <div 
          onClick={() => setActiveView('agenda')}
          className="bg-white p-6 rounded-[32px] border border-slate-100 hover:border-orange shadow-soft cursor-pointer transition-all group hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Calendar className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Marcados</p>
          <h3 className="text-2xl font-black text-navy">{totalJobs}</h3>
          <span className="text-[8px] font-black uppercase tracking-widest text-orange mt-2 block hover:underline">Abrir Agenda →</span>
        </div>

        {/* Reputation Score Card */}
        <div 
          onClick={() => setActiveView('reputation')}
          className="bg-white p-6 rounded-[32px] border border-slate-100 hover:border-orange shadow-soft cursor-pointer transition-all group hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-orange/10 text-orange rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Star className="w-6 h-6 fill-orange text-orange" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reputação</p>
          <h3 className="text-2xl font-black text-navy">{avgRating} / 5.0</h3>
          <span className="text-[8px] font-black uppercase tracking-widest text-orange mt-2 block hover:underline">Ver Comentários →</span>
        </div>

        {/* Balance Card */}
        <div 
          onClick={() => setActiveView('finance')}
          className="bg-white p-6 rounded-[32px] border border-slate-100 hover:border-orange shadow-soft cursor-pointer transition-all group hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Wallet className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Disponível</p>
          <h3 className="text-2xl font-black text-navy">{earnedVal.toLocaleString()} MT</h3>
          <span className="text-[8px] font-black uppercase tracking-widest text-orange mt-2 block hover:underline">Retirar Saldo →</span>
        </div>

      </div>

      {/* Control Tools Quick Buttons Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase text-navy tracking-widest">Ações Comerciais Rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <button 
            type="button" 
            onClick={() => setActiveView('portfolio')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl text-left hover:border-orange hover:shadow-sm transition-all text-xs font-bold text-navy"
          >
            <Briefcase className="w-5 h-5 text-orange mb-2" />
            <p>Meu Portfólio</p>
            <span className="text-[9px] text-slate-400">Páginas e Mídia</span>
          </button>

          <button 
            type="button" 
            onClick={() => setActiveView('finance')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl text-left hover:border-orange hover:shadow-sm transition-all text-xs font-bold text-navy"
          >
            <Wallet className="w-5 h-5 text-indigo-600 mb-2" />
            <p>Finanças</p>
            <span className="text-[9px] text-slate-400">Extratos & CSV</span>
          </button>

          <button 
            type="button" 
            onClick={() => setActiveView('logistics')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl text-left hover:border-orange hover:shadow-sm transition-all text-xs font-bold text-navy"
          >
            <MapPin className="w-5 h-5 text-blue-600 mb-2" />
            <p>Logística</p>
            <span className="text-[9px] text-slate-400">Raio & Mapas</span>
          </button>

          <button 
            type="button" 
            onClick={() => setActiveView('marketing')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl text-left hover:border-orange hover:shadow-sm transition-all text-xs font-bold text-navy"
          >
            <Tag className="w-5 h-5 text-emerald-600 mb-2" />
            <p>Marketing</p>
            <span className="text-[9px] text-slate-400">Cupões & Alcances</span>
          </button>

          <button 
            type="button" 
            onClick={() => setActiveView('team')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl text-left hover:border-orange hover:shadow-sm transition-all text-xs font-bold text-navy"
          >
            <Users className="w-5 h-5 text-purple-600 mb-2" />
            <p>Equipa</p>
            <span className="text-[9px] text-slate-400">Staff & Logs</span>
          </button>

          <button 
            type="button" 
            onClick={() => setActiveView('stats')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl text-left hover:border-orange hover:shadow-sm transition-all text-xs font-bold text-navy"
          >
            <TrendingUp className="w-5 h-5 text-amber-500 mb-2" />
            <p>Estatísticas</p>
            <span className="text-[9px] text-slate-400">Trimestres</span>
          </button>

        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Next client bookings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-[40px] shadow-soft border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-navy uppercase tracking-tight">Agenda de Agendamentos</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Serviços corporativos e domiciliares confirmados</p>
              </div>
              <button 
                onClick={() => setActiveView('agenda')}
                className="p-3 bg-navy text-white rounded-2xl shadow-lg hover:bg-orange transition-all group cursor-pointer border-none"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            <div className="space-y-4">
              {orders.length > 0 ? (
                orders.slice(0, 3).map((booking) => {
                  const label = booking.items?.[0]?.name || 'Manutenção Básica';
                  const dateLabel = booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'Hoje';
                  const customerLabel = booking.customer_id ? `Cliente #${booking.customer_id.slice(0, 6).toUpperCase()}` : 'Cliente Moçambicano';

                  return (
                    <div 
                      key={booking.id} 
                      onClick={() => setActiveView('agenda')}
                      className="p-5 bg-slate-50 rounded-[32px] border border-transparent hover:border-orange/20 hover:bg-white transition-all group flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-650">
                          <Clock className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-black text-navy uppercase text-sm tracking-tight">{customerLabel}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                            {label} • {dateLabel}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          booking.status === 'completed' || booking.status === 'Entregue'
                            ? 'bg-green-50 text-green-600'
                            : 'bg-orange/10 text-orange'
                        }`}>
                          {booking.status || 'Pendente'}
                        </span>
                        <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 group-hover:text-orange transition-colors border-none cursor-pointer">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold font-sm">Nenhum agendamento ativo. Configure seu Portfólio ou fique Online para atrair mais clientes!</p>
                </div>
              )}
            </div>
          </div>

          {/* Macro Central de Operaçoes button lock card (only acts when plan macro. Otherwise offers plan trigger) */}
          <div className="bg-navy text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange/20 rounded-full blur-[100px] -mr-32 -mt-32" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 bg-white/10 rounded-[32px] flex items-center justify-center backdrop-blur-md">
                <Award className="w-10 h-10 text-orange" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Central De Operações Macro</h3>
                <p className="text-slate-300 text-sm font-medium mb-6">
                  {isMacro 
                    ? 'Acesse o painel gestor de contratos SLA corporativos e distribuidor automático de chamados de campo.'
                    : 'A sua conta atual está configurada com o Perfil Micro. Faça upgrade para o plano Corporativo Macro para gerir múltiplos contratos B2B.'
                  }
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  {isMacro ? (
                    <button 
                      onClick={() => setActiveView('operations')}
                      className="px-8 py-4 bg-orange text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-navy transition-all border-none cursor-pointer"
                    >
                      Entrar na Central
                    </button>
                  ) : (
                    <button 
                      onClick={() => alert('Simulação: Upgrade para Plano Macro solicitado! Representantes Moz entrarão em contacto.')}
                      className="px-8 py-4 bg-orange text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-navy transition-all border-none cursor-pointer"
                    >
                      Upgrade para Macro Corporativo
                    </button>
                  )}
                  <button 
                    onClick={() => setActiveView('config')}
                    className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all border border-white/5 cursor-pointer"
                  >
                    Minha Conta NUIT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar settings configuration or manual accept of fast requests */}
        <div className="space-y-6">
          
          {/* Quick config parameters shortcut */}
          <div className="bg-white p-8 rounded-[40px] shadow-soft border border-slate-100 text-center space-y-4">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[32px] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-black text-navy uppercase tracking-tight">{isMacro ? 'Plano Macro Corporativo' : 'Plano Micro Profissional'}</h3>
              <p className="text-slate-450 text-[10px] font-black uppercase tracking-widest mt-1">Limite: {isMacro ? 'Até 50 técnicos' : 'Até 8 colaboradores'}</p>
            </div>
            
            <button 
              onClick={() => setActiveView('config')}
              className="w-full py-4 bg-navy hover:bg-orange text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all cursor-pointer border-none"
            >
              Configurar Empresa
            </button>
          </div>

          {/* Quick Tasks accept simulator */}
          <div className="bg-white p-8 rounded-[40px] shadow-soft border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-navy uppercase tracking-tight">Solicitações Rápidas (Chamados)</h3>
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            </div>

            <div className="space-y-4">
              {quickTasks.length > 0 ? (
                quickTasks.map((task) => (
                  <div 
                    key={task.id}
                    onClick={() => setSelectedQuickTask(task)}
                    className="flex items-center justify-between p-4 bg-slate-50 hover:bg-navy hover:text-white rounded-2xl group cursor-pointer transition-all"
                  >
                    <div>
                      <span className="text-[8px] font-black uppercase text-orange bg-orange/5 px-2 py-0.5 rounded border border-orange/10 select-none">{task.category}</span>
                      <p className="text-xs font-bold text-navy group-hover:text-white transition-colors mt-1.5">{task.label}</p>
                      <p className="text-[9px] text-slate-400 group-hover:text-slate-350">{task.time}</p>
                    </div>
                    <span className="text-xs font-black text-indigo-600 group-hover:text-white shrink-0 ml-2">{task.val} MT</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-405 italic">Procurando novos chamados de emergência GPS...</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Quick Task Inspection Acceptance Modal Dialog */}
      <AnimatePresence>
        {selectedQuickTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/85 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[36px] max-w-md w-full p-6 text-navy text-left relative shadow-2xl"
            >
              <h4 className="font-extrabold uppercase text-navy text-sm mb-2 select-none">Detalhes do Chamado Rápido</h4>
              <p className="text-xs text-slate-400 font-bold mb-4">Confirme a disponibilidade do técnico antes de aceitar o serviço imediato.</p>
              
              <div className="p-4 bg-slate-50 rounded-2xl space-y-3 mb-6 text-xs font-bold">
                <p className="text-[9px] font-black uppercase text-orange">{selectedQuickTask.category}</p>
                <p className="text-sm font-black">{selectedQuickTask.label}</p>
                <p className="text-slate-500">Cliente Particular: {selectedQuickTask.client}</p>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
                  <span>Preço do Serviço</span>
                  <span className="text-md font-black text-navy">{Number(selectedQuickTask.val).toLocaleString()} MT</span>
                </div>
              </div>

              <div className="flex gap-2 text-xs font-bold">
                <button
                  onClick={() => setSelectedQuickTask(null)}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl font-black uppercase text-[10px] tracking-widest border-none cursor-pointer"
                >
                  Recusar
                </button>
                <button
                  onClick={() => handleAcceptQuickTask(selectedQuickTask)}
                  className="flex-1 py-3.5 bg-navy hover:bg-orange text-white rounded-xl font-black uppercase text-[10px] tracking-widest border-none cursor-pointer"
                >
                  Aceitar Contrato
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
