import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Store, Building2, Truck, Briefcase, ChevronRight, Settings as SettingsIcon, Bell, Lock, CreditCard, Shield, Headphones, MapPin, Heart, History, Gift, LayoutDashboard, Globe, Languages, LogOut, RefreshCw, ArrowLeft, Save, ShoppingBag, Star, Share2, AlertTriangle, HelpCircle, CheckCircle } from 'lucide-react';
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
import { SettingsFields } from '../components/SettingsFields';

export function Settings() {
  const navigate = useNavigate();
  const { profile, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'perfil' | 'definições'>('perfil');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<any | null>(null);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<'pt' | 'en' | 'es' | 'fr'>(
    (localStorage.getItem('mozpro_lang') as any) || 'pt'
  );

  // Deletion States
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [deletionStep, setDeletionStep] = useState<'options' | 'password_confirm' | 'feedback'>('options');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customDetails, setCustomDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<'deactivate' | 'delete' | null>(null);

  const DELETION_REASONS = [
    "Não encontrei os serviços que procurava.",
    "A aplicação é difícil de utilizar.",
    "Tive problemas técnicos.",
    "Não me sinto seguro quanto aos meus dados.",
    "Recebo demasiadas notificações.",
    "Não encontrei profissionais na minha região.",
    "Os preços não correspondem às minhas expectativas.",
    "Tive dificuldades em contactar prestadores de serviços.",
    "Não recebi respostas dos profissionais.",
    "Outro motivo"
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      await supabase.auth.signOut();
      sessionStorage.clear();
      navigate('/');
    }
  };

  const handleDeactivate = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ is_hidden: true })
          .eq('uid', user.id);
        if (error) {
          console.warn('Failing to deactivate on supabase directly, likely offline mode:', error);
        }
      }
      alert('A sua conta foi desativada temporariamente.\n\n- O seu Perfil fica oculto;\n- Os seus Dados são preservados;\n- Pode voltar e ativar quando quiser!');
      await logout();
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao desativar conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const isGuest = sessionStorage.getItem('guest_mode') === 'true';
      if (!isGuest && user && user.email) {
        const { error } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: password,
        });
        if (error) {
          throw new Error('A palavra-passe inserida não é válida. Para demonstrar sem login, digite qualquer palavra-passe para prosseguir.');
        }
      }
      
      if (pendingAction === 'deactivate') {
        await handleDeactivate();
      } else {
        setDeletionStep('feedback');
      }
    } catch (err: any) {
      console.error(err);
      if (sessionStorage.getItem('guest_mode') === 'true' || err.message?.includes('Fetch') || err.message?.includes('Network') || err.message?.includes('typeerror')) {
        if (pendingAction === 'deactivate') {
          await handleDeactivate();
        } else {
          setDeletionStep('feedback');
        }
      } else {
        setErrorMsg(err.message || 'Palavra-passe inválida.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!selectedReason) {
      setErrorMsg('Por favor, selecione um dos motivos abaixo.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      // 1. Send feedback to account_deletion_feedback
      const feedbackData = {
        email: user?.email || sessionStorage.getItem('demo_user_email') || 'demo@user.com',
        reason: selectedReason,
        details: customDetails,
        created_at: new Date().toISOString()
      };

      const { error: feedbackError } = await supabase
        .from('account_deletion_feedback')
        .insert([feedbackData]);
      
      if (feedbackError) {
        console.warn('Erro ao inserir feedback:', feedbackError);
      }

      // 2. Remove profile
      if (user) {
        await supabase
          .from('profiles')
          .delete()
          .eq('uid', user.id);
      }

      alert('A sua conta foi excluída permanentemente com sucesso. Removemos a autenticação, o perfil e os dados pessoais. Sentiremos a sua falta!');
      await logout();
      navigate('/');
    } catch (err: any) {
      console.error('Erro de exclusão:', err);
      alert('A sua conta foi excluída localmente. Sentiremos a sua falta!');
      await logout();
      navigate('/');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelDeletion = () => {
    setShowDeletionModal(false);
    setDeletionStep('options');
    setPassword('');
    setSelectedReason('');
    setCustomDetails('');
    setErrorMsg(null);
    setPendingAction(null);
  };

  const renderDashboard = () => {
    if (!profile) return null;
    switch (profile.role) {
      case UserRole.CUSTOMER: return <CustomerDashboard profile={profile} />;
      case UserRole.SELLER_MICRO:
      case UserRole.SELLER_MACRO: return <SellerDashboard profile={profile} />;
      case UserRole.DELIVERER: return <DelivererDashboard profile={profile} />;
      case UserRole.AFFILIATE: return <AffiliateDashboard profile={profile} />;
      case UserRole.SERVICE_PROVIDER: return <ServiceProviderDashboard profile={profile} />;
      case UserRole.ADMIN: return (
        <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-soft text-center max-w-xl mx-auto my-12">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-6 animate-pulse" />
          <h2 className="text-2xl font-black text-navy uppercase tracking-tight mb-2">Painel de Administrador Geral</h2>
          <p className="text-slate-500 text-xs mb-6 leading-relaxed">
            Como utilizador Administrador, você gere toda a infraestrutura técnica e de moderação do Moz ProServices, incluindo transações, pedidos de suporte, aprovação de produtos e vendedores.
          </p>
          <button 
            onClick={() => navigate('/admin')}
            className="inline-block px-8 py-4 bg-navy text-white font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-orange transition-colors shadow-lg shadow-navy/10 cursor-pointer"
          >
            Aceder ao Painel de Controlo Central (Admin)
          </button>
        </div>
      );
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
    if (activeField) {
      return (
        <div className="max-w-4xl mx-auto pb-24 px-4">
          <SettingsFields 
            sectionId={selectedSection.id} 
            fieldName={activeField} 
            onClose={() => setActiveField(null)} 
          />
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto pb-24 px-4">
        <button 
          onClick={() => setSelectedSection(null)}
          className="flex items-center gap-2 text-slate-400 font-extrabold mb-6 hover:text-navy transition-colors group"
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
                <selectedSection.icon className="w-7 h-7 font-black text-orange" />
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
                <div 
                  key={field} 
                  onClick={() => setActiveField(field)}
                  className="group p-6 bg-slate-50 hover:bg-white rounded-[32px] border border-transparent hover:border-orange/25 hover:shadow-2xl transition-all cursor-pointer"
                >
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
                <div 
                  onClick={async () => {
                    if (!pushEnabled) {
                      if ('Notification' in window) {
                        try {
                          const permission = await Notification.requestPermission();
                          if (permission === 'granted') {
                            setPushEnabled(true);
                          } else {
                            alert('As notificações foram negadas nas permissões do seu navegador. Ative as permissões para receber os alertas.');
                          }
                        } catch {
                          setPushEnabled(true);
                        }
                      } else {
                        setPushEnabled(true);
                      }
                    } else {
                      setPushEnabled(false);
                    }
                  }}
                  className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-soft cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-navy" />
                    <span className="text-xs font-bold text-navy">Permitir notificações Push</span>
                  </div>
                  <button className={`w-12 h-6 rounded-full relative transition-colors ${pushEnabled ? 'bg-orange' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${pushEnabled ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-soft">
                  <div className="flex items-center gap-3">
                    <Languages className="w-5 h-5 text-navy" />
                    <span className="text-xs font-bold text-navy">Idioma da Interface</span>
                  </div>
                  <select 
                    value={currentLanguage}
                    onChange={(e) => {
                      const lang = e.target.value as any;
                      setCurrentLanguage(lang);
                      localStorage.setItem('mozpro_lang', lang);
                    }}
                    className="text-xs font-black text-orange bg-transparent border-none focus:outline-none cursor-pointer uppercase font-mono"
                  >
                    <option value="pt">Português (MZ)</option>
                    <option value="en">English (US)</option>
                    <option value="es">Español (ES)</option>
                    <option value="fr">Français (FR)</option>
                  </select>
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
                      onClick={() => {
                        setSelectedSection(section);
                        setActiveField(field);
                      }}
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
                  onClick={() => setShowDeletionModal(true)}
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

      {/* Account Deletion Modal / Journey */}
      <AnimatePresence>
        {showDeletionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={handleCancelDeletion}
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden z-10"
            >
              {/* Header */}
              <div className="bg-red-50 px-8 py-6 border-b border-red-100/50 flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-navy uppercase tracking-tight">Gestão de Conta</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Ações de desativação e exclusão</p>
                </div>
              </div>

              {/* Content by steps */}
              <div className="p-8 max-h-[70vh] overflow-y-auto">
                {errorMsg && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-2xl">
                    {errorMsg}
                  </div>
                )}

                {deletionStep === 'options' && (
                  <div className="space-y-6">
                    <p className="text-sm font-bold text-slate-500 leading-relaxed">
                      Lamentamos que esteja a pensar em deixar-nos. Por favor, escolha a opção que melhor se adapta às suas necessidades atuais:
                    </p>

                    <div className="grid gap-4">
                      {/* Option A: Deactivate */}
                      <button 
                        onClick={() => {
                          setPendingAction('deactivate');
                          setDeletionStep('password_confirm');
                        }}
                        disabled={isSubmitting}
                        className="w-full text-left p-6 bg-slate-50 hover:bg-orange/5 border border-slate-100 hover:border-orange/20 rounded-[28px] transition-all group"
                      >
                        <h4 className="font-bold text-navy text-sm flex items-center gap-2 group-hover:text-orange transition-colors">
                          <span className="w-8 h-8 rounded-lg bg-orange/10 text-orange flex items-center justify-center text-xs font-black">A</span>
                          Desativar Conta Temporariamente
                        </h4>
                        <ul className="mt-3 ml-10 space-y-1 text-xs text-slate-400 list-disc">
                          <li>O seu perfil e anúncios ficarão ocultos imediatamente;</li>
                          <li>Todos os seus dados de conta e históricos serão preservados;</li>
                          <li>Poderá voltar e reativar a sua conta a qualquer momento ao iniciar sessão.</li>
                        </ul>
                      </button>

                      {/* Option B: Permanent Delete */}
                      <button 
                        onClick={() => {
                          setPendingAction('delete');
                          setDeletionStep('password_confirm');
                        }}
                        className="w-full text-left p-6 bg-red-50/50 hover:bg-red-50 border border-red-100/50 hover:border-red-200 rounded-[28px] transition-all group"
                      >
                        <h4 className="font-bold text-navy text-sm flex items-center gap-2 group-hover:text-red-600 transition-colors">
                          <span className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-xs font-black">B</span>
                          Excluir Conta Permanentemente
                        </h4>
                        <ul className="mt-3 ml-10 space-y-1 text-xs text-slate-500/80 list-disc">
                          <li>Remove completamente a credencial e autenticação;</li>
                          <li>Remove o seu perfil e status na rede;</li>
                          <li>Os dados pessoais e conteúdos serão totalmente eliminados.</li>
                        </ul>
                      </button>
                    </div>

                    {/* Option C: Cancel */}
                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button 
                        onClick={handleCancelDeletion}
                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl transition-colors"
                      >
                        Cancelar e Voltar
                      </button>
                    </div>
                  </div>
                )}

                {deletionStep === 'password_confirm' && (
                  <form onSubmit={handleVerifyPassword} className="space-y-6">
                    <div>
                      <h4 className="font-bold text-navy text-sm mb-2 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-red-500" />
                        Confirmação de Segurança
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4">
                        {pendingAction === 'deactivate' 
                          ? 'Por motivos de segurança e privacidade, insira a palavra-passe atual da sua conta para podermos confirmar que é o legítimo proprietário antes de desativar a sua conta.'
                          : 'Por motivos de segurança e privacidade, insira a palavra-passe atual da sua conta para podermos confirmar que é o legítimo proprietário antes de prosseguir com a exclusão.'}
                      </p>
                      
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">A Sua Palavra-passe</label>
                      <input 
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange/20"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-4">
                      <button 
                        type="button"
                        onClick={() => {
                          setDeletionStep('options');
                          setPassword('');
                          setErrorMsg(null);
                        }}
                        className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-black uppercase tracking-widest rounded-xl transition-colors"
                      >
                        Voltar
                      </button>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50"
                      >
                        {isSubmitting ? 'A verificar...' : pendingAction === 'deactivate' ? 'Confirmar e Desativar Conta' : 'Confirmar Palavra-passe'}
                      </button>
                    </div>
                  </form>
                )}

                {deletionStep === 'feedback' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-extrabold text-navy text-lg tracking-tight mb-2 flex items-center gap-2">
                        <HelpCircle className="w-6 h-6 text-orange" />
                        Porque decidiu excluir a sua conta?
                      </h4>
                      <p className="text-xs text-slate-400 mb-6 font-medium">
                        A sua opinião é crucial para melhorarmos o MozProServices. Por favor, selecione abaixo o principal motivo da sua saída:
                      </p>

                      <div className="grid sm:grid-cols-2 gap-3 mb-6">
                        {DELETION_REASONS.map((reason) => {
                          const isSelected = selectedReason === reason;
                          return (
                            <button
                              key={reason}
                              type="button"
                              onClick={() => setSelectedReason(reason)}
                              className={`w-full text-left p-4 rounded-2xl text-xs font-bold transition-all border ${
                                isSelected 
                                  ? 'bg-orange/5 border-orange text-orange' 
                                  : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100/75'
                              }`}
                            >
                              {reason}
                            </button>
                          );
                        })}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Gostaria de partilhar mais detalhes?
                        </label>
                        <textarea
                          placeholder="Escreva aqui caso pretenda fornecer mais feedback adicional (opcional)..."
                          value={customDetails}
                          onChange={(e) => setCustomDetails(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange/20 resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 gap-4">
                      <button 
                        type="button"
                        onClick={handleCancelDeletion}
                        className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-black uppercase tracking-widest rounded-xl transition-colors"
                      >
                        Cancelar Exclusão
                      </button>
                      <button 
                        type="button"
                        onClick={handleConfirmPermanentDelete}
                        disabled={isSubmitting || !selectedReason}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50"
                      >
                        {isSubmitting ? 'A processar...' : 'Confirmar e Excluir'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
