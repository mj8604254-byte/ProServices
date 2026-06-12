import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User as UserIcon, 
  Store, 
  Building2, 
  Wrench, 
  Truck, 
  Briefcase, 
  ShieldCheck, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface GuestRoleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuestRoleSelectorModal({ isOpen, onClose }: GuestRoleSelectorModalProps) {
  const { loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const options = [
    {
      role: UserRole.CUSTOMER,
      label: 'Consumidor / Cliente',
      desc: 'Compre produtos, encomende comida iFood, contrate profissionais licenciados e acompanhe entregas.',
      icon: UserIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      badgeColor: 'bg-blue-50 text-blue-600 border-blue-100',
      hoverBorder: 'hover:border-blue-300'
    },
    {
      role: UserRole.SERVICE_PROVIDER,
      label: 'Prestador de Serviços',
      desc: 'Receba solicitações de clientes perto de si, envie propostas de orçamentos e agende serviços técnicos.',
      icon: Wrench,
      color: 'bg-indigo-600',
      textColor: 'text-indigo-600',
      badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      hoverBorder: 'hover:border-indigo-300'
    },
    {
      role: UserRole.SELLER_MICRO,
      label: 'Vendedor Micro (Pequeno Produtor)',
      desc: 'Gerencie pequenas bancas de mercado rural, produtos locais frescos e rastreie entregas directas.',
      icon: Store,
      color: 'bg-orange',
      textColor: 'text-orange',
      badgeColor: 'bg-orange/5 text-orange border-orange/10',
      hoverBorder: 'hover:border-orange/30'
    },
    {
      role: UserRole.SELLER_MACRO,
      label: 'Vendedor Macro (Supermercado / Empresa)',
      desc: 'Supervisione stock em lote, configure canais de faturação estruturada e emita faturas para clientes.',
      icon: Building2,
      color: 'bg-slate-800',
      textColor: 'text-slate-800',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      hoverBorder: 'hover:border-slate-400'
    },
    {
      role: UserRole.DELIVERER,
      label: 'Estafeta / Entregador',
      desc: 'Fique online para rastrear rotas integradas, coletar pedidos do iFood ou Lojas e monitorar lucros diários.',
      icon: Truck,
      color: 'bg-green-500',
      textColor: 'text-green-500',
      badgeColor: 'bg-green-50 text-green-600 border-green-100',
      hoverBorder: 'hover:border-green-300'
    },
    {
      role: UserRole.AFFILIATE,
      label: 'Afiliado / Embaixador',
      desc: 'Aceda aos seus links de comissão personalizados, controle cliques e rastreie recompensas de afiliado.',
      icon: Briefcase,
      color: 'bg-purple-500',
      textColor: 'text-purple-500',
      badgeColor: 'bg-purple-50 text-purple-600 border-purple-100',
      hoverBorder: 'hover:border-purple-300'
    },
    {
      role: UserRole.ADMIN,
      label: 'Administrador do Sistema',
      desc: 'Aceda ao centro de comando central: aprove anúncios, audite transações e modere conflitos.',
      icon: ShieldCheck,
      color: 'bg-red-500',
      textColor: 'text-red-500',
      badgeColor: 'bg-red-50 text-red-600 border-red-100',
      hoverBorder: 'hover:border-red-300'
    }
  ];

  const handleSelect = (role: UserRole) => {
    // Immediate, instant login without single input or confirmation screen.
    loginAsDemo(role);
    onClose();
    navigate('/');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop blur twilight overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl z-10 overflow-hidden my-8"
          >
            {/* Upper Accent Header Decoration */}
            <div className="bg-navy p-8 sm:p-10 text-white relative overflow-hidden text-center sm:text-left">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-orange mb-3 border border-white/5">
                  <Sparkles className="w-3.5 h-3.5" /> Explorar como Visitante
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Qual perfil deseja explorar?</h2>
                <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl font-normal leading-relaxed">
                  Clique no modelo de conta pretendido para aceder <b>instantaneamente</b> ao sistema, sem formulários, senhas ou confirmações.
                </p>
              </div>
              <div className="absolute top-1/2 right-0 -translate-y-1/2 w-48 h-48 bg-orange/10 rounded-full blur-3xl pointer-events-none" />
              <button 
                onClick={onClose} 
                className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition-all cursor-pointer border border-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List Selection Grid */}
            <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
              {options.map((option) => (
                <button
                  key={option.role}
                  onClick={() => handleSelect(option.role)}
                  className={`w-full flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-3xl border-2 border-slate-100 bg-slate-50/50 hover:bg-white ${option.hoverBorder} transition-all text-left group cursor-pointer`}
                >
                  <div className={`w-12 h-12 ${option.color} rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                    <option.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-black text-navy text-sm uppercase tracking-tight leading-none">
                        {option.label}
                      </span>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${option.badgeColor}`}>
                        Demo
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                      {option.desc}
                    </p>
                  </div>
                  <div className="hidden sm:flex w-8 h-8 rounded-full bg-slate-50 items-center justify-center text-slate-300 group-hover:text-navy group-hover:bg-slate-100 transition-all shrink-0">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </button>
              ))}
            </div>

            {/* Bottom informational banner */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-relaxed">
                👉 Escolha um perfil e explore todos os cantos reais do Moz ProServices!
              </span>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-navy font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
