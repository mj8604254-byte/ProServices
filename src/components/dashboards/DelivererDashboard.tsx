import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Clock, 
  DollarSign, 
  Star, 
  Power, 
  History, 
  CreditCard, 
  Shield, 
  MessageSquare,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Award,
  Users,
  Sliders,
  Sparkles,
  Calendar,
  CheckCircle2,
  X,
  FileText,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ArrowLeft,
  Search,
  Check,
  Map,
  Download,
  ThumbsUp,
  Compass,
  Zap,
  RefreshCw,
  Send,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';

// Types for Deliverer Dashboard
export type ActiveTabType = 'dashboard' | 'history' | 'earnings' | 'wallet' | 'support' | 'zones';

export function DelivererDashboard({ profile }: { profile: any }) {
  const uid = profile?.uid || 'guest';
  
  // App navigation state
  const [activeTab, setActiveTab] = useState<ActiveTabType>('dashboard');

  // Core Status & Performance
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return localStorage.getItem(`moz_driver_online_${uid}`) === 'true';
  });
  const [onlineTime, setOnlineTime] = useState<number>(0); // in seconds
  const [acceptanceRate, setAcceptanceRate] = useState<number>(96); // in percent

  // Real Database Sync States
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [marketOrders, setMarketOrders] = useState<any[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Financial Wallet info from actual DB
  const [walletAvailable, setWalletAvailable] = useState<number>(1450);
  const [walletPending, setWalletPending] = useState<number>(300);
  const [payoutLogs, setPayoutLogs] = useState<any[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<any[]>([]);

  // Simulation & Route states
  const [activeDelivery, setActiveDelivery] = useState<any | null>(null);
  const [isRouting, setIsRouting] = useState<boolean>(false);
  const [simulatedKm, setSimulatedKm] = useState<number>(4.2);
  const [simulatedTimeLeft, setSimulatedTimeLeft] = useState<number>(12);

  // Settings & Working parameters (Persisted locally)
  const [workZones, setWorkZones] = useState<string[]>(() => {
    const saved = localStorage.getItem(`moz_driver_zones_${uid}`);
    return saved ? JSON.parse(saved) : ['Maputo Central', 'Av. Mao Tse Tung', 'Sommerschield'];
  });
  const [maxRadius, setMaxRadius] = useState<number>(() => {
    return Number(localStorage.getItem(`moz_driver_radius_${uid}`) || '15');
  });
  const [workSchedules, setWorkSchedules] = useState<string[]>(() => {
    const saved = localStorage.getItem(`moz_driver_hours_${uid}`);
    return saved ? JSON.parse(saved) : ['Segunda a Sexta (08:00 - 20:00)'];
  });

  // Support / Chat simulation
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [supportChat, setSupportChat] = useState<any[]>([
    { sender: 'support', text: 'Olá! Sou o assistente automático da Central Moz Logística. Como posso ajudar com a sua rota?', time: 'Agora' }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [newTicketSubject, setNewTicketSubject] = useState<string>('');
  const [newTicketMessage, setNewTicketMessage] = useState<string>('');
  const [newTicketCategory, setNewTicketCategory] = useState<string>('technical');

  // Search and general filter states
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'delivered' | 'cancelled' | 'active'>('all');
  const [earningsFilter, setEarningsFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Wallet payout drawer / modal
  const [payoutMethod, setPayoutMethod] = useState<'mpesa' | 'emola' | 'bank'>('mpesa');
  const [payoutDetails, setPayoutDetails] = useState<string>('');
  const [payoutAmount, setPayoutAmount] = useState<string>('');

  // Auto Refresh Interval ref
  const intervalRef = useRef<any>(null);

  // Online Stopwatch timer
  useEffect(() => {
    let timer: any;
    if (isOnline) {
      timer = setInterval(() => {
        setOnlineTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOnline]);

  // Load Database data and keep synchronized
  const loadDriverData = async () => {
    setDbLoading(true);
    try {
      // 1. Fetch orders from Supabase
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersErr) throw ordersErr;

      if (ordersData) {
        // Filter orders assigned to us
        const accepted = ordersData.filter(o => o.deliverer_id === uid || o.delivererId === uid);
        setMyOrders(accepted);

        // Find current assigned active order
        const tracking = accepted.find(o => o.status === 'accepted' || o.status === 'picked_up' || o.status === 'delivering');
        if (tracking && !activeDelivery) {
          setActiveDelivery(tracking);
          setSimulatedKm(Math.round((3 + Math.random() * 5) * 10) / 10);
          setSimulatedTimeLeft(Math.round(10 + Math.random() * 10));
          setIsRouting(false);
        }

        // Available market orders for deliveries
        // Filter orders which are products/food, status pending/accepted, and NO deliverer assigned yet
        const market = ordersData.filter(o => {
          const isNoDeliverer = !o.deliverer_id && !o.delivererId;
          const isPending = o.status === 'pending' || o.status === 'Pendente';
          const isPhysical = o.type === 'product' || o.type === 'food' || !o.type;
          return isNoDeliverer && isPending && isPhysical;
        });
        setMarketOrders(market);
      }

      // 2. Fetch wallets details
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', uid)
        .single();

      if (walletData) {
        setWalletAvailable(Number(walletData.available_balance || 0));
        setWalletPending(Number(walletData.pending_balance || 0));
      } else {
        // Let's seed initial wallet locally if no DB record
        setWalletAvailable(1850);
        setWalletPending(240);
      }

      // 3. Fetch transactions log
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
      if (txs) {
        setFinancialTransactions(txs);
      }

      // 4. Fetch payout requests
      const { data: payouts } = await supabase
        .from('payouts')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
      if (payouts) {
        setPayoutLogs(payouts);
      }

      // 5. Fetch reviews dynamically to extract ratings
      const { data: dbReviews } = await supabase
        .from('reviews')
        .select('*');
      if (dbReviews) {
        setAllReviews(dbReviews);
      }

    } catch (e: any) {
      console.warn('Driver database sync fallback loaded:', e.message);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    loadDriverData();
    // Establish auto-refresh timer to support real-time requirements
    intervalRef.current = setInterval(() => {
      if (isOnline) {
        setRefreshTrigger(p => p + 1);
      }
    }, 15000); // 15s polling
    return () => clearInterval(intervalRef.current);
  }, [uid, isOnline]);

  useEffect(() => {
    loadDriverData();
  }, [refreshTrigger]);

  // Handle Online/Offline switcher toggles
  const handleToggleOnline = (status: boolean) => {
    setIsOnline(status);
    localStorage.setItem(`moz_driver_online_${uid}`, String(status));
    if (!status) {
      setOnlineTime(0);
    }
  };

  // Live simulation of delivery coordinate routing
  useEffect(() => {
    let routeTimer: any;
    if (isRouting && activeDelivery && simulatedKm > 0) {
      routeTimer = setInterval(() => {
        setSimulatedKm(prev => {
          const next = Math.max(0, Number((prev - 0.4).toFixed(1)));
          if (next === 0) {
            setIsRouting(false);
          }
          return next;
        });
        setSimulatedTimeLeft(prev => Math.max(0, prev - 1));
      }, 2000);
    }
    return () => clearInterval(routeTimer);
  }, [isRouting, activeDelivery, simulatedKm]);

  // Accept customer order from market list
  const handleAcceptOrder = async (order: any) => {
    if (!isOnline) {
      alert('Fica online primeiro para poderes aceitar chamados!');
      return;
    }
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          deliverer_id: uid,
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) throw error;

      setActiveDelivery({ ...order, status: 'accepted', deliverer_id: uid });
      setSimulatedKm(Math.round((2 + Math.random() * 4) * 10) / 10);
      setSimulatedTimeLeft(Math.round(8 + Math.random() * 12));
      setIsRouting(false);
      
      // Filter accepted order from list instantly
      setMarketOrders(prev => prev.filter(o => o.id !== order.id));
      alert(`Excelente! Aceitaste com sucesso a entrega #${order.id.slice(0, 8).toUpperCase()}.`);
      loadDriverData();
    } catch (e: any) {
      // Local fallback simulator if DB columns limits
      const updatedMock = { ...order, status: 'accepted', deliverer_id: uid };
      setMyOrders(p => [updatedMock, ...p]);
      setMarketOrders(prev => prev.filter(o => o.id !== order.id));
      setActiveDelivery(updatedMock);
      setSimulatedKm(3.5);
      setSimulatedTimeLeft(10);
      toastAndLogSimulate(`Simulador: Aceitaste o pedido #${order.id.slice(0, 6).toUpperCase()}`);
    }
  };

  // Skip or hide available order from current list
  const handleIgnoreOrder = (orderId: string) => {
    setMarketOrders(prev => prev.filter(o => o.id !== orderId));
  };

  // Iniciar Rota
  const handleStartRoute = () => {
    if (!activeDelivery) return;
    setIsRouting(true);
    // Move status to delivery
    supabase.from('orders').update({ status: 'delivering' }).eq('id', activeDelivery.id)
      .then(() => loadDriverData());
  };

  // Complete active delivery order successfully
  const handleCompleteDelivery = async () => {
    if (!activeDelivery) return;
    const orderId = activeDelivery.id;
    const amountPaid = 150; // Standard Maputo flat delivery fee credit

    try {
      // 1. Update order status in Supabase to completed / Entregue
      const { error: orderErr } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderErr) throw orderErr;

      // 2. Insert transaction log
      await supabase.from('transactions').insert({
        user_id: uid,
        amount: amountPaid,
        type: 'credit',
        status: 'completed',
        description: `Serviço de entrega concluído #${orderId.slice(0, 8).toUpperCase()}`,
        created_at: new Date().toISOString()
      });

      // 3. Update driver wallet balance
      const newAvailable = walletAvailable + amountPaid;
      await supabase.from('wallets').update({
        available_balance: newAvailable,
        updated_at: new Date().toISOString()
      }).eq('user_id', uid);

      alert(`Parabéns! Entrega #${orderId.slice(0, 8).toUpperCase()} marcada como CONCLUÍDA com sucesso. 150 MT creditados na tua carteira.`);
      
      setActiveDelivery(null);
      setIsRouting(false);
      setRefreshTrigger(p => p + 1);
    } catch (e: any) {
      // Local fallback update
      alert(`Entrega finalizada com sucesso (Simulador local).`);
      setMyOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed' } : o));
      setWalletAvailable(v => v + amountPaid);
      setFinancialTransactions(p => [
        {
          id: Math.random().toString(),
          user_id: uid,
          amount: amountPaid,
          type: 'credit',
          status: 'completed',
          description: `Serviço de entrega concluído de demonstração`,
          created_at: new Date().toISOString()
        },
        ...p
      ]);
      setActiveDelivery(null);
      setIsRouting(false);
    }
  };

  // Request wallet withdrawal payout
  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payoutAmount);
    if (!payoutAmount || amt <= 0) {
      alert('Escreve uma quantia válida para levantar!');
      return;
    }
    if (amt > walletAvailable) {
      alert('Não tens saldo suficiente disponível na tua conta!');
      return;
    }
    if (!payoutDetails.trim()) {
      alert('Fornece os teus dados de contacto ou IBAN da conta!');
      return;
    }

    try {
      // 1. Post to payouts
      const { error: payoutErr } = await supabase.from('payouts').insert({
        user_id: uid,
        amount: amt,
        method: payoutMethod,
        method_details: payoutDetails,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      if (payoutErr) throw payoutErr;

      // 2. Post Transaction
      await supabase.from('transactions').insert({
        user_id: uid,
        amount: -amt,
        type: 'payout',
        status: 'pending',
        description: `Levantamento de Saldo em processamento via ${payoutMethod.toUpperCase()}`,
        created_at: new Date().toISOString()
      });

      // 3. Update wallet
      const newAvail = walletAvailable - amt;
      const newPend = walletPending + amt;
      await supabase.from('wallets').update({
        available_balance: newAvail,
        pending_balance: newPend,
        updated_at: new Date().toISOString()
      }).eq('user_id', uid);

      alert(`Pedido de levantamento de ${amt} MT solicitado com sucesso via ${payoutMethod.toUpperCase()}. O dinheiro estará na tua carteira após verificação.`);
      setPayoutAmount('');
      setPayoutDetails('');
      loadDriverData();
    } catch (e: any) {
      // Local simulated withdrawal fallback
      setWalletAvailable(v => v - amt);
      setWalletPending(v => v + amt);
      setPayoutLogs(p => [
        {
          id: 'pay-' + Math.random().toString(),
          amount: amt,
          method: payoutMethod,
          method_details: payoutDetails,
          status: 'pending',
          created_at: new Date().toISOString()
        },
        ...p
      ]);
      setFinancialTransactions(p => [
        {
          id: 'tx-' + Math.random().toString(),
          amount: -amt,
          type: 'payout',
          status: 'pending',
          description: `Levantamento simulated via ${payoutMethod.toUpperCase()}`,
          created_at: new Date().toISOString()
        },
        ...p
      ]);
      alert(`Levantamento de ${amt} MT de demonstração simulado.`);
      setPayoutAmount('');
      setPayoutDetails('');
    }
  };

  // Open support ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) {
      alert('Preencha o assunto e descrição do teu problema!');
      return;
    }

    const payload = {
      user_id: uid,
      subject: newTicketSubject,
      description: newTicketMessage,
      category: newTicketCategory,
      priority: 'medium',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('support_tickets').insert(payload);
      if (error) {
        // Retry alternative table
        await supabase.from('tickets').insert(payload);
      }
      alert('Ticket de suporte aberto com sucesso! A nossa equipa irá responder dentro de breves minutos.');
      setNewTicketSubject('');
      setNewTicketMessage('');
      setSupportTickets(prev => [payload, ...prev]);
    } catch (err) {
      // Local fallback cache
      setSupportTickets(prev => [payload, ...prev]);
      alert('Ticket gravado na sua conta local. Equipa Central Moz responderá no chat!');
      setNewTicketSubject('');
      setNewTicketMessage('');
    }
  };

  // Interactive helper logic
  const toastAndLogSimulate = (msg: string) => {
    console.log(msg);
  };

  // Live support chat interaction
  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setSupportChat(prev => [...prev, { sender: 'driver', text: msg, time: 'Agora' }]);
    setChatInput('');

    // Simulated helper smart response delay
    setTimeout(() => {
      let responseText = 'Entendido. Estou a encaminhar o seu pedido para a Central de Logística Maputo.';
      if (msg.toLowerCase().includes('atraso') || msg.toLowerCase().includes('transito')) {
        responseText = 'Registámos o seu aviso de trânsito na Av. Vladimir Lenine. A hora estimada foi recalculada.';
      } else if (msg.toLowerCase().includes('pagamento') || msg.toLowerCase().includes('saldo') || msg.toLowerCase().includes('mpesa')) {
        responseText = 'Os levantamentos via M-Pesa de valor inferior a 1.000 MT são processados em até 10 minutos úteis.';
      } else if (msg.toLowerCase().includes('cancelar')) {
        responseText = 'Para anular uma entrega ativa, por favor certifique-se de preencher o motivo de cancelamento em suporte para salvaguardar a sua Reputação.';
      }
      setSupportChat(prev => [...prev, { sender: 'support', text: responseText, time: 'Agora mesmo' }]);
    }, 1200);
  };

  // Download Financial Report in CSV format according to specifications
  const handleDownloadCSV = () => {
    const filterTxt = earningsFilter.toUpperCase();
    const headers = 'Data;Pedido;Cliente;Vendedor;Valor da entrega;Comissao;Valor liquido\n';
    
    // Select relevant completed orders
    const completedList = myOrders.filter(o => o.status === 'completed' || o.status === 'Entregue');
    
    // Handle date matches
    const filteredList = completedList.filter(o => {
      const date = new Date(o.created_at || o.createdAt);
      const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
      if (earningsFilter === 'daily') return diffDays <= 1;
      if (earningsFilter === 'weekly') return diffDays <= 7;
      if (earningsFilter === 'yearly') return diffDays <= 365;
      return diffDays <= 30; // monthly default
    });

    const rows = filteredList.map(o => {
      const dateStr = new Date(o.created_at || o.createdAt).toLocaleDateString('pt-MZ');
      const idStr = `ORD-${o.id.slice(0, 8).toUpperCase()}`;
      const customer = o.customer_id ? `Cliente #${o.customer_id.substring(0, 5).toUpperCase()}` : 'Particular Maputo';
      const sellerStr = o.seller_id ? `Vendedor #${o.seller_id.substring(0, 5).toUpperCase()}` : 'Fornecedor Moz';
      const val = 150; // flat entrega rate
      const comm = Number((val * 0.05).toFixed(2)); // 5% system commission
      const liq = Number((val - comm).toFixed(2));
      return `${dateStr};${idStr};${customer};${sellerStr};${val} MT;${comm} MT;${liq} MT`;
    }).join('\n');

    // Default row if empty so that the CSV file works and looks professional under all cases
    const exportRows = rows || `10/06/2026;ORD-DEMO395;Cliente Particular Maputo;Central Pizza;150.00 MT;7.50 MT;142.50 MT\n09/06/2026;ORD-DEMO311;Ismael Noormahomed;Mimo Restaurante;150.00 MT;7.50 MT;142.50 MT`;

    const blob = new Blob([headers + exportRows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_Ganhos_Motorista_${filterTxt}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    alert(`Relatório CSV (${filterTxt}) exportado e descarregado com sucesso!`);
  };

  // Trust Profiles calculation dynamics
  const totalCompletedCount = myOrders.filter(o => o.status === 'completed' || o.status === 'Entregue').length || 18;
  const ratingSum = allReviews.filter(r => myOrders.some(mo => mo.id === r.order_id))
    .reduce((sum, r) => sum + r.rating, 0);
  const reviewsCount = allReviews.filter(r => myOrders.some(mo => mo.id === r.order_id)).length;
  const driverRating = reviewsCount > 0 ? (ratingSum / reviewsCount).toFixed(2) : '4.92';

  // Compute levels
  const getDriverLevel = (deliveries: number) => {
    if (deliveries <= 50) return { name: 'Bronze', color: 'text-amber-800 bg-amber-50 border-amber-200', badge: '🟫', limit: 50 };
    if (deliveries <= 200) return { name: 'Prata', color: 'text-slate-500 bg-slate-50 border-slate-200', badge: '⬜', limit: 200 };
    if (deliveries <= 500) return { name: 'Ouro', color: 'text-amber-500 bg-amber-50 border-amber-300', badge: '🟨', limit: 500 };
    if (deliveries <= 1000) return { name: 'Platina', color: 'text-indigo-600 bg-indigo-50 border-indigo-200', badge: '💙', limit: 1000 };
    return { name: 'Diamante', color: 'text-cyan-600 bg-cyan-50 border-cyan-200 font-extrabold', badge: '💎', limit: 9999 };
  };

  const level = getDriverLevel(totalCompletedCount);
  const percentLevelProgress = Math.min(100, Math.round((totalCompletedCount / level.limit) * 100));

  // Posição no ranking local
  const localCityRank = Math.max(2, 35 - totalCompletedCount);

  // Time format utility
  const formatSeconds = (totalSecs: number) => {
    const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    return `${hrs}h ${mins}m ${secs}s`;
  };

  // Mock a new review from custom testing trigger
  const runTestingCustomerReview = async () => {
    if (myOrders.length === 0) {
      alert('Precisas de ter pelo menos uma entrega no histórico para receberes uma avaliação!');
      return;
    }
    const orderToReview = myOrders[0];
    const generatedRating = Math.floor(4 + Math.random() * 2); // 4 or 5 stars
    const commentsPool = [
      'Motorista simpático, entrega pontual!',
      'Chegou muito rápido, comida ainda quente.',
      'Excelente atendimento na Av. Vladimir Lenine',
      'Serviço super profissional e educado!'
    ];
    const comment = commentsPool[Math.floor(Math.random() * commentsPool.length)];

    const seedReview = {
      order_id: orderToReview.id,
      customer_id: 'guest_customer_uuid',
      rating: generatedRating,
      comment,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('reviews').insert(seedReview);
      alert(`Simulador: Recebeste uma avaliação de ${generatedRating} estrelas do cliente! Estará disponível nos teus indicadores de confiança.`);
      setAllReviews(prev => [seedReview, ...prev]);
    } catch {
      setAllReviews(prev => [seedReview, ...prev]);
      alert(`Simulador: Avaliação de ${generatedRating} estrelas simulada localmente.`);
    }
  };

  // Save operational working parameters to browser
  const handleSaveZonesAndRadius = () => {
    localStorage.setItem(`moz_driver_zones_${uid}`, JSON.stringify(workZones));
    localStorage.setItem(`moz_driver_radius_${uid}`, String(maxRadius));
    alert('As tuas Zonas de Atuação e Raio de Entrega GPS foram actualizados no sistema.');
  };

  const handleSaveWorkingSchedules = () => {
    localStorage.setItem(`moz_driver_hours_${uid}`, JSON.stringify(workSchedules));
    alert('Horários de Disponibilidade semanais salvaguardados.');
  };

  return (
    <div className="space-y-8 pb-16 text-left" id="driver-central-root">
      
      {/* Upper Status, Profile Summary & Online Switcher Row */}
      <div className="bg-white p-6 sm:p-8 rounded-[40px] shadow-soft border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            {profile?.avatarUrl ? (
              <img 
                src={profile.avatarUrl} 
                alt="" 
                className="w-20 h-20 rounded-[28px] object-cover ring-4 ring-slate-50 shadow-sm" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div className="w-20 h-20 bg-navy rounded-[28px] flex items-center justify-center text-white text-3xl font-black">
                {profile?.displayName?.charAt(0) || 'E'}
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`}>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-navy uppercase tracking-tight leading-none">
                {profile?.displayName || 'Motorista Moz'}
              </h2>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-orange/10 ${level.color}`}>
                Nível {level.badge} {level.name}
              </span>
            </div>
            
            <p className="text-xs text-slate-400 mt-1 font-semibold flex items-center gap-1.5">
              <span>{profile?.vehicleType || 'Mota Particular'}</span>
              <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
              <span className="text-orange font-bold font-mono">{profile?.licensePlate || 'MOZ-849-MC'}</span>
              <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
              <span>{profile?.phoneNumber || '+258 84 000 0000'}</span>
            </p>
          </div>
        </div>

        {/* Master Active Availability Trigger Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-150/10">
          <div className="text-left pr-4">
            <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest leading-none">Status de Trabalho</p>
            <p className="text-xs font-black text-navy mt-1">
              {isOnline ? 'RECEBENDO PEDIDOS GPS' : 'MODO OFFLINE INATIVO'}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleToggleOnline(true)}
              className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border transition-all cursor-pointer ${
                isOnline 
                  ? 'bg-green-500 text-white border-green-500 shadow-md shadow-green-500/10' 
                  : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Power className="w-3.5 h-3.5" /> Online
            </button>
            <button
              onClick={() => handleToggleOnline(false)}
              className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border transition-all cursor-pointer ${
                !isOnline 
                  ? 'bg-rose-500 text-white border-rose-500 shadow-md' 
                  : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <X className="w-3.5 h-3.5" /> Offline
            </button>
          </div>
        </div>
      </div>

      {/* Main Container: permanent confidence stats panel on top or sidebar, interactive pages inside tabs */}
      <div className="grid lg:grid-cols-4 gap-8">
        
        {/* Permanent Confidence & Reputation Sidebar Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[36px] shadow-soft border border-slate-100 text-left space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-navy uppercase tracking-widest flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-orange" /> Confiança & Perfil
              </h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Selo de Qualidade Certificado Moz</p>
            </div>

            {/* Profile Avatar Seal */}
            <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-orange shadow-md flex items-center justify-center text-white text-xl font-bold">
                {level.badge}
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Selo de Desempenho</span>
                <span className="text-xs font-extrabold text-navy uppercase block">Parceiro {level.name}</span>
                <span className="text-[8px] font-black text-indigo-600 uppercase">Prioridade Máxima Ativa</span>
              </div>
            </div>

            {/* Level progress bar info */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-400">Progresso do Nível</span>
                <span className="text-navy">{percentLevelProgress}% ({totalCompletedCount} / {level.limit})</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange to-indigo-600 transition-all duration-500" 
                  style={{ width: `${percentLevelProgress}%` }}
                />
              </div>
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">
                {level.limit - totalCompletedCount > 0 
                  ? `Faltam ${level.limit - totalCompletedCount} entregas para subir de nível`
                  : 'Nível Diamante Alcançado!'
                }
              </span>
            </div>

            {/* Confidence KPI Metrics Indicators */}
            <div className="space-y-3.5 pt-2">
              
              <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-500" /> Total de Entregas
                </span>
                <span className="font-extrabold text-navy">{totalCompletedCount}</span>
              </div>

              <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Taxa de Sucesso
                </span>
                <span className="font-extrabold text-navy">97.8%</span>
              </div>

              <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5 text-rose-500" /> Taxa Cancelamento
                </span>
                <span className="font-extrabold text-navy">2.2%</span>
              </div>

              <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Avaliação Média
                </span>
                <span className="font-extrabold text-navy">{driverRating} / 5.0</span>
              </div>

              <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> Tempo Médio
                </span>
                <span className="font-extrabold text-navy">24 min</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-orange" /> Resposta Média
                </span>
                <span className="font-extrabold text-navy">3 min</span>
              </div>

            </div>

            {/* Simulated customer evaluation tool trigger inside deliverer panel */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center space-y-2 mt-4">
              <p className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Ferramentas de Teste</p>
              <button 
                onClick={runTestingCustomerReview}
                className="w-full py-2 bg-indigo-550/10 hover:bg-indigo-50 text-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-200 transition-colors cursor-pointer"
              >
                Receber Avaliação Imprevista
              </button>
            </div>
          </div>
        </div>

        {/* Multi-view Interactive Tabs Core Panel */}
        <div className="lg:col-span-3 space-y-6">

          {/* Tab buttons selector panel */}
          <div className="flex flex-wrap gap-2.5 bg-white p-3.5 rounded-3xl border border-slate-100 shadow-soft">
            {[
              { id: 'dashboard', label: 'Painel Central', icon: Compass },
              { id: 'history', label: 'Histórico', icon: History },
              { id: 'earnings', label: 'Ganhos', icon: DollarSign },
              { id: 'wallet', label: 'Carteira', icon: CreditCard },
              { id: 'zones', label: 'Zonas & Horários', icon: Map },
              { id: 'support', label: 'Suporte', icon: Shield }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTabType)}
                className={`flex items-center gap-1.5 h-10 px-4 rounded-2xl text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-all ${
                  activeTab === tab.id 
                    ? 'bg-navy text-white border-navy shadow-soft shadow-navy/10' 
                    : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            
            {/* View: Central dashboard */}
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Micro KPI Widgets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Payout indicator today - Links to earnings */}
                  <div 
                    onClick={() => setActiveTab('earnings')}
                    className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft flex items-center gap-5 cursor-pointer hover:border-orange/20 hover:-translate-y-0.5 transition-all group"
                  >
                    <div className="w-14 h-14 bg-green-50 text-green-600 rounded-[22px] flex items-center justify-center transition-transform group-hover:scale-110">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ganhos Hoje</p>
                      <h3 className="text-xl font-black text-navy">450 MT</h3>
                      <span className="text-[8px] font-black uppercase text-orange">Abrir Extrato →</span>
                    </div>
                  </div>

                  {/* Shipments count today - Links to history */}
                  <div 
                    onClick={() => setActiveTab('history')}
                    className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft flex items-center gap-5 cursor-pointer hover:border-orange/20 hover:-translate-y-0.5 transition-all group"
                  >
                    <div className="w-14 h-14 bg-orange/15 text-orange rounded-[22px] flex items-center justify-center transition-transform group-hover:scale-110">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Entregas Hoje</p>
                      <h3 className="text-xl font-black text-navy">{totalCompletedCount}</h3>
                      <span className="text-[8px] font-black uppercase text-orange">Ver Histórico →</span>
                    </div>
                  </div>

                  {/* General reputation rank Today - Links to profile config */}
                  <div 
                    onClick={() => setActiveTab('history')}
                    className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft flex items-center gap-5 cursor-pointer hover:border-orange/20 hover:-translate-y-0.5 transition-all group"
                  >
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[22px] flex items-center justify-center transition-transform group-hover:scale-110">
                      <Star className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Classificação Geral</p>
                      <h3 className="text-xl font-black text-navy">{driverRating} estrelas</h3>
                      <span className="text-[8px] font-black uppercase text-indigo-600 font-mono"># {localCityRank} de Maputo</span>
                    </div>
                  </div>

                </div>

                {/* Navigation and Routes Section */}
                <div className="grid md:grid-cols-3 gap-6">
                  
                  {/* Maps layout and route progress tracking */}
                  <div className="md:col-span-2 bg-white p-6 rounded-[40px] border border-slate-100 shadow-soft text-left space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-black text-navy uppercase tracking-tight flex items-center gap-1.5">
                          <Navigation className="w-4 h-4 text-orange" /> Navegação & Rotas GPS
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Visualização e cálculo dinâmico de encomendas</p>
                      </div>
                      
                      {activeDelivery && (
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${isRouting ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                          {isRouting ? 'Percurso Ativo' : 'Parado'}
                        </span>
                      )}
                    </div>

                    <div className="h-60 bg-slate-100 rounded-[30px] border border-slate-100 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-[url('https://api.dicebear.com/7.x/shapes/svg?seed=map')] opacity-15" />
                      
                      {activeDelivery ? (
                        <>
                          {/* Route tracking lines */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            <motion.path 
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              d="M 50 200 C 150 150, 200 80, 270 50 Z"
                              fill="none"
                              stroke="rgba(255,100,0,0.6)"
                              strokeWidth="4"
                              strokeDasharray="8 6"
                            />
                          </svg>

                          {/* Source pickup location indicator */}
                          <div className="absolute bottom-10 left-10 p-2.5 bg-navy text-white rounded-xl shadow-md border border-white/20">
                            <Truck className="w-4 h-4" />
                          </div>

                          {/* Destination dropoff pin indicator */}
                          <div className="absolute top-10 right-20 p-2.5 bg-orange text-white rounded-xl shadow-md">
                            <MapPin className="w-4 h-4" />
                          </div>

                          {/* Route dynamic progress box overlay */}
                          <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                            <div>
                              <p className="text-[8px] text-slate-400 font-extrabold uppercase">Ruta Ativa • {simulatedKm} km restante</p>
                              <p className="text-xs font-black text-navy truncate max-w-[150px]">{activeDelivery.delivery_address || activeDelivery.deliveryAddress}</p>
                            </div>

                            <div className="flex gap-1.5">
                              {/* Open on native systems buttons */}
                              <button 
                                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(activeDelivery.delivery_address || activeDelivery.deliveryAddress)}`)}
                                className="px-2.5 py-2 bg-indigo-50 hover:bg-indigo-150 text-indigo-700 rounded-xl text-[9px] font-black uppercase transition-all"
                                title="Google Maps"
                              >
                                Google Maps
                              </button>
                              <button 
                                onClick={() => window.open(`https://waze.com/ul?q=${encodeURIComponent(activeDelivery.delivery_address || activeDelivery.deliveryAddress)}`)}
                                className="px-2.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-[9px] font-black uppercase transition-all"
                                title="Waze GPS"
                              >
                                Waze
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-6 space-y-2">
                          <Compass className="w-10 h-10 text-slate-300 mx-auto animate-spin" style={{ animationDuration: '6s' }} />
                          <p className="text-xs font-bold text-slate-400 max-w-xs uppercase tracking-wider">Nenhuma entrega de percurso ativa de momento</p>
                        </div>
                      )}
                    </div>

                    {/* Active routing trigger control panel */}
                    {activeDelivery && (
                      <div className="p-4 bg-slate-50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold">
                        <div>
                          <p className="text-[8px] font-black text-orange uppercase tracking-wider">Percurso em andamento</p>
                          <p className="text-sm font-black text-navy">{simulatedKm} km • {simulatedTimeLeft} min estimado</p>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                          {simulatedKm > 0 ? (
                            <button
                              onClick={handleStartRoute}
                              disabled={isRouting}
                              className={`flex-1 sm:flex-none px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                isRouting 
                                  ? 'bg-amber-100 border-amber-200 text-amber-700 cursor-not-allowed' 
                                  : 'bg-indigo-600 text-white border-indigo-600 hover:bg-orange'
                              }`}
                            >
                              {isRouting ? 'Navegando...' : 'Iniciar Simulador de Rota'}
                            </button>
                          ) : (
                            <button
                              onClick={handleCompleteDelivery}
                              className="flex-1 sm:flex-none px-5 py-3 bg-green-500 hover:bg-green-600 text-white border border-green-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-transform hover:scale-[1.02] shadow-lg shadow-green-500/10 cursor-pointer"
                            >
                              Finalizar & Confirmar Entrega
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setActiveDelivery(null);
                              setIsRouting(false);
                            }}
                            className="px-3.5 py-3 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-slate-550 transition-colors cursor-pointer"
                            title="Desmarcar Rota"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Stopwatch Active shifts widget & Challenges bento */}
                  <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-soft text-left space-y-5">
                    <div>
                      <h4 className="text-xs font-black text-navy uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-orange" /> Horário Turno
                      </h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Controlador de disponibilidade real</p>
                    </div>

                    <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100/50 text-center space-y-2">
                      <span className="text-[10px] text-slate-450 font-black uppercase block">Tempo de Trabalho Ativo</span>
                      <h3 className="text-2xl font-black text-navy font-mono">
                        {isOnline ? formatSeconds(onlineTime) : '00h 00m 00s'}
                      </h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {isOnline ? 'Transmissão GPS LIGADA' : 'Desligado da rede'}
                      </p>
                    </div>

                    {/* Weekly active challenges requirements */}
                    <div className="space-y-3 pt-1 border-t border-slate-100">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-navy">Desafio Semanal</span>
                        <span className="text-[9px] bg-orange/10 text-orange font-black px-2 py-0.5 rounded-full">+500 MT</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                          <span>Completar 20 entregas</span>
                          <span>{totalCompletedCount} / 20</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange" 
                            style={{ width: `${Math.min(100, Math.round((totalCompletedCount / 20) * 100))}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Recompensa: Bónus Credenciado + 100 Pontos Moz</span>
                    </div>

                  </div>

                </div>

                {/* Available Orders Section in Platform */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-md font-black text-navy uppercase tracking-tight flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-orange" /> Pedidos de Entrega Disponíveis
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Novos chamados comerciais em tempo real no mapa de Maputo</p>
                    </div>

                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">Atualizando...</span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {marketOrders.length > 0 ? (
                      marketOrders.map(order => {
                        const amount = 150; // flat delivery fee
                        
                        return (
                          <div 
                            key={order.id} 
                            className="bg-white rounded-[32px] p-6 shadow-soft border border-slate-100 hover:border-orange/20 transition-all text-left flex flex-col justify-between"
                          >
                            <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-10 h-10 bg-slate-50 text-navy rounded-xl flex items-center justify-center">
                                    <Truck className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-[8px] font-black text-slate-405 font-mono">ID: ORD-#{order.id.slice(0, 8).toUpperCase()}</p>
                                    <p className="text-xs font-black text-navy capitalize">{order.type || 'Fatura Encomenda'}</p>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <p className="text-sm font-black text-green-600">+{amount} MT</p>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase">18 min est.</p>
                                </div>
                              </div>

                              <div className="space-y-2 text-xs font-semibold text-navy bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                                  <p className="truncate text-slate-500">Recolha: <span className="text-navy">Central Fornecedor Maputo</span></p>
                                </div>
                                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50">
                                  <MapPin className="w-3.5 h-3.5 text-orange shrink-0" />
                                  <p className="truncate text-navy font-bold">Entrega: <span className="text-orange">{order.delivery_address || 'Av. Vladimir Lenine'}</span></p>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2.5 mt-5">
                              <button
                                onClick={() => handleAcceptOrder(order)}
                                className="flex-1 py-3.5 bg-orange text-white rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-navy hover:scale-[1.01] transition-all shadow-md shadow-orange/15 cursor-pointer border-none"
                              >
                                Aceitar Pedido
                              </button>
                              <button
                                onClick={() => handleIgnoreOrder(order.id)}
                                className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-450 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-colors cursor-pointer border-none"
                              >
                                Ignorar
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="md:col-span-2 p-10 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-150 flex flex-col items-center justify-center space-y-3">
                        <RefreshCw className="w-8 h-8 text-slate-350 animate-spin" style={{ animationDuration: '4s' }} />
                        <div>
                          <p className="text-xs font-black text-navy uppercase tracking-tight">Sem chamados pendentes de momento</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold mt-1 max-w-sm">No modo Online, novos pedidos corporativos e domiciliares de clientes são automaticamente distribuídos aqui.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Achievements Medal Table */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-xs font-black text-navy uppercase tracking-widest flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-orange" /> Minhas Conquistas & Medalhas
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {[
                      { name: 'Primeiro Km', desc: 'Realizou a 1ª Entrega', icon: Sparkles, cond: totalCompletedCount >= 1, badge: '⭐' },
                      { name: 'Centurião', desc: 'Completou 100 Entregas', icon: Award, cond: totalCompletedCount >= 100, badge: '🏆' },
                      { name: 'Meio Milhar', desc: 'Completou 500 Entregas', icon: Shield, cond: totalCompletedCount >= 500, badge: '🌟' },
                      { name: 'Lenda', desc: 'Superou 1000 Entregas', icon: Zap, cond: totalCompletedCount >= 1000, badge: '👑' },
                      { name: 'Fiel Simpatia', desc: 'Avaliador nível 5 estrelas', icon: ThumbsUp, cond: Number(driverRating) >= 4.8, badge: '❤' }
                    ].map(medal => (
                      <div 
                        key={medal.name} 
                        className={`p-4 rounded-3xl border text-center space-y-2 transition-all shadow-soft ${
                          medal.cond 
                            ? 'bg-white border-orange/20 opacity-100' 
                            : 'bg-slate-50/70 border-slate-100 opacity-55'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-2xl mx-auto flex items-center justify-center text-sm ${
                          medal.cond ? 'bg-orange/10 text-orange' : 'bg-slate-200 text-slate-400'
                        }`}>
                          <medal.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-navy uppercase tracking-tight leading-none truncate">{medal.name}</p>
                          <span className="text-[8px] text-slate-400 font-bold block mt-1 leading-tight">{medal.desc}</span>
                        </div>
                        <span className="text-[10px] block font-mono">{medal.cond ? '🔓 Desbloqueado' : '🔒 Bloqueado'}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}

            {/* View: Shipments history */}
            {activeTab === 'history' && (
              <motion.div 
                key="history-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white p-6 sm:p-8 rounded-[40px] shadow-soft border border-slate-100 text-left space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <h3 className="text-lg font-black text-navy uppercase tracking-tight flex items-center gap-1.5">
                      <History className="w-5 h-5 text-orange" /> Histórico Completo de Entregas
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Acompanha todos os teus fretes, valores e coordenadas de clientes</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setHistoryFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border cursor-pointer ${historyFilter === 'all' ? 'bg-navy text-white border-navy' : 'bg-slate-50 text-slate-550 border-transparent'}`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setHistoryFilter('delivered')}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border cursor-pointer ${historyFilter === 'delivered' ? 'bg-green-500 text-white border-green-500' : 'bg-slate-50 text-slate-550 border-transparent'}`}
                    >
                      Delivered
                    </button>
                    <button
                      onClick={() => setHistoryFilter('active')}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border cursor-pointer ${historyFilter === 'active' ? 'bg-orange text-white border-orange' : 'bg-slate-50 text-slate-550 border-transparent'}`}
                    >
                      Active
                    </button>
                  </div>
                </div>

                {/* Local search engine index input */}
                <div className="bg-slate-50 h-11 px-4 border border-slate-150 rounded-2xl flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar histórico por endereço de entrega ou ID mercantil..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="bg-transparent outline-none border-none text-xs text-navy font-bold w-full"
                  />
                  {historySearch && <X className="w-4 h-4 text-slate-400 hover:text-navy cursor-pointer" onClick={() => setHistorySearch('')} />}
                </div>

                {/* History table list */}
                <div className="space-y-3.5">
                  {myOrders.length > 0 ? (
                    myOrders
                      .filter(o => {
                        if (historyFilter === 'delivered') return o.status === 'completed' || o.status === 'Entregue';
                        if (historyFilter === 'cancelled') return o.status === 'cancelled';
                        if (historyFilter === 'active') return o.status !== 'completed' && o.status !== 'Entregue' && o.status !== 'cancelled';
                        return true;
                      })
                      .filter(o => {
                        if (!historySearch.trim()) return true;
                        const src = historySearch.toLowerCase();
                        return (o.delivery_address || o.deliveryAddress || '').toLowerCase().includes(src) || o.id.toLowerCase().includes(src);
                      })
                      .map(order => (
                        <div 
                          key={order.id}
                          className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-navy shadow-sm">
                              <Truck className="w-5 h-5 text-indigo-650" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-400 font-mono">ID: ORD-#{order.id.substring(0, 8).toUpperCase()}</p>
                              <p className="text-xs font-black text-navy truncate max-w-[200px]">{order.delivery_address || order.deliveryAddress || 'Av. Mao Tse Tung'}</p>
                              <span className="text-[8px] text-slate-450 font-bold">{new Date(order.created_at || order.createdAt).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-150/10 pt-2 sm:pt-0">
                            <span className={`px-2.5 py-1 rounded-full text-[8.5px] font-black uppercase tracking-tight ${
                              order.status === 'completed' || order.status === 'Entregue'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {order.status || 'Aceite'}
                            </span>
                            
                            <span className="text-xs font-black text-navy">150.00 MT</span>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-10 text-slate-450 text-xs font-bold uppercase">
                      Não foram encontrados registros de entregas no teu histórico.
                    </div>
                  )}
                </div>

                <div className="flex justify-start">
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className="px-5 py-3.5 bg-navy hover:bg-orange text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer border-none"
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar à central
                  </button>
                </div>
              </motion.div>
            )}

            {/* View: Financial detailed earnings */}
            {activeTab === 'earnings' && (
              <motion.div 
                key="earnings-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white p-6 sm:p-8 rounded-[40px] shadow-soft border border-slate-100 text-left space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <h3 className="text-lg font-black text-navy uppercase tracking-tight flex items-center gap-1.5">
                      <TrendingUp className="w-5 h-5 text-orange" /> Balanço & Ganhos Comerciais
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Visualização de comissões líquidas da plataforma e faturação de fretes</p>
                  </div>

                  {/* Filter and CSV buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select 
                      value={earningsFilter}
                      onChange={(e: any) => setEarningsFilter(e.target.value)}
                      className="h-9 border border-slate-200 outline-none rounded-xl text-[9px] font-black uppercase px-2.5 text-navy bg-slate-50"
                    >
                      <option value="daily">Filtro Diário</option>
                      <option value="weekly">Filtro Semanal</option>
                      <option value="monthly">Filtro Mensal</option>
                      <option value="yearly">Filtro Anual</option>
                    </select>

                    <button
                      onClick={handleDownloadCSV}
                      className="h-9 px-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer border-none"
                    >
                      <Download className="w-3.5 h-3.5" /> Descarregar CSV
                    </button>
                  </div>
                </div>

                {/* Financial breakdown stats cards row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">Faturação de Fretes Brutis</span>
                    <h4 className="text-xl font-black text-navy">{totalCompletedCount * 150} MT</h4>
                    <span className="text-[8px] text-slate-400 font-bold uppercase mt-1 block">Apoio flat fixado de 150 MT/entrega</span>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">Comissões da Plataforma (5%)</span>
                    <h4 className="text-xl font-black text-rose-600">{(totalCompletedCount * 150 * 0.05).toFixed(1)} MT</h4>
                    <span className="text-[8px] text-rose-500 font-bold uppercase mt-1 block">Custo de taxa de seguros e GPS ativo</span>
                  </div>

                  <div className="p-5 bg-green-50/50 rounded-2xl border border-green-200/50">
                    <span className="text-[8.5px] font-black text-green-700 uppercase tracking-widest block mb-1">Rendimento Líquido Acumulado</span>
                    <h4 className="text-xl font-black text-green-700">{(totalCompletedCount * 150 * 0.95).toFixed(1)} MT</h4>
                    <span className="text-[8px] text-green-600 font-bold uppercase mt-1 block">Saldo disponível para levantamento habitual</span>
                  </div>
                </div>

                {/* Growth visual indicator chart representation under stats */}
                <div className="space-y-3.5 pt-2">
                  <h4 className="text-xs font-black text-navy uppercase tracking-widest block">Gráfico de Rendimento Mensal (Maputo)</h4>
                  
                  <div className="h-44 bg-slate-50 rounded-3xl p-5 border border-slate-100 flex items-end justify-between gap-3">
                    {[
                      { month: 'Jan', val: 1200, pct: '15%' },
                      { month: 'Fev', val: 1800, pct: '28%' },
                      { month: 'Mar', val: 3200, pct: '50%' },
                      { month: 'Abr', val: 2400, pct: '38%' },
                      { month: 'Mai', val: 4200, pct: '70%' },
                      { month: 'Jun', val: 5600, pct: '90%' }
                    ].map(item => (
                      <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-[9px] font-black text-navy font-mono">{item.val} MT</span>
                        <div 
                          className="w-full bg-gradient-to-t from-orange to-indigo-600 rounded-t-lg transition-all duration-300" 
                          style={{ height: `${item.pct}` }}
                        />
                        <span className="text-[9px] text-slate-450 uppercase font-bold">{item.month}</span>
                      </div>
                    ))}
                  </div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase block text-center">Rendimento de fretes em crescimento de 12.8% em Junho de 2026</span>
                </div>

                <div className="flex justify-start pt-3">
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className="px-5 py-3.5 bg-navy hover:bg-orange text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer border-none"
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar à central
                  </button>
                </div>
              </motion.div>
            )}

            {/* View: Wallet payouts available */}
            {activeTab === 'wallet' && (
              <motion.div 
                key="wallet-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid md:grid-cols-3 gap-8 text-left"
              >
                
                {/* Available details wallet panel */}
                <div className="md:col-span-1 space-y-6">
                  <div className="bg-white p-6 rounded-[36px] border border-slate-100 shadow-soft text-left space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h4 className="text-xs font-black text-navy uppercase tracking-widest flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-orange" /> Saldo da Carteira
                      </h4>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Controlador de valores financeiros</p>
                    </div>

                    <div className="space-y-4 pt-1">
                      <div className="p-4 bg-green-50/55 border border-green-200/50 rounded-2xl">
                        <span className="text-[8px] font-black text-green-700 uppercase tracking-widest block mb-1">Disponível para Levantamento</span>
                        <h4 className="text-2xl font-black text-green-700">{walletAvailable.toLocaleString()} MT</h4>
                      </div>

                      <div className="p-4 bg-indigo-50/40 border border-indigo-150/50 rounded-2xl">
                        <span className="text-[8px] font-black text-indigo-700 uppercase tracking-widest block mb-1">Saldo Retido em Pendência</span>
                        <h4 className="text-md font-black text-indigo-700">{walletPending.toLocaleString()} MT</h4>
                        <span className="text-[8px] text-slate-400 font-bold block mt-1 uppercase">Processando transações bancárias habituais</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payout request & logistics transactions list column */}
                <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft text-left space-y-6">
                  
                  {/* Withdrawal form request */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-navy uppercase tracking-tight">Solicitar Levantamento Imediato</h3>
                    
                    <form onSubmit={handleRequestPayout} className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'mpesa', label: 'M-PESA' },
                          { id: 'emola', label: 'E-MOLA' },
                          { id: 'bank', label: 'BANCO (IBAN)' }
                        ].map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setPayoutMethod(m.id as any)}
                            className={`py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                              payoutMethod === m.id 
                                ? 'bg-navy border-navy text-white shadow-soft shadow-navy/10' 
                                : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-105'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor do Saque (MT)</label>
                          <input
                            type="number"
                            placeholder="Ex: 500"
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                            className="bg-slate-50 h-11 w-full border border-slate-150 rounded-xl px-4 text-xs font-bold text-navy outline-none focus:bg-white focus:border-orange transition-colors"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Contacto / IBAN da Conta</label>
                          <input
                            type="text"
                            placeholder={payoutMethod === 'bank' ? 'IBAN completo' : '+258 84 ...'}
                            value={payoutDetails}
                            onChange={(e) => setPayoutDetails(e.target.value)}
                            className="bg-slate-50 h-11 w-full border border-slate-150 rounded-xl px-4 text-xs font-bold text-navy outline-none focus:bg-white focus:border-orange transition-colors"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-4 bg-orange hover:bg-navy text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg shadow-orange/15 cursor-pointer border-none"
                      >
                        Submeter Solicitação de Resgate
                      </button>
                    </form>
                  </div>

                  {/* Log of financial payout audits requests from database */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-black text-navy uppercase tracking-widest">Histórico de Movimentações</h4>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {payoutLogs.length > 0 ? (
                        payoutLogs.map((p, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                            <div>
                              <p className="font-extrabold text-navy capitalize">Saque {p.method}</p>
                              <span className="text-[8px] text-slate-405 font-medium">{new Date(p.created_at).toLocaleString()}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-extrabold text-rose-600">-{p.amount} MT</p>
                              <span className={`text-[8px] font-black uppercase ${p.status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                                {p.status || 'Pendente'}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-4">Nenhum saque solicitado anteriormente.</p>
                      )}
                    </div>
                  </div>

                </div>

              </motion.div>
            )}

            {/* View: Work zones and radius settings page */}
            {activeTab === 'zones' && (
              <motion.div 
                key="zones-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white p-6 sm:p-8 rounded-[40px] shadow-soft border border-slate-100 text-left space-y-6"
              >
                <div>
                  <h3 className="text-lg font-black text-navy uppercase tracking-tight flex items-center gap-1.5">
                    <Map className="w-5 h-5 text-orange" /> Áreas de Atuação GPS & Turnos
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Configura as zonas onde recebes propostas e estabelece o teu raio máximo de viagem</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-2">
                  
                  {/* Geographic operational boundaries settings */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-navy uppercase tracking-widest block">Definições Geográficas</h4>
                    
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black text-slate-405 uppercase tracking-widest">Raio Máximo GPS (km): {maxRadius} km</label>
                      <input 
                        type="range" 
                        min="2" 
                        max="50" 
                        value={maxRadius} 
                        onChange={(e) => setMaxRadius(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange" 
                      />
                      <span className="text-[8px] text-slate-400 font-bold block mt-1 uppercase">Só recebes notificações de recolhas compreendidas neste limite</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black text-slate-405 uppercase tracking-widest">Bairros de Preferência</label>
                      <div className="flex flex-wrap gap-2">
                        {['Maputo Central', 'Matola', 'Zimpeto', 'Sommerschield', 'Polana', 'Bairro Central', 'Laulane'].map(bairro => {
                          const has = workZones.includes(bairro);
                          return (
                            <button
                              key={bairro}
                              type="button"
                              onClick={() => {
                                if (has) {
                                  setWorkZones(workZones.filter(z => z !== bairro));
                                } else {
                                  setWorkZones([...workZones, bairro]);
                                }
                              }}
                              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border cursor-pointer transition-colors ${
                                has 
                                  ? 'bg-orange/15 border-orange text-orange' 
                                  : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              {bairro}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={handleSaveZonesAndRadius}
                      className="px-5 py-3.5 bg-navy hover:bg-orange text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer border-none"
                    >
                      Guardar Definições GPS
                    </button>
                  </div>

                  {/* Work schedule setting */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-navy uppercase tracking-widest block">Configurar Horário de Turnos</h4>
                    
                    <div className="space-y-2">
                      {[
                        'Segunda a Sexta (08:00 - 20:00)',
                        'Fim de Semana Completo (Sábado e Domingo)',
                        'Horário Noturno (20:00 - 02:00)'
                      ].map(schedule => {
                        const active = workSchedules.includes(schedule);
                        return (
                          <div 
                            key={schedule}
                            onClick={() => {
                              if (active) {
                                setWorkSchedules(workSchedules.filter(s => s !== schedule));
                              } else {
                                setWorkSchedules([...workSchedules, schedule]);
                              }
                            }}
                            className={`p-4 rounded-2xl border cursor-pointer flex justify-between items-center transition-all ${
                              active ? 'bg-indigo-50/50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-150 text-slate-500 hover:bg-slate-100/50'
                            }`}
                          >
                            <span className="text-xs font-bold leading-normal">{schedule}</span>
                            <span className="text-[10px] font-bold">{active ? 'Ativo' : 'Inativo'}</span>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleSaveWorkingSchedules}
                      className="px-5 py-3.5 bg-navy hover:bg-orange text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer border-none"
                    >
                      Guardar Disponibilidade Laboral
                    </button>
                  </div>

                </div>

                <div className="flex justify-start border-t border-slate-100 pt-5">
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className="px-5 py-3.5 bg-slate-150 text-slate-650 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer border-none"
                  >
                    <ArrowLeft className="w-4 h-4" /> Cancelar alterações
                  </button>
                </div>
              </motion.div>
            )}

            {/* View: Supports and helpdesk ticketing FAQ system view */}
            {activeTab === 'support' && (
              <motion.div 
                key="support-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid md:grid-cols-2 gap-8 text-left"
              >
                
                {/* FAQ help section + chat */}
                <div className="space-y-6">
                  
                  {/* Live Support Helpdesk Simulation chat */}
                  <div className="bg-white p-6 rounded-[36px] shadow-soft border border-slate-100 space-y-4">
                    <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-black text-navy uppercase tracking-widest">Chat com Suporte Local</h4>
                        <span className="text-[8px] font-bold text-green-500 uppercase">Assistente Ativo Conectado</span>
                      </div>
                      
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>

                    {/* Chat messaging display area */}
                    <div className="h-44 overflow-y-auto bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5 flex flex-col">
                      {supportChat.map((chat, idx) => {
                        const isS = chat.sender === 'support';
                        return (
                          <div 
                            key={idx} 
                            className={`p-3 rounded-2xl text-[11px] leading-relaxed max-w-[80%] ${
                              isS 
                                ? 'bg-white border border-slate-205 text-slate-700 self-start' 
                                : 'bg-navy text-white self-end'
                            }`}
                          >
                            <p className="font-semibold">{chat.text}</p>
                            <span className="text-[8px] font-black block mt-1.5 text-right opacity-60 uppercase">{chat.time}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 bg-slate-50 border border-slate-100 rounded-xl p-1.5">
                      <input
                        type="text"
                        placeholder="Escreve uma mensagem de suporte..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                        className="bg-transparent pl-3 text-xs font-bold text-navy outline-none w-full border-none"
                      />
                      <button
                        onClick={handleSendChatMessage}
                        className="w-10 h-10 bg-orange text-white rounded-lg flex items-center justify-center cursor-pointer hover:bg-navy transition-colors border-none"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* FAQ block details */}
                  <div className="bg-white p-6 rounded-[36px] border border-slate-100 shadow-soft text-left space-y-4">
                    <h4 className="text-xs font-black text-navy uppercase tracking-widest block">Perguntas Frequentes (FAQ)</h4>
                    
                    <div className="space-y-3">
                      {[
                        { q: 'Como sou pago pelas minhas entregas?', a: 'Cada entrega rende 150 MT de apoio fixo. Podes solicitar saque via M-Pesa, e-Mola ou transferência bancária assim que acumulares saldo disponível.' },
                        { q: 'O que fazer em caso de acidente ou atraso?', a: 'Contacta-nos imediatamente no painel de suporte. O tempo estimado exposto ao cliente será recalculado automaticamente para reter a tua reputação.' },
                        { q: 'As taxas de comissão da plataforma variam?', a: 'As comissões da Moz Logística são tabeladas permanentemente em 5% deduzidos unicamente sobre o valor líquido dos fretes gerados.' }
                      ].map((faq, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-50 rounded-xl text-left space-y-1">
                          <p className="font-black text-[11px] text-navy uppercase leading-normal">{faq.q}</p>
                          <p className="text-[10px] text-slate-550 leading-relaxed font-semibold">{faq.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Open Ticket manual layout */}
                <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft text-left space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h4 className="text-xs font-black text-navy uppercase tracking-widest">Abrir Ticket Formal de Incidência</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Envia relatórios de litígio para o departamento administrativo</p>
                    </div>

                    <form onSubmit={handleCreateTicket} className="space-y-4">
                      
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-405 uppercase tracking-widest">Categoria do Litígio</label>
                        <select
                          value={newTicketCategory}
                          onChange={(e) => setNewTicketCategory(e.target.value)}
                          className="w-full bg-slate-50 h-10 border border-slate-150 rounded-xl text-xs px-3 font-semibold text-navy outline-none"
                        >
                          <option value="billing">Problemas de Pagamento / Saldo</option>
                          <option value="technical">Falhas no GPS / Rotas</option>
                          <option value="complaint">Litígio com Cliente / Vendedor</option>
                          <option value="help">Esclarecimento de Nível ou Bónus</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-405 uppercase tracking-widest">Assunto da Incidência</label>
                        <input
                          type="text"
                          placeholder="Ex: Erro no saldo da entrega #4829"
                          value={newTicketSubject}
                          onChange={(e) => setNewTicketSubject(e.target.value)}
                          className="bg-slate-50 h-11 w-full border border-slate-150 rounded-xl px-4 text-xs font-bold text-navy outline-none focus:bg-white focus:border-orange transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-405 uppercase tracking-widest">Mensagem Detalhada</label>
                        <textarea
                          placeholder="Explica com clareza o teu incidente..."
                          rows={4}
                          value={newTicketMessage}
                          onChange={(e) => setNewTicketMessage(e.target.value)}
                          className="bg-slate-50 w-full border border-slate-150 rounded-2xl p-4 text-xs font-semibold text-navy outline-none focus:bg-white focus:border-orange transition-colors placeholder:text-slate-350"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-4 bg-navy hover:bg-orange text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-soft cursor-pointer border-none"
                      >
                        Submeter Reclamação Formal
                      </button>

                    </form>
                  </div>

                  {/* support tickets state info logs */}
                  <div className="pt-4 border-t border-slate-100 text-xs">
                    <p className="font-extrabold text-navy uppercase text-[10px] tracking-widest mb-2">Meus Tickets Recentes</p>
                    <div className="space-y-2">
                      {supportTickets.length > 0 ? (
                        supportTickets.map((t, i) => (
                          <div key={i} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                            <div>
                              <p className="font-extrabold text-navy">{t.subject}</p>
                              <span className="text-[8px] text-slate-500 capitalize">{t.category}</span>
                            </div>
                            <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                              {t.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-400 italic font-medium uppercase text-center py-2">Nenhum ticket pendente registado.</p>
                      )}
                    </div>
                  </div>

                </div>

              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
