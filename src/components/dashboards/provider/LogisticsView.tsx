import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  MapPin, 
  Navigation, 
  Settings, 
  Truck, 
  DollarSign, 
  Plus, 
  Trash, 
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Locate
} from 'lucide-react';
import { motion } from 'motion/react';

interface LogisticsViewProps {
  profile: any;
  onBack: () => void;
}

export function LogisticsView({ profile, onBack }: LogisticsViewProps) {
  const uid = profile?.uid || 'guest';
  const isMacro = profile?.role === 'seller_macro';

  const [radius, setRadius] = useState<number>(15); // operating radius in KM
  const [baseCost, setBaseCost] = useState<number>(300); // base travel/displacement cost
  const [costPerKm, setCostPerKm] = useState<number>(25); // value per km traveled
  
  // Custom operational zones list
  const [zones, setZones] = useState<Array<{ name: string, active: boolean, surcharge: number }>>([
    { name: 'Polana Cimento', active: true, surcharge: 0 },
    { name: 'Sommerschield', active: true, surcharge: 100 },
    { name: 'Matola Central', active: true, surcharge: 250 },
    { name: 'Matola Rio', active: false, surcharge: 400 },
    { name: 'Triunfo', active: true, surcharge: 150 },
    { name: 'Coop', active: true, surcharge: 0 },
    { name: 'Albazine', active: false, surcharge: 300 }
  ]);

  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneSurcharge, setNewZoneSurcharge] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(`moz_logistics_v2_${uid}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.radius) setRadius(parsed.radius);
        if (parsed.baseCost) setBaseCost(parsed.baseCost);
        if (parsed.costPerKm) setCostPerKm(parsed.costPerKm);
        if (parsed.zones) setZones(parsed.zones);
      } catch (e) {}
    }
  }, [uid]);

  const saveLogisticsConfig = () => {
    // Under Micro limit to up to 3 active zones
    if (!isMacro) {
      const activeCount = zones.filter(z => z.active).length;
      if (activeCount > 3) {
        alert('Limite do Plano MICRO: Só pode ter até 3 zonas de atendimento ativas em simultâneo. Por favor, desmarque ou remova para ficar dentro do limite.');
        return;
      }
    }

    const payload = { radius, baseCost, costPerKm, zones };
    localStorage.setItem(`moz_logistics_v2_${uid}`, JSON.stringify(payload));
    alert('As configurações logísticas de mobilidade foram guardadas com sucesso!');
  };

  const toggleZoneActive = (idx: number) => {
    const updated = [...zones];
    updated[idx].active = !updated[idx].active;
    setZones(updated);
  };

  const handleCreateZone = () => {
    if (!newZoneName) return;
    const item = {
      name: newZoneName,
      active: true,
      surcharge: Number(newZoneSurcharge) || 0
    };
    setZones([...zones, item]);
    setNewZoneName('');
    setNewZoneSurcharge('');
  };

  const handleDeleteZone = (idx: number) => {
    setZones(zones.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6 text-left" id="logistics-view-root">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-navy transition-all cursor-pointer shadow-soft"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase text-orange tracking-[0.2em]">Deslocação & Raio Geográfico</span>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Logística De Atendimento</h2>
          </div>
        </div>

        {/* Save button */}
        <button 
          onClick={saveLogisticsConfig}
          className="px-6 py-3 bg-navy hover:bg-orange text-white rounded-xl font-black text-[10px] uppercase tracking-widest self-start sm:self-center cursor-pointer shadow"
        >
          Guardar Parâmetros
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Settings column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
            <div>
              <h3 className="text-md font-black text-navy uppercase tracking-widest flex items-center gap-2">
                <Locate className="w-5 h-5 text-orange" />
                Definição do Raio Geográfico
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Defina até quantos quilómetros a sua equipa se desloca para prestar o serviço.</p>
            </div>

            {/* Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-navy">
                <span>Raio de Atuação</span>
                <span className="text-orange text-lg font-black">{radius} KM</span>
              </div>
              <input 
                type="range" 
                min="2" 
                max="80" 
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange"
              />
              <div className="flex justify-between text-[10px] uppercase tracking-widest font-black text-slate-400">
                <span>2 KM</span>
                <span>Sob Demanda (S/ Limite)</span>
                <span>80 KM</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
            <h3 className="text-md font-black text-navy uppercase tracking-widest flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange" />
              Tabela de Custos de Deslocação
            </h3>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Custo de Deslocação Base (MT)</label>
                <input 
                  type="number" 
                  value={baseCost}
                  onChange={(e) => setBaseCost(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-navy focus:outline-none focus:border-orange bg-slate-50 font-black"
                />
                <span className="text-[9px] text-slate-450 font-bold leading-tight block mt-1.5 uppercase">Custos fixados incluídos por aproximação até 5km.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Custo Excedente por Quilómetro (MT/KM)</label>
                <input 
                  type="number" 
                  value={costPerKm}
                  onChange={(e) => setCostPerKm(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-navy focus:outline-none focus:border-orange bg-slate-50 font-black"
                />
                <span className="text-[9px] text-slate-450 font-bold leading-tight block mt-1.5 uppercase">Cobrado apenas em caso de distâncias longas fora do perímetro.</span>
              </div>
            </div>
          </div>

          {/* Zones table list */}
          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <h3 className="text-md font-black text-navy uppercase tracking-widest">Zonas de Cobertura Específicas</h3>
              {!isMacro && (
                <span className="text-[9px] text-orange font-black uppercase tracking-widest">Plano MICRO: Ativo em {zones.filter(z=>z.active).length}/3</span>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3 items-end p-4 bg-slate-50 rounded-2xl border border-slate-150">
                <div className="sm:col-span-2">
                  <label className="block text-[9px] uppercase font-black text-slate-400 mb-1">Nome da Região / Bairro</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Albazine"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-250 text-xs text-navy bg-white focus:outline-none focus:border-orange font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-black text-slate-400 mb-1">Taxa de Adicional (+MT)</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Ex: 150"
                      value={newZoneSurcharge}
                      onChange={(e) => setNewZoneSurcharge(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-250 text-xs text-navy bg-white focus:outline-none focus:border-orange font-bold animate-pulse-once"
                    />
                    <button
                      onClick={handleCreateZone}
                      className="p-2.5 bg-navy hover:bg-orange text-white rounded-xl cursor-pointer"
                    >
                      <Plus className="w-5 h-5 animate-spin-hover" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {zones.map((zone, i) => (
                  <div key={i} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={zone.active}
                        onChange={() => toggleZoneActive(i)}
                        className="w-4 h-4 rounded text-orange accent-orange cursor-pointer"
                      />
                      <div>
                        <p className={`font-extrabold ${zone.active ? 'text-navy' : 'text-slate-400 line-through'}`}>{zone.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">Taxa logística especial extra: {zone.surcharge} MT</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteZone(i)}
                      className="p-1 text-slate-350 hover:text-rose-600 cursor-pointer border-none"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Mockup SVG Map of coverage Maputo */}
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
            <div>
              <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
                <Navigation className="w-5 h-5 text-orange" />
                Mapa de Cobertura Activo
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">Visualização por satélite das regiões marcadas</p>
            </div>

            {/* Stylized custom SVG map of Maputo outline */}
            <div className="h-64 bg-slate-950 rounded-3xl relative overflow-hidden p-4 border border-slate-800 flex items-center justify-center shadow-inner">
              <div className="absolute top-2 left-2 bg-navy/80 text-[8px] font-black text-slate-420 px-2 py-0.5 rounded uppercase font-mono border border-slate-800">MAPUTO METROPLEX</div>
              
              {/* Fake outline of districts */}
              <svg viewBox="0 0 200 200" className="w-full h-full opacity-80 filter drop-shadow">
                {/* Matola path */}
                <path 
                  d="M10,80 L60,40 L90,90 L50,130 Z" 
                  className={`transition-colors cursor-pointer stroke-slate-800 stroke-[1.5] ${
                    zones.find(z => z.name.includes('Matola') && z.active) ? 'fill-orange/40 hover:fill-orange/60' : 'fill-slate-900 hover:fill-slate-800'
                  }`} 
                />
                
                {/* Polana central path */}
                <path 
                  d="M93,92 L140,50 L180,90 L130,140 Z" 
                  className={`transition-colors cursor-pointer stroke-slate-800 stroke-[1.5] ${
                    zones.find(z => z.name.includes('Polana') && z.active) ? 'fill-orange/45 hover:fill-orange/60' : 'fill-slate-900 hover:fill-slate-800'
                  }`} 
                />

                {/* Coop path */}
                <path 
                  d="M95,14 L120,45 L85,85 L50,30 Z" 
                  className={`transition-colors cursor-pointer stroke-slate-800 stroke-[1.5] ${
                    zones.find(z => z.name.includes('Coop') && z.active) ? 'fill-orange/30 hover:fill-orange/50' : 'fill-slate-900 hover:fill-slate-800'
                  }`} 
                />

                {/* Sommerschield */}
                <circle 
                  cx="120" cy="110" r="25" 
                  className={`transition-colors cursor-pointer stroke-slate-800 stroke-[1.5] ${
                    zones.find(z => z.name.includes('Sommerschield') && z.active) ? 'fill-orange/50 hover:fill-orange/70' : 'fill-slate-900 hover:fill-slate-800'
                  }`} 
                />
              </svg>

              {/* Slider Radius effect overlay */}
              <div className="absolute inset-x-0 bottom-4 text-center">
                <span className="text-[9px] font-black bg-orange text-white px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                  Raio Coberto: {radius} KM
                </span>
              </div>
            </div>

            {/* Saturation advice and logistics */}
            <div className="bg-orange/5 p-4 rounded-3xl border border-orange/15 text-xs text-orange font-bold">
              <div className="flex gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <p className="leading-relaxed">A tarifa final de deslocação calculada é automaticamente acrescida nas contas de compras efetuadas por clientes da respetiva localidade ao fechar ordens de serviços.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
