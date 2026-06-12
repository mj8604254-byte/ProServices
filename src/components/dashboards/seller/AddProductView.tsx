import React, { useState, useEffect } from 'react';
import { ChevronLeft, Package, Sparkles, Tag, ArrowRight, Video, FileText, Info, Layers, CheckCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { CATEGORIES } from '../../../constants';
import { UserRole } from '../../../types';

interface AddProductViewProps {
  profile: any;
  editingProduct: any | null;
  onBack: () => void;
  onRefresh: () => Promise<void>;
}

export function AddProductView({ profile, editingProduct, onBack, onRefresh }: AddProductViewProps) {
  const isEdit = !!editingProduct;
  const isMacro = profile?.role === UserRole.SELLER_MACRO;
  const productLimit = 500;

  const [saving, setSaving] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORIES.products[0],
    subcategory: '',
    brand: '',
    sku: '',
    barcode: '',
    price: '',
    promo_price: '',
    stock: '',
    unit: 'unidade',
    description: '',
    image_urls: '', // Comma separated list of images
    video_url: '',
    weight: '',
    dimensions: { h: '', w: '', l: '' },
    moderation_status: 'pending' as 'pending' | 'approved' | 'draft' | 'scheduled',
  });

  // Prepopulate if editing
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        category: editingProduct.category || CATEGORIES.products[0],
        subcategory: editingProduct.subcategory || '',
        brand: editingProduct.brand || '',
        sku: editingProduct.sku || '',
        barcode: editingProduct.barcode || '',
        price: editingProduct.price ? String(editingProduct.price) : '',
        promo_price: editingProduct.promo_price ? String(editingProduct.promo_price) : '',
        stock: editingProduct.stock ? String(editingProduct.stock) : '',
        unit: editingProduct.unit || 'unidade',
        description: editingProduct.description || '',
        image_urls: editingProduct.image_url || '',
        video_url: editingProduct.video_url || '',
        weight: editingProduct.weight ? String(editingProduct.weight) : '',
        dimensions: editingProduct.dimensions || { h: '', w: '', l: '' },
        moderation_status: editingProduct.moderation_status || 'pending',
      });
    }
  }, [editingProduct]);

  const handleSubmit = async (submitType: 'draft' | 'publish' | 'schedule') => {
    if (!formData.name.trim() || !formData.price || !formData.stock) {
      alert('Por favor, preencha o nome, preço e quantidade de stock.');
      return;
    }

    // Limit check for SELLER_MICRO
    if (!isMacro && !isEdit) {
      // Query current product count
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', profile.uid);
      
      if (count && count >= productLimit) {
        alert(`Atingiu o limite do plano SELLER MICRO (${productLimit} produtos). Por favor, mude para o plano SELLER MACRO para produtos ilimitados!`);
        return;
      }
    }

    setSaving(true);
    try {
      // Determine final status
      let finalStatus = 'pending';
      if (submitType === 'draft') finalStatus = 'draft';
      else if (submitType === 'schedule') finalStatus = 'scheduled';
      else finalStatus = 'pending'; // await moderation

      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        subcategory: formData.subcategory.trim(),
        brand: formData.brand.trim(),
        sku: formData.sku.trim(),
        barcode: formData.barcode.trim(),
        price: parseFloat(formData.price),
        promo_price: formData.promo_price ? parseFloat(formData.promo_price) : null,
        stock: parseInt(formData.stock),
        unit: formData.unit,
        description: formData.description.trim(),
        image_url: formData.image_urls.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', // Set primary or list
        video_url: formData.video_url.trim() || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: formData.dimensions,
        moderation_status: finalStatus,
        seller_id: profile.uid,
        updated_at: new Date().toISOString()
      };

      if (isEdit && editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert({
            ...payload,
            rating: 5,
            reviews_count: 0,
            created_at: new Date().toISOString()
          });
        if (error) throw error;
      }

      setSuccess(true);
      await onRefresh();
      setTimeout(() => {
        setSuccess(false);
        onBack();
      }, 2000);
    } catch (err: any) {
      console.error('Error saving product:', err.message);
      alert('Erro ao guardar produto: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in" id="add-product-container">
      {/* Back action */}
      <button 
        id="add-product-back-btn"
        onClick={onBack} 
        className="flex items-center gap-2 text-slate-400 hover:text-navy mb-6 font-bold text-sm bg-none border-none cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" /> Voltar ao Painel
      </button>

      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden text-left">
        <div className="bg-navy p-8 sm:p-10 text-white relative">
          <span className="text-[10px] font-black uppercase text-orange tracking-[0.22em] block mb-2">Editor Catálogo</span>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            {isEdit ? 'Editar Produto Catalogo' : 'Cadastrar Novo Produto'}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">Preencha de forma rica para atrair novos clientes do Moz ProServices.</p>
        </div>

        {success ? (
          <div className="p-12 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
            <h3 className="text-2xl font-black text-navy uppercase tracking-tight">Produto Guardado!</h3>
            <p className="text-slate-500 text-sm">O portfólio físico e catálogo digital estão em perfeita sincronia com a base de dados.</p>
          </div>
        ) : (
          <div className="p-6 sm:p-10 space-y-10">
            {/* Section 1: Basic details */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-navy border-b border-slate-100 pb-3 flex items-center gap-2">
                <Package className="w-4.5 h-4.5 text-orange" /> Informações do Artigo
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome Comercial do Produto</label>
                  <input
                    id="new-product-name"
                    required
                    type="text"
                    placeholder="Ex: Arroz Tio Lucas Premium 25kg"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-xs focus:ring-2 focus:ring-orange/20 focus:outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Categoria de Artigo</label>
                  <select
                    id="new-product-category"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-xs text-navy focus:ring-2 focus:ring-orange/20 focus:outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.products.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Subcategoria (Opcional)</label>
                  <input
                    id="new-product-subcat"
                    type="text"
                    placeholder="Ex: Cereais de pequeno-almoço"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-xs focus:ring-2 focus:ring-orange/20 focus:outline-none"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Marca do Produto</label>
                  <input
                    id="new-product-brand"
                    type="text"
                    placeholder="Ex: LG, Samsung, Unilever"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-xs focus:ring-2 focus:ring-orange/20 focus:outline-none"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Unidade de Medida</label>
                  <select
                    id="new-product-unit"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-xs text-navy focus:ring-2 focus:ring-orange/20 focus:outline-none"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="unidade">Unidade (unid)</option>
                    <option value="kg">Quilo (kg)</option>
                    <option value="litro">Litro (l)</option>
                    <option value="pacote">Pacote</option>
                    <option value="caixa">Caixa</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Financial pricing & physical count */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-navy border-b border-slate-100 pb-3 flex items-center gap-2">
                <Tag className="w-4.5 h-4.5 text-orange" /> Preçário, Código & Inventário
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Preço Retail (MT) *</label>
                  <input
                    id="new-product-price"
                    required
                    type="number"
                    placeholder="Ex: 1500"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-xs focus:ring-2 focus:ring-orange/20 focus:outline-none"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Preço Promoção (MT)</label>
                  <input
                    id="new-product-promo"
                    type="number"
                    placeholder="Ex: 1200"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-xs focus:ring-2 focus:ring-orange/20 focus:outline-none"
                    value={formData.promo_price}
                    onChange={(e) => setFormData({ ...formData, promo_price: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Unidades em Stock *</label>
                  <input
                    id="new-product-stock"
                    required
                    type="number"
                    placeholder="Ex: 50"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-xs focus:ring-2 focus:ring-orange/20 focus:outline-none"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Código Interno (SKU)</label>
                  <input
                    id="new-product-sku"
                    type="text"
                    placeholder="Ex: RZ-TIO-25KG"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-xs focus:ring-2 focus:ring-orange/20 focus:outline-none"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Código de Barras (EAN-13)</label>
                  <input
                    id="new-product-barcode"
                    type="text"
                    placeholder="Ex: 5601234567890"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-xs focus:ring-2 focus:ring-orange/20 focus:outline-none"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Peso Bruto (kg)</label>
                  <input
                    id="new-product-weight"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 25"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-xs focus:ring-2 focus:ring-orange/20 focus:outline-none"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Physical sizing, description, image, and links */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-navy border-b border-slate-100 pb-3 flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-orange" /> Dimensões, Multimédia & Detalhes
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Altura (cm)</label>
                  <input
                    id="new-product-dim-h"
                    type="number"
                    placeholder="Ex: 40"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-xs focus:ring-2 focus:ring-orange/20 focus:outline-none"
                    value={formData.dimensions.h}
                    onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, h: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Largura (cm)</label>
                  <input
                    id="new-product-dim-w"
                    type="number"
                    placeholder="Ex: 20"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-xs focus:ring-2 focus:ring-orange/20 focus:outline-none"
                    value={formData.dimensions.w}
                    onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, w: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Comprimento (cm)</label>
                  <input
                    id="new-product-dim-l"
                    type="number"
                    placeholder="Ex: 50"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-xs focus:ring-2 focus:ring-orange/20 focus:outline-none"
                    value={formData.dimensions.l}
                    onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, l: e.target.value } })}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Imagens do Produto (Múltiplas separadas por vírgula)</label>
                  <input
                    id="new-product-images"
                    type="text"
                    placeholder="Ex: http://teste.com/foto1.jpg, http://teste.com/foto2.jpg"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-xs focus:ring-2 focus:ring-orange/20 focus:outline-none"
                    value={formData.image_urls}
                    onChange={(e) => setFormData({ ...formData, image_urls: e.target.value })}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Link de Vídeo de Apresentação (YouTube / Vimeo / MP4)</label>
                  <input
                    id="new-product-video"
                    type="text"
                    placeholder="Ex: https://www.youtube.com/watch?v=video_id"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-xs focus:ring-2 focus:ring-orange/20 focus:outline-none"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Descrição Comercial Detalhada *</label>
                  <textarea
                    id="new-product-desc"
                    required
                    rows={4}
                    placeholder="Descreva todos os detalhes ricos do seu produto, garantias, utilidades..."
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-xs focus:ring-2 focus:ring-orange/20 focus:outline-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Publication scheduling preferences */}
            <div className="p-6 bg-slate-55 rounded-[28px] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <h4 className="font-extrabold text-navy text-xs uppercase tracking-tight flex items-center gap-2">
                  <Layers className="w-4.5 h-4.5 text-orange animate-spin" strokeWidth={3} /> Programar Publicação Automática?
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">Configure a data em que o produto passará a ficar visível sob o seu catálogo público.</p>
              </div>
              <input
                id="scheduling-date-input"
                type="datetime-local"
                className="bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs focus:outline-none"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>

            {/* Submission Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-8">
              <button
                id="btn-save-draft"
                type="button"
                disabled={saving}
                onClick={() => handleSubmit('draft')}
                className="w-full md:w-auto px-6 py-4 bg-slate-100 hover:bg-slate-200 text-navy rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer transition-colors"
              >
                Guardar como Rascunho
              </button>

              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                {scheduledDate && (
                  <button
                    id="btn-schedule-product"
                    type="button"
                    disabled={saving}
                    onClick={() => handleSubmit('schedule')}
                    className="px-6 py-4 bg-navy text-white hover:bg-orange rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer transition-colors"
                  >
                    Programar Lançamento
                  </button>
                )}
                
                <button
                  id="btn-publish-product"
                  type="button"
                  disabled={saving}
                  onClick={() => handleSubmit('publish')}
                  className="px-8 py-4 bg-orange text-white hover:bg-orange/95 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-transform shadow-lg shadow-orange/15"
                >
                  {saving ? 'A Processar...' : isEdit ? 'Confirmar Edições' : 'Publicar Agora'} <ArrowRight className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
