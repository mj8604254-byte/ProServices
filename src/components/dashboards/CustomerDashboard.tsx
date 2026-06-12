import React, { useEffect, useState, useCallback } from 'react';
import { 
  ShoppingBag, 
  Heart, 
  MapPin, 
  CreditCard, 
  Clock, 
  Star, 
  ChevronRight, 
  Package, 
  Truck,
  RotateCcw,
  MessageSquare,
  Utensils,
  Plus,
  Loader2,
  Calendar,
  Sparkles,
  Wrench,
  Check,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { ReviewModal } from '../ReviewModal';

// Sub views components
import { PointsView } from './customer/PointsView';
import { FavoritesView } from './customer/FavoritesView';
import { AddressesView } from './customer/AddressesView';
import { PaymentsView } from './customer/PaymentsView';
import { WalletView } from './customer/WalletView';
import { SupportView } from './customer/SupportView';
import { OrdersView } from './customer/OrdersView';

export function CustomerDashboard({ profile }: { profile: any }) {
  const uid = profile?.uid || 'guest';
  const [orders, setOrders] = useState<any[]>([]);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isSeedingOrder, setIsSeedingOrder] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any | null>(null);

  // View state: 'hub' shows main page; others replace/render sub-components
  const [activeView, setActiveView] = useState<'hub' | 'orders' | 'favorites' | 'points' | 'addresses' | 'payments' | 'wallet' | 'support'>('hub');

  // Real-time counter states
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [pointsCount, setPointsCount] = useState(0);

  const fetchOrdersAndReviews = useCallback(async () => {
    if (!profile?.uid) return;
    setLoading(true);
    try {
      // 1. Fetch real orders
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', profile.uid)
        .order('created_at', { ascending: false });

      if (ordersErr) throw ordersErr;

      // 2. Fetch reviews to see which ones are reviewed
      const { data: reviewsData, error: reviewsErr } = await supabase
        .from('reviews')
        .select('order_id')
        .eq('customer_id', profile.uid);

      if (reviewsErr) {
        console.warn('Could not fetch reviews:', reviewsErr.message);
      }

      const reviewedIds = new Set<string>((reviewsData || []).map((r) => r.order_id));
      setReviewedOrderIds(reviewedIds);

      if (ordersData && ordersData.length > 0) {
        setOrders(ordersData);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      console.warn('Error loading real user orders/reviews:', err.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.uid]);

  // Read local storage indicators on select or view load
  const loadStatsData = useCallback(() => {
    // Favorites count
    const storedFavs = localStorage.getItem(`moz_favs_${uid}`);
    if (storedFavs) {
      try {
        const parsed = JSON.parse(storedFavs);
        setFavoritesCount(parsed.length);
      } catch (e) {
        setFavoritesCount(5); // default fallback
      }
    } else {
      setFavoritesCount(5); // initial default generated upon FavoritesView didMount
    }

    // Points count
    const storedPoints = localStorage.getItem(`moz_points_${uid}`);
    if (storedPoints) {
      setPointsCount(Number(storedPoints));
    } else {
      setPointsCount(850); // standard baseline
    }
  }, [uid]);

  useEffect(() => {
    fetchOrdersAndReviews();
    loadStatsData();
  }, [fetchOrdersAndReviews, loadStatsData, activeView]);

  // Seed standard compliant order for testing
  const generateDemoOrder = async () => {
    if (!profile?.uid) return;
    setIsSeedingOrder(true);
    try {
      // Find an approved product to make the demo realistic and trigger DB average score calculations
      const { data: dbProducts } = await supabase
        .from('products')
        .select('*')
        .eq('moderation_status', 'approved')
        .limit(1);

      let itemId = '11111111-1111-1111-1111-111111111111';
      let itemName = 'Camiseta Moz Proservices';
      let itemPrice = 850;
      let sellerId = profile.uid; 
      let isService = false;

      if (dbProducts && dbProducts.length > 0) {
        itemId = dbProducts[0].id;
        itemName = dbProducts[0].name;
        itemPrice = Number(dbProducts[0].price || 850);
        sellerId = dbProducts[0].seller_id;
      } else {
        // Look up service instead if no product exists
        const { data: dbServices } = await supabase
          .from('services')
          .select('*')
          .limit(1);
        if (dbServices && dbServices.length > 0) {
          itemId = dbServices[0].id;
          itemName = dbServices[0].name;
          itemPrice = Number(dbServices[0].price_per_hour || 1200);
          sellerId = dbServices[0].provider_id;
          isService = true;
        }
      }

      const orderPayload = {
        customer_id: profile.uid,
        items: [{ id: itemId, name: itemName, price: itemPrice, quantity: 1 }],
        total_price: itemPrice,
        status: 'completed', // Created instantly as completed so they can submit a review
        type: isService ? 'service' : 'product',
        seller_id: sellerId,
        delivery_address: 'Av. Vladimir Lenine, Maputo',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('orders').insert(orderPayload);
      if (error) throw error;

      await fetchOrdersAndReviews();
    } catch (err: any) {
      console.error('Failed to seed demo order:', err);
      alert('Erro ao criar encomenda no banco de dados: ' + err.message);
    } finally {
      setIsSeedingOrder(false);
    }
  };

  const getOrderStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
      case 'Entregue':
        return 'bg-green-100 text-green-650 font-black';
      case 'pending':
        return 'bg-orange/10 text-orange font-black';
      case 'accepted':
      case 'picked_up':
      case 'delivering':
        return 'bg-blue-100 text-blue-600 font-bold';
      default:
        return 'bg-slate-100 text-slate-500 font-bold';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'pending': return 'Pendente';
      case 'accepted': return 'Aceite';
      case 'picked_up': return 'Recolhida';
      case 'delivering': return 'Em Caminho';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const stats = [
    { label: 'Pedidos Totais', value: orders.length.toString(), icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50', view: 'orders' },
    { label: 'Favoritos', value: favoritesCount.toString(), icon: Heart, color: 'text-red-500', bg: 'bg-red-50', view: 'favorites' },
    { label: 'Pontos Moz', value: pointsCount.toString(), icon: Star, color: 'text-orange', bg: 'bg-orange/10', view: 'points' },
  ];

  // Active tracking filter (non-completed/cancelled)
  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'Entregue');
  const finishedOrders = orders.filter(o => o.status === 'completed' || o.status === 'Entregue').slice(0, 3); // show top 3 on hub

  return (
    <div className="space-y-8 pb-12" id="customer-dashboard-root">
      
      {/* Dynamic View Router inside Dashboard */}
      <AnimatePresence mode="wait">
        
        {/* Hub View: Standard Dashboard main layout */}
        {activeView === 'hub' && (
          <motion.div
            key="hub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Quick Stats Banner counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setActiveView(stat.view as any)}
                  className="bg-white p-6 rounded-[32px] shadow-soft border border-slate-100 flex items-center gap-4 cursor-pointer hover:border-orange/30 hover:scale-[1.01] transition-all"
                >
                  <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                    <stat.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <h3 className="text-2xl font-black text-navy">{stat.value}</h3>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Active tracking / Demo Orders action */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-black text-navy uppercase tracking-widest flex items-center gap-2">
                    <Truck className="w-5 h-5 text-orange" />
                    Entregas Ativas
                  </h3>
                  <button 
                    disabled={isSeedingOrder}
                    onClick={generateDemoOrder}
                    className="flex items-center gap-1.5 text-[10px] bg-navy text-white hover:bg-orange transition-all px-3.5 py-2 rounded-xl font-black uppercase tracking-widest disabled:opacity-50 cursor-pointer border-none shadow"
                  >
                    {isSeedingOrder ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Simular Nova Compra
                  </button>
                </div>
                
                {activeOrders.length > 0 ? (
                  activeOrders.map((order) => (
                    <div 
                      key={order.id} 
                      onClick={() => setActiveView('orders')}
                      className="bg-navy rounded-[32px] p-6 text-white overflow-hidden relative group mb-3 cursor-pointer text-left"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange/40 transition-colors" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                          <div className="text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-sm font-black truncate max-w-[200px] text-white">
                              {order.items?.[0]?.name || 'Itens'} {order.items?.length > 1 && `+ ${order.items.length - 1} item(s)`}
                            </p>
                          </div>
                          <div className="px-3 py-1 bg-orange rounded-full text-[9px] font-black uppercase tracking-widest">
                            {translateStatus(order.status)}
                          </div>
                        </div>

                        <div className="space-y-4 text-left">
                          <div className="flex justify-between items-end">
                            <p className="text-[10px] text-slate-350 font-bold uppercase">Progresso Logístico</p>
                            <p className="text-md font-black text-orange">{Number(order.total_price || order.totalPrice).toLocaleString()} MT</p>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: order.status === 'pending' ? '25%' : order.status === 'accepted' ? '50%' : '75%' }}
                              className="h-full bg-orange shadow-[0_0_15px_rgba(255,100,0,0.5)]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-[32px] p-8 border border-dashed border-slate-200 text-center space-y-4">
                    <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                      <Truck className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="font-bold text-navy text-sm">Nenhuma entrega em progresso</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Crie um pedido clicando no botão acima para simular compras concluídas e poder testar avaliações de estrelas em tempo real!
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Recent Orders / Completed Orders Review Area */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-black text-navy uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange" />
                    Compras Recentes
                  </h3>
                  <button 
                    onClick={() => setActiveView('orders')}
                    className="text-[10px] font-black text-orange uppercase tracking-widest hover:underline cursor-pointer bg-none border-none"
                  >
                    Ver Histórico Completo
                  </button>
                </div>

                <div className="space-y-3">
                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2].map(i => (
                        <div key={i} className="h-20 bg-white border border-slate-100 rounded-3xl animate-pulse" />
                      ))}
                    </div>
                  ) : finishedOrders.length > 0 ? (
                    finishedOrders.map((order) => {
                      const isReviewed = reviewedOrderIds.has(order.id);
                      return (
                        <div 
                          key={order.id} 
                          className="w-full bg-white p-4 sm:p-5 rounded-[24px] shadow-soft border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-navy group-hover:bg-orange/10 group-hover:text-orange transition-colors shrink-0">
                              {order.type === 'service' ? <Wrench className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                            </div>
                            <div className="text-left min-w-0 flex-1">
                              <div className="flex items-center justify-between sm:justify-start gap-3 mb-0.5">
                                <p className="text-[9px] font-black text-slate-400 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                                <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1 font-sans">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {new Date(order.created_at || order.createdAt).toLocaleDateString('pt-MZ')}
                                </span>
                              </div>
                              <p className="font-extrabold text-navy text-sm leading-tight truncate">
                                {order.items?.[0]?.name || 'Itens diversos'}
                                {order.items?.length > 1 && ` (+${order.items.length - 1} item)`}
                              </p>
                              <p className="text-xs font-bold text-orange mt-0.5">{order.total_price || order.totalPrice} MT</p>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 border-slate-50 pt-2 sm:pt-0 shrink-0">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${getOrderStatusBadgeClass(order.status)}`}>
                              {translateStatus(order.status)}
                            </span>
                            
                            {isReviewed ? (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-green-550 bg-green-550/10 px-2.5 py-1 rounded-xl">
                                <Check className="w-3.5 h-3.5" />
                                Avaliado
                              </div>
                            ) : (
                              <button
                                onClick={() => setSelectedOrderForReview(order)}
                                className="flex items-center gap-1 bg-orange text-white hover:bg-navy transition-colors px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest scale-95 hover:scale-100 cursor-pointer border-none"
                              >
                                <Star className="w-3.5 h-3.5 fill-white" />
                                Avaliar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-white p-5 rounded-[24px] shadow-soft border border-slate-150 flex items-center gap-4 filter saturate-75 opacity-70">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-navy shrink-0">
                        <Utensils className="w-6 h-6" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-[9px] font-black text-slate-400 font-mono">DEMO-4812</p>
                        <p className="font-bold text-navy text-sm leading-none">Samsung Galaxy A54 (Demonstração)</p>
                        <p className="text-[10px] font-black text-orange uppercase mt-1">18.500 MT</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase bg-green-100 text-green-600">
                          Entregue
                        </span>
                        <button
                          onClick={generateDemoOrder}
                          className="text-[9px] font-bold text-orange hover:underline uppercase cursor-pointer border-none"
                        >
                          Gerar para Avaliar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Premium Action Grid of other sections */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Endereços', icon: MapPin, color: 'bg-purple-500', view: 'addresses' },
                { label: 'Métodos Pagamento', icon: CreditCard, color: 'bg-emerald-500', view: 'payments' },
                { label: 'Minha Carteira', icon: Wallet, color: 'bg-amber-500', view: 'wallet' },
                { label: 'Linha Suporte', icon: MessageSquare, color: 'bg-blue-500', view: 'support' },
              ].map((item) => (
                <button 
                  key={item.label} 
                  onClick={() => setActiveView(item.view as any)}
                  className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft flex flex-col items-center gap-3 hover:border-orange hover:-translate-y-1 transition-all group cursor-pointer"
                >
                  <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-5.5 h-5.5" />
                  </div>
                  <span className="font-black text-navy text-[10px] uppercase tracking-widest">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Dynamic Route views rendered directly */}
        {activeView === 'orders' && (
          <motion.div key="orders" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
            <OrdersView 
              profile={profile} 
              orders={orders} 
              reviewedOrderIds={reviewedOrderIds} 
              onBack={() => setActiveView('hub')} 
              onRefresh={fetchOrdersAndReviews} 
            />
          </motion.div>
        )}

        {activeView === 'favorites' && (
          <motion.div key="favorites" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
            <FavoritesView profile={profile} onBack={() => setActiveView('hub')} />
          </motion.div>
        )}

        {activeView === 'points' && (
          <motion.div key="points" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
            <PointsView profile={profile} onBack={() => setActiveView('hub')} />
          </motion.div>
        )}

        {activeView === 'addresses' && (
          <motion.div key="addresses" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
            <AddressesView profile={profile} onBack={() => setActiveView('hub')} />
          </motion.div>
        )}

        {activeView === 'payments' && (
          <motion.div key="payments" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
            <PaymentsView profile={profile} onBack={() => setActiveView('hub')} />
          </motion.div>
        )}

        {activeView === 'wallet' && (
          <motion.div key="wallet" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
            <WalletView profile={profile} onBack={() => setActiveView('hub')} />
          </motion.div>
        )}

        {activeView === 'support' && (
          <motion.div key="support" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
            <SupportView profile={profile} onBack={() => setActiveView('hub')} />
          </motion.div>
        )}

      </AnimatePresence>

      {/* Review Modal Layer for main hub quick actions */}
      <AnimatePresence>
        {selectedOrderForReview && (
          <ReviewModal
            order={selectedOrderForReview}
            customerId={profile?.uid}
            onClose={() => setSelectedOrderForReview(null)}
            onReviewSubmitted={() => {
              setSelectedOrderForReview(null);
              fetchOrdersAndReviews();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
