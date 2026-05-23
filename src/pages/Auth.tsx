import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone, 
  ChevronRight, 
  ArrowLeft, 
  Store, 
  Building2, 
  Truck, 
  Briefcase, 
  ShieldCheck,
  CheckCircle2,
  Facebook,
  Apple,
  Wrench
} from 'lucide-react';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';

type AuthMode = 'login' | 'signup';
type SignupStep = 'basic' | 'role' | 'details' | 'verification';

export function Auth() {
  const navigate = useNavigate();
  const { user, loginAsDemo } = useAuth();
  const location = useLocation();
  
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  React.useEffect(() => {
    const errorParam = new URLSearchParams(location.search).get('error');
    if (errorParam) {
      setError(errorParam);
    }
  }, [location.search]);

  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get('mode') as AuthMode || 'login';
  const urlError = queryParams.get('error');

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<SignupStep>('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(urlError);

  // Form States
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: UserRole.CUSTOMER,
    // Extra fields
    businessName: '',
    nuit: '',
    vehicleType: '',
    licensePlate: '',
  });

const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    setLoading(true);
    setError(null);
    try {
      // Use the current origin + path for redirection to be safe
      const redirectTo = `${window.location.origin}/auth/callback`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(`Social Auth Error (${provider}):`, err);
      let message = err.message;
      if (message.includes('provider is not enabled')) {
        message = `O provedor ${provider} não está ativado no Dashboard do Supabase. Ative-o em Authentication > Providers.`;
      } else if (message.includes('Forbidden use of secret API key')) {
        message = 'Erro de Configuração: Foi detectado o uso de uma chave secreta no navegador. Por favor, use a chave "anon" key nas configurações.';
      }
      setError(`Erro ao entrar com ${provider}: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const identifier = formData.email.trim();
        // Simple regex to check if it looks like an email or phone
        const isEmail = identifier.includes('@');
        
        const loginData = isEmail 
          ? { email: identifier, password: formData.password }
          : { phone: identifier, password: formData.password };

        const { error } = await supabase.auth.signInWithPassword(loginData);
        
        if (error) {
          // If it failed and didn't look like email, maybe it's a username (not supported natively by Supabase yet)
          // But we provide better message
          if (!isEmail && error.message.includes('email')) {
            throw new Error('Formato inválido. Por favor use um email ou número de telefone válido.');
          }
          throw error;
        }
        navigate('/');
      } else {
        // Mode is signup, step 1 complete, move to roles
        setStep('role');
      }
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      let message = err.message;
      if (message === 'Invalid login credentials') {
        message = 'Dados de acesso incorretos. Verifique o email/telefone e a palavra-passe.';
      } else if (message.includes('Email not confirmed')) {
        message = 'Por favor, confirme o seu email antes de entrar.';
      } else if (message.includes('Forbidden use of secret API key')) {
        message = 'Erro de Configuração: Foi detectado o uso de uma chave secreta no navegador. Por favor, use a chave "anon" (ou public) nas configurações do projeto.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const finishSignup = async () => {
    setLoading(true);
    setError(null);
    try {
      // Guard registration data locally in case email confirmation is required/delayed
      localStorage.setItem(`pending_profile_${formData.email.trim().toLowerCase()}`, JSON.stringify(formData));

      // 1. Create user in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name
          }
        }
      });

      if (signUpError) throw signUpError;
      
      // Se não houver sessão imediata, é porque a confirmação de email é necessária
      if (!data.session && data.user) {
        setStep('verification');
        return;
      }

      if (!data.user) throw new Error('Falha ao criar utilizador');

      // 2. Save to Public Profiles Table
      const profileData = {
        uid: data.user.id,
        email: formData.email,
        display_name: formData.name,
        role: formData.role,
        phone_number: formData.phone,
        business_name: formData.businessName,
        nuit: formData.nuit,
        vehicle_type: formData.vehicleType,
        license_plate: formData.licensePlate,
        onboarding_completed: false,
        is_verified: false,
        created_at: new Date().toISOString(),
      };

      let profileError = null;
      try {
        const { error } = await supabase
          .from('profiles')
          .insert([profileData]);
        profileError = error;
      } catch (fetchErr: any) {
        console.error('Falha de rede ao tentar inserir perfil secundário:', fetchErr);
        profileError = { message: fetchErr.message || 'Falha de rede (TypeError: Failed to fetch)' };
      }

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // We still consider step 'verification' if auth worked
      }

      setStep('verification');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        layout
        className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-navy p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              {mode === 'login' ? 'Bem-vindo de volta' : 'Criar Conta'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {mode === 'login' ? 'Entre na sua conta Mozproservices' : 'Junte-se ao ecossistema Mozproservices'}
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-orange/10 rounded-full blur-3xl" />
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {mode === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        required
                        type="text" 
                        placeholder="Email, Username ou Telefone"
                        className="w-full bg-slate-50 border-none rounded-2xl px-12 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        required
                        type="password" 
                        placeholder="Palavra-passe"
                        className="w-full bg-slate-50 border-none rounded-2xl px-12 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                  </div>
                  <button 
                    disabled={loading}
                    className="w-full py-4 bg-navy text-white rounded-2xl font-black uppercase tracking-widest hover:bg-navy/90 transition-colors shadow-lg shadow-navy/20 disabled:opacity-50"
                  >
                    {loading ? 'A processar...' : 'Entrar na Conta'}
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem('guest_mode', 'true');
                      navigate('/');
                    }}
                    className="w-full py-4 bg-white text-navy rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-colors border-2 border-navy/10"
                  >
                    Aceder como Visitante
                  </button>
                </form>

                <div className="relative flex items-center justify-center py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100" />
                  </div>
                  <span className="relative z-10 px-4 bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest">Login rápido com</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => handleSocialLogin('google')}
                    className="flex items-center justify-center py-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors border border-slate-100"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleSocialLogin('facebook')}
                    className="flex items-center justify-center py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                  >
                    <Facebook className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleSocialLogin('apple')}
                    className="flex items-center justify-center py-3 bg-black text-white rounded-2xl hover:bg-zinc-800 transition-colors"
                  >
                    <Apple className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center pt-4">
                  <p className="text-sm font-medium text-slate-500">
                    Ainda não tem conta? {' '}
                    <button onClick={() => setMode('signup')} className="text-orange font-black hover:underline">
                      Registar agora
                    </button>
                  </p>
                </div>

                {/* Modo de Desenvolvimento */}
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">
                    Área de Teste / Modo Rápido (Bypass)
                  </p>
                  <p className="text-[10px] text-slate-400 text-center mb-4 leading-normal">
                    Selecione um perfil de demonstração abaixo para aceder às dashboards e testar as funcionalidades da app instantaneamente.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => loginAsDemo(UserRole.CUSTOMER)}
                      className="text-[10px] font-black text-blue-600 bg-blue-50/50 hover:bg-blue-100 py-3 rounded-xl transition-all uppercase tracking-wider"
                    >
                      Consumidor
                    </button>
                    <button 
                      type="button"
                      onClick={() => loginAsDemo(UserRole.SELLER_MICRO)}
                      className="text-[10px] font-black text-orange bg-orange/5 hover:bg-orange/10 py-3 rounded-xl transition-all uppercase tracking-wider"
                    >
                      Vendedor Micro
                    </button>
                    <button 
                      type="button"
                      onClick={() => loginAsDemo(UserRole.SELLER_MACRO)}
                      className="text-[10px] font-black text-slate-700 bg-slate-50 hover:bg-slate-100 py-3 rounded-xl transition-all uppercase tracking-wider"
                    >
                      Vendedor Macro
                    </button>
                    <button 
                      type="button"
                      onClick={() => loginAsDemo(UserRole.DELIVERER)}
                      className="text-[10px] font-black text-green-600 bg-green-50/50 hover:bg-green-100 py-3 rounded-xl transition-all uppercase tracking-wider"
                    >
                      Entregador
                    </button>
                    <button 
                      type="button"
                      onClick={() => loginAsDemo(UserRole.SERVICE_PROVIDER)}
                      className="text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-3 rounded-xl transition-all uppercase tracking-wider"
                    >
                      Prestador Serviços
                    </button>
                    <button 
                      type="button"
                      onClick={() => loginAsDemo(UserRole.ADMIN)}
                      className="text-[10px] font-black text-red-600 bg-red-50 hover:bg-red-100 py-3 rounded-xl transition-all uppercase tracking-wider"
                    >
                      Administrador
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {mode === 'signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {step === 'basic' && (
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div className="space-y-4">
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                          required
                          type="text" 
                          placeholder="Nome Completo"
                          className="w-full bg-slate-50 border-none rounded-2xl px-12 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                          required
                          type="email" 
                          placeholder="Email"
                          className="w-full bg-slate-50 border-none rounded-2xl px-12 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                          required
                          type="tel" 
                          placeholder="Número de Telefone"
                          className="w-full bg-slate-50 border-none rounded-2xl px-12 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                          required
                          type="password" 
                          placeholder="Palavra-passe"
                          className="w-full bg-slate-50 border-none rounded-2xl px-12 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                          value={formData.password}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                      </div>
                    </div>
                    <button className="w-full py-4 bg-navy text-white rounded-2xl font-black uppercase tracking-widest hover:bg-navy/90 transition-colors shadow-lg shadow-navy/20">
                      Próximo Passo
                    </button>

                    <button 
                      type="button"
                      onClick={() => {
                        sessionStorage.setItem('guest_mode', 'true');
                        navigate('/');
                      }}
                      className="w-full py-4 bg-white text-navy rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-colors border-2 border-navy/10"
                    >
                      Aceder como Visitante
                    </button>
                    
                    <div className="relative flex items-center justify-center py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-100" />
                      </div>
                      <span className="relative z-10 px-4 bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest">Ou registar com</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <button type="button" onClick={() => handleSocialLogin('google')} className="flex items-center justify-center py-3 bg-slate-50 rounded-2xl hover:bg-slate-100 border border-slate-100"><svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg></button>
                      <button type="button" onClick={() => handleSocialLogin('facebook')} className="flex items-center justify-center py-3 bg-blue-600 text-white rounded-2xl"><Facebook className="w-5 h-5" /></button>
                      <button type="button" onClick={() => handleSocialLogin('apple')} className="flex items-center justify-center py-3 bg-black text-white rounded-2xl"><Apple className="w-5 h-5" /></button>
                    </div>
                  </form>
                )}

                {step === 'role' && (
                  <div className="space-y-6">
                    <button onClick={() => setStep('basic')} className="flex items-center gap-2 text-slate-400 font-bold text-xs hover:text-navy transition-colors">
                      <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>
                    <div>
                      <h2 className="text-xl font-black text-navy uppercase tracking-tight">Que tipo de conta pretende?</h2>
                      <p className="text-slate-400 text-xs mt-1">Escolha a opção que melhor se adapta a si.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: UserRole.CUSTOMER, label: 'CONSUMIDOR', icon: UserIcon, desc: 'Compre produtos e serviços de rede', color: 'bg-blue-500' },
                        { id: UserRole.SELLER_MICRO, label: 'VENDEDOR MICRO', icon: Store, desc: 'Pequenos produtores e lojas locais', color: 'bg-orange' },
                        { id: UserRole.SELLER_MACRO, label: 'VENDEDOR MACRO', icon: Building2, desc: 'Grandes estabelecimentos e empresas', color: 'bg-slate-800' },
                        { id: UserRole.DELIVERER, label: 'ENTREGADOR', icon: Truck, desc: 'Ganha dinheiro fazendo entregas rápidas', color: 'bg-green-500' },
                        { id: UserRole.AFFILIATE, label: 'AFILIADO', icon: Briefcase, desc: 'Promova e ganhe comissões', color: 'bg-purple-500' },
                        { id: UserRole.SERVICE_PROVIDER, label: 'PRESTADOR DE SERVIÇOS', icon: Wrench, desc: 'Ofereça os seus serviços profissionais na nossa plataforma.', color: 'bg-indigo-600' },
                      ].map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setFormData({...formData, role: r.id});
                            setStep('details');
                          }}
                          className="flex items-center gap-4 p-4 rounded-3xl border-2 border-slate-100 hover:border-orange transition-all text-left bg-slate-50/50 hover:bg-white group"
                        >
                          <div className={`w-12 h-12 ${r.color} rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-black/5 group-hover:scale-110 transition-transform`}>
                            <r.icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-navy text-xs uppercase tracking-widest">{r.label}</p>
                            <p className="text-[10px] text-slate-400 font-medium leading-tight">{r.desc}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-orange" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 'details' && (
                  <div className="space-y-6">
                    <button onClick={() => setStep('role')} className="flex items-center gap-2 text-slate-400 font-bold text-xs hover:text-navy transition-colors">
                      <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>
                    <div>
                      <h2 className="text-xl font-black text-navy uppercase tracking-tight">Detalhes do Perfil</h2>
                      <p className="text-slate-400 text-xs mt-1">Precisamos de mais algumas informações para validar a sua conta.</p>
                    </div>

                    <div className="space-y-4">
                      {/* Common fields based on role selection */}
                      {(formData.role === UserRole.SELLER_MICRO || formData.role === UserRole.SELLER_MACRO || formData.role === UserRole.SERVICE_PROVIDER) && (
                        <>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                              {formData.role === UserRole.SERVICE_PROVIDER ? 'Nome Profissional/Empresa' : 'Nome do Negócio'}
                            </label>
                            <input 
                              type="text" 
                              className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                              value={formData.businessName}
                              onChange={e => setFormData({...formData, businessName: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">NUIT (Documento)</label>
                            <input 
                              type="text" 
                              className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                              value={formData.nuit}
                              onChange={e => setFormData({...formData, nuit: e.target.value})}
                            />
                          </div>
                        </>
                      )}

                      {formData.role === UserRole.SERVICE_PROVIDER && (
                        <div className="bg-indigo-50 p-6 rounded-3xl border border-dashed border-indigo-200 text-center">
                          <Wrench className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                          <p className="text-sm font-bold text-navy">Perfil de Prestador selecionado.</p>
                          <p className="text-xs text-slate-400 mt-1">Conclua para começar a listar os seus serviços profissionais.</p>
                        </div>
                      )}

                      {formData.role === UserRole.DELIVERER && (
                        <>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tipo de Veículo</label>
                            <select 
                              className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                              value={formData.vehicleType}
                              onChange={e => setFormData({...formData, vehicleType: e.target.value})}
                            >
                              <option value="bicicleta">Bicicleta</option>
                              <option value="mota">Mota</option>
                              <option value="carro">Carro</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Matrícula (Se aplicável)</label>
                            <input 
                              type="text" 
                              className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                              value={formData.licensePlate}
                              onChange={e => setFormData({...formData, licensePlate: e.target.value})}
                            />
                          </div>
                        </>
                      )}

                      {formData.role === UserRole.CUSTOMER && (
                        <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200 text-center">
                          <CheckCircle2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                          <p className="text-sm font-bold text-navy">Perfil de Consumidor selecionado.</p>
                          <p className="text-xs text-slate-400 mt-1">Clique em "Concluir" para criar a sua conta de comprador.</p>
                        </div>
                      )}

                      {formData.role === UserRole.AFFILIATE && (
                        <div className="bg-purple-50 p-6 rounded-3xl border border-dashed border-purple-200 text-center">
                          <Briefcase className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                          <p className="text-sm font-bold text-navy">Perfil de Afiliado selecionado.</p>
                          <p className="text-xs text-slate-400 mt-1">Conclua para obter o seu painel de parcerias e códigos de convite.</p>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={finishSignup}
                      disabled={loading}
                      className="w-full py-4 bg-orange text-white rounded-2xl font-black uppercase tracking-widest hover:bg-orange/90 transition-colors shadow-lg shadow-orange/20 disabled:opacity-50"
                    >
                      {loading ? 'A processar...' : 'Concluir Registo'}
                    </button>
                  </div>
                )}

                {step === 'verification' && (
                  <div className="text-center py-8 space-y-6">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                      <ShieldCheck className="w-12 h-12" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Verificação em Curso!</h2>
                      <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
                        Escolha como deseja receber o seu código de ativação para a conta de {formData.role.replace('_', ' ')}.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 px-4">
                      <button className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-orange transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-navy shadow-sm group-hover:text-orange">
                            <Mail className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-black text-navy">EMAIL</p>
                            <p className="text-[10px] text-slate-400">{formData.email}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </button>

                      <button className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-orange transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-navy shadow-sm group-hover:text-orange">
                            <Phone className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-black text-navy">SMS</p>
                            <p className="text-[10px] text-slate-400">{formData.phone}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => navigate('/')}
                      className="w-full py-4 bg-navy text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-navy/90 transition-all"
                    >
                      Continuar para a App
                    </button>
                  </div>
                )}

                <div className="text-center pt-4">
                  <p className="text-sm font-medium text-slate-500">
                    Já tem conta? {' '}
                    <button onClick={() => { setMode('login'); setStep('basic'); }} className="text-orange font-black hover:underline">
                      Entrar agora
                    </button>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
