import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User as UserIcon, Store, Building2, Truck, Briefcase, ChevronRight, Check, AlertCircle, Wrench } from 'lucide-react';
import { UserRole, UserProfile } from '../types';
import { supabase } from '../lib/supabase';

interface RoleSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile | null;
}

export function RoleSwitchModal({ isOpen, onClose, currentProfile }: RoleSwitchModalProps) {
  const [step, setStep] = useState<'selection' | 'details'>('selection');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState({
    businessName: currentProfile?.businessName || '',
    nuit: currentProfile?.nuit || '',
    vehicleType: currentProfile?.vehicleType || 'bicicleta',
    licensePlate: currentProfile?.licensePlate || '',
  });

  const roles = [
    { id: UserRole.CUSTOMER, label: 'Consumidor', icon: UserIcon, color: 'bg-blue-500' },
    { id: UserRole.SELLER_MICRO, label: 'Vendedor Micro', icon: Store, color: 'bg-orange' },
    { id: UserRole.SELLER_MACRO, label: 'Vendedor Macro', icon: Building2, color: 'bg-slate-800' },
    { id: UserRole.DELIVERER, label: 'Entregador', icon: Truck, color: 'bg-green-500' },
    { id: UserRole.AFFILIATE, label: 'Afiliado', icon: Briefcase, color: 'bg-purple-500' },
    { id: UserRole.SERVICE_PROVIDER, label: 'Prestador de Serviços', icon: Wrench, color: 'bg-indigo-600' },
  ];

  const handleRoleSelect = (role: UserRole) => {
    if (role === currentProfile?.role) return;
    
    setSelectedRole(role);
    
    // Check if extra info is needed
    const needsInfo = 
      (role === UserRole.SELLER_MICRO || role === UserRole.SELLER_MACRO || role === UserRole.SERVICE_PROVIDER) && (!currentProfile?.businessName || !currentProfile?.nuit) ||
      (role === UserRole.DELIVERER) && (!currentProfile?.vehicleType);

    if (needsInfo) {
      setStep('details');
    } else {
      updateRole(role);
    }
  };

  const updateRole = async (role: UserRole, extraData = {}) => {
    if (!currentProfile) return;
    setLoading(true);
    try {
      const mappedData: any = {
        role,
        is_verified: false,
        updated_at: new Date().toISOString()
      };

      if ((extraData as any).vehicleType) mappedData.vehicle_type = (extraData as any).vehicleType;
      if ((extraData as any).licensePlate) mappedData.license_plate = (extraData as any).licensePlate;
      if ((extraData as any).businessName) mappedData.business_name = (extraData as any).businessName;
      if ((extraData as any).nuit) mappedData.nuit = (extraData as any).nuit;

      const { error } = await supabase
        .from('profiles')
        .update(mappedData)
        .eq('uid', currentProfile.uid);

      if (error) throw error;
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error switching role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole) {
      const extraData = selectedRole === UserRole.DELIVERER 
        ? { vehicleType: details.vehicleType, licensePlate: details.licensePlate }
        : { businessName: details.businessName, nuit: details.nuit };
      updateRole(selectedRole, extraData);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Mudar de Conta</h2>
                  <p className="text-slate-400 text-xs mt-1">Alternar entre os seus perfis</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              {step === 'selection' ? (
                <div className="grid gap-3">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleRoleSelect(r.id)}
                      disabled={loading}
                      className={`flex items-center gap-4 p-4 rounded-3xl border-2 transition-all text-left group ${
                        currentProfile?.role === r.id 
                          ? 'border-orange bg-orange/5' 
                          : 'border-slate-100 hover:border-navy bg-slate-50'
                      }`}
                    >
                      <div className={`w-12 h-12 ${r.color} rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                        <r.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-navy text-xs uppercase tracking-widest">{r.label}</p>
                        {currentProfile?.role === r.id && (
                          <p className="text-[10px] text-orange font-bold uppercase tracking-widest mt-0.5">Perfil Activo</p>
                        )}
                      </div>
                      {currentProfile?.role === r.id ? (
                        <Check className="w-6 h-6 text-orange" />
                      ) : (
                        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-navy" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleSubmitDetails} className="space-y-6">
                  <div className="p-4 bg-orange/10 rounded-2xl flex gap-3 border border-orange/20">
                    <AlertCircle className="w-5 h-5 text-orange shrink-0" />
                    <p className="text-[11px] font-bold text-orange">Precisamos de completar o seu perfil de {selectedRole?.replace('_', ' ')} antes de alternar.</p>
                  </div>

                  <div className="space-y-4">
                    {(selectedRole === UserRole.SELLER_MICRO || selectedRole === UserRole.SELLER_MACRO || selectedRole === UserRole.SERVICE_PROVIDER) && (
                      <>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                            {selectedRole === UserRole.SERVICE_PROVIDER ? 'Nome Profissional/Empresa' : 'Nome do Negócio'}
                          </label>
                          <input 
                            required
                            type="text" 
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                            value={details.businessName}
                            onChange={e => setDetails({...details, businessName: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">NUIT</label>
                          <input 
                            required
                            type="text" 
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                            value={details.nuit}
                            onChange={e => setDetails({...details, nuit: e.target.value})}
                          />
                        </div>
                      </>
                    )}

                    {selectedRole === UserRole.DELIVERER && (
                      <>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tipo de Veículo</label>
                          <select 
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                            value={details.vehicleType}
                            onChange={e => setDetails({...details, vehicleType: e.target.value})}
                          >
                            <option value="bicicleta">Bicicleta</option>
                            <option value="mota">Mota</option>
                            <option value="carro">Carro</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Matrícula</label>
                          <input 
                            required
                            type="text" 
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-orange/20"
                            value={details.licensePlate}
                            onChange={e => setDetails({...details, licensePlate: e.target.value})}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setStep('selection')}
                      className="flex-1 py-4 bg-slate-100 text-navy rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                    >
                      Voltar
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-4 bg-orange text-white rounded-2xl font-black uppercase tracking-widest hover:bg-orange/90 transition-colors shadow-lg shadow-orange/20"
                    >
                      {loading ? 'A processar...' : 'Confirmar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
