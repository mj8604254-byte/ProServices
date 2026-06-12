import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  ChevronRight, 
  MoreHorizontal,
  Plus,
  ArrowUpRight,
  Truck,
  Settings,
  PieChart,
  RefreshCw,
  Award,
  Power,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { UserRole } from '../../types';

// Subviews
import { SalesAnalyticsView } from './seller/SalesAnalyticsView';
import { OrdersManagerView } from './seller/OrdersManagerView';
import { CustomersView } from './seller/CustomersView';
import { StockReplenishmentView } from './seller/StockReplenishmentView';
import { InventoryManagementView } from './seller/InventoryManagementView';
import { AddProductView } from './seller/AddProductView';
import { ReportsView } from './seller/ReportsView';
import { PortfolioView } from './seller/PortfolioView';
import { EmployeesView } from './seller/EmployeesView';

export function SellerDashboard({ profile }: { profile: any }) {
  const isMacro = profile?.role === UserRole.SELLER_MACRO;
  const stockCritLimit = isMacro ? 100 : 10;

  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'overview' | 'sales_analytics' | 'orders_manager' | 'customers' | 'stock_replenishment' | 'inventory_management' | 'add_product' | 'reports' | 'portfolio' | 'employees'>('overview');
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const loadData = async () => {
    if (!profile?.uid) return;
    setLoading(true);
    try {
      // 1. Load products
      const { data: dbProducts, error: pErr } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', profile.uid)
        .order('created_at', { ascending: false });
      
      if (pErr) throw pErr;
      setProducts(dbProducts || []);

      // 2. Load orders
      const { data: dbOrders, error: oErr } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', profile.uid)
        .order('created_at', { ascending: false });

      if (oErr) {
        // Fallback or sub items scanning
        const { data: allOrders } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (allOrders && dbProducts) {
          const pIds = dbProducts.map(p => p.id);
          const filtered = allOrders.filter(o => {
            if (o.items && Array.isArray(o.items)) {
              return o.items.some((item: any) => pIds.includes(item.id));
            }
            return false;
          });
          setOrders(filtered);
        }
      } else {
        setOrders(dbOrders || []);
      }
    } catch (err) {
      console.error('Error in seller profile fetching:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile?.uid]);

  // Database Seed Action for initial demo products and orders
  const seedDemoDatabase = async () => {
    if (!profile?.uid) return;
    setLoading(true);
    try {
      const demoProducts = [
        {
          name: 'iPhone 15 Pro Max Titanium 256GB',
          category: 'Eletrónicos',
          brand: 'Apple',
          description: 'Edição Premium Titanium de 256GB com câmera tripla profissional e inteligência integrada.',
          price: 95000,
          stock: 12,
          unit: 'unidade',
          location: 'Maputo',
          availability: 'imediato',
          seller_id: profile.uid,
          image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500',
          rating: 5,
          reviews_count: 5,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          name: 'Arroz Tio Lucas Seleção Especial 25kg',
          category: 'Mercearia',
          brand: 'Tio Lucas',
          description: 'Arroz agulha de cozedura solta ideal para o consumo de famílias exigentes em Moçambique.',
          price: 1800,
          stock: 95,
          unit: 'saco',
          location: 'Maputo',
          availability: 'imediato',
          seller_id: profile.uid,
          image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500',
          rating: 4,
          reviews_count: 2,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          name: 'Azeite de Oliva Extra Virgem Gallo 750ml',
          category: 'Mercearia',
          brand: 'Gallo',
          description: 'Sabor clássico extra virgem direto dos melhores olivais portugueses.',
          price: 650,
          stock: 0,
          unit: 'unidade',
          location: 'Beira',
          availability: 'indisponivel',
          seller_id: profile.uid,
          image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500',
          rating: 4,
          reviews_count: 1,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          name: 'Cafeteira Expresso Oster Prima Latte III',
          category: 'Eletrodomésticos',
          brand: 'Oster',
          description: 'Sua xícara perfeita com bomba de 20 bar italiana para leite cremoso no ponto expresso.',
          price: 12500,
          stock: 3,
          unit: 'unidade',
          location: 'Nampula',
          availability: 'imediato',
          seller_id: profile.uid,
          image_url: 'https://images.unsplash.com/photo-1517256064527-09c53b2dbeb1?w=500',
          rating: 5,
          reviews_count: 1,
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      const { data: insertedProducts, error: pErr } = await supabase
        .from('products')
        .insert(demoProducts)
        .select();

      if (pErr) throw pErr;

      const arrozId = insertedProducts?.find(p => p.name.includes('Arroz'))?.id || 'demo-p-1';
      const phoneId = insertedProducts?.find(p => p.name.includes('iPhone'))?.id || 'demo-p-2';
      const coffeeId = insertedProducts?.find(p => p.name.includes('Cafeteira'))?.id || 'demo-p-3';

      const demoOrders = [
        {
          customer_id: 'customer_live_sim_a',
          seller_id: profile.uid,
          items: [
            { id: phoneId, name: 'iPhone 15 Pro Max Titanium 256GB', price: 95000, quantity: 2 }
          ],
          total_price: 190000,
          status: 'completed',
          type: 'delivery',
          delivery_address: 'Avenida Julius Nyerere, Maputo',
          created_at: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          customer_id: 'customer_live_sim_b',
          seller_id: profile.uid,
          items: [
            { id: arrozId, name: 'Arroz Tio Lucas Seleção Especial 25kg', price: 1800, quantity: 1 }
          ],
          total_price: 1800,
          status: 'preparing',
          type: 'delivery',
          delivery_address: 'Avenida de Moçambique, Zimpeto',
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        },
        {
          customer_id: 'customer_live_sim_c',
          seller_id: profile.uid,
          items: [
            { id: coffeeId, name: 'Cafeteira Expresso Oster Prima Latte III', price: 12500, quantity: 1 }
          ],
          total_price: 12500,
          status: 'pending',
          type: 'pickup',
          delivery_address: 'Avenida 24 de Julho, Maputo',
          created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString()
        }
      ];

      const { error: oErr } = await supabase
        .from('orders')
        .insert(demoOrders);

      if (oErr) throw oErr;

      await loadData();
    } catch (err: any) {
      console.error('Failed to seed real tables:', err.message);
      alert('Erro ao carregar banco de dados de testes reais: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4" id="seller-loading-screen">
        <RefreshCw className="w-10 h-10 text-orange animate-spin" />
        <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Carregando painel real...</p>
      </div>
    );
  }

  // Handle dynamic screen rendering depending on current active view
  const renderActiveView = () => {
    switch (currentView) {
      case 'sales_analytics':
        return <SalesAnalyticsView orders={orders} onBack={() => setCurrentView('overview')} />;
      case 'orders_manager':
        return <OrdersManagerView orders={orders} onBack={() => setCurrentView('overview')} onRefresh={loadData} />;
      case 'customers':
        return <CustomersView orders={orders} onBack={() => setCurrentView('overview')} />;
      case 'stock_replenishment':
        return <StockReplenishmentView products={products} profile={profile} onBack={() => setCurrentView('overview')} onRefresh={loadData} />;
      case 'inventory_management':
        return (
          <InventoryManagementView 
            products={products} 
            profile={profile} 
            onBack={() => setCurrentView('overview')} 
            onRefresh={loadData}
            onEditProduct={(p) => {
              setEditingProduct(p);
              setCurrentView('add_product');
            }}
            onAddNewProduct={() => {
              setEditingProduct(null);
              setCurrentView('add_product');
            }}
          />
        );
      case 'add_product':
        return (
          <AddProductView 
            profile={profile} 
            editingProduct={editingProduct} 
            onBack={() => {
              setEditingProduct(null);
              setCurrentView('overview');
            }} 
            onRefresh={loadData} 
          />
        );
      case 'reports':
        return <ReportsView orders={orders} products={products} onBack={() => setCurrentView('overview')} />;
      case 'portfolio':
        return <PortfolioView profile={profile} products={products} onBack={() => setCurrentView('overview')} />;
      case 'employees':
        return <EmployeesView profile={profile} onBack={() => setCurrentView('overview')} />;
      default:
        return renderOverview();
    }
  };

  // Calculates real summary stats for top counters
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'Entregue');
  const totalSalesVolume = completedOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'accepted' || o.status === 'shipped').length;
  const lowStockCount = products.filter(p => Number(p.stock || 0) < stockCritLimit).length;
  const uniqueClientsCount = Array.from(new Set(orders.map(o => o.customer_id))).length;

  const stats = [
    { label: 'Vendas Totais', value: `${totalSalesVolume.toLocaleString()} MT`, change: `De ${completedOrders.length} concluídos`, icon: DollarSign, color: 'text-green-500', action: () => setCurrentView('sales_analytics') },
    { label: 'Pedidos Ativos', value: String(pendingCount).padStart(2, '0'), change: 'Em aberto', icon: ShoppingBag, color: 'text-orange', action: () => setCurrentView('orders_manager') },
    { label: 'Stock Crítico', value: String(lowStockCount).padStart(2, '0'), change: `Abaixo de ${stockCritLimit} unid`, icon: Package, color: 'text-red-500', action: () => setCurrentView('stock_replenishment') },
    { label: 'Ficheiros Clientes', value: String(uniqueClientsCount).padStart(2, '0'), change: 'Registados no CRM', icon: Users, color: 'text-blue-500', action: () => setCurrentView('customers') },
  ];

  function renderOverview() {
    return (
      <div className="space-y-8 pb-12 animate-fade-in" id="seller-overview-dashboard">
        {/* Helper DB Seed Alert if empty */}
        {products.length === 0 && (
          <div className="bg-navy p-6 rounded-[32px] text-white text-left flex flex-col sm:flex-row items-center justify-between gap-4 border border-orange animate-pulse">
            <div>
              <h4 className="font-extrabold uppercase text-xs text-orange tracking-widest flex items-center gap-1">
                <Sparkles className="w-4.5 h-4.5" /> Experimente o Painel Comercial Real
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                A sua base de dados de demonstração está vazia. Carregue 4 produtos elegantes e 3 encomendas instantâneas em tempo real de forma segura.
              </p>
            </div>
            <button
              id="seed-demo-db-btn"
              onClick={seedDemoDatabase}
              className="px-6 py-3 bg-orange hover:bg-orange/95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap"
            >
              Semear Dados Reais
            </button>
          </div>
        )}

        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
          <div>
            <span className="text-[10px] font-black uppercase text-orange tracking-[0.22em]">
              Moz ProServices • {profile?.role === UserRole.SELLER_MACRO ? 'Plano Seller Macro' : 'Plano Seller Micro'}
            </span>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Painel de Controlo</h2>
            <p className="text-slate-400 text-sm font-medium">Gestão da Loja: <span className="text-orange">{profile?.businessName || 'Minha Loja'}</span></p>
          </div>
          <div className="flex gap-3">
            <button 
              id="dash-btn-add-product"
              onClick={() => {
                setEditingProduct(null);
                setCurrentView('add_product');
              }}
              className="flex-1 md:flex-none px-6 py-3 bg-orange text-white rounded-2xl font-black uppercase tracking-widest hover:bg-orange/90 transition-all shadow-lg shadow-orange/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Novo Produto
            </button>
            <button 
              id="dash-btn-reports"
              onClick={() => setCurrentView('reports')}
              className="flex-1 md:flex-none px-6 py-3 bg-navy text-white rounded-2xl font-black uppercase tracking-widest hover:bg-navy/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PieChart className="w-5 h-5" />
              Relatórios
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {stats.map((stat, idx) => (
            <motion.div
              id={`stat-card-${idx}`}
              key={stat.label}
              onClick={stat.action}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-5 rounded-[28px] shadow-soft border border-slate-100 group hover:border-orange hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center ${stat.color} group-hover:bg-orange/10 transition-colors`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-orange transition-colors">
                  Gerir →
                </span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-xl font-black text-navy">{stat.value}</h3>
              <p className="text-[9px] text-slate-450 font-semibold mt-1.5">{stat.change}</p>
            </motion.div>
          ))}
        </div>

        {/* Inner Tables grids */}
        <div className="grid lg:grid-cols-2 gap-8 text-left">
          
          {/* Recent Orders Side Table */}
          <section className="bg-white rounded-[32px] shadow-soft border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange" />
                Pedidos Recentes
              </h3>
              <button 
                id="dash-btn-all-orders"
                onClick={() => setCurrentView('orders_manager')}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-orange transition-colors cursor-pointer bg-none border-none"
              >
                Gerir Todos
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {orders.slice(0, 5).map((order) => (
                    <tr 
                      key={order.id} 
                      onClick={() => setCurrentView('orders_manager')}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-bold text-navy">#{order.id.slice(0, 8)}...</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-navy leading-none">Cliente Demo</p>
                        <p className="text-[9px] text-slate-440 font-medium italic mt-1">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[8px] font-black uppercase tracking-tight px-2 py-0.5 rounded-full ${
                          order.status === 'completed' || order.status === 'Entregue' ? 'bg-green-150 text-green-700' :
                          order.status === 'pending' ? 'bg-orange/10 text-orange' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-navy">{Number(order.total_price || 0).toLocaleString()} MT</td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 font-bold">
                        Nenhum pedido registado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Product Stock status preview lists */}
          <section className="bg-white rounded-[32px] shadow-soft border border-slate-100 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange" />
                  Estado do Stock
                </h3>
                <button 
                  id="dash-btn-inventory-top"
                  onClick={() => setCurrentView('inventory_management')}
                  className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-orange transition-colors cursor-pointer"
                >
                  Inventário
                </button>
              </div>

              <div className="p-2 space-y-1">
                {products.slice(0, 4).map((product) => {
                  const stock = Number(product.stock || 0);
                  const isLow = stock < stockCritLimit;
                  
                  return (
                    <div 
                      key={product.id} 
                      onClick={() => setCurrentView('inventory_management')}
                      className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                      <img
                        src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 object-cover rounded-xl border border-slate-100"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[12px] font-bold text-navy truncate leading-snug">{product.name}</h4>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                          <span className="font-black text-orange uppercase tracking-tight">{Number(product.price).toLocaleString()} MT</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className="font-bold text-slate-400">{stock} {product.unit || 'unid'}</span>
                        </div>
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                        isLow ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
                      }`}>
                        {isLow ? 'Stock Baixo' : 'Em Stock'}
                      </span>
                    </div>
                  );
                })}
                {products.length === 0 && (
                  <p className="py-12 text-center text-slate-400 font-bold text-xs">Catálogo de produtos vazio.</p>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 mt-auto">
              <button 
                id="dash-btn-inv-footer"
                onClick={() => setCurrentView('inventory_management')}
                className="w-full py-3 bg-navy hover:bg-orange text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Gestão de Inventário
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        </div>

        {/* Grid of Other Modules */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: 'Vendas', icon: DollarSign, color: 'bg-green-500', view: 'sales_analytics' },
            { label: 'Reposição', icon: Truck, color: 'bg-amber-500', view: 'stock_replenishment' },
            { label: 'Portfólio', icon: TrendingUp, color: 'bg-gradient-to-tr from-orange to-amber-500', view: 'portfolio' },
            { label: 'Equipa', icon: Users, color: 'bg-blue-500', view: 'employees', macroOnly: true },
            { label: 'Estatísticas', icon: PieChart, color: 'bg-indigo-500', view: 'reports' },
            { label: 'Configuração', icon: Settings, color: 'bg-slate-700', view: 'portfolio' },
          ].map((item) => {
            if (item.macroOnly && !isMacro) return null; // Hide non-macro operations
            
            return (
              <button 
                id={`module-link-${item.label.toLowerCase()}`}
                key={item.label} 
                onClick={() => setCurrentView(item.view as any)}
                className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-soft flex flex-col items-center gap-3 hover:border-orange hover:-translate-y-0.5 transition-all group text-center cursor-pointer"
              >
                <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-black text-navy text-[9px] uppercase tracking-widest">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {renderActiveView()}
    </div>
  );
}
