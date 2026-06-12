import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Upload, Edit, Save, Smartphone, Monitor, Eye, 
  MapPin, Phone, Globe, Calendar, Image as ImageIcon, Star, MessageSquare, 
  Settings, Award, Sparkles, TrendingUp, Info 
} from 'lucide-react';

interface PortfolioViewProps {
  profile: any;
  products: any[];
  onBack: () => void;
}

export function PortfolioView({ profile, products, onBack }: PortfolioViewProps) {
  const localStorageKey = `moz_pro_seller_portfolio_${profile?.uid || 'default'}`;

  // Local state for customized brand representation
  const [config, setConfig] = useState({
    businessName: profile?.businessName || 'Minha Loja Digital',
    tagline: 'Excelência e qualidade ao seu serviço',
    bannerUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1516841273335-e39b37888115?w=300',
    primaryColor: '#F25C05',
    whatsapp: '+258 84 123 4567',
    phone: '+258 21 000 000',
    website: 'www.minhaloja.co.mz',
    address: 'Avenida de Moçambique, Maputo',
    hours: 'Seg - Sex: 08h00 - 18h00 / Sáb: 09h00 - 13h00',
    about: 'Fundada com o intuito de simplificar a aquisição de produtos premium no mercado moçambicano.',
    metaTitle: 'Minha Loja Digital - Produtos Premium em Maputo',
    metaSlug: 'minha-loja-digital',
    metaDesc: 'Compre produtos autênticos com entregas rápidas e garantias no Moz ProServices.',
    metaKeywords: 'compras, maputo, moçambique, comércio, entrega rápida',
    customCategories: ['Geral', 'Eletrónicos', 'Mercearia', 'Destaques'],
    bannerGallery: [
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600',
      'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=600'
    ]
  });

  const [activeTab, setActiveTab] = useState<'details' | 'layout' | 'gallery' | 'seo' | 'reviews' | 'analytic_stats'>('details');
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [replies, setReplies] = useState<{ [key: string]: string }>({});

  // Saved responses
  useEffect(() => {
    const saved = localStorage.getItem(localStorageKey);
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.warn('Could not parse saved portfolio config:', e);
      }
    }
  }, [localStorageKey]);

  const handleSave = () => {
    localStorage.setItem(localStorageKey, JSON.stringify(config));
    alert('Configurações de presença digital e Portfólio salvas com sucesso!');
  };

  // Mock reply submission to reviews for full premium flow
  const handleReplyReview = (reviewId: string) => {
    const replyTxt = replies[reviewId];
    if (!replyTxt?.trim()) return;
    
    alert(`Resposta enviada com sucesso: "${replyTxt}"`);
    setReplies({ ...replies, [reviewId]: '' });
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in" id="portfolio-view-box">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            id="back-from-portfolio-btn"
            onClick={onBack} 
            className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-navy transition-all cursor-pointer shadow-soft"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase text-orange tracking-[0.2em]">Identidade Comercial</span>
            <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Presença Digital (Meu Portfólio)</h2>
          </div>
        </div>

        <button
          id="save-portfolio-btn"
          onClick={handleSave}
          className="px-6 py-4 bg-orange text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange/95 cursor-pointer flex items-center gap-2 shadow-lg shadow-orange/15 transition-transform"
        >
          <Save className="w-4.5 h-4.5" /> Salvar Portfólio
        </button>
      </div>

      {/* Main Panel Content split into Edit Controls and Live Previewer Frame */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Controls Section (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Internal sub tabs */}
          <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50 overflow-x-auto gap-1 text-xs font-black uppercase tracking-wider custom-scrollbar">
            {[
              { id: 'details', label: '📄 Informações' },
              { id: 'layout', label: '🎨 Capa e Cores' },
              { id: 'gallery', label: '🖼️ Galeria Estab.' },
              { id: 'seo', label: '🔍 Palavras SEO' },
              { id: 'reviews', label: '⭐ Feedbacks' },
              { id: 'analytic_stats', label: '📈 Métricas Vitrine' },
            ].map((t) => (
              <button
                id={`subtab-${t.id}`}
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2.5 rounded-xl whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeTab === t.id 
                    ? 'bg-navy text-white shadow-md' 
                    : 'text-slate-400 hover:text-navy hover:bg-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-soft text-left space-y-6">
            
            {/* Tab 1: Details */}
            {activeTab === 'details' && (
              <div className="space-y-6 animate-fade-in">
                <h4 className="text-xs font-black text-navy uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Info className="w-4.5 h-4.5 text-orange" /> Informações do Estabelecimento
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nome Público da Loja</label>
                    <input
                      id="port-edit-name"
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-xs"
                      value={config.businessName}
                      onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Slogan / Frase Comercial</label>
                    <input
                      id="port-edit-tagline"
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-xs"
                      value={config.tagline}
                      onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Contacto Telefónico Principal</label>
                    <input
                      id="port-edit-phone"
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-xs"
                      value={config.phone}
                      onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nº WhatsApp Comercial</label>
                    <input
                      id="port-edit-whatsapp"
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-xs"
                      value={config.whatsapp}
                      onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Website Próprio</label>
                    <input
                      id="port-edit-web"
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-xs"
                      value={config.website}
                      onChange={(e) => setConfig({ ...config, website: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Morada Física do Estabelecimento</label>
                    <input
                      id="port-edit-address"
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-xs"
                      value={config.address}
                      onChange={(e) => setConfig({ ...config, address: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Horário de Funcionamento Comercial</label>
                    <input
                      id="port-edit-hours"
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-xs"
                      value={config.hours}
                      onChange={(e) => setConfig({ ...config, hours: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Quem Somos / História da Empresa (about)</label>
                    <textarea
                      id="port-edit-about"
                      rows={3}
                      className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-xs"
                      value={config.about}
                      onChange={(e) => setConfig({ ...config, about: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Layout Colors & Cover and Logo URLs */}
            {activeTab === 'layout' && (
              <div className="space-y-6 animate-fade-in">
                <h4 className="text-xs font-black text-navy uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Award className="w-4.5 h-4.5 text-orange" /> Aspecto Visual & Identidade
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">URL Imagem Banner Superior</label>
                    <input
                      id="port-edit-banner"
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-xs"
                      value={config.bannerUrl}
                      onChange={(e) => setConfig({ ...config, bannerUrl: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">URL Imagem Logótipo Circular</label>
                    <input
                      id="port-edit-logo"
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-xs"
                      value={config.logoUrl}
                      onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Selecione Cor de Destaque Primária (Cores do Tema)</label>
                    <div className="flex items-center gap-3">
                      <input
                        id="port-edit-color"
                        type="color"
                        className="w-12 h-12 bg-transparent border-none rounded cursor-pointer"
                        value={config.primaryColor}
                        onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      />
                      <span className="text-xs text-navy font-bold uppercase tracking-wider">{config.primaryColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Gallleries */}
            {activeTab === 'gallery' && (
              <div className="space-y-6 animate-fade-in">
                <h4 className="text-xs font-black text-navy uppercase tracking-widest border-b border-slate-100 pb-3">🖼️ Galeria do Estabelecimento</h4>
                <p className="text-[10px] text-slate-500 font-semibold mb-4">Adicione fotos ricas da equipa, das de fabrico ou expositores físicos em Maputo.</p>

                <div className="grid grid-cols-2 gap-4">
                  {config.bannerGallery.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200">
                      <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-32 object-cover" />
                      <button
                        onClick={() => {
                          const updated = config.bannerGallery.filter((_, i) => i !== idx);
                          setConfig({ ...config, bannerGallery: updated });
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                  
                  {/* Plus mock uploader */}
                  <button
                    onClick={() => {
                      const url = prompt('Deseja associar uma nova URL de imagem institucional para a Galeria?');
                      if (url) {
                        setConfig({ ...config, bannerGallery: [...config.bannerGallery, url] });
                      }
                    }}
                    className="h-32 bg-slate-50 border-2 border-dashed border-slate-200 hover:border-orange rounded-xl flex flex-col items-center justify-center text-slate-400 font-bold text-xs gap-2 cursor-pointer transition-colors"
                  >
                    <ImageIcon className="w-6 h-6" /> Adicionar Imagem
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4: Local SEO */}
            {activeTab === 'seo' && (
              <div className="space-y-6 animate-fade-in">
                <h4 className="text-xs font-black text-navy uppercase tracking-widest border-b border-slate-100 pb-3">🔍 Configurações SEO (Indexação Google)</h4>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Título da Página (SEO Meta-Title)</label>
                    <input
                      id="port-seo-title"
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-xs"
                      value={config.metaTitle}
                      onChange={(e) => setConfig({ ...config, metaTitle: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">URL Slug Customizada (mozproservices.com/loja/slug)</label>
                    <input
                      id="port-seo-slug"
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-xs"
                      value={config.metaSlug}
                      onChange={(e) => setConfig({ ...config, metaSlug: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Meta Descrição</label>
                    <textarea
                      id="port-seo-desc"
                      rows={2}
                      className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-xs"
                      value={config.metaDesc}
                      onChange={(e) => setConfig({ ...config, metaDesc: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Palavras-chave (Separadas por vírgulas)</label>
                    <input
                      id="port-seo-kw"
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-xs"
                      value={config.metaKeywords}
                      onChange={(e) => setConfig({ ...config, metaKeywords: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Reviews */}
            {activeTab === 'reviews' && (
              <div className="space-y-6 animate-fade-in text-left">
                <h4 className="text-xs font-black text-navy uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center justify-between">
                  <span>Reviews Dos Consumidores ({products.length > 0 ? 5 : 0} estrelas)</span>
                  <span className="text-[10px] font-black text-orange bg-orange/5 px-2.5 py-0.5 rounded-full border border-orange/10">Score Auditado</span>
                </h4>

                {/* Sample feedback lists with reply action */}
                <div className="space-y-4">
                  {[
                    { id: 'rev-1', client: 'Celeste Macuácua', rating: 5, date: 'Ontem', comment: 'Excelente qualidade de entrega, arroz de primeira classe e embalado com cuidado!' },
                    { id: 'rev-2', client: 'Américo Mundlovo', rating: 4, date: 'Há 3 dias', comment: 'Rápido contacto e o vendedor tirou todas as dúvidas prontamente no WhatsApp.' }
                  ].map((r) => (
                    <div key={r.id} className="p-4 border border-slate-100 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[11px] text-navy">{r.client}</span>
                          <span className="text-[9px] text-slate-400 font-bold">{r.date}</span>
                        </div>
                        <div className="flex text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-current' : 'opacity-35'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold">{r.comment}</p>
                      
                      {/* Vendedor reply */}
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Responder ao Feedback</label>
                        <div className="flex gap-2">
                          <input
                            id={`reply-input-${r.id}`}
                            type="text"
                            placeholder="Agradeça o elogio ou esclareça..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-navy"
                            value={replies[r.id] || ''}
                            onChange={(e) => setReplies({ ...replies, [r.id]: e.target.value })}
                          />
                          <button
                            id={`reply-btn-${r.id}`}
                            onClick={() => handleReplyReview(r.id)}
                            className="px-4 py-2 bg-navy hover:bg-orange text-white text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer"
                          >
                            Responder
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 6: Analytics Stats */}
            {activeTab === 'analytic_stats' && (
              <div className="space-y-6 animate-fade-in text-left">
                <h4 className="text-xs font-black text-navy uppercase tracking-widest border-b border-slate-100 pb-3">📈 Métricas de Visualização da Vitrine</h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <span className="text-[8px] font-black text-slate-400 uppercase block">Visitas Portfólio</span>
                    <span className="text-xl font-black text-navy">1.284</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <span className="text-[8px] font-black text-slate-400 uppercase block">Cliques Artigos</span>
                    <span className="text-xl font-black text-navy">492</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <span className="text-[8px] font-black text-slate-400 uppercase block">Conversões</span>
                    <span className="text-xl font-black text-navy">56</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <span className="text-[8px] font-black text-slate-400 uppercase block">Cliques WhatsApp</span>
                    <span className="text-xl font-black text-navy">114</span>
                  </div>
                </div>

                <div className="p-4 bg-amber-50/50 rounded-2xl flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-orange animate-bounce" />
                  <span className="text-[10px] font-bold text-slate-650 leading-relaxed">Taxa de Contacto Próprio: ~8.8% dos visitantes iniciaram conversa via canal integrado do WhatsApp.</span>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right column: Interactive Live Preview Mockup (5 cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-navy uppercase tracking-widest flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-orange" /> Mockup e Pré-visualização
            </h4>
            
            {/* Toggle mobile vs desktop */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                id="preview-mode-mobile"
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${previewMode === 'mobile' ? 'bg-white text-navy shadow-sm' : 'text-slate-400'}`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                id="preview-mode-desktop"
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${previewMode === 'desktop' ? 'bg-white text-navy shadow-sm' : 'text-slate-400'}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Device container mockup with custom styles using state variables */}
          <div className={`mx-auto bg-slate-900 border-[8px] border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 ${
            previewMode === 'mobile' 
              ? 'w-[290px] h-[580px] rounded-[36px]' 
              : 'w-full h-[400px] rounded-2xl'
          }`}>
            <div className="w-full h-full bg-white overflow-y-auto custom-scrollbar flex flex-col items-stretch text-left font-sans text-navy">
              {/* Cover Banner Mock */}
              <div className="h-28 relative shrink-0">
                <img src={config.bannerUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {/* Logo mock circular */}
                <div className="absolute -bottom-6 left-4 w-12 h-12 rounded-full border-2 border-white bg-white shadow-md overflow-hidden">
                  <img src={config.logoUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Company Details Showcase */}
              <div className="px-4 pt-8 pb-4 space-y-2">
                <h3 className="font-extrabold text-sm uppercase tracking-tight" style={{ color: config.primaryColor }}>{config.businessName}</h3>
                <p className="text-[10px] text-slate-400 font-extrabold italic leading-tight">{config.tagline}</p>
                <p className="text-[9px] text-slate-600 leading-snug font-medium mt-1">{config.about}</p>

                <div className="space-y-1 text-[8px] text-slate-500 font-bold border-t border-slate-100 pt-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> <span>{config.address}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> <span>{config.phone}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="w-3 h-3 text-slate-400" /> <span>{config.website}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" /> <span className="truncate">{config.hours}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic products catalogs */}
              <div className="px-4 pb-6 space-y-3 flex-1 bg-slate-50/50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] uppercase font-black tracking-widest">Catálogo Destaque</span>
                  <span className="text-[8px] font-bold text-slate-400">{products.length} Artigos</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {products.slice(0, 4).map((p, i) => (
                    <div key={i} className="bg-white p-2.5 rounded-xl border border-slate-150 flex flex-col gap-1.5 shadow-sm">
                      <img src={p.image_url} alt="" referrerPolicy="no-referrer" className="w-full h-16 object-cover rounded-lg" />
                      <div>
                        <span className="block font-black text-[9px] truncate">{p.name}</span>
                        <span className="text-[8px] font-black block mt-0.5 text-orange">{Number(p.price).toLocaleString()} MT</span>
                      </div>
                    </div>
                  ))}
                  {products.length === 0 && (
                    <div className="col-span-2 py-6 text-center text-slate-350 text-[10px] font-bold">
                      Sem produtos para destacar.
                    </div>
                  )}
                </div>

                {/* WhatsApp call button */}
                <button
                  className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 mt-4"
                >
                  Falar no WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
