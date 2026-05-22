import React, { useState } from 'react';
import { User, Store, Building2, Truck, Briefcase, ChevronRight, Settings as SettingsIcon, Bell, Lock, CreditCard, Shield, Headphones, MapPin, Heart, History, Gift, LayoutDashboard, Globe, Languages, LogOut, RefreshCw, ArrowLeft, Save, ShoppingBag, Star, Share2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { RoleSwitchModal } from '../components/RoleSwitchModal';
import { CustomerDashboard } from '../components/dashboards/CustomerDashboard';
import { SellerDashboard } from '../components/dashboards/SellerDashboard';
import { DelivererDashboard } from '../components/dashboards/DelivererDashboard';
import { AffiliateDashboard } from '../components/dashboards/AffiliateDashboard';
import { ServiceProviderDashboard } from '../components/dashboards/ServiceProviderDashboard';

export function Settings() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'perfil' | 'definições'>('perfil');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<any | null>(null);

  const handleLogout = () => supabase.auth.signOut();

  const renderDashboard = () => {
    if (!profile) return null;
    switch (profile.role) {
      case UserRole.CUSTOMER: return <CustomerDashboard profile={profile} />;
      case UserRole.SELLER_MICRO:
      case UserRole.SELLER_MACRO: return <SellerDashboard profile={profile} />;
      case UserRole.DELIVERER: return <DelivererDashboard profile={profile} />;
      case UserRole.AFFILIATE: return <AffiliateDashboard profile={profile} />;
      case UserRole.SERVICE_PROVIDER: return <ServiceProviderDashboard profile={profile} />;
      default: return <CustomerDashboard profile={profile} />;
    }
  };

  const commonSettings = [
    { id: 'profile', title: 'Perfil da Conta', icon: User, fields: ['Foto de perfil', 'Nome completo', 'Número de telefone', 'Email', 'Palavra-passe'] },
    { id: 'security', title: 'Segurança', icon: Lock, fields: ['Alterar senha', 'Verificação em duas etapas', 'Dispositivos conectados', 'Histórico de login'] },
    { id: 'notifications', title: 'Notificações', icon: Bell, fields: ['Pedidos', 'Promoções', 'Novidades', 'SMS / Email / Push'] },
    { id: 'payments', title: 'Pagamentos', icon: CreditCard, fields: ['Cartões salvos', 'Mobile Money', 'Carteira digital', 'Histórico financeiro'] },
    { id: 'support', title: 'Apoio ao Cliente', icon: Headphones, fields: ['Central de ajuda', 'Chat de suporte', 'Abrir Ticket', 'Termos de uso'] },
  ];

  if (selectedSection) {
    return (
      <div className="max-w-4xl mx-auto pb-24">
        <button 
          onClick={() => setSelectedSection(null)}
          className="flex items-center gap-2 text-slate-400 font-bold mb-6 hover:text-navy transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Voltar ao Painel
        </button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden"
        >
          <div className="bg-navy p-8 text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <selectedSection.icon className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">{selectedSection.title}</h2>
                <p className="text-slate-400 text-sm">Módulo de Gestão Funcional</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {selectedSection.fields.map((field: string) => (
                <div key={field} className="group p-6 bg-slate-50 rounded-[32px] border border-transparent hover:border-orange/20 hover:bg-white hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{field}</p>
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-300 group-hover:text-orange transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-navy leading-tight">Configurar {field}</h4>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">Acesse as ferramentas avançadas de {field.toLowerCase()} para personalizar a sua conta.</p>
                </div>
              ))}
            </div>

            <div className="bg-orange/5 p-8 rounded-[40px] border border-orange/10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange shadow-soft">
                  <SettingsIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-navy uppercase tracking-tight">Configurações Rápidas</h4>
                  <p className="text-slate-400 text-xs font-bold uppercase">Mais opções disponíveis abaixo</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-soft">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-navy" />
                    <span className="text-xs font-bold text-navy">Permitir notificações Push</span>
                  </div>
                  <div className="w-12 h-6 bg-orange rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-soft">
                  <div className="flex items-center gap-3">
                    <Languages className="w-5 h-5 text-navy" />
                    <span className="text-xs font-bold text-navy">Idioma da Interface</span>
                  </div>
                  <span className="text-[10px] font-black text-orange uppercase">Português (MZ)</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4">
      {/* Dynamic Header */}
      <div className="relative mb-12">
        <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-8 md:p-10 rounded-[48px] shadow-soft border border-slate-100 relative z-10">
          <div className="relative group">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-24 h-24 rounded-[32px] border-4 border-slate-50 shadow-xl group-hover:rotate-3 transition-transform" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-24 h-24 bg-navy rounded-[32px] flex items-center justify-center text-white text-3xl font-black shadow-xl group-hover:rotate-3 transition-transform">
                {profile?.displayName?.charAt(0)}
              </div>
            )}
            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-black text-navy uppercase tracking-tight">{profile?.displayName}</h1>
              <div className="px-3 py-1 bg-orange/10 text-orange rounded-full text-[10px] font-black uppercase tracking-widest border border-orange/20">
                {profile?.role.replace('_', ' ')}
              </div>
            </div>
            <p className="text-slate-400 font-bold mb-4">{profile?.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-navy uppercase tracking-widest transition-colors">
                <MapPin className="w-4 h-4" /> {profile?.location?.address || 'Moçambique'}
              </button>
              <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-navy uppercase tracking-widest transition-colors">
                <Share2 className="w-4 h-4" /> Partilhar Perfil
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('perfil')}
              className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-lg ${activeTab === 'perfil' ? 'bg-navy text-white shadow-navy/20' : 'bg-slate-50 text-slate-400 shadow-transparent'}`}
            >
              Meu Painel
            </button>
            <button 
              onClick={() => setActiveTab('definições')}
              className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-lg ${activeTab === 'definições' ? 'bg-navy text-white shadow-navy/20' : 'bg-slate-50 text-slate-400 shadow-transparent'}`}
            >
              Definições
            </button>
          </div>
        </div>

        {/* Background elements */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[150%] bg-orange/5 blur-[120px] rounded-full -z-10" />
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'perfil' ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {renderDashboard()}
          </motion.div>
        ) : (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {commonSettings.map((section, idx) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[32px] border border-slate-100 shadow-soft overflow-hidden hover:border-orange transition-all group"
              >
                <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-navy shadow-soft group-hover:scale-110 transition-transform">
                      <section.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-navy text-sm uppercase tracking-tight">{section.title}</h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-orange transition-transform group-hover:translate-x-1" />
                </div>
                <div className="p-4 grid gap-1">
                  {section.fields.map((field) => (
                    <button 
                      key={field} 
                      onClick={() => setSelectedSection(section)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-50 transition-colors group/item"
                    >
                      <span className="text-xs text-slate-500 group-hover/item:text-navy font-bold">{field}</span>
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity bg-white text-orange shadow-soft">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}

            <div className="md:col-span-2 space-y-4 pt-8">
              <button 
                onClick={() => setIsRoleModalOpen(true)}
                className="w-full py-6 bg-gradient-to-r from-navy to-slate-800 text-white rounded-[32px] font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:scale-[1.01] transition-all shadow-xl shadow-navy/20"
              >
                <RefreshCw className="w-6 h-6 animate-spin-slow" />
                Alternar Modelo de Conta
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={handleLogout}
                  className="py-5 bg-white border border-red-100 text-red-500 rounded-[32px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Sair da Conta
                </button>
                <button 
                  className="py-5 bg-red-500 text-white rounded-[32px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-600 transition-all shadow-xl shadow-red-500/20"
                >
                  <User className="w-5 h-5" />
                  Excluir Conta
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <RoleSwitchModal 
        isOpen={isRoleModalOpen} 
        onClose={() => setIsRoleModalOpen(false)} 
        currentProfile={profile} 
      />
    </div>
  );
}
