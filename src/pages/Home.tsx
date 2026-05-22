import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { MOCK_PRODUCTS, MOCK_SERVICES } from '../constants';
import { ItemCard } from '../components/ItemCard';
import { ArrowRight, Utensils, Truck, Wrench, Sparkles, MapPin, Database, BookOpen, LayoutGrid, Clock, Star, TrendingUp, DollarSign, UserCheck, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { Product, Service, UserRole } from '../types';

export function Home() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initHome() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('moderation_status', 'approved')
          .limit(4);

        if (error) throw error;

        if (!data || data.length === 0) {
          setProducts(MOCK_PRODUCTS as any);
        } else {
          const mappedData = data.map(item => ({
            ...item,
            imageUrl: item.image_url,
            sellerId: item.seller_id,
            moderationStatus: item.moderation_status,
            reviewsCount: item.reviews_count,
            createdAt: item.created_at
          })) as Product[];
          setProducts(mappedData);
        }
      } catch (err) {
        console.warn('Usando mock data devido a erro ou falta de dados:', err);
        setProducts(MOCK_PRODUCTS as any);
      } finally {
        setLoading(false);
      }
    }
    initHome();
  }, []);

  const seedData = async () => {
    if (!user || !profile) {
      alert("Por favor, faça login para inicializar o demo.");
      return;
    }

    if (profile.role !== UserRole.SELLER_MICRO && profile.role !== UserRole.SELLER_MACRO && profile.role !== UserRole.ADMIN) {
      alert("Apenas vendedores ou administradores podem inicializar o demo.");
      return;
    }

    try {
      const productsToSeed = MOCK_PRODUCTS.map(({ id, ...data }) => ({
        ...data,
        image_url: data.imageUrl,
        seller_id: user.id,
        moderation_status: 'approved',
        created_at: new Date().toISOString()
      }));

      const servicesToSeed = MOCK_SERVICES.map(({ id, ...data }) => ({
        ...data,
        image_url: data.imageUrl,
        provider_id: user.id,
        created_at: new Date().toISOString()
      }));

      const { error: pError } = await supabase.from('products').insert(productsToSeed);
      if (pError) throw pError;

      const { error: sError } = await supabase.from('services').insert(servicesToSeed);
      if (sError) throw sError;

      window.location.reload();
    } catch (err) {
      handleSupabaseError(err);
    }
  };

  const discoveryOptions = [
    { name: 'Perto de mim', icon: MapPin, color: 'bg-blue-500', path: '/explore?filter=nearby' },
    { name: 'Promoções do dia', icon: Percent, color: 'bg-orange', path: '/explore?filter=promo' },
    { name: 'Melhores qualificados', icon: Star, color: 'bg-yellow-500', path: '/explore?filter=top-rated' },
    { name: 'Em alta', icon: TrendingUp, color: 'bg-red-500', path: '/explore?filter=trending' },
    { name: 'Melhores preços', icon: DollarSign, color: 'bg-green-500', path: '/explore?filter=best-prices' },
    { name: 'Recomendado para mim', icon: UserCheck, color: 'bg-purple-500', path: '/explore?filter=recommended' },
  ];

  return (
    <div className="space-y-8 pb-24">
      {/* Hero / Location Header */}
      <section className="bg-navy text-white px-4 py-8 -mx-4 sm:mx-0 sm:rounded-3xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2 text-orange font-semibold text-sm">
                <MapPin className="w-4 h-4" />
                Entregar em: Moçambique
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                Tudo o que precisas,<br />
                <span className="text-orange italic">num só lugar.</span>
              </h1>
            </div>
            
            {products.length === 0 && !loading && (
              <button 
                onClick={seedData}
                className="flex items-center gap-2 bg-orange hover:bg-orange/90 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange/20 self-start"
              >
                <Database className="w-4 h-4" />
                INICIALIZAR DEMO
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {discoveryOptions.map((opt) => (
              <Link
                key={opt.name}
                to={opt.path}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl hover:bg-white/20 transition-all border border-white/10 shrink-0"
              >
                <opt.icon className="w-4 h-4 text-orange" />
                <span className="text-[11px] font-bold">{opt.name}</span>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Abstract shapes for design flair */}
        <div className="absolute top-1/2 left-3/4 -translate-y-1/2 w-64 h-64 bg-orange/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </section>

      {/* Promotions Banner */}
      <section>
        <div className="bg-orange/10 border border-orange/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange rounded-full flex items-center justify-center text-white">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-navy">Ganhe 20% OFF no seu 1º pedido!</p>
              <p className="text-xs text-slate-500">Válido para serviços e iFood.</p>
            </div>
          </div>
          <button className="bg-orange text-white text-xs font-bold px-4 py-2 rounded-lg">USAR AGORA</button>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-extrabold text-navy">Produtos em Destaque</h2>
          <Link to="/products" className="text-orange text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
            Ver tudo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((item) => (
            <ItemCard
              key={item.id}
              id={item.id}
              name={item.name}
              imageUrl={item.imageUrl}
              price={item.price}
              rating={item.rating}
              provider="Loja Local"
              category={item.category}
              type="product"
            />
          ))}
        </div>
      </section>

      {/* Featured Infoproducts Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-extrabold text-navy">Infoprodutos Digitais</h2>
          <Link to="/infoproducts" className="text-orange text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
            Explorar Cursos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Curso de Marketing Digital', price: 1500, students: 450, icon: BookOpen, color: 'bg-purple-500' },
            { title: 'Template de Gestão Financeira', price: 250, students: 1200, icon: LayoutGrid, color: 'bg-blue-500' },
            { title: 'E-book: Empreender em Moçambique', price: 450, students: 890, icon: BookOpen, color: 'bg-orange' },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft flex items-center gap-4 cursor-pointer"
            >
              <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center text-white shrink-0`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-navy text-sm">{item.title}</h4>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-orange font-black text-xs">{item.price} MT</span>
                  <span className="text-[10px] text-slate-400 font-medium">{item.students} alunos</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recommendations Placeholder */}
      {profile?.role === UserRole.CUSTOMER && !profile?.onboardingCompleted && (
        <section className="bg-slate-900 text-white p-12 rounded-[48px] text-center space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange/20 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-orange/30 transition-colors" />
          <div className="relative z-10">
            <h3 className="text-3xl font-black uppercase tracking-tight">Personaliza a tua <span className="text-orange">experiência</span></h3>
            <p className="text-slate-400 max-w-sm mx-auto text-sm font-medium leading-relaxed">
              Diz-nos o que gostas para podermos fazer recomendações inteligentes com base no teu perfil e localização.
            </p>
            <Link 
              to="/onboarding"
              className="inline-flex items-center gap-3 bg-orange px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-orange/20"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
