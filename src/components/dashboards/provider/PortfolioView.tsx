import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Image, 
  Video, 
  Award, 
  MapPin, 
  Phone, 
  Mail, 
  Plus, 
  Trash, 
  Check, 
  Eye, 
  Wrench, 
  Sparkles,
  Layers,
  Star,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../../lib/supabase';

interface PortfolioViewProps {
  profile: any;
  onBack: () => void;
}

export function PortfolioView({ profile, onBack }: PortfolioViewProps) {
  const uid = profile?.uid || 'guest';
  const isMacro = profile?.role === 'seller_macro';

  // Portfolio items structure
  const [banner, setBanner] = useState('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&auto=format');
  const [logo, setLogo] = useState(profile?.avatarUrl || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150');
  const [about, setAbout] = useState('Prestaçao de serviços profissionais de eletricidade e refrigeração em Maputo. Equipa técnica qualificada e com certificação internacional.');
  const [experience, setExperience] = useState('Mais de 10 anos de experiência consolidada resolvendo instalações corporativas e domiciliares.');
  
  const [contacts, setContacts] = useState({
    phone: profile?.phoneNumber || '+258 84 100 0000',
    email: profile?.email || 'empresa@proservices.co.mz',
    website: 'www.proservices.co.mz'
  });

  const [services, setServices] = useState<Array<{ id: string, name: string, category: string, price: number, highlighted: boolean }>>([
    { id: '1', name: 'Manutenção de AC Rápida', category: 'Refrigeração', price: 1500, highlighted: true },
    { id: '2', name: 'Reparação Elétrica Completa', category: 'Eletricidade', price: 2500, highlighted: true },
    { id: '3', name: 'Diagnóstico de Disjuntores', category: 'Eletricidade', price: 850, highlighted: false },
    { id: '4', name: 'Limpeza Profunda de Filtros', category: 'Refrigeração', price: 900, highlighted: false }
  ]);

  const [certifications, setCertifications] = useState<string[]>([
    'Certificado de Eletricidade Industrial ANEEL',
    'Certificação de Manuseamento de Gases Fluorados Maputo'
  ]);

  const [gallery, setGallery] = useState<string[]>([
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
    'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400'
  ]);

  const [workingAreas, setWorkingAreas] = useState<string[]>(['Polana', 'Coop', 'Matola Rio', 'Sommerschield', 'Triunfo']);

  // New item creators
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('Eletricidade');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newCert, setNewCert] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newPhotoLink, setNewPhotoLink] = useState('');

  // Toggling public preview
  const [showPublicPreview, setShowPublicPreview] = useState(false);

  useEffect(() => {
    const storedPortfolio = localStorage.getItem(`moz_portfolio_edited_${uid}`);
    if (storedPortfolio) {
      try {
        const parsed = JSON.parse(storedPortfolio);
        if (parsed.banner) setBanner(parsed.banner);
        if (parsed.logo) setLogo(parsed.logo);
        if (parsed.about) setAbout(parsed.about);
        if (parsed.experience) setExperience(parsed.experience);
        if (parsed.contacts) setContacts(parsed.contacts);
        if (parsed.services) setServices(parsed.services);
        if (parsed.certifications) setCertifications(parsed.certifications);
        if (parsed.gallery) setGallery(parsed.gallery);
        if (parsed.workingAreas) setWorkingAreas(parsed.workingAreas);
      } catch (e) {
        console.error(e);
      }
    }
  }, [uid]);

  const savePortfolioConfig = () => {
    // Under Micro limit to up to 3 working areas
    if (!isMacro && workingAreas.length > 3) {
      alert('Limite do Plano MICRO: Só pode configurar até 3 áreas de atuação simultâneas.');
      return;
    }

    const payload = {
      banner, logo, about, experience, contacts, services, certifications, gallery, workingAreas
    };
    localStorage.setItem(`moz_portfolio_edited_${uid}`, JSON.stringify(payload));
    alert('As configurações do seu Portfólio foram guardadas com sucesso!');
  };

  const handleCreateService = () => {
    if (!newServiceName || !newServicePrice) return;
    const item = {
      id: Math.random().toString(),
      name: newServiceName,
      category: newServiceCategory,
      price: Number(newServicePrice),
      highlighted: false
    };
    setServices([...services, item]);
    setNewServiceName('');
    setNewServicePrice('');
  };

  const handleRemoveService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const handleToggleHighlight = (id: string) => {
    setServices(services.map(s => s.id === id ? { ...s, highlighted: !s.highlighted } : s));
  };

  return (
    <div className="space-y-6 text-left" id="portfolio-view-root">
      
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
            <span className="text-[10px] font-black uppercase text-orange tracking-[0.2em]">Showroom Profissional</span>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Gestor de Portfólio</h2>
          </div>
        </div>

        {/* Action button triggers preview & save */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowPublicPreview(true)}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" /> Ver Perfil Público
          </button>
          <button 
            onClick={savePortfolioConfig}
            className="px-5 py-2.5 bg-navy hover:bg-orange text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
          >
            Guardar Edições
          </button>
        </div>
      </div>

      {/* Main editable layout splits into left controls and right banner simulation */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left column configuration parameters forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Metadata Block & Files Simulation */}
          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
            <h3 className="text-md font-black text-navy uppercase tracking-widest flex items-center gap-2">
              <Globe className="w-5 h-5 text-orange" />
              Identidade do Negócio
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Link da Imagem de Banner</label>
                <input 
                  type="text" 
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-navy focus:outline-none focus:border-orange bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Link do Logótipo (Avatar URL)</label>
                <input 
                  type="text" 
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-navy focus:outline-none focus:border-orange bg-slate-50 font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-1">Sobre o Profissional / Empresa (Bio)</label>
                <textarea 
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-navy focus:outline-none focus:border-orange bg-slate-50 font-bold"
                  rows={3}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-1">Experiência Profissional</label>
                <input 
                  type="text" 
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-navy focus:outline-none focus:border-orange bg-slate-50 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Manage services pricing catalogs */}
          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
            <h3 className="text-md font-black text-navy uppercase tracking-widest flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange" />
              Catálogo de Serviços Oferecidos
            </h3>

            <div className="space-y-4">
              {/* Creator form */}
              <div className="grid sm:grid-cols-3 gap-3 items-end p-4 bg-slate-50 rounded-2xl border border-slate-150">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Nome Serviço</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Instalaçao Quadro"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-250 text-xs text-navy bg-white focus:outline-none focus:border-orange font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Categoria de Atuação</label>
                  <select 
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-250 text-xs text-navy bg-white focus:outline-none focus:border-orange font-bold"
                  >
                    <option value="Eletricidade">Eletricidade</option>
                    <option value="Refrigeração">Refrigeração</option>
                    <option value="Serralharia">Serralharia</option>
                    <option value="Canalização">Canalização</option>
                    <option value="Limpeza">Limpeza</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Preço Inicial (MT)</label>
                    <input 
                      type="number" 
                      placeholder="MT"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-250 text-xs text-navy bg-white focus:outline-none focus:border-orange font-bold"
                    />
                  </div>
                  <button
                    onClick={handleCreateService}
                    className="p-2.5 bg-navy hover:bg-orange text-white rounded-xl cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {services.map((ser) => (
                  <div key={ser.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-extrabold text-navy">{ser.name} <span className="text-[10px] font-black text-orange uppercase">[{ser.category}]</span></p>
                      <span className="font-bold text-slate-400">Preços iniciam em: {Number(ser.price).toLocaleString()} MT</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleToggleHighlight(ser.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          ser.highlighted ? 'bg-orange/10 text-orange' : 'bg-slate-50 text-slate-400 hover:text-slate-650'
                        }`}
                      >
                        {ser.highlighted ? '★ Destacado' : 'Destacar'}
                      </button>
                      <button 
                        onClick={() => handleRemoveService(ser.id)}
                        className="p-1 text-slate-300 hover:text-rose-600"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Right side certificates & areas configs */}
        <div className="space-y-6">
          
          {/* Areas block */}
          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
            <div>
              <h3 className="text-sm font-black text-navy uppercase tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange" />
                Zonas de Atendimento
              </h3>
              {!isMacro && (
                <p className="text-[9px] text-orange font-black uppercase tracking-wider mt-1 block">Limite MICRO: Até 3 zonas simultâneas ({workingAreas.length}/3)</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ex: Sommerschield" 
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-navy focus:outline-none focus:border-orange bg-slate-50"
                  onKeyDown={(e) => e.key === 'Enter' && newArea && (setWorkingAreas([...workingAreas, newArea]), setNewArea(''))}
                />
                <button
                  onClick={() => {
                    if (!newArea) return;
                    setWorkingAreas([...workingAreas, newArea]);
                    setNewArea('');
                  }}
                  className="px-4 py-2 bg-navy text-white rounded-xl font-bold cursor-pointer text-xs"
                >
                  Ok
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {workingAreas.map((area, idx) => (
                  <span key={idx} className="px-2.5 py-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-[10px] font-extrabold text-slate-550 flex items-center gap-1 cursor-pointer"
                    onClick={() => setWorkingAreas(workingAreas.filter((_, i) => i !== idx))}
                  >
                    {area} <Trash className="w-3 h-3 text-slate-350" />
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Certifications block */}
          <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-soft space-y-6">
            <h3 className="text-sm font-black text-navy uppercase tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-orange" />
              Certificações Oficiais
            </h3>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ex: Registo de Competencias" 
                  value={newCert}
                  onChange={(e) => setNewCert(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-navy focus:outline-none focus:border-orange bg-slate-50"
                  onKeyDown={(e) => e.key === 'Enter' && newCert && (setCertifications([...certifications, newCert]), setNewCert(''))}
                />
                <button
                  onClick={() => {
                    if (!newCert) return;
                    setCertifications([...certifications, newCert]);
                    setNewCert('');
                  }}
                  className="px-4 py-2 bg-navy text-white rounded-xl font-bold cursor-pointer text-xs"
                >
                  Ok
                </button>
              </div>

              <div className="divide-y divide-slate-105">
                {certifications.map((cert, i) => (
                  <div key={i} className="py-2.5 flex justify-between items-center text-xs text-slate-650 font-bold">
                    <span>{cert}</span>
                    <button 
                      onClick={() => setCertifications(certifications.filter((_, idx) => idx !== i))}
                      className="p-1 text-slate-300 hover:text-rose-650 bg-transparent border-none"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Floating Public Page Mockup Preview Dialog Modal */}
      <AnimatePresence>
        {showPublicPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/80 p-4 sm:p-6 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-50 rounded-[48px] max-w-4xl w-full max-h-[90vh] overflow-y-auto relative text-navy text-left shadow-2xl"
            >
              {/* Close float */}
              <button
                onClick={() => setShowPublicPreview(false)}
                className="absolute top-6 right-6 z-[200] p-3 bg-white hover:bg-orange hover:text-white rounded-full text-navy shadow-md transition-all border-none"
              >
                <Trash className="w-5 h-5 rotate-45 transform" />
              </button>

              {/* Banner Area */}
              <div className="h-64 relative">
                <img src={banner} className="w-full h-full object-cover" alt="Banner" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
                  <div className="flex items-center gap-6">
                    <img src={logo} className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-lg" alt="Logo" />
                    <div className="text-white">
                      <h4 className="text-2xl font-black uppercase tracking-tight">{profile?.businessName || profile?.displayName || 'Proservices Moz'}</h4>
                      <p className="text-slate-300 text-xs font-bold uppercase mt-1 tracking-widest flex items-center gap-1">
                        <Star className="w-4 h-4 fill-orange text-orange" />
                        Reputação: 4.9 • Prestador Reconhecido Pro
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-8 grid md:grid-cols-3 gap-8 text-xs font-bold text-navy/70">
                {/* Left bio details Contacts */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                    <h5 className="font-extrabold text-navy text-sm uppercase">Sobre Nós</h5>
                    <p className="font-medium text-slate-500 leading-relaxed">"{about}"</p>
                    <p className="font-semibold text-slate-400 mt-2">{experience}</p>
                  </div>

                  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                    <h5 className="font-extrabold text-navy text-sm uppercase">Contactos Directos</h5>
                    <div className="space-y-2 text-slate-500">
                      <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-orange" /> {contacts.phone}</p>
                      <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-orange" /> {contacts.email}</p>
                      <p className="flex items-center gap-2"><Globe className="w-4 h-4 text-orange" /> {contacts.website}</p>
                    </div>
                  </div>
                </div>

                {/* Center Services Catalog */}
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                    <h5 className="font-extrabold text-navy text-md uppercase">Catálogo Padrão ({services.length} Serviços)</h5>
                    
                    <div className="space-y-4">
                      {services.map(ser => (
                        <div key={ser.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                          <div>
                            <span className="text-[8px] font-black uppercase text-orange border border-orange/20 px-1.5 py-0.5 rounded bg-orange/5 mb-1 inline-block">{ser.category}</span>
                            <h6 className="font-extrabold text-navy text-sm">{ser.name}</h6>
                            {ser.highlighted && <span className="text-[8px] text-green-600 font-extrabold flex items-center gap-0.5 mt-0.5">✔ Destacado de Alta Procura</span>}
                          </div>
                          <span className="text-sm font-black text-navy">{Number(ser.price).toLocaleString()} MT <p className="text-[8px] opacity-40 font-bold block text-right">Inicial</p></span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certs and Area Preview */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-2">
                      <h5 className="font-extrabold text-navy tracking-tight uppercase text-xs">Áreas Cobertas</h5>
                      <div className="flex flex-wrap gap-1">
                        {workingAreas.map((ar, i) => <span key={i} className="px-2 py-0.5 bg-slate-100 text-[9px] rounded font-bold uppercase">{ar}</span>)}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-2">
                      <h5 className="font-extrabold text-navy tracking-tight uppercase text-xs">Acreditações</h5>
                      <ul className="list-disc pl-4 text-[10px] space-y-1 text-slate-505">
                        {certifications.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
