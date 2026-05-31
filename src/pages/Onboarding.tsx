import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, 
  ShoppingBag, 
  Utensils, 
  BookOpen, 
  Cpu, 
  Paintbrush, 
  Wrench, 
  Check,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Stethoscope,
  Car,
  Briefcase
} from 'lucide-react';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const INTERESTS = [
  { id: 'tech', label: 'Tecnologia', icon: Cpu, color: 'bg-blue-500' },
  { id: 'fashion', label: 'Moda', icon: ShoppingBag, color: 'bg-pink-500' },
  { id: 'food', label: 'Alimentação', icon: Utensils, color: 'bg-orange' },
  { id: 'agri', label: 'Agricultura', icon: TrendingUp, color: 'bg-green-600' },
  { id: 'construction', label: 'Construção', icon: Wrench, color: 'bg-slate-700' },
  { id: 'health', label: 'Saúde', icon: Stethoscope, color: 'bg-red-500' },
  { id: 'auto', label: 'Automóveis', icon: Car, color: 'bg-slate-900' },
  { id: 'edu', label: 'Educação', icon: BookOpen, color: 'bg-purple-500' },
  { id: 'design', label: 'Design', icon: Paintbrush, color: 'bg-indigo-500' },
  { id: 'business', label: 'Negócios', icon: Briefcase, color: 'bg-cyan-600' },
  { id: 'security', label: 'Segurança', icon: ShieldCheck, color: 'bg-emerald-600' },
  { id: 'logistics', label: 'Logística', icon: Truck, color: 'bg-amber-600' },
];

export function Onboarding() {
  const { profile, logout } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toggleInterest = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          interests: selected,
          onboarding_completed: true
        })
        .eq('uid', profile.uid);

      if (error) throw error;
      navigate('/');
    } catch (error) {
      handleSupabaseError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true
        })
        .eq('uid', profile.uid);

      if (error) throw error;
      navigate('/');
    } catch (error) {
      handleSupabaseError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Brand Header */}
      <header className="w-full bg-white border-b border-slate-100 py-4 px-6 flex items-center justify-between">
        <button 
          id="brand_onboarding_link"
          type="button"
          onClick={async () => {
            if (logout) {
              await logout();
            }
            sessionStorage.removeItem('guest_mode');
            window.location.href = '/';
          }}
          className="flex flex-col -space-y-1 items-start text-left hover:opacity-85 transition-opacity cursor-pointer group"
        >
          <span className="font-black text-xl tracking-tighter text-navy uppercase group-hover:text-orange transition-colors">Moz</span>
          <span className="font-black text-[10px] tracking-[0.2em] text-slate-400 uppercase">ProServices</span>
        </button>
        <button
          id="onboarding_return_button"
          type="button"
          onClick={async () => {
            if (logout) {
              await logout();
            }
            sessionStorage.removeItem('guest_mode');
            window.location.href = '/';
          }}
          className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-orange transition-colors cursor-pointer"
        >
          Sair & Voltar
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 w-full mx-auto py-11 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black text-navy uppercase tracking-tight mb-4">
            Personaliza a tua <span className="text-orange whitespace-nowrap">Experiência</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-xl mx-auto">
            Escolhe pelo menos 3 interesses para podermos sugerir o melhor conteúdo para ti na Moz ProServices.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          {INTERESTS.map((interest, idx) => {
            const isSelected = selected.includes(interest.id);
            return (
              <motion.button
                key={interest.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => toggleInterest(interest.id)}
                className={`group relative aspect-square rounded-[32px] p-6 flex flex-col items-center justify-center gap-4 transition-all border-4 ${
                  isSelected 
                    ? 'bg-white border-orange shadow-xl shadow-orange/10' 
                    : 'bg-white border-transparent hover:border-slate-200 shadow-soft'
                }`}
              >
                <div className={`w-16 h-16 ${interest.color} rounded-[20px] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform ${isSelected ? 'scale-110' : ''}`}>
                  <interest.icon className="w-8 h-8" />
                </div>
                <span className={`font-black text-sm uppercase tracking-tight ${isSelected ? 'text-orange' : 'text-navy'}`}>
                  {interest.label}
                </span>

                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-orange text-white rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        <div id="onboarding-footer" className="relative group/footer">
          <div className="absolute inset-0 bg-orange/5 blur-3xl rounded-full opacity-0 group-hover/footer:opacity-100 transition-opacity" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 bg-white/80 backdrop-blur-xl p-8 rounded-[48px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-orange rounded-full animate-pulse" />
                <p className="text-navy font-black uppercase tracking-tight text-lg">
                  {selected.length} Curadorias
                </p>
              </div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] ml-4">
                {selected.length < 3 ? `Faltam ${3 - selected.length} seleções` : 'Configuração pronta'}
              </p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                onClick={handleSkip}
                disabled={loading}
                className="flex-1 md:px-8 py-4 text-slate-400 font-bold uppercase tracking-widest hover:text-navy hover:bg-slate-50 rounded-2xl transition-all disabled:opacity-50"
              >
                Pular
              </button>
              <button
                disabled={selected.length < 3 || loading}
                onClick={handleFinish}
                className="flex-[2] md:px-12 py-5 bg-navy text-white rounded-2xl font-black uppercase tracking-widest hover:bg-orange hover:shadow-2xl hover:shadow-orange/30 transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3 group/btn"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Começar agora
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
