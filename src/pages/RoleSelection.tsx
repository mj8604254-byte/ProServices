import React, { useState } from 'react';
import { User, Store, Building2, Truck, Briefcase, ChevronRight, ArrowLeft, Wrench, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function RoleSelection() {
  const { user, logout } = useAuth();
  const [step, setStep] = useState<'selection' | 'question' | 'form'>('selection');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const navigate = useNavigate();

  // Detail states
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [businessName, setBusinessName] = useState('');
  const [nuit, setNuit] = useState('');
  const [vehicleType, setVehicleType] = useState('bicicleta');
  const [licensePlate, setLicensePlate] = useState('');

  const roles = [
    { 
      id: UserRole.CUSTOMER, 
      label: 'Consumidor', 
      desc: 'Comprar produtos, contratar serviços e pedir entregas facilmente.', 
      icon: User, 
      color: 'bg-blue-500' 
    },
    { 
      id: UserRole.SELLER_MICRO, 
      label: 'Vendedor Micro', 
      desc: 'Ideal para pequenos negócios, empreendedores e vendedores locais.', 
      icon: Store, 
      color: 'bg-orange' 
    },
    { 
      id: UserRole.SELLER_MACRO, 
      label: 'Vendedor Macro', 
      desc: 'Para empresas, supermercados, restaurantes e grandes operações.', 
      icon: Building2, 
      color: 'bg-slate-800' 
    },
    { 
      id: UserRole.DELIVERER, 
      label: 'Entregador', 
      desc: 'Faça entregas e gere renda com horários flexíveis em sua zona.', 
      icon: Truck, 
      color: 'bg-green-600' 
    },
    { 
      id: UserRole.AFFILIATE, 
      label: 'Afiliado', 
      desc: 'Ganhe comissões promovendo produtos e serviços da plataforma.', 
      icon: Briefcase, 
      color: 'bg-purple-600' 
    },
    { 
      id: UserRole.SERVICE_PROVIDER, 
      label: 'Prestador de Serviços', 
      desc: 'Ofereça os seus serviços profissionais na nossa plataforma.', 
      icon: Wrench, 
      color: 'bg-indigo-600' 
    },
  ];

  const handleRoleSelect = async (role: UserRole) => {
    setSelectedRole(role);
    
    // Check if extra info is needed for this role
    const needsInfo = 
      role === UserRole.SELLER_MICRO || 
      role === UserRole.SELLER_MACRO || 
      role === UserRole.SERVICE_PROVIDER || 
      role === UserRole.DELIVERER;

    if (!needsInfo) {
      // No extra info needed, log in/save directly!
      await completeRegistration(role, {});
    } else {
      // Question: Ask if user would like to provide details now
      setStep('question');
    }
  };

  const completeRegistration = async (role: UserRole, extraData: any = {}) => {
    if (!user) return;
    try {
      const display_name = fullName.trim() || user.user_metadata?.full_name || user.email?.split('@')[0];
      const payload: any = {
        role: role,
        display_name: display_name,
        onboarding_completed: true,
        is_verified: false,
        updated_at: new Date().toISOString()
      };
      
      if (extraData.businessName) payload.business_name = extraData.businessName;
      if (extraData.nuit) payload.nuit = extraData.nuit;
      if (extraData.vehicleType) payload.vehicle_type = extraData.vehicleType;
      if (extraData.licensePlate) payload.license_plate = extraData.licensePlate;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          uid: user.id,
          email: user.email,
          ...payload
        }, { onConflict: 'uid' });

      if (error) throw error;
      
      // Direct navigation and reload to synchronize contexts
      window.location.href = '/';
    } catch (err) {
      handleSupabaseError(err);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    
    const extraData = selectedRole === UserRole.DELIVERER 
      ? { vehicleType, licensePlate }
      : { businessName, nuit };
      
    await completeRegistration(selectedRole, extraData);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Brand Header */}
      <header className="w-full bg-white border-b border-slate-100 py-4 px-6 flex items-center justify-between">
        <button 
          id="brand_role_link"
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
          id="role_return_button"
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
      <div className="flex-1 max-w-4xl w-full mx-auto py-12 px-4 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {step === 'selection' && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8 w-full max-w-2xl"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-navy uppercase tracking-tighter">Escolha o seu perfil</h1>
              <p className="text-slate-500">Como é que deseja utilizar a Moz Proservices?</p>
            </div>

            <div className="grid gap-4">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft hover:border-orange hover:shadow-xl transition-all flex items-center gap-6 text-left group"
                >
                  <div className={`w-16 h-16 ${role.color} rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg`}>
                    <role.icon className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-navy group-hover:text-orange transition-colors">{role.label}</h3>
                    <p className="text-sm text-slate-500">{role.desc}</p>
                  </div>
                  <ChevronRight className="text-slate-300 group-hover:text-orange" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'question' && (
          <motion.div
            key="question"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 max-w-lg w-full text-center"
          >
            <div className="w-16 h-16 bg-orange/10 text-orange rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            
            <h2 className="text-2xl font-black text-navy mb-4">Informações Adicionais</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              O perfil de <b>{selectedRole?.replace('_', ' ').toUpperCase()}</b> necessita de detalhes adicionais (como identificação ou detalhes da viatura/negócio). Gostaria de fornecer estes dados agora para ativar este tipo de conta?
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full py-4 bg-orange text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-orange/20 hover:bg-orange/90 transition-colors"
              >
                Sim, Fornecer Dados
              </button>
              <button
                type="button"
                onClick={() => setStep('selection')}
                className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
              >
                Não, Voltar
              </button>
            </div>
          </motion.div>
        )}

        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 max-w-lg w-full"
          >
            <button 
              onClick={() => setStep('question')}
              className="flex items-center gap-2 text-slate-400 hover:text-navy mb-8 font-bold text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            <h2 className="text-2xl font-black text-navy mb-2">Quase lá!</h2>
            <p className="text-slate-500 mb-8">Confirme alguns detalhes para o seu perfil de <b>{selectedRole?.replace('_', ' ')}</b>.</p>

            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nome Completo</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-navy font-bold focus:ring-2 focus:ring-orange/20" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </div>
              
              {(selectedRole === UserRole.SELLER_MICRO || selectedRole === UserRole.SELLER_MACRO || selectedRole === UserRole.SERVICE_PROVIDER) && (
                <>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      {selectedRole === UserRole.SERVICE_PROVIDER ? 'Nome Profissional/Empresa' : 'Nome do Negócio'}
                    </label>
                    <input 
                      required 
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-navy font-bold focus:ring-2 focus:ring-orange/20" 
                      placeholder={selectedRole === UserRole.SERVICE_PROVIDER ? "Ex: Silva Carpintaria" : "Ex: Minha Loja Pro"} 
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">NUIT (Documento)</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-navy font-bold focus:ring-2 focus:ring-orange/20" 
                      placeholder="Ex: 123456789" 
                      value={nuit}
                      onChange={e => setNuit(e.target.value)}
                    />
                  </div>
                </>
              )}

              {selectedRole === UserRole.DELIVERER && (
                <>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de Veículo</label>
                    <select 
                      required 
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-navy font-bold focus:ring-2 focus:ring-orange/20"
                      value={vehicleType}
                      onChange={e => setVehicleType(e.target.value)}
                    >
                      <option value="mota">Motocicleta</option>
                      <option value="carro">Carro</option>
                      <option value="bicicleta">Bicicleta</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Matrícula (Se aplicável)</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-navy font-bold focus:ring-2 focus:ring-orange/20" 
                      placeholder="Ex: MM-12-34-GP" 
                      value={licensePlate}
                      onChange={e => setLicensePlate(e.target.value)}
                    />
                  </div>
                </>
              )}

              <button 
                type="submit"
                className="w-full py-5 bg-orange text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-orange/20 hover:scale-[1.02] transition-transform active:scale-95 mt-4"
              >
                Concluir Cadastro
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
