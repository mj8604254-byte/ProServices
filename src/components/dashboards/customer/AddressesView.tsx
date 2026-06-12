import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit3, 
  Navigation, 
  Home, 
  Briefcase, 
  FileText,
  Check,
  Globe,
  Loader2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface AddressesViewProps {
  profile: any;
  onBack: () => void;
  onRefreshProfile?: () => void;
}

interface AddressItem {
  id: string;
  type: 'home' | 'work' | 'other';
  label: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  isDefault: boolean;
}

export function AddressesView({ profile, onBack, onRefreshProfile }: AddressesViewProps) {
  const uid = profile?.uid || 'guest';
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);

  // Form Fields
  const [addressType, setAddressType] = useState<'home' | 'work' | 'other'>('home');
  const [label, setLabel] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Maputo');
  const [latitude, setLatitude] = useState(-25.9692);
  const [longitude, setLongitude] = useState(32.5732);
  const [isDefault, setIsDefault] = useState(false);
  const [fetchingGPS, setFetchingGPS] = useState(false);

  useEffect(() => {
    // Read addresses from local storage associated with uid
    const stored = localStorage.getItem(`moz_addresses_${uid}`);
    if (stored) {
      setAddresses(JSON.parse(stored));
      setLoading(false);
    } else {
      // Setup some default addresses based on user's location
      const defaultAddresses: AddressItem[] = [
        {
          id: 'addr-1',
          type: 'home',
          label: 'Casa Principal',
          address: profile?.location?.address || 'Avenida Julius Nyerere, Edifício Polana Palace, Apt 401',
          city: 'Maputo',
          lat: profile?.location?.lat || -25.9692,
          lng: profile?.location?.lng || 32.5732,
          isDefault: true
        },
        {
          id: 'addr-2',
          type: 'work',
          label: 'Escritório Matola',
          address: 'Avenida das Indústrias, Parque Industrial da Matola, Armazém 4B',
          city: 'Matola',
          lat: -25.9622,
          lng: 32.4732,
          isDefault: false
        }
      ];
      localStorage.setItem(`moz_addresses_${uid}`, JSON.stringify(defaultAddresses));
      setAddresses(defaultAddresses);
      setLoading(false);
    }
  }, [uid, profile]);

  const saveAddresses = (updatedList: AddressItem[]) => {
    localStorage.setItem(`moz_addresses_${uid}`, JSON.stringify(updatedList));
    setAddresses(updatedList);

    // Sync default address to Supabase public.profiles if user has profile and custom trigger
    const defaultAddr = updatedList.find(a => a.isDefault);
    if (defaultAddr && profile?.uid) {
      const syncWithSupabase = async () => {
        try {
          await supabase
            .from('profiles')
            .update({
              location: {
                lat: defaultAddr.lat,
                lng: defaultAddr.lng,
                address: `${defaultAddr.address}, ${defaultAddr.city}`
              }
            })
            .eq('uid', profile.uid);
          
          if (onRefreshProfile) onRefreshProfile();
        } catch (err) {
          console.warn('Silent database sync skipped:', err);
        }
      };
      syncWithSupabase();
    }
  };

  const handleDeleteAddress = (id: string, isDef: boolean) => {
    if (isDef && addresses.length > 1) {
      alert('Não é possível apagar o endereço principal! Defina outro endereço como principal antes de remover.');
      return;
    }
    const confirmed = window.confirm('Deseja realmente eliminar este endereço salvo?');
    if (!confirmed) return;

    const filtered = addresses.filter(a => a.id !== id);
    if (filtered.length > 0 && isDef) {
      filtered[0].isDefault = true;
    }
    saveAddresses(filtered);
  };

  const handleSetDefault = (id: string) => {
    const updated = addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    saveAddresses(updated);
  };

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setAddressType('home');
    setLabel('Minha Casa');
    setAddressLine('');
    setCity('Maputo');
    setLatitude(-25.9692);
    setLongitude(32.5732);
    setIsDefault(addresses.length === 0);
    setShowAddModal(true);
  };

  const handleOpenEdit = (addr: AddressItem) => {
    setEditingAddress(addr);
    setAddressType(addr.type);
    setLabel(addr.label);
    setAddressLine(addr.address);
    setCity(addr.city);
    setLatitude(addr.lat);
    setLongitude(addr.lng);
    setIsDefault(addr.isDefault);
    setShowAddModal(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine.trim()) {
      alert('Por favor, indique a morada completa!');
      return;
    }

    let newList: AddressItem[] = [];

    if (editingAddress) {
      // Edit
      newList = addresses.map(a => {
        if (a.id === editingAddress.id) {
          return {
            ...a,
            type: addressType,
            label: label || (addressType === 'home' ? 'Casa' : addressType === 'work' ? 'Trabalho' : 'Outro'),
            address: addressLine,
            city,
            lat: latitude,
            lng: longitude,
            isDefault: isDefault || a.isDefault
          };
        }
        return a;
      });
    } else {
      // Create new
      const newAddr: AddressItem = {
        id: Math.random().toString(36).substring(2, 9),
        type: addressType,
        label: label || (addressType === 'home' ? 'Casa' : addressType === 'work' ? 'Trabalho' : 'Outro'),
        address: addressLine,
        city,
        lat: latitude,
        lng: longitude,
        isDefault: isDefault || addresses.length === 0
      };
      newList = [...addresses, newAddr];
    }

    if (isDefault) {
      newList = newList.map(a => ({
        ...a,
        isDefault: editingAddress ? a.id === editingAddress.id : a.id === newList[newList.length - 1].id
      }));
    }

    saveAddresses(newList);
    setShowAddModal(false);
  };

  const getGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('A geolocalização não é suportada por este navegador.');
      return;
    }

    setFetchingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setFetchingGPS(false);
        // Look up simulation to be polite and complete
        setAddressLine(prev => prev || `Coordenadas aproximadas captadas na latitude ${position.coords.latitude.toFixed(5)}`);
      },
      (error) => {
        console.warn('GPS Error:', error);
        setFetchingGPS(false);
        // Simulate a real Moz coordinates if permissions blocked
        setLatitude(-25.9654 + (Math.random() - 0.5) * 0.01);
        setLongitude(32.5891 + (Math.random() - 0.5) * 0.01);
        alert('Simulámos as suas coordenadas GPS locais em Maputo devido às restrições de iFrame ou bloqueio de permissão.');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home className="w-4.5 h-4.5" />;
      case 'work': return <Briefcase className="w-4.5 h-4.5" />;
      default: return <FileText className="w-4.5 h-4.5" />;
    }
  };

  // Preset location points for Maputu/Matola quick selection
  const handleMapClickSim = (latOffset: number, lngOffset: number, mockAddr: string) => {
    setLatitude(latOffset);
    setLongitude(lngOffset);
    setAddressLine(mockAddr);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in" id="customer-addresses-view">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-navy transition-colors font-bold text-xs uppercase"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </button>
        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-orange text-white hover:bg-navy font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-md shadow-orange/10"
        >
          <Plus className="w-4.5 h-4.5" /> Adicionar Endereço
        </button>
      </div>

      {/* Main Addresses & Map Visual Container */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Real Addresses List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange" /> Meus Endereços Salvos
            </h3>
            <span className="text-[10px] font-bold text-slate-400 font-mono">Total de {addresses.length} moradas</span>
          </div>

          <div className="space-y-3">
            {addresses.map((addr) => (
              <div 
                key={addr.id}
                className={`bg-white p-5 rounded-[24px] border transition-all flex items-start justify-between gap-4 group shadow-soft ${
                  addr.isDefault ? 'border-orange shadow-lg' : 'border-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    addr.isDefault ? 'bg-orange/10 text-orange' : 'bg-slate-50 text-slate-500'
                  }`}>
                    {getAddressIcon(addr.type)}
                  </div>
                  <div className="space-y-1 text-left min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-extrabold text-navy text-sm leading-none truncate">{addr.label}</h4>
                      {addr.isDefault && (
                        <span className="text-[8px] font-black text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full uppercase tracking-tighter">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="text-slate-550 text-xs font-semibold leading-relaxed line-clamp-2">{addr.address}</p>
                    <p className="text-[10px] text-slate-450 font-bold uppercase">{addr.city} • <span className="font-mono text-slate-400">Lat: {addr.lat.toFixed(4)}, Lng: {addr.lng.toFixed(4)}</span></p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(addr)}
                      className="p-1.5 text-slate-400 hover:text-orange hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border-none bg-none"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(addr.id, addr.isDefault)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50/50 rounded-lg transition-colors cursor-pointer border-none bg-none"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[9px] font-black text-orange hover:text-navy uppercase tracking-wider hover:underline"
                    >
                      Tornar Principal
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Vector map visualization */}
        <section className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-soft space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black text-navy uppercase tracking-widest flex items-center gap-2">
              <Globe className="w-4.5 h-4.5 text-orange" /> Localizador Visual Moçambique
            </h4>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              Mapa visual estilizado de Maputo/Moçambique. Clique nos pontos de teste abaixo para definir moradas instantâneas simuladas.
            </p>
          </div>

          {/* Interactive Styled Map Grid card */}
          <div className="bg-slate-50 border border-slate-150 rounded-2xl h-56 relative overflow-hidden flex items-center justify-center p-2">
            
            {/* Background Map Simulation (Mozambique coastline SVG art style) */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-15 stroke-slate-300 stroke-1 fill-none pointer-events-none">
              <path d="M70,10 C60,20 40,40 30,50 C20,60 10,80 5,90 M80,20 C75,30 65,50 60,60" />
              <circle cx="50" cy="50" r="10" className="stroke-indigo-300 mt-2 stroke-dashed" />
              <circle cx="20" cy="80" r="15" className="stroke-indigo-300 stroke-dashed" />
              {/* Rivers */}
              <path d="M5,50 Q25,55 50,60 T95,70" className="stroke-blue-200" />
            </svg>

            {/* Grid Coordinates */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-30 border border-slate-200 pointer-events-none">
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className="border-r border-b border-slate-200" />
              ))}
            </div>

            {/* Simulated Points drops */}
            <div className="relative z-10 w-full h-full">
              {/* Point 1: Polana JMN */}
              <button 
                onClick={() => handleMapClickSim(-25.9692, 32.5732, 'Avenida Julius Nyerere, Edifício Polana Palace')}
                className="absolute top-[45%] left-[65%] w-3 h-3 bg-orange rounded-full shadow-[0_0_10px_rgba(255,94,20,0.6)] animate-pulse transition-transform hover:scale-125 cursor-pointer border border-white"
                title="Polana Cimento"
              />
              <span className="absolute top-[48%] left-[68%] text-[8px] font-black text-navy uppercase bg-white/70 px-1 rounded pointer-events-none shadow-sm">Polana</span>

              {/* Point 2: Zimpeto stadium */}
              <button 
                onClick={() => handleMapClickSim(-25.8454, 32.5691, 'Avenida de Moçambique, Estádio Nacional do Zimpeto')}
                className="absolute top-[18%] left-[40%] w-3 h-3 bg-orange rounded-full shadow-[0_0_10px_rgba(255,94,20,0.6)] animate-pulse transition-transform hover:scale-125 cursor-pointer border border-white"
                title="Zimpeto"
              />
              <span className="absolute top-[21%] left-[43%] text-[8px] font-black text-navy uppercase bg-white/70 px-1 rounded pointer-events-none shadow-sm font-sans">Zimpeto</span>

              {/* Point 3: Matola Shopping */}
              <button 
                onClick={() => handleMapClickSim(-25.9622, 32.4732, 'Avenida das Indústrias, Matola Shopping Mall')}
                className="absolute top-[50%] left-[22%] w-3 h-3 bg-orange rounded-full shadow-[0_0_10px_rgba(255,94,20,0.6)] animate-pulse transition-transform hover:scale-125 cursor-pointer border border-white"
                title="Matola"
              />
              <span className="absolute top-[53%] left-[25%] text-[8px] font-black text-navy uppercase bg-white/70 px-1 rounded pointer-events-none shadow-sm">Matola</span>

              {/* Point 4: Baixa Maputo */}
              <button 
                onClick={() => handleMapClickSim(-25.9754, 32.5691, 'Avenida 25 de Setembro, Praça dos Trabalhadores')}
                className="absolute top-[65%] left-[55%] w-3 h-3 bg-orange rounded-full shadow-[0_0_10px_rgba(255,94,20,0.6)] animate-pulse transition-transform hover:scale-125 cursor-pointer border border-white"
                title="Baixa"
              />
              <span className="absolute top-[68%] left-[58%] text-[8px] font-black text-navy uppercase bg-white/70 px-1 rounded pointer-events-none shadow-sm">Baixa</span>
            </div>

            {/* Current Coordinates Alert Overlay */}
            <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur border border-slate-100 p-2.5 rounded-xl text-left shadow-md">
              <p className="text-[10px] font-black uppercase text-orange">Pino de Entrega Selecionado</p>
              <p className="font-bold text-navy truncate text-xs mt-0.5">{addressLine || 'Nenhum pino clicado'}</p>
              <div className="flex gap-4 mt-1 text-[9px] font-mono text-slate-500 font-bold">
                <span>Lat: {latitude.toFixed(5)}</span>
                <span>Lng: {longitude.toFixed(5)}</span>
              </div>
            </div>
          </div>
          
          <p className="text-[10px] text-slate-400 font-semibold text-center italic leading-relaxed">
            * Utilize a Georreferenciação por GPS ou clique directamente nos pontos do mapa para captar as suas coordenadas geográficas com precisão militar.
          </p>
        </section>
      </div>

      {/* Add / Edit Address Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-lg p-6 rounded-[32px] shadow-2xl border border-slate-150 text-left my-8">
            <h3 className="text-lg font-black text-navy uppercase tracking-tight flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-orange" />
              {editingAddress ? 'Editar Morada Salva' : 'Novo Endereço de Entrega'}
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">Defina a localização precisa para o envio rápido de produtos de marketplace e deslocação rápida de técnicos.</p>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              {/* Type selector */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'home', label: 'Casa', icon: Home },
                  { id: 'work', label: 'Trabalho', icon: Briefcase },
                  { id: 'other', label: 'Outro', icon: FileText },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setAddressType(item.id as any);
                      if (!label || label === 'Minha Casa' || label === 'Meu Escritório' || label === 'Outro') {
                        setLabel(item.id === 'home' ? 'Minha Casa' : item.id === 'work' ? 'Meu Escritório' : 'Outro');
                      }
                    }}
                    className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      addressType === item.id 
                        ? 'border-orange bg-orange/5 text-orange' 
                        : 'border-slate-150 hover:border-slate-350 bg-white text-slate-500'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Label name */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Apelido do Endereço</label>
                <input 
                  type="text" 
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex: Casa Praia, Studio, Escritório..."
                  className="w-full h-11 border border-slate-200 rounded-xl px-4 text-xs font-bold text-navy outline-none focus:border-orange"
                />
              </div>

              {/* City selector & GPS capture button */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Cidade em Moçambique</label>
                  <select 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-11 border border-slate-200 rounded-xl px-3 text-xs font-bold text-navy outline-none focus:border-orange"
                  >
                    <option value="Maputo">Maputo</option>
                    <option value="Matola">Matola</option>
                    <option value="Beira">Beira</option>
                    <option value="Nampula">Nampula</option>
                    <option value="Chimoio">Chimoio</option>
                    <option value="Quelimane">Quelimane</option>
                    <option value="Tete">Tete</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Capturar Georreferência</label>
                  <button
                    type="button"
                    onClick={getGPSLocation}
                    disabled={fetchingGPS}
                    className="w-full h-11 bg-navy hover:bg-orange disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-none shadow-md"
                  >
                    {fetchingGPS ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Navigation className="w-4.5 h-4.5" />
                    )}
                    Utilizar Meu GPS
                  </button>
                </div>
              </div>

              {/* Address Line */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Morada Completa e Pontos de Referência</label>
                <textarea 
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  rows={2}
                  placeholder="Avenida/Rua, Número de Porta, Prédio, Apt... Ex: Av. Julius Nyerere, Prédio 45, Baixa"
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold text-navy outline-none focus:border-orange resize-none"
                />
              </div>

              {/* Coordinates inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Latitude (Opcional)</label>
                  <input 
                    type="number" 
                    step="any" 
                    value={latitude}
                    onChange={(e) => setLatitude(Number(e.target.value))}
                    className="w-full h-10 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-605 outline-none focus:border-orange font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Longitude (Opcional)</label>
                  <input 
                    type="number" 
                    step="any" 
                    value={longitude}
                    onChange={(e) => setLongitude(Number(e.target.value))}
                    className="w-full h-10 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-605 outline-none focus:border-orange font-mono"
                  />
                </div>
              </div>

              {/* Default checkbox */}
              <label className="flex items-center gap-2.5 pt-2 select-none cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  disabled={editingAddress?.isDefault}
                  className="w-4.5 h-4.5 bg-slate-50 border border-slate-200 outline-none rounded focus:ring-0 checked:bg-orange text-orange cursor-pointer"
                />
                <span className="text-xs font-bold text-navy">Definir como Endereço Principal de Entrega</span>
              </label>

              {/* Action buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-navy font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors cursor-pointer border-none shadow-soft"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange hover:bg-navy text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors cursor-pointer border-none shadow-md"
                >
                  Confirmar e Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
