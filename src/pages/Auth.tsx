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

type AuthMode = 'login' | 'signup' | 'recover' | 'reset-password';
type SignupStep = 'basic' | 'role' | 'details' | 'verification';

export function Auth() {
  const navigate = useNavigate();
  const { user, loginAsDemo } = useAuth();
  const location = useLocation();
  
  React.useEffect(() => {
    // Only redirect to homepage if user exists and we are NOT actively resetting the password
    if (user && mode !== 'reset-password') {
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sync mode with search param changes
  React.useEffect(() => {
    const qParams = new URLSearchParams(location.search);
    const m = qParams.get('mode') as AuthMode;
    if (m === 'login' || m === 'signup' || m === 'recover' || m === 'reset-password') {
      setMode(m);
      setError(null);
      setSuccessMessage(null);
    }
  }, [location.search]);

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

const withTimeout = async <T,>(promise: PromiseLike<T> | Promise<T>, ms = 6000): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('SUPABASE_TIMEOUT_OR_PAUSED')), ms)
    )
  ]);
};

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const identifier = formData.email.trim();
        const isEmail = identifier.includes('@');
        
        let finalEmail = isEmail ? identifier.toLowerCase() : identifier;
        let isResolved = isEmail;

        if (!isEmail) {
          const cleanPhone = identifier.replace(/[\s-+]/g, '');
          try {
            const { data: profileRows } = await withTimeout(supabase
              .from('profiles')
              .select('email, phone_number, display_name'));

            if (profileRows && profileRows.length > 0) {
              const matchedRow = profileRows.find(row => {
                const rowPhoneClean = (row.phone_number || '').replace(/[\s-+]/g, '');
                const cleanInput = cleanPhone;
                
                const phoneMatch = rowPhoneClean && cleanInput && (rowPhoneClean.endsWith(cleanInput) || cleanInput.endsWith(rowPhoneClean));
                const nameMatch = row.display_name && row.display_name.trim().toLowerCase() === identifier.trim().toLowerCase();
                
                return phoneMatch || nameMatch;
              });

              if (matchedRow && matchedRow.email) {
                finalEmail = matchedRow.email.toLowerCase();
                isResolved = true;
              }
            }
          } catch (searchErr) {
            console.warn('Silent search warning on finding profiles:', searchErr);
          }
        }

        if (!isResolved) {
          throw new Error('E-mail, Telefone ou Nome de utilizador não encontrado. Por favor, verifique se digitou corretamente ou registe uma nova conta se for o seu primeiro acesso.');
        }

        const loginPayload = { email: finalEmail, password: formData.password };

        const { error } = await withTimeout(supabase.auth.signInWithPassword(loginPayload));
        
        if (error) {
          throw error;
        }
        navigate('/');
      } else {
        // Mode is signup, step 1 complete, move to roles
        setStep('role');
      }
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      let message = err.message || '';
      if (
        message === 'SUPABASE_TIMEOUT_OR_PAUSED' || 
        message.toLowerCase().includes('failed to fetch') || 
        message.toLowerCase().includes('network') ||
        message.toLowerCase().includes('typeerror')
      ) {
        message = '⚠️ BASE DE DADOS DO SUPABASE INDISPONÍVEL OU PAUSADA:\n\nA base de dados de demonstração (kqbzokibwrlkwwljnfyn.supabase.co) parece estar pausada por inatividade no plano gratuito ou inacessível no momento.\n\n👉 COMO RESOLVER ESTE PROBLEMA:\n1. Se é o administrador, aceda à sua conta em https://supabase.com, selecione o projeto "kqbzokibwrlkwwljnfyn" e clique em "Restore Project" / "Resume Project" (reativação imediata em 1 minuto).\n2. Adicione os seus próprios dados de ligação no menu de Configurações (Settings) do AI Studio.\n\n💡 SOLUÇÃO IMEDIATA SEM ESPERAR:\nClique no botão "Aceder como Visitante" (acima) ou escolha qualquer um dos botões do "Modo Rápido (Bypass)" listados abaixo para testar a app com dados de demonstração salvos localmente!';
      } else if (message === 'Invalid login credentials' || message.includes('Invalid login credentials') || message === 'invalid_credentials') {
        message = 'Palavra-passe ou dados de acesso inválidos. Esqueceu-se da sua senha? Pode recuperá-la de forma rápida ou usar o "Modo Rápido" abaixo de testes para se autenticar sem senha.';
      } else if (message.includes('Email not confirmed')) {
        message = 'Por favor, confirme o seu e-mail antes de entrar.\n\n💡 Dica: Se o e-mail não chegar ou se estiver apenas a testar, use qualquer um dos botões do "Modo Rápido (Bypass)" abaixo para aceder instantaneamente!';
      } else if (message.includes('Forbidden use of secret API key')) {
        message = 'Erro de Configuração: Foi detectado o uso de uma chave secreta no navegador. Por favor, use a chave "anon" (ou public) nas configurações do projeto.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const emailInput = formData.email.trim();
    if (!emailInput || !emailInput.includes('@')) {
      setError('Por favor, introduza um endereço de e-mail válido.');
      setLoading(false);
      return;
    }

    try {
      // Direct password recovery using resetPasswordForEmail (prevents false negatives on restricted setups)
      const redirectTo = `${window.location.origin}/auth/callback?type=recovery`;
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailInput, {
        redirectTo
      });

      if (resetError) throw resetError;

      setSuccessMessage('Um link de recuperação seguro foi enviado para o e-mail: ' + emailInput + '.\n\nPor favor, verifique a sua caixa de entrada (incluindo SPAM) e clique no link para redefinir o seu acesso.');
    } catch (err: any) {
      console.error('Password Recovery Error:', err);
      setError(err.message || 'Ocorreu um erro ao enviar o link de redefinição.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const newPass = formData.password;
    if (newPass.length < 6) {
      setError('A nova palavra-passe tem de ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (newPass !== confirmPassword) {
      setError('As palavras-passe introduzidas não correspondem.');
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPass
      });

      if (updateError) throw updateError;

      setSuccessMessage('A sua palavra-passe foi alterada com sucesso!');
      
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err: any) {
      console.error('Password Update Error:', err);
      setError(err.message || 'Não foi possível atualizar a sua palavra-passe. Certifique-se de que o link de recuperação de e-mail ainda é válido ou tente pedir um novo link.');
    } finally {
      setLoading(false);
    }
  };

  const finishSignup = async () => {
    setLoading(true);
    setError(null);
    try {
      const email = formData.email.trim().toLowerCase();
      const password = formData.password;
      const name = formData.name.trim();

      // 1. Pre-verify if email is already registered in profiles to completely prevent duplicates
      const { data: existingUser, error: checkError } = await withTimeout(supabase
        .from('profiles')
        .select('email')
        .eq('email', email));

      if (checkError) {
        console.warn('Silent note on pre-verifying duplicate email:', checkError.message);
      }

      if (existingUser && existingUser.length > 0) {
        throw new Error('Atenção: Este e-mail já está registado no Moz Proservices. Redefina a sua password ou inicie sessão.');
      }

      // Guard registration data locally in case email confirmation is required/delayed
      localStorage.setItem(`pending_profile_${email}`, JSON.stringify(formData));

      // 2. Create user in Supabase Auth with complete metadata to feed the database trigger
      const { data, error: signUpError } = await withTimeout(supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            role: formData.role,
            phone: formData.phone,
            business_name: formData.businessName,
            nuit: formData.nuit,
            vehicle_type: formData.vehicleType,
            license_plate: formData.licensePlate
          }
        }
      }));

      if (signUpError) throw signUpError;
      
      if (!data.user) throw new Error('Falha ao criar o utilizador no Supabase Auth');

      // 3. Upsert Public Profiles with full structural data (prevents primary key conflicts with trigger handle_new_auth_user)
      let profileError = null;
      try {
        const { error } = await withTimeout(supabase
          .from('profiles')
          .upsert({
            uid: data.user.id,
            email: email,
            display_name: name,
            role: formData.role,
            phone_number: formData.phone,
            business_name: formData.businessName,
            nuit: formData.nuit,
            vehicle_type: formData.vehicleType,
            license_plate: formData.licensePlate,
            onboarding_completed: true, // Marked true since registration is completed
            is_verified: false
          }, { onConflict: 'uid' }));
        profileError = error;
      } catch (fetchErr: any) {
        console.error('Falha de rede ao tentar atualizar perfil secundário:', fetchErr);
        profileError = { message: fetchErr.message || 'Falha de rede (TypeError: Failed to fetch)' };
      }

      if (profileError) {
        console.warn('Profile sync warning (this is expected if automatic email confirmation is active and the session does not exist yet):', profileError.message);
      }

      // 4. Give immediate home screen access if authenticated session exists
      if (data.session) {
        navigate('/');
        return;
      }

      // If no immediate session, email verification is required or activation is in progress
      setStep('verification');
    } catch (err: any) {
      console.error('Signup Error:', err);
      let message = err.message || '';
      if (
        message === 'SUPABASE_TIMEOUT_OR_PAUSED' || 
        message.toLowerCase().includes('failed to fetch') || 
        message.toLowerCase().includes('network') ||
        message.toLowerCase().includes('typeerror')
      ) {
        message = '⚠️ BASE DE DADOS DO SUPABASE INDISPONÍVEL OU PAUSADA:\n\nA base de dados de demonstração (kqbzokibwrlkwwljnfyn.supabase.co) parece estar pausada por inatividade no plano gratuito ou inacessível no momento.\n\n👉 COMO RESOLVER ESTE PROBLEMA:\n1. Se é o administrador, aceda à sua barra de controlo em https://supabase.com, selecione o seu projeto e clique para Reativar ("Restore" / "Resume Project").\n2. Adicione os seus próprios dados de ligação no menu de Configurações (Settings) do AI Studio.\n\n💡 SOLUÇÃO IMEDIATA SEM ESPERAR:\nVolte para a tela anterior e use o "Aceder como Visitante" ou use qualquer um dos perfis do "Modo Rápido (Bypass)" de teste!';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Brand Header */}
      <header className="w-full bg-white border-b border-slate-100 py-4 px-6 flex items-center justify-between">
        <button 
          id="brand_auth_link"
          type="button"
          onClick={() => {
            sessionStorage.removeItem('guest_mode');
            window.location.href = '/';
          }}
          className="flex flex-col -space-y-1 items-start text-left hover:opacity-85 transition-opacity cursor-pointer group"
        >
          <span className="font-black text-xl tracking-tighter text-navy uppercase group-hover:text-orange transition-colors">Moz</span>
          <span className="font-black text-[10px] tracking-[0.2em] text-slate-400 uppercase">ProServices</span>
        </button>
        <button
          id="auth_return_button"
          type="button"
          onClick={() => {
            sessionStorage.removeItem('guest_mode');
            window.location.href = '/';
          }}
          className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-orange transition-colors cursor-pointer"
        >
          Voltar para o Início
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div 
          layout
          className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden"
        >
        {/* Header */}
        <div className="bg-navy p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              {mode === 'login' ? 'Bem-vindo de volta' : mode === 'signup' ? 'Criar Conta' : mode === 'recover' ? 'Recuperar Conta' : 'Nova Palavra-passe'}
            </h1>
            <p className="text-slate-400 text-sm mt-1 animate-fade-in">
              {mode === 'login' ? 'Entre na sua conta Moz Proservices' : mode === 'signup' ? 'Junte-se ao ecossistema Moz Proservices' : mode === 'recover' ? 'Recupere o acesso à sua conta' : 'Defina os novos dados de acesso no formulário'}
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-orange/10 rounded-full blur-3xl" />
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 whitespace-pre-wrap text-left leading-relaxed">
              <span>{error}</span>
              {error.includes('Esqueceu-se') && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode('recover');
                    navigate('/auth?mode=recover');
                  }}
                  className="block mt-2 text-xs font-black uppercase tracking-wider text-orange hover:underline decoration-2"
                >
                  👉 Recuperar Palavra-passe Agora
                </button>
              )}
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
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setSuccessMessage(null);
                          setMode('recover');
                          navigate('/auth?mode=recover');
                        }}
                        className="text-xs font-bold text-orange hover:underline uppercase tracking-wider transition-colors"
                      >
                        Esqueci-me da senha?
                      </button>
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

            {mode === 'recover' && (
              <motion.div
                key="recover"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {successMessage ? (
                  <div className="space-y-6 text-center py-6">
                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-sm border border-green-100">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-black text-navy uppercase tracking-tight">E-mail Enviado!</h3>
                      <p className="text-slate-500 text-xs font-semibold leading-relaxed px-4 whitespace-pre-wrap">
                        {successMessage}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSuccessMessage(null);
                        setError(null);
                        setMode('login');
                        navigate('/auth?mode=login');
                      }}
                      className="w-full py-4 bg-navy text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-navy/90 transition-all shadow-lg"
                    >
                      Voltar para o Login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordRecovery} className="space-y-4">
                    <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                      Introduza o endereço de e-mail associado à sua conta. Enviaremos um link de início de sessão seguro para que possa escolher uma nova palavra-passe imediatamente.
                    </p>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        required
                        type="email" 
                        placeholder="Insira o seu e-mail"
                        className="w-full bg-slate-50 border-none rounded-2xl px-12 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <button 
                      disabled={loading}
                      className="w-full py-4 bg-navy text-white rounded-2xl font-black uppercase tracking-widest hover:bg-navy/90 transition-colors shadow-lg shadow-navy/20 disabled:opacity-50"
                    >
                      {loading ? 'A enviar link...' : 'Enviar Link de Recuperação'}
                    </button>
                    <div className="text-center pt-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setError(null);
                          setMode('login');
                          navigate('/auth?mode=login');
                        }}
                        className="text-xs font-black text-slate-400 hover:text-navy uppercase tracking-widest transition-colors"
                      >
                        Cancelar e Voltar ao login
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}

            {mode === 'reset-password' && (
              <motion.div
                key="reset-password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {successMessage ? (
                  <div className="space-y-6 text-center py-6">
                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-sm border border-green-100 animate-bounce">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-navy uppercase tracking-tight">Alterada com Sucesso!</h3>
                      <p className="text-slate-500 text-xs font-semibold leading-relaxed px-4 whitespace-pre-wrap">
                        {successMessage}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSuccessMessage(null);
                        setError(null);
                        navigate('/');
                      }}
                      className="w-full py-4 bg-navy text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-navy/90 transition-all shadow-lg animate-pulse"
                    >
                      Aceder Directamente
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                      Por favor, introduza a sua nova palavra-passe de segurança abaixo. Certifique-se de que escolhe uma combinação robusta (mínimo 6 caracteres).
                    </p>
                    
                    <div className="space-y-4">
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                          required
                          type="password" 
                          placeholder="Nova Palavra-passe"
                          className="w-full bg-slate-50 border-none rounded-2xl px-12 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                          value={formData.password}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                      </div>
                      
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                          required
                          type="password" 
                          placeholder="Confirmar Nova Palavra-passe"
                          className="w-full bg-slate-50 border-none rounded-2xl px-12 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <button 
                      disabled={loading}
                      className="w-full py-4 bg-navy text-white rounded-2xl font-black uppercase tracking-widest hover:bg-navy/90 transition-colors shadow-lg shadow-navy/20 disabled:opacity-50"
                    >
                      {loading ? 'A atualizar...' : 'Atualizar Palavra-passe'}
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
