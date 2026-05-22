import React from 'react';
import { Truck, ShoppingBag, Wrench, Utensils, BookOpen, ShieldCheck, Zap, Clock, Headphones } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export function Landing({ onGuestAccess }: { onGuestAccess: () => void }) {
  const navigate = useNavigate();

  const handleAuth = (mode: 'login' | 'signup') => {
    navigate(`/auth?mode=${mode}`);
  };

  const benefits = [
    { icon: Zap, text: 'Entregas Rápidas' },
    { icon: ShieldCheck, text: 'Segurança Garantida' },
    { icon: Clock, text: 'Acompanhamento em Tempo Real' },
    { icon: Headphones, text: 'Suporte 24h' },
    { icon: Zap, text: 'Inteligência Artificial' },
    { icon: ShieldCheck, text: 'Pagamentos Seguros' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 bg-navy text-white overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-24 h-24 bg-white/10 backdrop-blur rounded-3xl flex items-center justify-center mb-8 border border-white/20"
          >
            <Truck className="w-12 h-12 text-orange" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl font-extrabold mb-6 leading-tight max-w-4xl"
          >
            Mozproservices: Conectando produtos, serviços e entregas <span className="text-orange">em um só lugar.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-300 mb-12 max-w-2xl"
          >
            A plataforma líder em Moçambique para tudo o que precisas. Compre, venda, preste serviços ou realize entregas.
          </motion.p>

          <div className="flex flex-col items-center gap-8 w-full">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <button 
                onClick={() => handleAuth('signup')}
                className="w-full sm:w-auto px-10 py-5 bg-orange text-white rounded-full font-bold text-lg hover:scale-105 transition-all shadow-xl shadow-orange/20"
              >
                Criar Conta Grátis
              </button>
              <button 
                onClick={() => handleAuth('login')}
                className="w-full sm:w-auto px-10 py-5 bg-white/10 backdrop-blur text-white border border-white/20 rounded-full font-bold text-lg hover:bg-white/20 transition-all"
              >
                Entrar
              </button>
            </div>
            
            <button 
              onClick={onGuestAccess}
              className="text-slate-400 font-bold text-lg hover:text-white transition-all underline underline-offset-8 decoration-white/20"
            >
              Explorar como Visitante
            </button>
          </div>
        </div>

        {/* Floating Shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange/20 rounded-full blur-[120px] pointer-events-none -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-navy-light rounded-full blur-[100px] pointer-events-none -ml-40 -mb-40" />
      </section>

      {/* Benefits Grid */}
      <section className="bg-white py-12 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {benefits.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-orange/10 rounded-full flex items-center justify-center text-orange">
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-navy">{item.text}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-extrabold text-navy text-center mb-16 underline decoration-orange decoration-4 underline-offset-8">
          Explora o ecossistema Mozproservices
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Produtos', desc: 'Compre produtos locais e internacionais de vendedores verificados.', icon: ShoppingBag, color: 'bg-blue-500' },
            { title: 'Serviços', desc: 'Contrate profissionais de limpeza, reparação, design e muito mais.', icon: Wrench, color: 'bg-slate-800' },
            { title: 'iFood / Comida', desc: 'Receba a sua refeição favorita à porta em minutos.', icon: Utensils, color: 'bg-orange' },
          ].map((card, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="p-8 bg-white rounded-3xl shadow-soft border border-slate-100 flex flex-col items-center text-center"
            >
              <div className={`w-16 h-16 ${card.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg`}>
                <card.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-navy mb-4">{card.title}</h3>
              <p className="text-slate-500 mb-8">{card.desc}</p>
              <button 
                onClick={() => handleAuth('signup')}
                className="mt-auto text-orange font-bold text-sm tracking-widest uppercase hover:underline"
              >
                SABER MAIS
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Quote */}
      <section className="bg-navy py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-2xl font-medium text-slate-300 italic mb-8">
            "A Mozproservices mudou a forma como faço compras e recebo encomendas em Moçambique. É simples, rápido e, acima de tudo, confiável."
          </p>
          <div className="flex items-center justify-center gap-3 text-white">
            <div className="w-12 h-12 bg-white/10 rounded-full" />
            <div className="text-left">
              <p className="font-bold">Ricardo M.</p>
              <p className="text-xs text-orange uppercase tracking-widest font-black">Cliente Premium</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
